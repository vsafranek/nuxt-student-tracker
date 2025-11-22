<template>
  <div class="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-lg">AI Asistent</h3>
            <p class="text-sm text-white/80">Jak mohu pomoci?</p>
          </div>
        </div>
        <button
          @click="clearChat"
          class="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          title="Vymazat konverzaci"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Messages Area -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
      <!-- Empty State -->
      <div v-if="displayMessages.length === 0" class="flex flex-col items-center justify-center h-full text-gray-500">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p class="text-center max-w-sm">
          Začněte konverzaci! Položte jakoukoliv otázku a já vám pomůžu.
        </p>
      </div>

      <!-- Messages -->
      <TransitionGroup name="message" tag="div" class="space-y-4">
        <div
          v-for="(message, index) in displayMessages"
          :key="`${message.timestamp?.getTime() || index}-${message.content.slice(0, 20)}`"
          :class="[
            'flex flex-col',
            message.role === 'user' ? 'items-end' : 'items-start'
          ]"
        >
          <div
            :class="[
              'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm relative',
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border border-gray-200',
              // Green border for relevant messages
              message.isRelevant && message.role === 'user' && 'ring-2 ring-green-500 ring-offset-1 border-green-500'
            ]"
          >
            <div class="whitespace-pre-wrap break-words">{{ message.content }}</div>
            <div
              v-if="message.timestamp"
              :class="[
                'text-xs mt-2',
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              ]"
            >
              {{ formatTime(message.timestamp) }}
            </div>
          </div>
          <!-- Warning indicator for non-relevant messages -->
          <div
            v-if="message.role === 'user' && message.isRelevant === false"
            class="mt-1 flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Tato zpráva nesouvisí s cíli</span>
          </div>
          <!-- Success indicator for relevant messages -->
          <div
            v-if="message.role === 'user' && message.isRelevant && message.goalIndex !== null"
            class="mt-1 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Pokrok k cíli</span>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div
          v-if="isLoading"
          key="loading"
          class="flex justify-start"
        >
          <div class="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
            <div class="flex items-center gap-2">
              <div class="flex gap-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
              </div>
              <span class="text-sm text-gray-500">AI píše...</span>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="px-4 py-2 bg-red-50 border-t border-red-200">
      <div class="flex items-center gap-2 text-red-700 text-sm">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- Input Area -->
    <div class="border-t border-gray-200 p-4 bg-white">
      <form @submit.prevent="handleSubmit" class="flex gap-2">
        <textarea
          v-model="inputMessage"
          ref="inputRef"
          :disabled="isLoading"
          placeholder="Napište zprávu..."
          rows="1"
          class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
          @keydown.enter.exact.prevent="handleSubmit"
          @keydown.enter.shift.exact="inputMessage += '\n'"
          @input="autoResize"
        ></textarea>
        <button
          type="submit"
          :disabled="!inputMessage.trim() || isLoading"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[80px]"
        >
          <span v-if="!isLoading">Odeslat</span>
          <div v-else class="loading-spinner w-5 h-5 border-2 border-white border-t-transparent"></div>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Goal {
  id: string
  title: string
  type: 'boolean' | 'percentage'
  targetCount: number
  progress: number
  completed: boolean
  percentage: number
}

interface Props {
  userId?: string
  groupId?: string
  systemPrompt?: string
  goals?: Goal[]
  groupDescription?: string
  groupName?: string
  studentName?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '600px',
  goals: () => []
})

const { messages, isLoading, error, sendMessage, clearMessages, addAssistantMessage } = useChat({
  userId: props.userId,
  groupId: props.groupId,
  systemPrompt: props.systemPrompt,
  goals: props.goals || [],
  groupDescription: props.groupDescription || ''
})

const inputMessage = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const messagesContainer = ref<HTMLDivElement | null>(null)
const hasShownWelcome = ref(false)
const isGeneratingWelcome = ref(false)
let welcomeTimeout: ReturnType<typeof setTimeout> | null = null

// Filter out system messages for display
const displayMessages = computed(() => {
  return messages.value.filter(msg => msg.role !== 'system')
})

// Generate welcome message with AI-generated task assignment
const generateWelcomeMessage = async (): Promise<string> => {
  const studentName = props.studentName || 'studente'
  const groupName = props.groupName || 'skupině'
  
  let welcomeText = ''
  
  // Try to generate task assignment using AI if we have group description
  if (props.groupDescription && props.groupDescription.trim()) {
    try {
      console.log('Generating assignment with:', {
        groupDescription: props.groupDescription,
        goalsCount: props.goals?.length || 0,
        studentName: props.studentName,
        groupName: props.groupName
      })
      
      const response = await $fetch<{
        success: boolean
        assignment: string
      }>('/api/chat/generate-assignment', {
        method: 'POST',
        body: {
          groupDescription: props.groupDescription,
          goals: props.goals || [],
          studentName: props.studentName,
          groupName: props.groupName
        }
      })
      
      console.log('Assignment response:', response)
      
      if (response.success && response.assignment && response.assignment.trim()) {
        welcomeText += `${response.assignment}\n\n`
      } else {
        console.warn('Assignment response missing or empty, using fallback')
        throw new Error('No assignment in response')
      }
    } catch (error: any) {
      console.error('Error generating assignment:', error)
      // Fallback if AI generation fails - create basic assignment based on goals
      if (props.goals && props.goals.length > 0) {
        welcomeText += 'Pracujte na plnění následujících cílů. Pomohu vám s jejich splněním.\n\n'
      } else {
        welcomeText += 'Pracujte na úkolech ve skupině. Pomohu vám s jejich splněním.\n\n'
      }
    }
  } else {
    // If no group description, provide basic assignment
    console.log('No group description, using basic assignment')
    if (props.goals && props.goals.length > 0) {
      welcomeText += 'Pracujte na plnění následujících cílů. Pomohu vám s jejich splněním.\n\n'
    } else {
      welcomeText += 'Pracujte na úkolech ve skupině. Pomohu vám s jejich splněním.\n\n'
    }
  }
  
  // Add goals if available
  if (props.goals && props.goals.length > 0) {
    welcomeText += '**Vaše cíle:**\n\n'
    
    props.goals.forEach((goal, index) => {
      welcomeText += `${index + 1}. ${goal.title}\n`
      
      if (goal.type === 'boolean') {
        welcomeText += `   Status: ${goal.completed ? '✅ Splněno' : '❌ Nesplněno'}\n`
      } else if (goal.type === 'percentage') {
        welcomeText += `   Průběh: ${goal.percentage}% (${goal.progress}/${goal.targetCount})\n`
      }
      
      welcomeText += '\n'
    })
    
    welcomeText += '\n'
  }
  
  welcomeText += 'Můžete se mě zeptat na cokoliv souvisejícího s úkolem nebo cíli. Pomohu vám s jejich splněním. Jak mohu pomoci?'
  
  return welcomeText
}

const showWelcome = async () => {
  if (hasShownWelcome.value || displayMessages.value.length > 0 || isGeneratingWelcome.value) {
    return
  }

  isGeneratingWelcome.value = true

  try {
    console.log('Generating welcome message with props:', {
      groupDescription: props.groupDescription,
      goalsCount: props.goals?.length || 0,
      studentName: props.studentName,
      groupName: props.groupName
    })

    const welcomeMessage = await generateWelcomeMessage()
    if (welcomeMessage && welcomeMessage.trim()) {
      addAssistantMessage(welcomeMessage)
      hasShownWelcome.value = true
      scrollToBottom()
    }
  } catch (error) {
    console.error('Error generating welcome message:', error)
    const basicWelcome = `Ahoj ${props.studentName || 'studente'}! 👋\n\nVítejte ve skupině "${props.groupName || 'skupině'}". Jsem AI asistent a jsem zde, abych vám pomohl s vašimi úkoly.\n\n**Vaše zadání:**\nPracujte na úkolech ve skupině. Pomohu vám s jejich splněním.\n\nMůžete se mě zeptat na cokoliv. Jak mohu pomoci?`
    addAssistantMessage(basicWelcome)
    hasShownWelcome.value = true
    scrollToBottom()
  } finally {
    isGeneratingWelcome.value = false
  }
}

const scheduleWelcome = () => {
  if (hasShownWelcome.value || displayMessages.value.length > 0 || isGeneratingWelcome.value) {
    return
  }

  if (welcomeTimeout) {
    return
  }

  welcomeTimeout = setTimeout(async () => {
    welcomeTimeout = null
    await showWelcome()
  }, 300)
}

const handleSubmit = async () => {
  if (!inputMessage.value.trim() || isLoading.value) {
    return
  }

  const message = inputMessage.value.trim()
  inputMessage.value = ''
  
  // Reset textarea height
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }

  await sendMessage(message)
  
  // Scroll to bottom after sending
  nextTick(() => {
    scrollToBottom()
  })
}

const clearChat = () => {
  if (confirm('Opravdu chcete vymazat celou konverzaci?')) {
    clearMessages()
    inputMessage.value = ''
    scrollToBottom()
  }
}

const autoResize = () => {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
    inputRef.value.style.height = `${Math.min(inputRef.value.scrollHeight, 150)}px`
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Scroll to bottom when new messages arrive
watch(() => messages.value.length, () => {
  scrollToBottom()
})

// Show welcome message when props are ready
watch(
  [() => props.goals, () => props.groupDescription, () => props.groupName, () => props.studentName],
  () => {
    scheduleWelcome()
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
})

onBeforeUnmount(() => {
  if (welcomeTimeout) {
    clearTimeout(welcomeTimeout)
    welcomeTimeout = null
  }
})
</script>

<style scoped>
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.message-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

