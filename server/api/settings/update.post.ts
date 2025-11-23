import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody(event)
    
    // Get authenticated user (more secure - authenticates with Supabase Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw createError({
        statusCode: 401,
        message: 'Neautorizovaný přístup. Prosím přihlaste se.'
      })
    }
    
    // Validate input
    if (body.inactivityTimeoutMinutes !== undefined && 
        (typeof body.inactivityTimeoutMinutes !== 'number' || body.inactivityTimeoutMinutes < 1 || body.inactivityTimeoutMinutes > 60)) {
      throw createError({
        statusCode: 400,
        message: 'Čas neaktivity musí být mezi 1 a 60 minutami'
      })
    }
    
    if (body.allowDirectAnswers !== undefined && typeof body.allowDirectAnswers !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: 'Neplatná hodnota pro povolení přímých odpovědí'
      })
    }
    
    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('app_settings')
      .select('id')
      .eq('teacher_id', user.id)
      .maybeSingle()
    
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }
    
    if (body.inactivityTimeoutMinutes !== undefined) {
      updateData.inactivity_timeout_minutes = body.inactivityTimeoutMinutes
    }
    
    if (body.allowDirectAnswers !== undefined) {
      updateData.allow_direct_answers = body.allowDirectAnswers
    }
    
    let result
    
    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('app_settings')
        .update(updateData)
        .eq('teacher_id', user.id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating settings:', error)
        throw createError({
          statusCode: 500,
          message: 'Nepodařilo se aktualizovat nastavení: ' + error.message
        })
      }
      
      result = data
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('app_settings')
        .insert({
          teacher_id: user.id,
          inactivity_timeout_minutes: body.inactivityTimeoutMinutes ?? 3,
          allow_direct_answers: body.allowDirectAnswers ?? false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating settings:', error)
        throw createError({
          statusCode: 500,
          message: 'Nepodařilo se vytvořit nastavení: ' + error.message
        })
      }
      
      result = data
    }
    
    return {
      success: true,
      settings: {
        inactivityTimeoutMinutes: result.inactivity_timeout_minutes,
        allowDirectAnswers: result.allow_direct_answers
      }
    }
  } catch (error: any) {
    console.error('Error updating settings:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se aktualizovat nastavení'
    })
  }
})

