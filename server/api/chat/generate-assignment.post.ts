import { serverSupabaseClient } from '#supabase/server'
import { getAzureClient } from '~/server/utils/azureClient'
import { extractMessageContent } from '~/server/utils/openaiContent'

type AssignmentMode = 'uniform' | 'variant'

interface GoalInput {
  title: string
  type?: string
  targetCount?: number
}

const buildFallbackAssignment = ({
  studentName,
  groupName,
  groupDescription,
  goals,
  assignmentMode = 'uniform'
}: {
  studentName?: string
  groupName?: string
  groupDescription: string
  goals: GoalInput[]
  assignmentMode?: AssignmentMode
}) => {
  const safeGroup = (groupName && groupName.trim()) || 'skupině'
  const safeDescription = groupDescription.trim()

  let text = `Ve skupině "${safeGroup}" se zaměříme na: ${safeDescription}.\n\n`
  text += 'Tvůj úkol:\n'

  if (goals.length > 0) {
    text += 'Postupuj krok za krokem podle těchto cílů:\n'
    goals.forEach((goal, index) => {
      const targetInfo = goal.type === 'percentage' && goal.targetCount
        ? ` – dokonči ${goal.targetCount} úkolů`
        : ''
      text += `${index + 1}. ${goal.title}${targetInfo}\n`
    })
    text += '\n'
  } else {
    text += 'Začni tím, že si rozepíšeš konkrétní kroky, které tě k cíli přiblíží.\n\n'
  }

  if (assignmentMode === 'variant') {
    const sampleNumbers = Array.from({ length: 3 }, () => Math.floor(Math.random() * 40) + 10)
    text += `Tato varianta používá jiné hodnoty než u spolužáků. Pro kontrolu můžeš pracovat s čísly ${sampleNumbers.join(', ')} a kdykoli je obměnit za podobné.\n\n`
  } else {
    text += 'Toto zadání je shodné se zadáním ostatních, abyste byli ve stejné fázi.\n\n'
  }

  text += 'Napiš mi, kde chceš začít nebo kde potřebuješ pomoct a společně úkol zvládneme.'
  return text
}

export default defineEventHandler(async (event) => {
  let fallbackAssignment = ''
  let assignmentModeState: AssignmentMode = 'uniform'
  let targetGroupId: string | null = null
  let supabase: any = null

  try {
    const body = await readBody(event)
    
    const {
      groupDescription,
      goals,
      studentName,
      groupName,
      assignmentMode,
      groupId
    } = body
    
    assignmentModeState = assignmentMode === 'variant' ? 'variant' : 'uniform'
    targetGroupId = typeof groupId === 'string' ? groupId : null
    
    if (!groupDescription || !groupDescription.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Group description is required'
      })
    }
    
    // Goals are optional, but recommended
    const goalsList = goals && Array.isArray(goals) ? goals : []
    fallbackAssignment = buildFallbackAssignment({
      studentName,
      groupName,
      groupDescription,
      goals: goalsList,
      assignmentMode: assignmentModeState
    })
    
    supabase = await serverSupabaseClient(event) as any
    
    if (assignmentModeState === 'uniform' && targetGroupId) {
      const { data: groupRecord, error: sharedError } = await supabase
        .from('groups')
        .select('shared_assignment')
        .eq('id', targetGroupId)
        .single()
      
      if (!sharedError && groupRecord?.shared_assignment) {
        return {
          success: true,
          assignment: groupRecord.shared_assignment,
          shared: true
        }
      }
    }
    
    const { client, deployment } = getAzureClient()
    
    // Build goals list
    let goalsText = ''
    if (goalsList.length > 0) {
      goalsText = '\nCíle, které má student splnit:\n'
      goalsList.forEach((goal: any, index: number) => {
        goalsText += `${index + 1}. ${goal.title}`
        if (goal.type === 'boolean') {
          goalsText += ' (typ: splněno/nesplněno)'
        } else if (goal.type === 'percentage') {
          goalsText += ` (typ: splněno %, cíl: ${goal.targetCount || 0} úkolů)`
        }
        goalsText += '\n'
      })
    } else {
      goalsText = '\nSkupina nemá zatím definované cíle. Vytvořte zadání na základě popisu skupiny.\n'
    }
    
    const modeInstructions = assignmentModeState === 'variant'
      ? `- Vytvoř variantu se stejnou obtížností jako mají ostatní studenti, ale změň konkrétní číselné hodnoty nebo vstupní data, aby zadání bylo unikátní.\n- Zachovej stejnou strukturu kroků, aby bylo možné úkol vyhodnocovat podle stejných kritérií.`
      : `- Toto zadání bude sdílené všemi studenty skupiny. Nevytvářej žádné individuální varianty ani volby.`
    
    const systemPrompt = `Jste AI asistent pomáhající studentům s jejich úkoly.

KONTEXT PRO VÁS (vodítko pro vytvoření zadání):
${groupDescription}

${goalsText}

Student se jmenuje: ${studentName || 'studente'}
Skupina: ${groupName || 'skupina'}

ÚKOL:
Na základě výše uvedeného kontextu vytvořte přátelské a motivační zadání úkolu pro studenta.
Zadání by mělo:
1. Jasně popisovat, co má student dělat
2. Vysvětlit, jak splní cíle nebo na čem má pracovat
3. Být srozumitelné a konkrétní
4. Být přátelské a povzbuzující
5. ${goalsList.length > 0 ? 'Odkazovat na cíle, které má splnit' : 'Poskytnout jasné instrukce na základě popisu skupiny'}

DŮLEŽITÉ: 
- Zadání musí být pro studenta (ne pro vás)
- Použijte druhou osobu (ty/dělej/zkus)
- Buďte konkrétní a jasní
- Nepoužívejte fráze jako "vodítko pro vás" - to je jen pro váš kontext
- Nepřidávejte vlastní pozdrav ani úvod – aplikace už studenta přivítala. Začněte rovnou zadáním úkolu nebo popisem, co má student udělat.
- ${modeInstructions}

Odpovězte pouze textem zadání úkolu pro studenta (bez dalších komentářů, bez markdown formátování).`

    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: 'Vytvoř celé zadání úkolu podle uvedeného kontextu.'
        }
      ],
      // Temperature removed - Azure OpenAI model uses default value
      max_tokens: 500
    })
    
    let assignment = extractMessageContent(completion.choices[0]?.message?.content).trim()
    
    if (!assignment) {
      console.warn('AI returned empty assignment, using fallback.')
      assignment = fallbackAssignment
    }
    
    if (assignmentModeState === 'uniform' && targetGroupId && supabase) {
      const { error: storeError } = await supabase
        .from('groups')
        .update({ shared_assignment: assignment })
        .eq('id', targetGroupId)
      if (storeError) {
        console.error('Error storing shared assignment:', storeError)
      }
    }
    
    return {
      success: true,
      assignment,
      shared: assignmentModeState === 'uniform'
    }
  } catch (error: any) {
    console.error('Generate assignment error:', error)
    
    if (error.statusCode && error.statusCode !== 500) {
      throw error
    }
    
    if (fallbackAssignment) {
      if (assignmentModeState === 'uniform' && targetGroupId && supabase) {
        await supabase
          .from('groups')
          .update({ shared_assignment: fallbackAssignment })
          .eq('id', targetGroupId)
      }
      
      return {
        success: true,
        assignment: fallbackAssignment,
        fallback: true,
        shared: assignmentModeState === 'uniform'
      }
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate assignment'
    })
  }
})

