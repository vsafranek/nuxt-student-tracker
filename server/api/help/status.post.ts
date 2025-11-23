import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody(event)

    const { groupId, deviceId, memberId, needsHelp } = body

    if (!groupId || typeof needsHelp !== 'boolean' || (!deviceId && !memberId)) {
      throw createError({
        statusCode: 400,
        message: 'Chybí povinné údaje (groupId, needsHelp, deviceId/memberId)'
      })
    }

    let targetMemberId = memberId as string | null

    if (!targetMemberId) {
      const { data: member, error: memberError } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('device_id', deviceId)
        .single()

      if (memberError || !member) {
        throw createError({
          statusCode: 404,
          message: 'Student ve skupině nenalezen'
        })
      }

      targetMemberId = member.id
    }

    const updates: Record<string, any> = {
      needs_help: needsHelp
    }

    updates.help_requested_at = needsHelp ? new Date().toISOString() : null

    const { error: updateError } = await supabase
      .from('group_members')
      .update(updates)
      .eq('id', targetMemberId)
      .eq('group_id', groupId)

    if (updateError) {
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se aktualizovat stav studenta'
      })
    }

    return {
      success: true
    }
  } catch (error: any) {
    console.error('Help status update error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se aktualizovat stav pomoci'
    })
  }
})

