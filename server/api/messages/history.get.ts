import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const query = getQuery(event)
    
    const groupId = query.groupId as string
    const deviceId = query.deviceId as string
    
    if (!groupId || !deviceId) {
      throw createError({
        statusCode: 400,
        message: 'Chybí groupId nebo deviceId'
      })
    }
    
    const { data: groupMember, error: memberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('device_id', deviceId)
      .single()
    
    if (memberError || !groupMember) {
      throw createError({
        statusCode: 404,
        message: 'Student ve skupině nebyl nalezen'
      })
    }
    
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, content, role, is_relevant, metadata, created_at')
      .eq('group_id', groupId)
      .eq('group_member_id', groupMember.id)
      .order('created_at', { ascending: true })
      .limit(200)
    
    if (messagesError) {
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se načíst historii konverzace'
      })
    }
    
    return {
      success: true,
      messages: messages || []
    }
  } catch (error: any) {
    console.error('Error loading message history:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se načíst historii konverzace'
    })
  }
})


