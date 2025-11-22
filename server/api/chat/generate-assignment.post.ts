import { getAzureClient } from '~/server/utils/azureClient'
import { extractMessageContent } from '~/server/utils/openaiContent'

interface GoalInput {
  title: string
  type?: string
  targetCount?: number
}

const buildFallbackAssignment = ({
  studentName,
  groupName,
  groupDescription,
  goals
}: {
  studentName?: string
  groupName?: string
  groupDescription: string
  goals: GoalInput[]
}) => {
  const safeStudent = (studentName && studentName.trim()) || 'studente'
  const safeGroup = (groupName && groupName.trim()) || 'skupině'
  const safeDescription = groupDescription.trim()

  let text = `Ahoj ${safeStudent}! 👋\n`
  text += `Ve skupině "${safeGroup}" se budeme soustředit na: ${safeDescription}.\n\n`

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

  text += 'Napiš mi, s čím chceš začít nebo kde potřebuješ pomoct a společně úkol zvládneme.'
  return text
}

export default defineEventHandler(async (event) => {
  let fallbackAssignment = ''

  try {
    const body = await readBody(event)
    
    const { groupDescription, goals, studentName, groupName } = body
    
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
      goals: goalsList
    })
    
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
    
    return {
      success: true,
      assignment
    }
  } catch (error: any) {
    console.error('Generate assignment error:', error)
    
    if (error.statusCode && error.statusCode !== 500) {
      throw error
    }
    
    if (fallbackAssignment) {
      return {
        success: true,
        assignment: fallbackAssignment,
        fallback: true
      }
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate assignment'
    })
  }
})

