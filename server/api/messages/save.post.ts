import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody(event)
    
    const {
      content,
      groupId,
      deviceId,
      role,
      isRelevant,
      goalIndex,
      progressIncrease,
      metadata
    } = body
    
    if (!content || !groupId || !deviceId) {
      throw createError({
        statusCode: 400,
        message: 'Chybí povinné údaje (content, groupId, deviceId)'
      })
    }
    
    const normalizedRole = role === 'assistant' ? 'assistant' : 'user'
    
    // Get group member by deviceId
    const { data: groupMember, error: memberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('device_id', deviceId)
      .single()
    
    if (memberError || !groupMember) {
      console.error('Group member not found for deviceId:', deviceId, memberError)
      throw createError({
        statusCode: 404,
        message: 'Člen skupiny nebyl nalezen'
      })
    }
    
    const metadataPayload: Record<string, any> = {
      ...(metadata || {})
    }
    
    if (goalIndex !== undefined) {
      metadataPayload.goalIndex = goalIndex
    }
    
    if (progressIncrease !== undefined) {
      metadataPayload.progressIncrease = progressIncrease
    }
    
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        content: content.trim(),
        group_id: groupId,
        group_member_id: groupMember.id,
        student_id: null, // Students without user accounts
        role: normalizedRole,
        is_relevant: typeof isRelevant === 'boolean' ? isRelevant : null,
        metadata: Object.keys(metadataPayload).length > 0
          ? metadataPayload
          : null
      } as any)
      .select('id, content, role, is_relevant, metadata, created_at')
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
      message
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


