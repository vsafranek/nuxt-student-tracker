import { serverSupabaseClient } from '#supabase/server'

interface ValidationResult {
  isRelevant?: boolean
  goalIndex?: number | null
  progressIncrease?: number | null
  reason?: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody(event)
    const {
      groupId,
      deviceId,
      message,
      result
    }: {
      groupId?: string
      deviceId?: string
      message?: string
      result?: ValidationResult | null
    } = body || {}

    if (!groupId || !deviceId || !message) {
      throw createError({
        statusCode: 400,
        message: 'Chybí groupId, deviceId nebo message'
      })
    }

    const { data: member, error: memberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('device_id', deviceId)
      .single()

    if (memberError || !member) {
      throw createError({
        statusCode: 404,
        message: 'Člen skupiny nenalezen'
      })
    }

    const normalizedResult: ValidationResult = result || {}
    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('group_members')
      .update({
        last_message_content: message,
        last_message_is_relevant: typeof normalizedResult.isRelevant === 'boolean'
          ? normalizedResult.isRelevant
          : null,
        last_message_goal_index: typeof normalizedResult.goalIndex === 'number'
          ? normalizedResult.goalIndex
          : null,
        last_message_progress: typeof normalizedResult.progressIncrease === 'number'
          ? normalizedResult.progressIncrease
          : null,
        last_message_reason: normalizedResult.reason || null,
        last_message_at: now
      })
      .eq('id', member.id)
      .eq('group_id', groupId)

    if (updateError) {
      console.error('Error updating validation snapshot:', updateError)
      throw createError({
        statusCode: 500,
        message: 'Nepodařilo se uložit validaci'
      })
    }

    return {
      success: true,
      updatedAt: now
    }
  } catch (error: any) {
    console.error('Validation record error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Nepodařilo se uložit výsledek validace'
    })
  }
})


