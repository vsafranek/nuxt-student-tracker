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
    
    // Get authenticated session
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
        message: 'Skupina nebyla nalezena'
      })
    }
    
    if (group.teacher_id !== session.user.id) {
      throw createError({
        statusCode: 403,
        message: 'Nemáte oprávnění smazat tuto skupinu'
      })
    }
    
    // Delete related records in the correct order (to avoid foreign key constraint violations)
    // 1. Delete student_progress (references goals and groups)
    const { error: progressError } = await supabase
      .from('student_progress')
      .delete()
      .eq('group_id', groupId)
    
    if (progressError) {
      console.error('Error deleting student_progress:', progressError)
      // Continue anyway, might not have any progress records
    }
    
    // 2. Delete messages (references groups)
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('group_id', groupId)
    
    if (messagesError) {
      console.error('Error deleting messages:', messagesError)
      // Continue anyway, might not have any messages
    }
    
    // 3. Get all goals for this group first (to delete their progress)
    const { data: goals, error: goalsFetchError } = await supabase
      .from('goals')
      .select('id')
      .eq('group_id', groupId)
    
    if (goalsFetchError) {
      console.error('Error fetching goals:', goalsFetchError)
      // Continue anyway
    }
    
    // 4. Delete goals (references groups)
    const { error: goalsError } = await supabase
      .from('goals')
      .delete()
      .eq('group_id', groupId)
    
    if (goalsError) {
      console.error('Error deleting goals:', goalsError)
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se smazat cíle skupiny: ' + goalsError.message
      })
    }
    
    // 5. Delete group_members (references groups)
    const { error: membersError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
    
    if (membersError) {
      console.error('Error deleting group_members:', membersError)
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se smazat členy skupiny: ' + membersError.message
      })
    }
    
    // 6. Finally, delete the group itself
    const { error: deleteError } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se smazat skupinu: ' + deleteError.message
      })
    }
    
    return {
      success: true,
      message: 'Skupina byla úspěšně smazána'
    }
  } catch (error: any) {
    console.error('Error deleting group:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se smazat skupinu'
    })
  }
})


