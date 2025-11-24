import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const query = getQuery(event)
    
    console.log('GET /api/groups - Query params:', query)
    
    // Get authenticated user (more secure - authenticates with Supabase Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('User check - User:', user?.id, 'Error:', userError)
    
    if (userError || !user) {
      console.error('Authentication failed:', userError)
      throw createError({
        statusCode: 401,
        message: 'Neautorizovaný přístup. Prosím přihlaste se.'
      })
    }
    
    // Use authenticated user's ID as teacherId (ignore query param for security)
    const teacherId = user.id
    
    console.log('Loading groups for teacher:', teacherId)
    console.log('Teacher ID type:', typeof teacherId)
    console.log('Teacher ID value:', JSON.stringify(teacherId))

    // Load teacher's groups (use snake_case for column names)
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
    
    console.log('Groups query result:', groups)
    console.log('Groups count:', groups?.length || 0)
    console.log('Groups error:', groupsError)
    
    if (groupsError) {
      console.error('Groups fetch error:', groupsError)
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se načíst skupiny: ' + groupsError.message
      })
    }
    
    // Debug: Check all groups to see teacher_id values
    const { data: allGroups } = await supabase
      .from('groups')
      .select('id, name, teacher_id')
    
    console.log('All groups in DB:', allGroups)

    // For each group, load statistics (use snake_case for column names)
    const groupsWithStats = await Promise.all(
      (groups || []).map(async (group: any) => {
        // Number of students in the group (from group_members)
        const { count: studentCount } = await supabase
          .from('group_members')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', group.id)
        
        // Load goals for calculating percentage progress
        const { data: goals } = await supabase
          .from('goals')
          .select('id, type, target_count')
          .eq('group_id', group.id)
        
        const goalMeta = new Map<string, { type: string; targetCount: number }>()
        if (goals) {
          goals.forEach((goal: any) => {
            goalMeta.set(goal.id, {
              type: goal.type,
              targetCount: goal.target_count || 0
            })
          })
        }
        
        // Load progress data
        const { data: progressRows } = await supabase
          .from('student_progress')
          .select('group_member_id, goal_id, progress, completed')
          .eq('group_id', group.id)
        
        // Calculate percentage progress for each student
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
        
        // Calculate average group progress
        let averageProgress = 0
        if (progressMap.size > 0) {
          const studentProgresses: number[] = []
          progressMap.forEach((percentages) => {
            const studentProgress = percentages.length
              ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
              : 0
            studentProgresses.push(studentProgress)
          })
          
          if (studentProgresses.length > 0) {
            averageProgress = Math.round(
              studentProgresses.reduce((sum, value) => sum + value, 0) / studentProgresses.length
            )
          }
        }
        
        // Number of students needing help
        const { count: helpNeeded } = await supabase
          .from('group_members')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', group.id)
          .eq('needs_help', true)
        
        // Number of online students (last_active_at < 60 seconds)
        const ONLINE_THRESHOLD_MS = 60 * 1000
        const { data: allMembers } = await supabase
          .from('group_members')
          .select('last_active_at')
          .eq('group_id', group.id)
        
        let onlineCount = 0
        if (allMembers && allMembers.length > 0) {
          const now = Date.now()
          const memberDetails: any[] = []
          
          onlineCount = allMembers.filter((member: any) => {
            if (!member.last_active_at) {
              memberDetails.push({ last_active_at: null, isOnline: false, reason: 'No last_active_at' })
              return false
            }
            
            // Parse the timestamp - handle both string and Date objects
            let lastActive: number
            try {
              // If the string doesn't have timezone info, assume it's UTC and add Z
              let lastActiveAtValue = member.last_active_at
              if (typeof lastActiveAtValue === 'string' && 
                  !lastActiveAtValue.endsWith('Z') && 
                  !lastActiveAtValue.includes('+') && 
                  !lastActiveAtValue.includes('-', 10)) { // Check if timezone offset exists (after date part)
                lastActiveAtValue = lastActiveAtValue + 'Z'
              }
              
              const lastActiveDate = new Date(lastActiveAtValue)
              if (isNaN(lastActiveDate.getTime())) {
                memberDetails.push({ 
                  last_active_at: member.last_active_at, 
                  normalized: lastActiveAtValue,
                  isOnline: false, 
                  reason: 'Invalid date' 
                })
                return false
              }
              lastActive = lastActiveDate.getTime()
            } catch (e) {
              memberDetails.push({ 
                last_active_at: member.last_active_at, 
                isOnline: false, 
                reason: 'Date parse error',
                error: e
              })
              return false
            }
            
            const diff = now - lastActive
            const isOnline = diff >= 0 && diff < ONLINE_THRESHOLD_MS
            
            memberDetails.push({
              last_active_at: member.last_active_at,
              lastActiveTimestamp: lastActive,
              now,
              diff,
              diffSeconds: Math.round(diff / 1000),
              threshold: ONLINE_THRESHOLD_MS,
              isOnline
            })
            return isOnline
          }).length
          
          console.log(`[API] Group ${group.id} (${group.name}): ${onlineCount} online out of ${allMembers.length} members`)
          if (onlineCount === 0 && allMembers.length > 0) {
            // Only log details if no one is online but there are members (for debugging)
            console.log(`[API] Member details (debugging):`, JSON.stringify(memberDetails, null, 2))
          }
        } else {
          console.log(`[API] Group ${group.id} (${group.name}): No members found`)
        }
        
        // Number of students who completed all goals
        let completedCount = 0
        if (goals && goals.length > 0) {
          // Get all member IDs from the group
          const { data: allMembers } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', group.id)
          
          if (allMembers) {
            for (const member of allMembers as any[]) {
              const memberId = member.id
              // Check if student has progress for all goals
              const memberProgressRows = (progressRows || []).filter((row: any) => row.group_member_id === memberId)
              
              // Must have progress for all goals
              if (memberProgressRows.length === goals.length) {
                // All goals must be completed
                const allCompleted = memberProgressRows.every((row: any) => row.completed === true)
                if (allCompleted) {
                  completedCount++
                }
              }
            }
          }
        }
        
        return {
          id: group.id,
          name: group.name,
          description: group.description,
          qrCode: group.qr_code, // Map snake_case to camelCase
          assignmentMode: group.assignment_mode || 'uniform',
          createdAt: group.created_at,
          studentCount: studentCount || 0,
          onlineCount,
          averageProgress,
          helpNeeded: helpNeeded || 0,
          completedCount
        }
      })
    )

    return {
      success: true,
      groups: groupsWithStats
    }
  } catch (error: any) {
    console.error('Error fetching groups:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se načíst skupiny'
    })
  }
})
  