import { serverSupabaseClient } from '#supabase/server'
import QRCode from 'qrcode'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody(event)
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw createError({
        statusCode: 401,
        message: 'Neautorizovaný přístup. Prosím přihlaste se.'
      })
    }
    
    // Validate input data (teacherId comes from auth, not body)
    if (!body.name || !body.description) {
      throw createError({
        statusCode: 400,
        message: 'Chybí povinné údaje (name, description)'
      })
    }

    // Use authenticated user's ID as teacherId
    const teacherId = user.id

    // Generate unique ID for the group
    const groupId = crypto.randomUUID()
    
    // Create URL for joining the group
    const origin = getRequestURL(event).origin
    const joinUrl = `${origin}/join/${groupId}`
    
    // Generate QR code as SVG string
    const qrCodeSvg = await QRCode.toString(joinUrl, {
      type: 'svg',
      width: 300,
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    
    // Save group to database (use snake_case for column names)
    const assignmentMode = body.assignmentMode === 'variant' ? 'variant' : 'uniform'

    const { data: group, error: insertError } = await supabase
      .from('groups')
      .insert({
        id: groupId,
        name: body.name,
        description: body.description,
        qr_code: qrCodeSvg,
        teacher_id: teacherId,
        assignment_mode: assignmentMode
      } as any)
      .select()
      .single()
    
    if (insertError) {
      console.error('Database insert error:', insertError)
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se vytvořit skupinu v databázi: ' + insertError.message
      })
    }
    
    if (!group) {
      throw createError({
        statusCode: 500,
        message: 'Skupina byla vytvořena, ale nepodařilo se ji načíst'
      })
    }
    
    const groupData = group as any
    
    // Generate assignment and goals using LLM
    try {
      // Step 1: Generate assignment from group description
      const requestUrl = getRequestURL(event)
      const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
      
      let generatedAssignment = body.description
      try {
        const assignmentResponse = await $fetch<{
          success: boolean
          assignment: string
        }>(`${baseUrl}/api/chat/generate-assignment`, {
          method: 'POST',
          body: {
            groupDescription: body.description,
            goals: [], // No goals yet, we'll generate them
            assignmentMode: assignmentMode,
            groupId: groupId
          }
        })
        
        if (assignmentResponse.success && assignmentResponse.assignment) {
          generatedAssignment = assignmentResponse.assignment
        }
      } catch (assignmentError) {
        console.warn('Error generating assignment, using description:', assignmentError)
      }
      
      // Step 2: Generate goals from assignment
      const goalsResponse = await $fetch<{
        success: boolean
        goals: Array<{
          title: string
          type: 'boolean' | 'percentage'
          targetCount?: number
        }>
      }>(`${baseUrl}/api/groups/generate-goals`, {
        method: 'POST',
        body: {
          groupDescription: body.description,
          assignment: generatedAssignment
        }
      })
      
      if (goalsResponse.success && goalsResponse.goals && goalsResponse.goals.length > 0) {
        const goalsToInsert = goalsResponse.goals.map((goal: any) => ({
          group_id: groupId,
          title: goal.title.trim(),
          type: goal.type || 'boolean',
          target_count: goal.type === 'percentage' && goal.targetCount ? goal.targetCount : null
        }))
        
        const { error: goalsError } = await supabase
          .from('goals')
          .insert(goalsToInsert as any)
        
        if (goalsError) {
          console.error('Error creating generated goals:', goalsError)
          // Fallback: create a default goal
          await supabase
            .from('goals')
            .insert({
              group_id: groupId,
              title: body.description.trim() || 'Splnit úkol',
              type: 'boolean',
              target_count: null
            } as any)
        } else {
          console.log(`Created ${goalsToInsert.length} generated goals for group ${groupId}`)
        }
      } else {
        // Fallback: create a default goal
        await supabase
          .from('goals')
          .insert({
            group_id: groupId,
            title: body.description.trim() || 'Splnit úkol',
            type: 'boolean',
            target_count: null
          } as any)
        console.log(`Created default goal for group ${groupId} (goals generation failed)`)
      }
    } catch (goalsError: any) {
      console.error('Error generating goals:', goalsError)
      // Fallback: create a default goal
      try {
        await supabase
          .from('goals')
          .insert({
            group_id: groupId,
            title: body.description.trim() || 'Splnit úkol',
            type: 'boolean',
            target_count: null
          } as any)
        console.log(`Created fallback goal for group ${groupId}`)
      } catch (fallbackError) {
        console.error('Error creating fallback goal:', fallbackError)
        // Don't fail group creation if goals fail
      }
    }
    
    return {
      success: true,
      group: {
        id: groupData.id,
        name: groupData.name,
        description: groupData.description,
        qrCode: groupData.qr_code, // Map snake_case to camelCase
        assignmentMode: groupData.assignment_mode || 'uniform',
        createdAt: groupData.created_at,
        studentCount: 0,
        averageProgress: 0,
        helpNeeded: 0
      }
    }
  } catch (error: any) {
    console.error('Error creating group:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se vytvořit skupinu'
    })
  }
})