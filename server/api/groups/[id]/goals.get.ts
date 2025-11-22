import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const groupId = getRouterParam(event, 'id')
    
    if (!groupId) {
      throw createError({
        statusCode: 400,
        message: 'Chybí ID skupiny'
      })
    }
    
    // Get goals for the group (no auth required - students need to see goals)
    const { data: goals, error } = await supabase
      .from('goals')
      .select('id, title, type, target_count')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching goals:', error)
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
        targetCount: goal.target_count
      }))
    }
  } catch (error: any) {
    console.error('Error fetching goals:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se načíst cíle'
    })
  }
})


