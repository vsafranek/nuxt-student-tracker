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
    
    // Get group info
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()
    
    if (groupError || !group) {
      throw createError({
        statusCode: 404,
        message: 'Skupina nenalezena'
      })
    }
    
    const groupData = group as any
    
    // Verify the group belongs to the authenticated user
    if (groupData.teacher_id !== session.user.id) {
      throw createError({
        statusCode: 403,
        message: 'Nemáte oprávnění zobrazit tuto skupinu'
      })
    }
    
    // Get all students in the group
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: false })
    
    if (membersError) {
      console.error('Error fetching group members:', membersError)
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se načíst seznam studentů'
      })
    }
    
    // Format members data
    const students = (members || []).map((member: any) => ({
      id: member.id,
      nickname: member.nickname,
      deviceId: member.device_id,
      joinedAt: member.joined_at
    }))
    
    return {
      success: true,
      group: {
        id: groupData.id,
        name: groupData.name,
        description: groupData.description,
        qrCode: groupData.qr_code,
        createdAt: groupData.created_at
      },
      students,
      studentCount: students.length
    }
  } catch (error: any) {
    console.error('Error fetching group details:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se načíst detaily skupiny'
    })
  }
})

