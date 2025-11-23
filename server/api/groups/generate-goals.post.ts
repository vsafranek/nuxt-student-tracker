import { getAzureClient } from '~/server/utils/azureClient'
import { extractMessageContent } from '~/server/utils/openaiContent'

interface GeneratedGoal {
  title: string
  type: 'boolean' | 'percentage'
  targetCount?: number
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    const { groupDescription, assignment } = body
    
    if (!groupDescription || !groupDescription.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Group description is required'
      })
    }
    
    const { client, deployment } = getAzureClient()
    
    const systemPrompt = `Jste AI asistent, který analyzuje zadání úkolu a vytváří konkrétní, měřitelné cíle (goals).

KONTEXT:
Popis cíle skupiny: ${groupDescription}
${assignment ? `Vygenerované zadání úkolu: ${assignment}` : ''}

ÚKOL:
Na základě popisu cíle skupiny a vygenerovaného zadání úkolu vytvořte seznam konkrétních, měřitelných cílů (goals).

Pravidla:
1. Každý konkrétní úkol/příklad/krok by měl být samostatný goal
2. Pokud zadání obsahuje "vyřeš 4 rovnice", vytvořte 4 goals (jeden pro každou rovnici)
3. Pokud zadání obsahuje "vysvětli rozdíl mezi X a Y", vytvořte 1 goal typu boolean
4. Goals typu "boolean" = splněno/nesplněno (např. "Vysvětlit rozdíl mezi lineární a kvadratickou rovnicí")
5. Goals typu "percentage" = splněno v % (např. "Vyřešit 3 rovnice" = 3 goals typu boolean, nebo 1 goal typu percentage s targetCount=3)
6. Pro úkoly s více příklady (např. "vyřeš 4 rovnice") vytvořte samostatné goals pro každý příklad
7. Název goal by měl být konkrétní a měřitelný (např. "Vyřešit kvadratickou rovnici x² + 5x + 6 = 0" místo jen "Rovnice 1")

Vraťte JSON objekt s polem "goals" ve formátu:
{
  "goals": [
    {
      "title": "Konkrétní název cíle",
      "type": "boolean" nebo "percentage",
      "targetCount": číslo (pouze pro percentage, jinak null)
    }
  ]
}

Příklad pro "vyřeš 4 kvadratické rovnice":
{
  "goals": [
    {"title": "Vyřešit kvadratickou rovnici x² + 5x + 6 = 0", "type": "boolean"},
    {"title": "Vyřešit kvadratickou rovnici 2x² - 7x + 3 = 0", "type": "boolean"},
    {"title": "Vyřešit kvadratickou rovnici x² - 4x + 4 = 0", "type": "boolean"},
    {"title": "Vyřešit kvadratickou rovnici 3x² + 2x - 1 = 0", "type": "boolean"}
  ]
}

Příklad pro "vysvětli rozdíl":
{
  "goals": [
    {"title": "Vysvětlit rozdíl mezi lineární a kvadratickou rovnicí", "type": "boolean"}
  ]
}

Odpovězte POUZE JSON formátem (bez markdown, bez dalšího textu).`

    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: 'Vytvoř seznam konkrétních cílů na základě zadání.'
        }
      ],
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    })
    
    const responseContent = extractMessageContent(completion.choices[0]?.message?.content)
    if (!responseContent) {
      throw createError({
        statusCode: 500,
        message: 'No response from AI'
      })
    }
    
    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      throw createError({
        statusCode: 500,
        message: 'Invalid JSON response from AI'
      })
    }
    
    // Extract goals array - AI should return { goals: [...] }
    let goals: GeneratedGoal[] = []
    if (parsedResponse.goals && Array.isArray(parsedResponse.goals)) {
      goals = parsedResponse.goals
    } else if (Array.isArray(parsedResponse)) {
      // Fallback: if AI returned array directly
      goals = parsedResponse
    } else {
      console.error('Unexpected AI response format:', parsedResponse)
      throw createError({
        statusCode: 500,
        message: 'AI response does not contain goals array'
      })
    }
    
    // Validate and normalize goals
    const normalizedGoals: GeneratedGoal[] = goals.map((goal: any) => {
      const normalized: GeneratedGoal = {
        title: (goal.title || '').trim(),
        type: goal.type === 'percentage' ? 'percentage' : 'boolean',
        targetCount: goal.type === 'percentage' && goal.targetCount ? Number(goal.targetCount) : undefined
      }
      
      if (!normalized.title) {
        throw createError({
          statusCode: 500,
          message: 'Goal title is required'
        })
      }
      
      return normalized
    }).filter((goal: GeneratedGoal) => goal.title.length > 0)
    
    if (normalizedGoals.length === 0) {
      // Fallback: create a single boolean goal from description
      normalizedGoals.push({
        title: groupDescription.trim(),
        type: 'boolean'
      })
    }
    
    return {
      success: true,
      goals: normalizedGoals
    }
  } catch (error: any) {
    console.error('Error generating goals:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate goals'
    })
  }
})

