import { serverSupabaseClient } from '#supabase/server'

const ONLINE_THRESHOLD_MS = 60 * 1000

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
    if (groupData.teacher_id !== session.user.id) {
      throw createError({
        statusCode: 403,
        message: 'Nemáte oprávnění zobrazit statistiky této skupiny'
      })
    }
    
    // Počet studentů ve skupině
    const { count: studentCount } = await supabase
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
    
    // Načíst goals pro výpočet procentuálního pokroku
    const { data: goals } = await supabase
      .from('goals')
      .select('id, type, target_count')
      .eq('group_id', groupId)
    
    const goalMeta = new Map<string, { type: string; targetCount: number }>()
    if (goals) {
      goals.forEach((goal: any) => {
        goalMeta.set(goal.id, {
          type: goal.type,
          targetCount: goal.target_count || 0
        })
      })
    }
    
    // Načíst progress data
    const { data: progressRows } = await supabase
      .from('student_progress')
      .select('group_member_id, goal_id, progress, completed')
      .eq('group_id', groupId)
    
    // Vypočítat procentuální pokrok pro každého studenta
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
    
    // Vypočítat průměrný pokrok skupiny
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
    
    // Počet studentů potřebujících pomoc
    const { count: helpNeeded } = await supabase
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('needs_help', true)
    
    // Počet online studentů (last_active_at < 60 sekund)
    const { data: allMembers, error: membersError } = await supabase
      .from('group_members')
      .select('last_active_at')
      .eq('group_id', groupId)
    
    if (membersError) {
      console.error(`[API Stats] Error fetching members for group ${groupId}:`, membersError)
    }
    
    console.log(`[API Stats] Fetched ${allMembers?.length || 0} members for group ${groupId}`)
    if (allMembers && allMembers.length > 0) {
      console.log(`[API Stats] Raw member data:`, JSON.stringify(allMembers, null, 2))
    }
    
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
            error: String(e)
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
      
      console.log(`[API Stats] Group ${groupId}: ${onlineCount} online out of ${allMembers.length} members`)
      // Always log details for debugging
      console.log(`[API Stats] Member details:`, JSON.stringify(memberDetails, null, 2))
    } else {
      console.log(`[API Stats] Group ${groupId}: No members found`)
    }
    
    // Počet studentů, kteří dokončili všechny cíle
    let completedCount = 0
    if (goals && goals.length > 0) {
      // Získat všechny member IDs ze skupiny
      const { data: allMemberIds } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
      
      if (allMemberIds) {
        for (const member of allMemberIds as any[]) {
          const memberId = member.id
          // Zkontrolovat, zda má student progress pro všechny cíle
          const memberProgressRows = (progressRows || []).filter((row: any) => row.group_member_id === memberId)
          
          // Musí mít progress pro všechny cíle
          if (memberProgressRows.length === goals.length) {
            // Všechny cíle musí být dokončené
            const allCompleted = memberProgressRows.every((row: any) => row.completed === true)
            if (allCompleted) {
              completedCount++
            }
          }
        }
      }
    }
    
    return {
      success: true,
      stats: {
        studentCount: studentCount || 0,
        onlineCount,
        averageProgress,
        helpNeeded: helpNeeded || 0,
        completedCount
      }
    }
  } catch (error: any) {
    console.error('Error fetching group stats:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se načíst statistiky skupiny'
    })
  }
})

