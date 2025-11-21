import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody(event)
    
    // Validate input
    if (!body.groupId || !body.nickname || !body.deviceId) {
      throw createError({
        statusCode: 400,
        message: 'Chybí povinné údaje (groupId, nickname, deviceId)'
      })
    }
    
    const { groupId, nickname, deviceId } = body
    
    // Check if group exists
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .eq('id', groupId)
      .single()
    
    if (groupError || !group) {
      throw createError({
        statusCode: 404,
        message: 'Skupina nenalezena'
      })
    }
    
    // Check if device already joined this group
    const { data: existingMember, error: checkError } = await supabase
      .from('group_members')
      .select('id, nickname')
      .eq('group_id', groupId)
      .eq('device_id', deviceId)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing member:', checkError)
      throw createError({
        statusCode: 500,
        message: 'Chyba při kontrole členství'
      })
    }
    
    if (existingMember) {
      // Device already joined - return existing info
      return {
        success: true,
        message: 'Zařízení je již zaregistrované v této skupině',
        member: {
          nickname: existingMember.nickname
        }
      }
    }
    
    // Create new membership
    const { data: newMember, error: insertError } = await supabase
      .from('group_members')
      .insert({
        device_id: deviceId,
        group_id: groupId,
        nickname: nickname.trim()
      } as any)
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating group member:', insertError)
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se připojit ke skupině: ' + insertError.message
      })
    }
    
    return {
      success: true,
      message: 'Úspěšně jste se připojili ke skupině',
      member: {
        nickname: newMember.nickname,
        joinedAt: newMember.joined_at
      }
    }
  } catch (error: any) {
    console.error('Error joining group:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se připojit ke skupině'
    })
  }
})

