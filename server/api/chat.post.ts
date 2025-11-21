import { AzureOpenAI } from 'openai'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const body = await readBody(event)
    
    const { messages, userId, groupId } = body
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Messages are required'
      })
    }
    
    // Validate Azure OpenAI configuration
    if (!config.azureOpenAiApiBase || !config.azureOpenAiApiKey) {
      console.error('Azure OpenAI configuration missing:', {
        hasApiBase: !!config.azureOpenAiApiBase,
        hasApiKey: !!config.azureOpenAiApiKey
      })
      throw createError({
        statusCode: 500,
        message: 'Azure OpenAI není nakonfigurováno. Prosím přidejte do .env souboru: AZURE_OPENAI_API_BASE, AZURE_OPENAI_API_KEY'
      })
    }
    
    // Initialize Azure OpenAI client
    // For Azure OpenAI, baseURL should point to your Azure endpoint
    const client = new AzureOpenAI({
      baseURL: config.azureOpenAiApiBase,
      apiKey: config.azureOpenAiApiKey,
      apiVersion: config.azureOpenAiApiVersion || '2024-02-15-preview'
    })
    
    // Call Azure OpenAI API
    // Use deployment name as the model parameter
    const deployment = config.azureOpenAiDeployment || 'models-gpt-4o'
    const completion = await client.chat.completions.create({
      model: deployment,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    })
    
    const assistantMessage = completion.choices[0]?.message
    
    if (!assistantMessage) {
      throw createError({
        statusCode: 500,
        message: 'No response from AI'
      })
    }
    
    return {
      success: true,
      message: {
        role: assistantMessage.role,
        content: assistantMessage.content
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

