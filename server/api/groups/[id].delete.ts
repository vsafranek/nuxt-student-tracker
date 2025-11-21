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
    
    // Delete the group (cascade should handle related records)
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


