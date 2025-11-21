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
    
    // Get group info (no auth required - anyone can view group info to join)
    const { data: group, error } = await supabase
      .from('groups')
      .select('id, name, description, created_at')
      .eq('id', groupId)
      .single()
    
    if (error || !group) {
      throw createError({
        statusCode: 404,
        message: 'Skupina nenalezena'
      })
    }
    
    return {
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description
      }
    }
  } catch (error: any) {
    console.error('Error fetching group info:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se načíst informace o skupině'
    })
  }
})

