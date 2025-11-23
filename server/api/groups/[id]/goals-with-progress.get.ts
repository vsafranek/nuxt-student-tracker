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
    
    const memberData = groupMember as any
    
    // Get goals for the group
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, title, type, target_count')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
    
    if (goalsError) {
      console.error('Error fetching goals:', goalsError)
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se načíst cíle skupiny'
      })
    }
    
    console.log(`Found ${goals?.length || 0} goals for group ${groupId}, member ${memberData.id}`)
    
    const { data: progressRows } = await supabase
      .from('student_progress')
      .select('goal_id, progress, completed')
      .eq('group_id', groupId)
      .eq('group_member_id', memberData.id)
    
    console.log(`Found ${progressRows?.length || 0} progress records for member ${memberData.id}`)
    
    const progressMap = new Map<string, { progress: number; completed: boolean }>()
    ;(progressRows || []).forEach((row: any) => {
      if (!row.goal_id) return
      progressMap.set(row.goal_id, {
        progress: row.progress || 0,
        completed: row.completed || false
      })
    })
    
    const goalsList = (goals || []) as any[]
    const goalsWithProgress = goalsList.map((goal: any) => {
      const progressData = progressMap.get(goal.id) || { progress: 0, completed: false }
      let percentage = 0
      if (goal.type === 'percentage' && goal.target_count) {
        const rawPercentage = Math.round((progressData.progress / goal.target_count) * 100)
        if (rawPercentage === 0) {
          percentage = 0
        } else if (rawPercentage >= 100 || progressData.completed) {
          percentage = 100
        } else if (rawPercentage >= 66) {
          percentage = 66
        } else if (rawPercentage >= 33) {
          percentage = 33
        } else {
          percentage = 33
        }
      } else if (goal.type === 'boolean') {
        percentage = progressData.completed ? 100 : 0
      }
      
      return {
        id: goal.id,
        title: goal.title,
        type: goal.type,
        targetCount: goal.target_count || 0,
        progress: progressData.progress,
        completed: progressData.completed,
        percentage
      }
    })
    
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

