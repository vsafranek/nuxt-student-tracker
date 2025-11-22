import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const groupId = getRouterParam(event, 'id')
    const query = getQuery(event)
    const deviceId = query.deviceId as string
    
    if (!groupId) {
      throw createError({
        statusCode: 400,
        message: 'Chybí ID skupiny'
      })
    }
    
    if (!deviceId) {
      throw createError({
        statusCode: 400,
        message: 'Chybí deviceId'
      })
    }
    
    // Get group member by deviceId
    const { data: groupMember, error: memberError } = await supabase
      .from('group_members')
      .select('id, nickname')
      .eq('group_id', groupId)
      .eq('device_id', deviceId)
      .single()
    
    if (memberError || !groupMember) {
      // Student not found in group, but we can still return goals without progress
      // Get goals for the group
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('id, title, type, target_count')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
      
      if (goalsError) {
        throw createError({
          statusCode: 500,
          message: 'Nepodařilo se načíst cíle skupiny'
        })
      }
      
      return {
        success: true,
        goals: (goals || []).map((goal: any) => ({
          id: goal.id,
          title: goal.title,
          type: goal.type,
          targetCount: goal.target_count || 0,
          progress: 0,
          completed: false,
          percentage: 0
        }))
      }
    }
    
    // Get goals for the group
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, title, type, target_count')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
    
    if (goalsError) {
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se načíst cíle skupiny'
      })
    }
    
    // Get progress for each goal
    // Note: student_progress uses student_id (UUID from users table)
    // Since students without accounts use deviceId, we'll use group_id + goal_id combination
    // For now, progress will be tracked per goal in group (we can extend schema later)
    
    const goalsWithProgress = await Promise.all(
      (goals || []).map(async (goal: any) => {
        // Try to find progress by group_id and goal_id where student_id is null
        // This allows tracking progress for students without user accounts
        // We'll use a combination of group_id + goal_id to identify progress
        // Later we can extend schema to support group_member_id
        
        const { data: progressData, error: progressError } = await supabase
          .from('student_progress')
          .select('progress, completed')
          .eq('group_id', groupId)
          .eq('goal_id', goal.id)
          .is('student_id', null) // Progress without user account
          .limit(1)
          .single()
        
        let progress = 0
        let completed = false
        
        if (!progressError && progressData) {
          progress = progressData.progress || 0
          completed = progressData.completed || false
        }
        
        // Calculate percentage based on goal type
        // Round to nearest increment: 0%, 33%, 66%, 100%
        let percentage = 0
        if (goal.type === 'percentage' && goal.target_count) {
          // Progress is stored as count completed (0 to target_count)
          // Calculate raw percentage
          const rawPercentage = Math.round((progress / goal.target_count) * 100)
          // Round to nearest 33% increment for display (0%, 33%, 66%, 100%)
          if (rawPercentage === 0) {
            percentage = 0
          } else if (rawPercentage >= 100 || completed) {
            percentage = 100
          } else if (rawPercentage >= 66) {
            percentage = 66
          } else if (rawPercentage >= 33) {
            percentage = 33
          } else {
            percentage = 33 // If there's any progress, show at least 33%
          }
        } else if (goal.type === 'boolean') {
          percentage = completed ? 100 : 0
        }
        
        return {
          id: goal.id,
          title: goal.title,
          type: goal.type,
          targetCount: goal.target_count || 0,
          progress,
          completed,
          percentage
        }
      })
    )
    
    return {
      success: true,
      goals: goalsWithProgress
    }
  } catch (error: any) {
    console.error('Error fetching goals with progress:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se načíst cíle s průběhem'
    })
  }
})

