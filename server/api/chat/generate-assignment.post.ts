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
    
    // Analyze goals to extract task structure (e.g., "3 různé kvadratické rovnice")
    const extractTaskStructure = (goals: GoalInput[]): { hasStructuredTasks: boolean; description: string } => {
      if (goals.length === 0) return { hasStructuredTasks: false, description: '' }
      
      const taskStructures: string[] = []
      let hasStructured = false
      
      goals.forEach((goal) => {
        const title = goal.title.toLowerCase()
        // Look for patterns like "3 různé", "5 úkolů", "několik", "samostatně X", etc.
        const patterns = [
          /(\d+)\s+(různé|různých|úkolů|úloh|příkladů|příkladů|rovnic|rovnicí|úlohy|příklady|rovnice)/i,
          /samostatně\s+(\d+)\s+(různé|různých|úkolů|úloh|příkladů|příkladů|rovnic|rovnicí|úlohy|příklady|rovnice)/i,
          /(\d+)\s+(úlohy|příklady|rovnice|úkoly)/i,
          /vyřeší\s+(\d+)\s+(různé|různých|úkolů|úloh|příkladů|příkladů|rovnic|rovnicí|úlohy|příklady|rovnice)/i
        ]
        
        let matched = false
        for (const pattern of patterns) {
          const match = title.match(pattern)
          if (match) {
            const count = parseInt(match[1])
            // Extract the task type (everything after the number and quantity word)
            const taskType = goal.title.replace(new RegExp(`^.*?${match[0]}\\s+`, 'i'), '').trim()
            if (taskType) {
              taskStructures.push(`${count}x ${taskType}`)
              hasStructured = true
              matched = true
              break
            }
          }
        }
        
        if (!matched) {
          taskStructures.push(goal.title)
        }
      })
      
      return {
        hasStructuredTasks: hasStructured,
        description: taskStructures.join('; ')
      }
    }
    
    // Check if goals require solving/calculating tasks
    const requiresConcreteExamples = (goals: GoalInput[]): boolean => {
      const solvingKeywords = [
        'vyřešit', 'vyřeší', 'vyřeš', 'řešit', 'řeší', 'řeš',
        'vypočítat', 'vypočítej', 'vypočti', 'spočítat', 'spočítej', 'spočti',
        'najít', 'najdi', 'najde', 'určit', 'urči', 'určí',
        'příklad', 'příklady', 'úloha', 'úlohy', 'úkol', 'úkoly',
        'rovnice', 'rovnic', 'rovnici',
        'derivace', 'integrál', 'integrály',
        'samostatně', 'sám', 'sama'
      ]
      
      return goals.some(goal => {
        const title = goal.title.toLowerCase()
        return solvingKeywords.some(keyword => title.includes(keyword))
      })
    }
    
    const needsConcreteExamples = requiresConcreteExamples(goalsList)
    const taskStructure = extractTaskStructure(goalsList)
    
    const structureInstruction = (taskStructure.hasStructuredTasks || needsConcreteExamples)
      ? `\n\nDŮLEŽITÉ PRO GENEROVÁNÍ ÚLOH - POVINNÉ PRAVIDLO:
- Analyzuj strukturu cílů: ${taskStructure.description}
- Pokud cíl obsahuje slova jako "vyřešit", "vypočítat", "najít", "příklad", "úloha", "rovnice" nebo podobná, MUSÍŠ VYGENEROVAT konkrétní úlohy přímo do zadání
- Pokud cíl obsahuje číslo a typ úlohy (např. "3 různé kvadratické rovnice", "vyřeší samostatně 3 různé kvadratické rovnice"), VYGENERUJ konkrétní úlohy tohoto typu a počtu
- Například: pokud cíl je "vyřeší samostatně 3 různé kvadratické rovnice typu ax^2 + bx + c", vytvoř 3 konkrétní kvadratické rovnice s různými koeficienty a zapiš je přímo do zadání
- Pokud cíl je "vyřeší 5 příkladů na derivace", vytvoř 5 konkrétních příkladů na derivace a zapiš je do zadání
- Pokud cíl je "vyřeší kvadratické rovnice", vytvoř alespoň 3-5 konkrétních kvadratických rovnic a zapiš je do zadání
- VŽDY generuj konkrétní úlohy přímo do zadání, ne jen popis typu úlohy nebo obecné instrukce
- Úlohy by měly být různé, ale stejné obtížnosti
- Pokud je v cíli uveden konkrétní typ (např. "typu ax^2 + bx + c"), respektuj tento typ při generování
- Pokud cíl neobsahuje konkrétní číslo, ale vyžaduje řešení (např. "vyřeší kvadratické rovnice"), vytvoř alespoň 3-5 konkrétních příkladů`
      : ''

    const systemPrompt = `Jste AI asistent pomáhající studentům s jejich úkoly.

KONTEXT PRO VÁS (vodítko pro vytvoření zadání):
${groupDescription}

${goalsText}
${structureInstruction}

Student se jmenuje: ${studentName || 'studente'}
Skupina: ${groupName || 'skupina'}

ÚKOL:
Na základě výše uvedeného kontextu vytvořte přátelské a motivační zadání úkolu pro studenta.
Zadání by mělo:
1. Jasně popisovat, co má student dělat
2. ${(taskStructure.hasStructuredTasks || needsConcreteExamples) ? 'OBSAHOVAT KONKRÉTNÍ ÚLOHY - Pokud cíl vyžaduje řešení, výpočet nebo práci s příklady (obsahuje slova jako "vyřešit", "vypočítat", "najít", "příklad", "úloha", "rovnice"), MUSÍŠ vytvořit konkrétní úlohy a zapsat je přímo do zadání. NEPOUŽÍVEJ obecné popisy typu "vyřeš kvadratické rovnice" - místo toho vytvoř konkrétní rovnice jako "x^2 + 5x + 6 = 0" a zapiš je do zadání.' : 'Vysvětlit, jak splní cíle nebo na čem má pracovat'}
3. Být srozumitelné a konkrétní
4. Být přátelské a povzbuzující
5. ${goalsList.length > 0 ? 'Odkazovat na cíle, které má splnit' : 'Poskytnout jasné instrukce na základě popisu skupiny'}

${(taskStructure.hasStructuredTasks || needsConcreteExamples) ? `PŘÍKLADY SPRÁVNÉHO GENEROVÁNÍ (POVINNÉ DODRŽET):

Příklad 1: Cíl je "vyřeší samostatně 3 různé kvadratické rovnice typu ax^2 + bx + c"
SPRÁVNÉ zadání:
"Tvůj úkol je vyřešit následující 3 kvadratické rovnice:
1. x^2 + 5x + 6 = 0
2. 2x^2 - 7x + 3 = 0
3. x^2 - 4x - 5 = 0
Pro každou rovnici najdi hodnoty x, které ji řeší."

ŠPATNÉ zadání (NEPOUŽÍVEJ):
"Tvůj úkol je vyřešit 3 kvadratické rovnice typu ax^2 + bx + c." (chybí konkrétní rovnice!)

Příklad 2: Cíl je "vyřeší 5 příkladů na derivace"
SPRÁVNÉ zadání:
"Tvůj úkol je vypočítat derivace následujících funkcí:
1. f(x) = x^3 + 2x^2 - 5x + 1
2. f(x) = sin(x) + cos(x)
3. f(x) = e^x * ln(x)
4. f(x) = (x^2 + 1) / (x - 1)
5. f(x) = sqrt(x^2 + 1)
Pro každou funkci najdi f'(x)."

Příklad 3: Cíl je "vyřeší 4 úlohy na lineární rovnice"
SPRÁVNÉ zadání:
"Tvůj úkol je vyřešit následující 4 lineární rovnice:
1. 3x + 5 = 14
2. 2x - 7 = 3x + 1
3. 4(x - 2) = 2x + 8
4. (x + 3)/2 = 5
Pro každou rovnici najdi hodnotu x."

Příklad 4: Cíl je "vyřeší kvadratické rovnice" (bez konkrétního čísla)
SPRÁVNÉ zadání:
"Tvůj úkol je vyřešit následující kvadratické rovnice:
1. x^2 + 3x - 4 = 0
2. 2x^2 - 5x + 2 = 0
3. x^2 - 9 = 0
4. 3x^2 + 7x + 2 = 0
Pro každou rovnici najdi hodnoty x pomocí diskriminantu."

ŠPATNÉ zadání (NEPOUŽÍVEJ):
"Tvůj úkol je vyřešit kvadratické rovnice pomocí diskriminantu." (chybí konkrétní rovnice!)

DŮLEŽITÉ: VŽDY generuj konkrétní úlohy přímo do zadání, ne jen popis typu úlohy! 
- Pokud cíl říká "3 rovnice", musíš vytvořit 3 konkrétní rovnice a zapsat je do zadání
- Pokud cíl říká "vyřeší rovnice" (bez čísla), vytvoř alespoň 3-5 konkrétních rovnic a zapiš je
- Pokud cíl obsahuje slova "vyřešit", "vypočítat", "najít", "příklad", "úloha" - VŽDY vytvoř konkrétní úlohy, ne obecné instrukce` : ''}

DŮLEŽITÉ: 
- Zadání musí být pro studenta (ne pro vás)
- Použijte druhou osobu (ty/dělej/zkus)
- Buďte konkrétní a jasní
- Buďte STRUČNÍ - zadání by mělo být krátké a přímočaré
- NEPŘIDÁVEJTE otázky na konci zadání (např. "Jak chceš začít?", "Máš nějaké otázky?"). Zadání končí popisem úkolu.
- Nepoužívejte fráze jako "vodítko pro vás" - to je jen pro váš kontext
- Nepřidávejte vlastní pozdrav ani úvod – aplikace už studenta přivítala. Začněte rovnou zadáním úkolu nebo popisem, co má student udělat.
- ${modeInstructions}
${(taskStructure.hasStructuredTasks || needsConcreteExamples) ? '- POVINNÉ: Pokud cíl obsahuje slova jako "vyřešit", "vypočítat", "najít", "příklad", "úloha", "rovnice" nebo podobná, MUSÍŠ vytvořit konkrétní úlohy a zapsat je přímo do zadání. NEPOUŽÍVEJ obecné popisy typu "vyřeš rovnice" - místo toho vytvoř konkrétní rovnice jako "x^2 + 5x + 6 = 0" a zapiš je do zadání. Pokud cíl obsahuje číslo (např. "3 rovnice"), vytvoř přesně tolik úloh. Pokud číslo neobsahuje, vytvoř alespoň 3-5 konkrétních úloh.' : ''}

Odpovězte pouze textem zadání úkolu pro studenta (bez dalších komentářů, bez markdown formátování, bez otázek na konci).`

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
      // Increased tokens to allow for concrete task generation (e.g., multiple equations, examples)
      max_tokens: 800
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

