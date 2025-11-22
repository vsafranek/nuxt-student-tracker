interface ChatMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp?: Date
    isRelevant?: boolean
    goalIndex?: number | null
    progressIncrease?: number | null
    analysisReason?: string
  }
  
  interface ChatOptions {
    userId?: string
    groupId?: string
    systemPrompt?: string
    goals?: any[]
    groupDescription?: string
  }
  
  export const useChat = (options: ChatOptions = {}) => {
    const messages = ref<ChatMessage[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    
    // Store goals and description for analysis
    const goals = ref(options.goals || [])
    const groupDescription = ref(options.groupDescription || '')
  
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

      // Add user message (will be updated with analysis)
      const userMessage: ChatMessage = {
        role: 'user',
        content: content.trim(),
        timestamp: new Date()
      }
      messages.value.push(userMessage)

      isLoading.value = true
      error.value = null

      try {
        // Analyze message relevance if goals are provided
        let analysis = null
        if (goals.value && goals.value.length > 0 && options.groupId) {
          try {
            const analysisResponse = await $fetch<{
              success: boolean
              analysis: {
                isRelevant: boolean
                goalIndex: number | null
                progress: boolean
                progressIncrease: number | null
                reason: string
              }
            }>('/api/chat/analyze', {
              method: 'POST',
              body: {
                message: content.trim(),
                goals: goals.value,
                groupDescription: groupDescription.value
              }
            })

            if (analysisResponse.success) {
              analysis = analysisResponse.analysis
              // Update user message with analysis
              userMessage.isRelevant = analysis.isRelevant
              userMessage.goalIndex = analysis.goalIndex
              userMessage.progressIncrease = analysis.progressIncrease
              userMessage.analysisReason = analysis.reason

              // Save message to DB if relevant or for tracking
              if (options.groupId && options.userId) {
                await $fetch('/api/messages/save', {
                  method: 'POST',
                  body: {
                    content: content.trim(),
                    groupId: options.groupId,
                    deviceId: options.userId,
                    isRelevant: analysis.isRelevant,
                    goalIndex: analysis.goalIndex,
                    progressIncrease: analysis.progressIncrease,
                    metadata: {
                      reason: analysis.reason,
                      timestamp: new Date().toISOString()
                    }
                  }
                }).catch(err => {
                  console.error('Error saving message to DB:', err)
                  // Don't fail the chat if DB save fails
                })

                // Update progress if relevant
                if (analysis.isRelevant && analysis.goalIndex !== null && analysis.progress) {
                  await $fetch('/api/progress/update', {
                    method: 'POST',
                    body: {
                      groupId: options.groupId,
                      goalIndex: analysis.goalIndex,
                      deviceId: options.userId,
                      progressIncrease: analysis.progressIncrease || 0
                    }
                  }).catch(err => {
                    console.error('Error updating progress:', err)
                  })
                  
                  // Emit event to refresh goals
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('progress-updated'))
                  }
                }
              }
            }
          } catch (analysisError) {
            console.error('Error analyzing message:', analysisError)
            // Continue even if analysis fails
          }
        }

        // Prepare messages for API (excluding timestamp and analysis)
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

    const addAssistantMessage = (content: string) => {
      messages.value.push({
        role: 'assistant',
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
      addSystemMessage,
      addAssistantMessage
    }
  }
  