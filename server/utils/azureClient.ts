import { AzureOpenAI } from 'openai'
import { createError } from 'h3'

export const getAzureClient = () => {
  const config = useRuntimeConfig()

  if (!config.azureOpenAiApiBase || !config.azureOpenAiApiKey) {
    throw createError({
      statusCode: 500,
      message: 'Azure OpenAI není nakonfigurováno. Prosím přidejte do .env: AZURE_OPENAI_API_BASE, AZURE_OPENAI_API_KEY'
    })
  }

  const client = new AzureOpenAI({
    baseURL: config.azureOpenAiApiBase,
    apiKey: config.azureOpenAiApiKey,
    apiVersion: config.azureOpenAiApiVersion || '2024-02-15-preview'
  })

  const deployment = config.azureOpenAiDeployment || 'models-gpt-4o'

  return {
    client,
    deployment
  }
}

