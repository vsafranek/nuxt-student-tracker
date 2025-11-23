import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const groupId = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!groupId) {
      throw createError({
        statusCode: 400,
        message: 'Chybí ID skupiny'
      })
    }
    
    // Get authenticated user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      throw createError({
        statusCode: 401,
        message: 'Neautorizovaný přístup. Prosím přihlaste se.'
      })
    }
    
    // Verify the group belongs to the authenticated user
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('teacher_id')
      .eq('id', groupId)
      .single()
    
    if (groupError || !group) {
      throw createError({
        statusCode: 404,
        message: 'Skupina nenalezena'
      })
    }
    
    if (group.teacher_id !== session.user.id) {
      throw createError({
        statusCode: 403,
        message: 'Nemáte oprávnění upravovat tuto skupinu'
      })
    }
    
    const { goals } = body
    
    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Musíte zadat alespoň jeden cíl'
      })
    }
    
    // Delete existing goals for this group
    const { error: deleteError } = await supabase
      .from('goals')
      .delete()
      .eq('group_id', groupId)
    
    if (deleteError) {
      console.error('Error deleting existing goals:', deleteError)
      // Continue anyway - might not have any goals
    }
    
    // Insert new goals
    const goalsToInsert = goals.map((goal: any) => ({
      group_id: groupId,
      title: goal.title.trim(),
      type: goal.type, // 'boolean' or 'percentage'
      target_count: goal.type === 'percentage' ? (goal.targetCount || 1) : null
    }))
    
    const { data: insertedGoals, error: insertError } = await supabase
      .from('goals')
      .insert(goalsToInsert as any)
      .select()
    
    if (insertError) {
      console.error('Error inserting goals:', insertError)
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se vytvořit cíle'
      })
    }
    
    return {
      success: true,
      goals: insertedGoals
    }
  } catch (error: any) {
    console.error('Error creating goals:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se vytvořit cíle'
    })
  }
})

