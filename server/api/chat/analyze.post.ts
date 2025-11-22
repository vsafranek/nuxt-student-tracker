import { getAzureClient } from '~/server/utils/azureClient'
import { extractMessageContent } from '~/server/utils/openaiContent'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    const { message, goals, groupDescription } = body
    
    if (!message || !message.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Message is required'
      })
    }
    
    const { client, deployment } = getAzureClient()
    
    // Build context about goals
    let goalsContext = ''
    if (goals && Array.isArray(goals) && goals.length > 0) {
      goalsContext = '\n\nCíle skupiny:\n'
      goals.forEach((goal: any, index: number) => {
        goalsContext += `${index + 1}. ${goal.title} (typ: ${goal.type})\n`
      })
    }
    
    const analysisPrompt = `Jsi AI asistent, který analyzuje, zda zpráva studenta souvisí s plněním cílů.

${groupDescription ? `Zadání úkolu: ${groupDescription}` : ''}${goalsContext}

Analyzujte následující zprávu studenta a určete:
1. Zda zpráva souvisí s plněním nějakého cíle (isRelevant: true/false)
2. Kterému cíli se zpráva týká (goalIndex: číslo cíle od 0, nebo null)
3. Zda zpráva představuje pokrok (progress: true/false)
4. Pro percentage cíle: o kolik procent se zvýšil pokrok (0, 33, 66, 100)
   - 0% = žádný pokrok
   - 33% = malý pokrok (1/3 úkolů)
   - 66% = střední pokrok (2/3 úkolů)
   - 100% = cíl splněn
   - Pro boolean cíle: použijte 100 pokud je cíl splněn, jinak 0

Zpráva studenta: "${message}"

DŮLEŽITÉ: goalIndex je index cíle v poli (začíná od 0). Použijte číslo cíle, ne jeho ID.

Odpovězte POUZE JSON formátem (bez markdown, pouze JSON):
{
  "isRelevant": true/false,
  "goalIndex": číslo_od_0 nebo null,
  "progress": true/false,
  "progressIncrease": 0 nebo 33 nebo 66 nebo 100 nebo null,
  "reason": "stručné vysvětlení v češtině"
}`

    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: 'system',
          content: 'Jste AI asistent, který analyzuje relevance zpráv k cílům. Odpovídejte pouze v JSON formátu.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      // Temperature removed - Azure OpenAI model uses default value (1)
      max_tokens: 500,
      response_format: { type: 'json_object' }
    })
    
    const responseContent = extractMessageContent(completion.choices[0]?.message?.content)
    if (!responseContent) {
      throw createError({
        statusCode: 500,
        message: 'No response from AI'
      })
    }
    
    let analysis
    try {
      analysis = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      // Default to non-relevant if parsing fails
      analysis = {
        isRelevant: false,
        goalIndex: null,
        progress: false,
        progressIncrease: null,
        reason: 'Chyba při analýze'
      }
    }
    
    return {
      success: true,
      analysis: {
        isRelevant: analysis.isRelevant || false,
        goalIndex: analysis.goalIndex !== null && analysis.goalIndex !== undefined 
          ? Number(analysis.goalIndex) 
          : null,
        progress: analysis.progress || false,
        progressIncrease: analysis.progressIncrease !== null && analysis.progressIncrease !== undefined
          ? Number(analysis.progressIncrease)
          : null,
        reason: analysis.reason || ''
      }
    }
  } catch (error: any) {
    console.error('Message analysis error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    // Return default non-relevant analysis on error
    return {
      success: true,
      analysis: {
        isRelevant: false,
        goalIndex: null,
        progress: false,
        progressIncrease: null,
        reason: 'Chyba při analýze zprávy'
      }
    }
  }
})

