import { getAzureClient } from '~/server/utils/azureClient'
import { extractMessageContent } from '~/server/utils/openaiContent'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    const { messages, userId, groupId } = body
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Messages are required'
      })
    }
    
    // Initialize Azure OpenAI client once using shared helper
    const { client, deployment } = getAzureClient()

    const completion = await client.chat.completions.create({
      model: deployment,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: 1000,
      stream: false
    })
    
    const assistantMessage = completion.choices[0]?.message
    console.log("MESSAGE ",assistantMessage)
    const assistantContent = extractMessageContent(assistantMessage?.content).trim()
    
    if (!assistantContent) {
      throw createError({
        statusCode: 500,
        message: 'No response from AI'
      })
    }
    
    return {
      success: true,
      message: {
        role: assistantMessage.role,
        content: assistantContent
      },
      usage: completion.usage
    }
  } catch (error: any) {
    console.error('Chat API error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to get chat response'
    })
  }
})

