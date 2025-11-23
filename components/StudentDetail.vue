<template>
  <div class="space-y-4">
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <div class="text-center">
        <div class="loading-spinner w-8 h-8 mx-auto mb-2"></div>
        <p class="text-sm text-gray-600">Načítání zpráv...</p>
      </div>
    </div>
    
    <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
      {{ error }}
    </div>
    
    <div v-else-if="goalsWithMessages.length === 0" class="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 text-center">
      Student zatím neposlal žádné relevantní zprávy k cílům.
    </div>
    
    <div v-else class="space-y-6">
      <div
        v-for="(item, index) in goalsWithMessages"
        :key="item.goal.id"
        class="bg-white rounded-lg border border-gray-200 p-4"
      >
        <div class="flex items-start gap-3 mb-3">
          <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
            {{ index + 1 }}
          </div>
          <div class="flex-1">
            <h4 class="font-semibold text-gray-900 mb-1">{{ item.goal.title }}</h4>
            <p class="text-xs text-gray-500">
              {{ item.goal.type === 'boolean' ? 'Typ: Ano/Ne' : `Typ: Procento (Cíl: ${item.goal.targetCount})` }}
            </p>
          </div>
        </div>
        
        <div class="ml-11 space-y-3">
          <div
            v-for="(message, msgIndex) in item.messages"
            :key="message.id"
            class="border-l-2 border-blue-200 pl-3 py-2"
          >
            <div class="flex items-start gap-2 mb-1">
              <span
                class="px-2 py-0.5 text-xs font-medium rounded"
                :class="message.role === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'"
              >
                {{ message.role === 'user' ? 'Student' : 'Asistent' }}
              </span>
              <span class="text-xs text-gray-500">
                {{ formatMessageTime(message.createdAt) }}
              </span>
              <span
                v-if="message.metadata.progressIncrease"
                class="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700"
              >
                +{{ message.metadata.progressIncrease }}%
              </span>
            </div>
            <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ message.content }}</p>
            <p
              v-if="message.metadata.reason"
              class="text-xs text-gray-500 mt-1 italic"
            >
              {{ message.metadata.reason }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Goal {
  id: string
  title: string
  type: string
  targetCount: number
  index: number
}

interface Message {
  id: string
  content: string
  role: string
  createdAt: string
  metadata: {
    goalIndex?: number
    progressIncrease?: number
    reason?: string
  }
}

interface GoalWithMessages {
  goal: Goal
  messages: Message[]
}

interface Props {
  studentId: string
  groupId: string
}

const props = defineProps<Props>()

const isLoading = ref(true)
const error = ref<string | null>(null)
const goalsWithMessages = ref<GoalWithMessages[]>([])

const loadStudentMessages = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await $fetch<{
      success: boolean
      student: { id: string; nickname: string }
      goalsWithMessages: GoalWithMessages[]
    }>(`/api/groups/${props.groupId}/student/${props.studentId}/messages`)
    
    if (response.success) {
      goalsWithMessages.value = response.goalsWithMessages
    } else {
      error.value = 'Nepodařilo se načíst zprávy studenta'
    }
  } catch (err: any) {
    console.error('Error loading student messages:', err)
    error.value = err.message || 'Nepodařilo se načíst zprávy studenta'
  } finally {
    isLoading.value = false
  }
}

const formatMessageTime = (dateString: string) => {
  if (!dateString) return ''
  
  // Normalize the date string - if it doesn't have timezone, assume UTC
  let normalizedDateString = dateString
  if (typeof normalizedDateString === 'string' && 
      !normalizedDateString.endsWith('Z') && 
      !normalizedDateString.includes('+') && 
      !normalizedDateString.includes('-', 10)) {
    normalizedDateString = normalizedDateString + 'Z'
  }
  
  const date = new Date(normalizedDateString)
  return date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
}

// Load messages when component is mounted
onMounted(() => {
  loadStudentMessages()
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 2000px;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>

