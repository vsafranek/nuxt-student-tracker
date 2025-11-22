import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody(event)
    
    const { content, groupId, deviceId, isRelevant, goalIndex, progressIncrease, metadata } = body
    
    if (!content || !groupId || !deviceId) {
      throw createError({
        statusCode: 400,
        message: 'Chybí povinné údaje (content, groupId, deviceId)'
      })
    }
    
    // Get group member by deviceId
    const { data: groupMember, error: memberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('device_id', deviceId)
      .single()
    
    if (memberError || !groupMember) {
      // Member not found, but we can still save the message
      console.warn('Group member not found for deviceId:', deviceId)
    }
    
    // Save message to database
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        content: content.trim(),
        group_id: groupId,
        student_id: null, // Students without user accounts
        is_relevant: isRelevant || false,
        metadata: metadata || {
          goalIndex,
          progressIncrease,
          deviceId,
          timestamp: new Date().toISOString()
        }
      } as any)
      .select()
      .single()
    
    if (insertError) {
      console.error('Error saving message:', insertError)
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se uložit zprávu do databáze'
      })
    }
    
    return {
      success: true,
      messageId: message.id
    }
  } catch (error: any) {
    console.error('Error saving message:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se uložit zprávu'
    })
  }
})


