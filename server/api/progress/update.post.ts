import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody(event)
    
    const { groupId, goalIndex, deviceId, progressIncrease } = body
    
    if (!groupId || goalIndex === null || goalIndex === undefined || !deviceId) {
      throw createError({
        statusCode: 400,
        message: 'Chybí povinné údaje (groupId, goalIndex, deviceId)'
      })
    }
    
    // Find group member by device
    const { data: groupMember, error: memberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('device_id', deviceId)
      .single()
    
    if (memberError || !groupMember) {
      throw createError({
        statusCode: 404,
        message: 'Student ve skupině nenalezen'
      })
    }
    
    const targetStudentId = groupMember.id
    
    // Get goals for the group
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, type, target_count')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
    
    if (goalsError) {
      console.error('Error fetching goals:', goalsError)
      throw createError({
        statusCode: 500,
        message: 'Chyba při načítání cílů skupiny'
      })
    }
    
    if (!goals || goals.length === 0) {
      console.warn(`No goals found for group ${groupId}`)
      throw createError({
        statusCode: 404,
        message: 'Cíle skupiny nenalezeny'
      })
    }
    
    console.log(`Found ${goals.length} goals for group ${groupId}, goalIndex: ${goalIndex}`)
    
    const goal = goals[goalIndex]
    if (!goal) {
      console.error(`Goal at index ${goalIndex} not found. Available goals:`, goals.map((g: any, i: number) => `${i}: ${g.id}`))
      throw createError({
        statusCode: 404,
        message: `Cíl na indexu ${goalIndex} nenalezen`
      })
    }
    
    console.log(`Updating progress for goal ${goal.id} (type: ${goal.type}, target: ${goal.target_count})`)
    
    // Get current progress
    const { data: currentProgress, error: progressError } = await supabase
      .from('student_progress')
      .select('id, progress, completed')
      .eq('group_id', groupId)
      .eq('goal_id', goal.id)
      .eq('group_member_id', targetStudentId)
      .limit(1)
      .single()
    
    if (progressError && progressError.code !== 'PGRST116') {
      throw createError({
        statusCode: 500,
        message: 'Chyba při načítání progress'
      })
    }
    
    let newProgress = currentProgress?.progress || 0
    let newCompleted = currentProgress?.completed || false
    
    if (goal.type === 'percentage') {
      // For percentage goals, calculate new progress based on increase
      // progressIncrease is 0, 33, 66, or 100 - represents the target percentage
      if (progressIncrease !== null && progressIncrease !== undefined) {
        const targetCount = goal.target_count || 1
        // Calculate what progress count corresponds to this percentage
        const targetProgress = Math.round((progressIncrease / 100) * targetCount)
        // Update to the higher value (don't decrease progress)
        newProgress = Math.max(newProgress || 0, targetProgress)
        
        // Mark as completed if progress reaches 100%
        if (progressIncrease >= 100 || newProgress >= targetCount) {
          newCompleted = true
          newProgress = targetCount
        }
      }
    } else if (goal.type === 'boolean') {
      // For boolean goals, mark as completed if progressIncrease >= 100
      if (progressIncrease !== null && progressIncrease !== undefined && progressIncrease >= 100) {
        newCompleted = true
        newProgress = 1
      }
    }
    
    // Update or create progress entry
    if (currentProgress) {
      // Update existing
      console.log(`Updating existing progress record ${currentProgress.id}: progress=${newProgress}, completed=${newCompleted}`)
      const { error: updateError } = await supabase
        .from('student_progress')
        .update({
          progress: newProgress,
          completed: newCompleted,
          last_updated: new Date().toISOString()
        })
        .eq('id', currentProgress.id)
      
      if (updateError) {
        console.error('Error updating progress:', updateError)
        throw createError({
          statusCode: 500,
          message: 'Chyba při aktualizaci progress'
        })
      }
      console.log('Progress updated successfully')
    } else {
      // Create new
      console.log(`Creating new progress record: group_id=${groupId}, goal_id=${goal.id}, group_member_id=${targetStudentId}, progress=${newProgress}, completed=${newCompleted}`)
      const { error: insertError } = await supabase
        .from('student_progress')
        .insert({
          group_id: groupId,
          goal_id: goal.id,
          group_member_id: targetStudentId,
          progress: newProgress,
          completed: newCompleted,
          needs_help: false
        } as any)
      
      if (insertError) {
        console.error('Error creating progress:', insertError)
        throw createError({
          statusCode: 500,
          message: 'Chyba při vytváření progress záznamu'
        })
      }
      console.log('Progress created successfully')
    }
    
    return {
      success: true,
      progress: newProgress,
      completed: newCompleted
    }
  } catch (error: any) {
    console.error('Error updating progress:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se aktualizovat progress'
    })
  }
})

