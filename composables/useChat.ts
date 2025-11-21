interface ChatMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp?: Date
  }
  
  interface ChatOptions {
    userId?: string
    groupId?: string
    systemPrompt?: string
  }
  
  export const useChat = (options: ChatOptions = {}) => {
    const messages = ref<ChatMessage[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)
  
    // Initialize with system prompt if provided
    if (options.systemPrompt) {
      messages.value.push({
        role: 'system',
        content: options.systemPrompt,
        timestamp: new Date()
      })
    }
  
    const sendMessage = async (content: string) => {
      if (!content.trim() || isLoading.value) {
        return
      }
  
      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: content.trim(),
        timestamp: new Date()
      }
      messages.value.push(userMessage)
  
      isLoading.value = true
      error.value = null
  
      try {
        // Prepare messages for API (excluding timestamp)
        const apiMessages = messages.value.map(({ role, content }) => ({
          role,
          content
        }))
  
        const response = await $fetch<{
          success: boolean
          message: { role: string; content: string }
          usage?: any
        }>('/api/chat', {
          method: 'POST',
          body: {
            messages: apiMessages,
            userId: options.userId,
            groupId: options.groupId
          }
        })
  
        if (response.success && response.message) {
          const assistantMessage: ChatMessage = {
            role: response.message.role as 'assistant',
            content: response.message.content,
            timestamp: new Date()
          }
          messages.value.push(assistantMessage)
        } else {
          throw new Error('Invalid response from chat API')
        }
      } catch (err: any) {
        error.value = err.message || 'Failed to send message'
        console.error('Chat error:', err)
        
        // Remove user message if there was an error
        const index = messages.value.findIndex(m => m === userMessage)
        if (index !== -1) {
          messages.value.splice(index, 1)
        }
      } finally {
        isLoading.value = false
      }
    }
  
    const clearMessages = () => {
      messages.value = []
      if (options.systemPrompt) {
        messages.value.push({
          role: 'system',
          content: options.systemPrompt,
          timestamp: new Date()
        })
      }
      error.value = null
    }
  
    const addSystemMessage = (content: string) => {
      messages.value.unshift({
        role: 'system',
        content,
        timestamp: new Date()
      })
    }
  
    return {
      messages: readonly(messages),
      isLoading: readonly(isLoading),
      error: readonly(error),
      sendMessage,
      clearMessages,
      addSystemMessage
    }
  }
  