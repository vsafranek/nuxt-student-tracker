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
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
            'flex',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          ]"
        >
          <div
            :class="[
              'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border border-gray-200'
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
interface Props {
  userId?: string
  groupId?: string
  systemPrompt?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '600px'
})

const { messages, isLoading, error, sendMessage, clearMessages } = useChat({
  userId: props.userId,
  groupId: props.groupId,
  systemPrompt: props.systemPrompt
})

const inputMessage = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const messagesContainer = ref<HTMLDivElement | null>(null)

// Filter out system messages for display
const displayMessages = computed(() => {
  return messages.value.filter(msg => msg.role !== 'system')
})

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

// Focus input on mount
onMounted(() => {
  if (inputRef.value) {
    inputRef.value.focus()
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

