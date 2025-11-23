import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody(event)
    
    // Validate input
    if (!body.groupId || !body.nickname || !body.deviceId) {
      throw createError({
        statusCode: 400,
        message: 'Chybí povinné údaje (groupId, nickname, deviceId)'
      })
    }
    
    const { groupId, nickname, deviceId } = body
    
    // Check if group exists
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .eq('id', groupId)
      .single()
    
    if (groupError || !group) {
      throw createError({
        statusCode: 404,
        message: 'Skupina nenalezena'
      })
    }
    
    // Check if device already joined this group
    const { data: existingMember, error: checkError } = await supabase
      .from('group_members')
      .select('id, nickname')
      .eq('group_id', groupId)
      .eq('device_id', deviceId)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing member:', checkError)
      throw createError({
        statusCode: 500,
        message: 'Chyba při kontrole členství'
      })
    }
    
    if (existingMember) {
      const existingMemberData = existingMember as any
      // Device already joined - return existing info
      return {
        success: true,
        message: 'Zařízení je již zaregistrované v této skupině',
        member: {
          nickname: existingMemberData.nickname
        }
      }
    }
    
    // Create new membership
    const supabaseClient = supabase as any
    
    const { data: newMember, error: insertError } = await supabaseClient
      .from('group_members')
      .insert({
        device_id: deviceId,
        group_id: groupId,
        nickname: nickname.trim()
      } as any)
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating group member:', insertError)
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se připojit ke skupině: ' + insertError.message
      })
    }
    
    // Initialize progress for all goals in the group
    // Get all goals for this group
    const { data: goals, error: goalsError } = await supabaseClient
      .from('goals')
      .select('id')
      .eq('group_id', groupId)
    
    const memberData = newMember as any
    
    if (goalsError) {
      console.error('Error fetching goals for progress initialization:', goalsError)
      // Don't fail the join if goals fetch fails, just log it
    } else if (goals && goals.length > 0) {
      // Create progress entries for each goal
      // Check if progress already exists, if not create it
      // For students without user accounts, we'll track progress per group_member
      // For now, we'll check if progress exists and create if it doesn't
      
      for (const goal of goals as any[]) {
        const { data: existingProgress, error: existingProgressError } = await supabaseClient
          .from('student_progress')
          .select('id')
          .eq('group_id', groupId)
          .eq('goal_id', goal.id)
          .eq('group_member_id', memberData.id)
          .limit(1)
          .maybeSingle()
        
        if (existingProgressError && existingProgressError.code !== 'PGRST116') {
          console.error('Error checking existing progress:', existingProgressError)
          continue
        }
        
        if (!existingProgress) {
          const { error: progressError } = await supabaseClient
            .from('student_progress')
            .insert({
              group_id: groupId,
              goal_id: goal.id,
              group_member_id: memberData.id,
              progress: 0,
              completed: false,
              needs_help: false
            })
          
          if (progressError) {
            console.error(`Error creating progress for goal ${goal.id}:`, progressError)
          }
        }
      }
      
      console.log(`Initialized progress for ${goals.length} goals for new member`)
    }
    
    return {
      success: true,
      message: 'Úspěšně jste se připojili ke skupině',
      member: {
        nickname: memberData.nickname,
        joinedAt: memberData.joined_at
      }
    }
  } catch (error: any) {
    console.error('Error joining group:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se připojit ke skupině'
    })
  }
})

