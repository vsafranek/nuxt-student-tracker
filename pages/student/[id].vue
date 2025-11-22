<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ group?.name || 'Skupina' }}</h1>
            <p v-if="studentInfo" class="text-sm text-gray-500 mt-2">
              Přihlášen jako: <span class="font-semibold">{{ studentInfo.nickname }}</span>
            </p>
          </div>
          <button
            @click="goHome"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Zpět
          </button>
        </div>
      </div>

      <!-- Goals Display -->
      <div v-if="goals.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Vaše cíle</h2>
        <GoalsDisplay :goals="goals" />
      </div>

      <!-- AI Chatbot -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style="height: 600px;">
        <ChatBot 
          v-if="studentInfo && groupId && group"
          :user-id="studentInfo.deviceId"
          :group-id="groupId"
          :system-prompt="systemPrompt"
          :goals="goals"
          :group-description="group.description"
          :group-name="group.name"
          :student-name="studentInfo.nickname"
          :height="'600px'"
        />
        <div v-else class="flex items-center justify-center h-full text-gray-500">
          <div class="text-center">
            <div class="loading-spinner w-8 h-8 mx-auto mb-4"></div>
            <p>Načítání...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Group {
  id: string
  name: string
  description?: string
}

interface StudentInfo {
  nickname: string
  deviceId: string
  joinedAt: string
}

const route = useRoute()
const router = useRouter()
const groupId = route.params.id as string

interface Goal {
  id: string
  title: string
  type: 'boolean' | 'percentage'
  targetCount: number
  progress: number
  completed: boolean
  percentage: number
}

const group = ref<Group | null>(null)
const studentInfo = ref<StudentInfo | null>(null)
const goals = ref<Goal[]>([])
const isLoadingGoals = ref(false)

// Load student info from localStorage
const loadStudentInfo = () => {
  if (typeof window === 'undefined') return
  
  const joinedGroups = JSON.parse(localStorage.getItem('joinedGroups') || '{}')
  const groupData = joinedGroups[groupId]
  
  if (groupData) {
    studentInfo.value = groupData
  } else {
    // Not joined - redirect to join page
    router.push(`/join/${groupId}`)
  }
}

// Load group info
const loadGroup = async () => {
  try {
    const response = await $fetch<{ success: boolean; group: Group }>(`/api/groups/${groupId}/info`)
    
    if (response.success) {
      group.value = response.group
    } else {
      router.push('/')
    }
  } catch (error) {
    console.error('Error loading group:', error)
    router.push('/')
  }
}

// Load goals with progress
const loadGoals = async () => {
  if (!studentInfo.value || !groupId) return
  
  isLoadingGoals.value = true
  try {
    const response = await $fetch<{
      success: boolean
      goals: Goal[]
    }>(`/api/groups/${groupId}/goals-with-progress`, {
      query: {
        deviceId: studentInfo.value.deviceId
      }
    })
    
    if (response.success) {
      goals.value = response.goals
    }
  } catch (error) {
    console.error('Error loading goals:', error)
  } finally {
    isLoadingGoals.value = false
  }
}

const goHome = () => {
  router.push('/')
}

// System prompt for the AI assistant
const systemPrompt = computed(() => {
  const groupName = group.value?.name || 'této skupině'
  const studentName = studentInfo.value?.nickname || 'studente'
  const groupDesc = group.value?.description || ''
  
  // Build goals context
  let goalsContext = ''
  if (goals.value && goals.value.length > 0) {
    goalsContext = '\n\nCíle, které má student splnit:\n'
    goals.value.forEach((goal, index) => {
      goalsContext += `${index + 1}. ${goal.title}`
      if (goal.type === 'boolean') {
        goalsContext += ' (typ: splněno/nesplněno)'
      } else if (goal.type === 'percentage') {
        goalsContext += ` (typ: splněno %, cíl: ${goal.targetCount} úkolů)`
      }
      goalsContext += '\n'
    })
  }
  
  let prompt = `Jste AI asistent pomáhající studentům v edukační aplikaci. 
Jste přátelský, nápomocný a motivující asistent, který pomáhá studentům s jejich úkoly a studiem.

Kontext:
- Student se jmenuje: ${studentName}
- Nachází se ve skupině: ${groupName}
${groupDesc ? `- Vodítko pro vás (popis zaměření skupiny): ${groupDesc}` : ''}${goalsContext}

VÁŠ ÚKOL:
- Vytvořte a zadávejte studentovi úkoly na základě cílů skupiny a vodítka výše
- Dohlížejte na splnění cílů a pomáhejte studentovi je dosáhnout
- Sledujte pokrok studenta a povzbuzujte ho
- Buďte trpělivý a povzbuzující
- Odpovídejte v češtině
- Pomáhejte s úkoly a vysvětlujte koncepty jasně
- Ptejte se, pokud něco není jasné
- Pokud student nepracuje na cílech, upozorněte ho přátelsky`
  
  return prompt
})

onMounted(async () => {
  loadStudentInfo()
  await loadGroup()
  
  // Load goals after student info is available
  if (studentInfo.value) {
    await loadGoals()
  } else {
    // Wait a bit and try again if studentInfo wasn't loaded yet
    setTimeout(async () => {
      if (studentInfo.value) {
        await loadGoals()
      }
    }, 100)
  }
})

// Watch for studentInfo changes
watch(() => studentInfo.value, async (newVal) => {
  if (newVal && groupId) {
    await loadGoals()
  }
})

// Watch for group changes to ensure we have description
watch(() => group.value, (newGroup) => {
  if (newGroup && newGroup.description) {
    // Group loaded with description, welcome message should appear
    console.log('Group loaded with description:', newGroup.description)
  }
})

// Listen for progress updates to refresh goals
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('progress-updated', () => {
      // Refresh goals after progress update
      setTimeout(() => {
        loadGoals()
      }, 500)
    })
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('progress-updated', () => {})
  }
})
</script>

