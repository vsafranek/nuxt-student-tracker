import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const query = getQuery(event)
    
    console.log('GET /api/groups - Query params:', query)
    
    // Get authenticated session (more reliable for server-side)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('Session check - Session:', session?.user?.id, 'Error:', sessionError)
    
    if (sessionError || !session?.user) {
      console.error('Authentication failed:', sessionError)
      throw createError({
        statusCode: 401,
        message: 'Neautorizovaný přístup. Prosím přihlaste se.'
      })
    }
    
    // Use authenticated user's ID as teacherId (ignore query param for security)
    const teacherId = session.user.id
    
    console.log('Loading groups for teacher:', teacherId)
    console.log('Teacher ID type:', typeof teacherId)
    console.log('Teacher ID value:', JSON.stringify(teacherId))

    // Načtení skupin učitele (use snake_case for column names)
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

    // Pro každou skupinu načíst statistiky (use snake_case for column names)
    const groupsWithStats = await Promise.all(
      (groups || []).map(async (group: any) => {
        // Počet studentů ve skupině (z group_members)
        const { count: studentCount } = await supabase
          .from('group_members')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', group.id)
        
        // Průměrný pokrok
        const { data: progressData } = await supabase
          .from('student_progress')
          .select('progress')
          .eq('group_id', group.id)
        
        const averageProgress = progressData && progressData.length > 0
          ? Math.round(progressData.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / progressData.length)
          : 0
        
        // Počet studentů potřebujících pomoc
        const { count: helpNeeded } = await supabase
          .from('student_progress')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)
          .eq('needs_help', true)
        
        return {
          id: group.id,
          name: group.name,
          description: group.description,
          qrCode: group.qr_code, // Map snake_case to camelCase
          createdAt: group.created_at,
          studentCount: studentCount || 0,
          averageProgress,
          helpNeeded: helpNeeded || 0
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
  