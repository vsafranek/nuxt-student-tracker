interface ChatMessage {
    id?: string
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
  
  interface AnalysisResult {
    isRelevant: boolean
    goalIndex: number | null
    progress: boolean
    progressIncrease: number | null
    reason: string
  }
  
  const HELP_THRESHOLD = 2
  const HELP_COOLDOWN_MS = 5 * 60 * 1000
  const INACTIVITY_LIMIT_MS = 3 * 60 * 1000

  export const useChat = (options: ChatOptions = {}) => {
    const buildSystemMessages = () => {
      if (!options.systemPrompt) {
        return []
      }
      
      return [{
        role: 'system' as const,
        content: options.systemPrompt,
        timestamp: new Date()
      }]
    }
  
    const messages = ref<ChatMessage[]>(buildSystemMessages())
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    
    // Store goals and description for analysis
  const goals = ref(options.goals || [])
  const groupDescription = ref(options.groupDescription || '')
    const irrelevantStreak = ref(0)
    const lastHelpRequestAt = ref<number | null>(null)
    const hasLoadedHistory = ref(false)
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null
  
    type PersistMessagePayload = {
      role: 'user' | 'assistant'
      content: string
      isRelevant?: boolean
      goalIndex?: number | null
      progressIncrease?: number | null
      metadata?: Record<string, any>
    }
  
    const persistMessageRecord = async (payload: PersistMessagePayload) => {
      if (!options.groupId || !options.userId) {
        return null
      }
  
      try {
        const response = await $fetch<{
          success: boolean
          message: {
            id: string
            created_at: string
          }
        }>('/api/messages/save', {
          method: 'POST',
          body: {
            content: payload.content,
            groupId: options.groupId,
            deviceId: options.userId,
            role: payload.role,
            isRelevant: payload.isRelevant,
            goalIndex: payload.goalIndex,
            progressIncrease: payload.progressIncrease,
            metadata: payload.metadata
          }
        })
  
        return response.message
      } catch (err) {
        console.error('Error saving message to DB:', err)
        return null
      }
    }
  
    const recordValidationSnapshot = async (messageContent: string, analysis: AnalysisResult | null) => {
      if (!options.groupId || !options.userId) {
        return
      }

      try {
        await $fetch('/api/validation/update', {
          method: 'POST',
          body: {
            groupId: options.groupId,
            deviceId: options.userId,
            message: messageContent,
            result: analysis
              ? {
                  isRelevant: analysis.isRelevant,
                  goalIndex: analysis.goalIndex,
                  progressIncrease: analysis.progressIncrease,
                  reason: analysis.reason
                }
              : null
          }
        })
      } catch (err) {
        console.error('Error recording validation snapshot:', err)
      }
    }
  
    const runValidatorTool = async (content: string): Promise<AnalysisResult | null> => {
      if (!options.groupId) {
        return null
      }

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
            message: content,
            goals: goals.value || [],
            groupDescription: groupDescription.value || ''
          }
        })

        if (analysisResponse.success) {
          const analysis = analysisResponse.analysis
          return {
            isRelevant: !!analysis.isRelevant,
            goalIndex: analysis.goalIndex !== null && analysis.goalIndex !== undefined
              ? Number(analysis.goalIndex)
              : null,
            progress: !!analysis.progress,
            progressIncrease: analysis.progressIncrease !== null && analysis.progressIncrease !== undefined
              ? Number(analysis.progressIncrease)
              : null,
            reason: analysis.reason || ''
          }
        }
      } catch (err) {
        console.error('Error analyzing message:', err)
      }

      return null
    }
  
    const loadHistory = async () => {
      if (!options.groupId || !options.userId || hasLoadedHistory.value) {
        return messages.value.length > (options.systemPrompt ? 1 : 0)
      }
  
      try {
        const response = await $fetch<{
          success: boolean
          messages: Array<{
            id: string
            content: string
            role: 'user' | 'assistant'
            is_relevant: boolean | null
            metadata?: Record<string, any> | null
            created_at: string
          }>
        }>('/api/messages/history', {
          query: {
            groupId: options.groupId,
            deviceId: options.userId
          }
        })
  
        const historyMessages = (response.messages || []).map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
          isRelevant: typeof msg.is_relevant === 'boolean' ? msg.is_relevant : undefined,
          goalIndex: msg.metadata?.goalIndex ?? null,
          progressIncrease: msg.metadata?.progressIncrease ?? null,
          analysisReason: msg.metadata?.reason
        })) as ChatMessage[]
  
        if (historyMessages.length > 0) {
          messages.value = [...buildSystemMessages(), ...historyMessages]
        }
  
        hasLoadedHistory.value = true
        return historyMessages.length > 0
      } catch (err) {
        console.error('Error loading chat history:', err)
        hasLoadedHistory.value = true
        return false
      }
    }
  
    const sendInactivityReminder = async () => {
      await addAssistantMessagePersisted('Už jsi dlouho nenapsal žádnou zprávu. Jak pokračuješ v úkolu?')
      await notifyTeacher()
    }

    const resetInactivityTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer)
      }
      inactivityTimer = setTimeout(async () => {
        await sendInactivityReminder()
        resetInactivityTimer()
      }, INACTIVITY_LIMIT_MS)
    }

    resetInactivityTimer()
    const addSystemMessage = (content: string) => {
      const message: ChatMessage = {
        role: 'system',
        content,
        timestamp: new Date()
      }
      messages.value.unshift(message)
      return message
    }
  
    const persistAssistantMessage = async (message: ChatMessage, metadata?: Record<string, any>) => {
      if (!message || message.role !== 'assistant') {
        return
      }
  
      const saved = await persistMessageRecord({
        role: 'assistant',
        content: message.content,
        metadata
      })
  
      if (saved?.id) {
        message.id = saved.id
      }
    }
  
    const addAssistantMessage = (content: string) => {
      const message: ChatMessage = {
        role: 'assistant',
        content,
        timestamp: new Date()
      }
      messages.value.push(message)
      return message
    }
  
    const addAssistantMessagePersisted = async (content: string, metadata?: Record<string, any>) => {
      const message = addAssistantMessage(content)
      await persistAssistantMessage(message, metadata)
      return message
    }

    const setGoalsContext = (nextGoals?: any[]) => {
      goals.value = Array.isArray(nextGoals) ? nextGoals : []
    }

    const setGroupDescriptionContext = (description?: string) => {
      groupDescription.value = description || ''
    }
  
    const notifyTeacher = async () => {
      if (!options.groupId || !options.userId) {
        return
      }
      
      const now = Date.now()
      if (lastHelpRequestAt.value && now - lastHelpRequestAt.value < HELP_COOLDOWN_MS) {
        return
      }
      
      try {
        await $fetch('/api/help/status', {
          method: 'POST',
          body: {
            groupId: options.groupId,
            deviceId: options.userId,
            needsHelp: true
          }
        })
        lastHelpRequestAt.value = now
        await addAssistantMessagePersisted('Upozorňuji učitele, že potřebujete pomoc s úkolem.')
      } catch (notificationError) {
        console.error('Error notifying teacher:', notificationError)
      }
    }

    const sendMessage = async (content: string) => {
      if (!content.trim() || isLoading.value) {
        return
      }

      resetInactivityTimer()

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
        const analysis = await runValidatorTool(content.trim())
        if (analysis) {
          console.log('Analysis result:', {
            isRelevant: analysis.isRelevant,
            goalIndex: analysis.goalIndex,
            progress: analysis.progress,
            progressIncrease: analysis.progressIncrease,
            reason: analysis.reason
          })

          userMessage.isRelevant = analysis.isRelevant
          userMessage.goalIndex = analysis.goalIndex
          userMessage.progressIncrease = analysis.progressIncrease
          userMessage.analysisReason = analysis.reason

          if (analysis.isRelevant) {
            irrelevantStreak.value = 0
          } else {
            irrelevantStreak.value += 1
            if (irrelevantStreak.value >= HELP_THRESHOLD) {
              await notifyTeacher()
            }
          }

          // Update progress if message is relevant and has a goal index
          // Even if progress is false, we should still update if there's a progressIncrease
          if (analysis.isRelevant && analysis.goalIndex !== null && (analysis.progress || analysis.progressIncrease !== null)) {
            console.log('Updating progress:', {
              groupId: options.groupId,
              goalIndex: analysis.goalIndex,
              progressIncrease: analysis.progressIncrease || 0
            })
            
            try {
              const progressResponse = await $fetch('/api/progress/update', {
                method: 'POST',
                body: {
                  groupId: options.groupId,
                  goalIndex: analysis.goalIndex,
                  deviceId: options.userId,
                  progressIncrease: analysis.progressIncrease || 0
                }
              })
              console.log('Progress update success:', progressResponse)
              
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('progress-updated'))
              }
            } catch (err: any) {
              console.error('Error updating progress:', err)
              // Log the full error details
              if (err.data) {
                console.error('Progress update error details:', err.data)
              }
            }
          } else {
            console.log('Skipping progress update:', {
              isRelevant: analysis.isRelevant,
              goalIndex: analysis.goalIndex,
              progress: analysis.progress,
              progressIncrease: analysis.progressIncrease
            })
          }
        } else {
          console.warn('No analysis result from validator')
        }
  
        const userMetadata: Record<string, any> = {
          timestamp: new Date().toISOString()
        }
        if (analysis?.reason) {
          userMetadata.reason = analysis.reason
        }
  
        const savedUserMessage = await persistMessageRecord({
          role: 'user',
          content: content.trim(),
          isRelevant: analysis?.isRelevant,
          goalIndex: analysis?.goalIndex,
          progressIncrease: analysis?.progressIncrease,
          metadata: userMetadata
        })
        if (savedUserMessage?.id) {
          userMessage.id = savedUserMessage.id
        }

        await recordValidationSnapshot(content.trim(), analysis)

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
          const assistantMessage = addAssistantMessage(response.message.content)
          await persistAssistantMessage(assistantMessage)
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
      messages.value = buildSystemMessages()
      error.value = null
      irrelevantStreak.value = 0
      lastHelpRequestAt.value = null
      resetInactivityTimer()
    }
  
    return {
      messages: readonly(messages),
      isLoading: readonly(isLoading),
      error: readonly(error),
      sendMessage,
      clearMessages,
      addSystemMessage,
      addAssistantMessage,
      addAssistantMessagePersisted,
      loadHistory,
      setGoalsContext,
      setGroupDescriptionContext
    }
  }
  