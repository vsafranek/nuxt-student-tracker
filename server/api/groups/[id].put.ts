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
    
    // Get authenticated session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      throw createError({
        statusCode: 401,
        message: 'Neautorizovaný přístup. Prosím přihlaste se.'
      })
    }
    
    // Validate input
    if (!body.name || !body.description) {
      throw createError({
        statusCode: 400,
        message: 'Chybí povinné údaje (name, description)'
      })
    }
    
    // Verify the group belongs to the authenticated user
    const { data: existingGroup, error: groupError } = await supabase
      .from('groups')
      .select('teacher_id')
      .eq('id', groupId)
      .single()
    
    if (groupError || !existingGroup) {
      throw createError({
        statusCode: 404,
        message: 'Skupina nebyla nalezena'
      })
    }
    
    const existingGroupData = existingGroup as any
    
    if (existingGroupData.teacher_id !== session.user.id) {
      throw createError({
        statusCode: 403,
        message: 'Nemáte oprávnění upravit tuto skupinu'
      })
    }
    
    // Update the group
    const { data: updatedGroup, error: updateError } = await supabase
      .from('groups')
      .update({
        name: body.name,
        description: body.description,
      } as never)
      .eq('id', groupId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Update error:', updateError)
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se upravit skupinu: ' + updateError.message
      })
    }
    
    if (!updatedGroup) {
      throw createError({
        statusCode: 500,
        message: 'Skupina byla upravena, ale nepodařilo se ji načíst'
      })
    }
    
    const groupData = updatedGroup as any
    
    return {
      success: true,
      group: {
        id: groupData.id,
        name: groupData.name,
        description: groupData.description,
        qrCode: groupData.qr_code, // Map snake_case to camelCase
        createdAt: groupData.created_at
      }
    }
  } catch (error: any) {
    console.error('Error updating group:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se upravit skupinu'
    })
  }
})


