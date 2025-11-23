import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const groupId = getRouterParam(event, 'id')
    const memberId = getRouterParam(event, 'memberId')
    
    if (!groupId || !memberId) {
      throw createError({
        statusCode: 400,
        message: 'Chybí ID skupiny nebo člena'
      })
    }
    
    // Get authenticated user (more secure - authenticates with Supabase Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
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
    
    const groupData = group as any
    if (groupData.teacher_id !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'Nemáte oprávnění zobrazit zprávy studentů této skupiny'
      })
    }
    
    // Verify the member belongs to the group
    const { data: member, error: memberError } = await supabase
      .from('group_members')
      .select('id, nickname')
      .eq('id', memberId)
      .eq('group_id', groupId)
      .single()
    
    if (memberError || !member) {
      throw createError({
        statusCode: 404,
        message: 'Student nenalezen ve skupině'
      })
    }
    
    // Get goals for the group
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, title, type, target_count')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
    
    if (goalsError) {
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se načíst cíle skupiny'
      })
    }
    
    // Get relevant messages for this student
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, content, role, is_relevant, metadata, created_at')
      .eq('group_id', groupId)
      .eq('group_member_id', memberId)
      .eq('is_relevant', true)
      .order('created_at', { ascending: true })
    
    if (messagesError) {
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se načíst zprávy studenta'
      })
    }
    
    // Group messages by goal
    const goalsWithMessages = (goals || []).map((goal: any, goalIndex: number) => {
      const goalMessages = (messages || []).filter((msg: any) => {
        const metadata = msg.metadata || {}
        return metadata.goalIndex === goalIndex
      })
      
      return {
        goal: {
          id: goal.id,
          title: goal.title,
          type: goal.type,
          targetCount: goal.target_count || 0,
          index: goalIndex
        },
        messages: goalMessages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          createdAt: msg.created_at,
          metadata: msg.metadata || {}
        }))
      }
    }).filter((item: any) => item.messages.length > 0) // Only include goals with messages
    
    return {
      success: true,
      student: {
        id: member.id,
        nickname: member.nickname
      },
      goalsWithMessages
    }
  } catch (error: any) {
    console.error('Error fetching student messages:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se načíst zprávy studenta'
    })
  }
})

