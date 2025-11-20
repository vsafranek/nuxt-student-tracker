import QRCode from 'qrcode'

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseClient()
  const body = await readBody(event)
  
  try {
    const groupId = crypto.randomUUID()
    
    // Vytvoření URL pro vstup
    const origin = getRequestURL(event).origin
    const joinUrl = `${origin}/join/${groupId}`
    
    // Generování QR kódu
    const qrCodeDataUrl = await QRCode.toDataURL(joinUrl, {
      width: 300,
      errorCorrectionLevel: 'H',
      margin: 2
    })
    
    // Uložení skupiny do databáze
    const { data, error } = await supabase
      .from('groups')
      .insert({
        id: groupId,
        name: body.name,
        description: body.description,
        qrCode: qrCodeDataUrl,
        teacherId: body.teacherId,
        createdAt: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, group: data }
  } catch (error) {
    console.error('Error creating group:', error)
    return { error: error.message }
  }
})
