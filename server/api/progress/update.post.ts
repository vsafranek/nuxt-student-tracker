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
    
    // Get goals for the group
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, type, target_count')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
    
    if (goalsError || !goals || goals.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Cíle skupiny nenalezeny'
      })
    }
    
    const goal = goals[goalIndex]
    if (!goal) {
      throw createError({
        statusCode: 404,
        message: 'Cíl nenalezen'
      })
    }
    
    // Get current progress
    const { data: currentProgress, error: progressError } = await supabase
      .from('student_progress')
      .select('id, progress, completed')
      .eq('group_id', groupId)
      .eq('goal_id', goal.id)
      .is('student_id', null)
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
      const { error: updateError } = await supabase
        .from('student_progress')
        .update({
          progress: newProgress,
          completed: newCompleted,
          last_updated: new Date().toISOString()
        })
        .eq('id', currentProgress.id)
      
      if (updateError) {
        throw createError({
          statusCode: 500,
          message: 'Chyba při aktualizaci progress'
        })
      }
    } else {
      // Create new
      const { error: insertError } = await supabase
        .from('student_progress')
        .insert({
          group_id: groupId,
          goal_id: goal.id,
          student_id: null,
          progress: newProgress,
          completed: newCompleted,
          needs_help: false
        } as any)
      
      if (insertError) {
        throw createError({
          statusCode: 500,
          message: 'Chyba při vytváření progress záznamu'
        })
      }
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

