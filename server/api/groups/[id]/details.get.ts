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
    
    // Get authenticated user (more secure - authenticates with Supabase Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
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
    
    if (groupError) {
      console.error('Error fetching group from database:', groupError)
      console.error('Group ID:', groupId)
      console.error('User ID:', user.id)
      
      // Check if it's a "not found" error or RLS policy error
      if (groupError.code === 'PGRST116' || groupError.message?.includes('No rows')) {
        throw createError({
          statusCode: 404,
          message: 'Skupina nenalezena'
        })
      }
      
      // For other errors, log and throw
      throw createError({
        statusCode: 500,
        message: 'Chyba při načítání skupiny: ' + groupError.message
      })
    }
    
    if (!group) {
      console.error('Group not found - Group ID:', groupId, 'User ID:', user.id)
      throw createError({
        statusCode: 404,
        message: 'Skupina nenalezena'
      })
    }
    
    const groupData = group as any
    
    // Verify the group belongs to the authenticated user
    if (groupData.teacher_id !== user.id) {
      console.error('Group access denied - Group teacher_id:', groupData.teacher_id, 'User ID:', user.id)
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
    
    const goalsQuery = await supabase
      .from('goals')
      .select('id, type, target_count')
      .eq('group_id', groupId)
    
    const goalMeta = new Map<string, { type: string; targetCount: number }>()
    if (!goalsQuery.error && goalsQuery.data) {
      goalsQuery.data.forEach((goal: any) => {
        goalMeta.set(goal.id, {
          type: goal.type,
          targetCount: goal.target_count || 0
        })
      })
    }
    
    const { data: progressRows } = await supabase
      .from('student_progress')
      .select('group_member_id, goal_id, progress, completed')
      .eq('group_id', groupId)
    
    const progressMap = new Map<string, number[]>()
    ;(progressRows || []).forEach((row: any) => {
      if (!row.group_member_id || !row.goal_id) return
      const goal = goalMeta.get(row.goal_id)
      if (!goal) return
      
      let percentage = 0
      if (goal.type === 'percentage' && goal.targetCount) {
        const rawPercentage = Math.round((row.progress || 0) / goal.targetCount * 100)
        if (rawPercentage === 0) percentage = 0
        else if (rawPercentage >= 100 || row.completed) percentage = 100
        else if (rawPercentage >= 66) percentage = 66
        else if (rawPercentage >= 33) percentage = 33
        else percentage = 33
      } else if (goal.type === 'boolean') {
        percentage = row.completed ? 100 : 0
      }
      
      if (!progressMap.has(row.group_member_id)) {
        progressMap.set(row.group_member_id, [])
      }
      progressMap.get(row.group_member_id)!.push(percentage)
    })
    
    const students = (members || []).map((member: any) => {
      const percentages = progressMap.get(member.id) || []
      const progressPercentage = percentages.length
        ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
        : 0
      
      return {
        id: member.id,
        nickname: member.nickname,
        deviceId: member.device_id,
        joinedAt: member.joined_at,
        needsHelp: member.needs_help || false,
        helpRequestedAt: member.help_requested_at,
        lastActiveAt: member.last_active_at,
        progressPercentage,
        lastMessageContent: member.last_message_content,
        lastMessageIsRelevant: member.last_message_is_relevant,
        lastMessageGoalIndex: member.last_message_goal_index,
        lastMessageProgress: member.last_message_progress,
        lastMessageReason: member.last_message_reason,
        lastMessageAt: member.last_message_at
      }
    })
    
    const helpNeededCount = students.filter(student => student.needsHelp).length
    const averageProgress = students.length
      ? Math.round(students.reduce((sum, student) => sum + (student.progressPercentage || 0), 0) / students.length)
      : 0
    
    return {
      success: true,
      group: {
        id: groupData.id,
        name: groupData.name,
        description: groupData.description,
        assignmentMode: groupData.assignment_mode || 'uniform',
        qrCode: groupData.qr_code,
        createdAt: groupData.created_at
      },
      students,
      studentCount: students.length,
      averageProgress,
      helpNeeded: helpNeededCount
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

