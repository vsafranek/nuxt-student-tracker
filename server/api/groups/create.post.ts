import { serverSupabaseClient } from '#supabase/server'
import QRCode from 'qrcode'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody(event)
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw createError({
        statusCode: 401,
        message: 'Neautorizovaný přístup. Prosím přihlaste se.'
      })
    }
    
    // Validace vstupních dat (teacherId comes from auth, not body)
    if (!body.name || !body.description) {
      throw createError({
        statusCode: 400,
        message: 'Chybí povinné údaje (name, description)'
      })
    }

    // Use authenticated user's ID as teacherId
    const teacherId = user.id

    // Generování unikátního ID pro skupinu
    const groupId = crypto.randomUUID()
    
    // Vytvoření URL pro vstup do skupiny
    const origin = getRequestURL(event).origin
    const joinUrl = `${origin}/join/${groupId}`
    
    // Generování QR kódu jako SVG string
    const qrCodeSvg = await QRCode.toString(joinUrl, {
      type: 'svg',
      width: 300,
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    
    // Uložení skupiny do databáze (use snake_case for column names)
    const { data: group, error: insertError } = await supabase
      .from('groups')
      .insert({
        id: groupId,
        name: body.name,
        description: body.description,
        qr_code: qrCodeSvg,
        teacher_id: teacherId,
      } as any)
      .select()
      .single()
    
    if (insertError) {
      console.error('Database insert error:', insertError)
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se vytvořit skupinu v databázi: ' + insertError.message
      })
    }
    
    if (!group) {
      throw createError({
        statusCode: 500,
        message: 'Skupina byla vytvořena, ale nepodařilo se ji načíst'
      })
    }
    
    const groupData = group as any
    
    return {
      success: true,
      group: {
        id: groupData.id,
        name: groupData.name,
        description: groupData.description,
        qrCode: groupData.qr_code, // Map snake_case to camelCase
        createdAt: groupData.created_at,
        studentCount: 0,
        averageProgress: 0,
        helpNeeded: 0
      }
    }
  } catch (error: any) {
    console.error('Error creating group:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se vytvořit skupinu'
    })
  }
})