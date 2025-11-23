import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody(event)

    const { groupId, deviceId } = body

    if (!groupId || !deviceId) {
      throw createError({
        statusCode: 400,
        message: 'Chybí povinné údaje (groupId, deviceId)'
      })
    }

    const { data: member, error: memberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('device_id', deviceId)
      .maybeSingle()

    // If member not found, silently return success (student might have left or not joined yet)
    if (memberError && memberError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected if student not found)
      console.warn('Heartbeat: Error checking member:', memberError)
      return {
        success: true,
        skipped: true,
        reason: 'Member check failed'
      }
    }

    if (!member) {
      // Student not found - this is normal if they haven't joined yet or left
      return {
        success: true,
        skipped: true,
        reason: 'Member not found'
      }
    }

    const memberData = member as any
    const now = new Date().toISOString()
    console.log(`Heartbeat: Updating last_active_at for member ${memberData.id} in group ${groupId} to ${now}`)
    
    const client = supabase as any
    const { error: updateError } = await client
      .from('group_members')
      .update({
        last_active_at: now
      })
      .eq('id', memberData.id)
      .eq('group_id', groupId)

    if (updateError) {
      console.error('Heartbeat: Error updating last_active_at:', updateError)
      // Don't throw error, just log it - heartbeat failures shouldn't break the app
      return {
        success: false,
        error: 'Update failed'
      }
    }

    console.log('Heartbeat: Successfully updated last_active_at')
    return {
      success: true
    }
  } catch (error: any) {
    console.error('Heartbeat update error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se aktualizovat aktivitu studenta'
    })
  }
})

