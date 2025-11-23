import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    
    // Get authenticated user (more secure - authenticates with Supabase Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw createError({
        statusCode: 401,
        message: 'Neautorizovaný přístup. Prosím přihlaste se.'
      })
    }
    
    // Get settings for this teacher
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('teacher_id', user.id)
      .maybeSingle()
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching settings:', settingsError)
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se načíst nastavení: ' + settingsError.message
      })
    }
    
    // If no settings exist, return defaults
    if (!settings) {
      return {
        success: true,
        settings: {
          inactivityTimeoutMinutes: 3,
          allowDirectAnswers: false
        }
      }
    }
    
    return {
      success: true,
      settings: {
        inactivityTimeoutMinutes: settings.inactivity_timeout_minutes || 3,
        allowDirectAnswers: settings.allow_direct_answers || false
      }
    }
  } catch (error: any) {
    console.error('Error getting settings:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se načíst nastavení'
    })
  }
})

