<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <!-- Main Content: Goals Sidebar + Chat -->
      <div class="flex flex-col md:flex-row gap-6">
        <!-- Goals Sidebar (left on desktop, top on mobile) -->
        <div 
          v-if="goals.length > 0" 
          class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:w-80 md:shrink-0 md:sticky md:top-8 md:self-start md:max-h-[calc(100vh-8rem)] md:overflow-y-auto"
        >
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Vaše cíle</h2>
          <GoalsDisplay :goals="goals" />
        </div>

        <!-- AI Chatbot (right on desktop, bottom on mobile) -->
        <div class="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" :style="{ height: '600px' }">
          <ChatBot 
            v-if="studentInfo && groupId && group"
            :user-id="studentInfo.deviceId"
            :group-id="groupId"
            :system-prompt="systemPrompt"
            :goals="goals"
            :group-description="group.description"
            :group-name="group.name"
            :student-name="studentInfo.nickname"
            :assignment-mode="group.assignmentMode || 'uniform'"
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
  </div>
</template>

<script setup lang="ts">
type AssignmentMode = 'uniform' | 'variant'

interface Group {
  id: string
  name: string
  description?: string
  assignmentMode?: AssignmentMode
}

interface StudentInfo {
  nickname: string
  deviceId: string
  joinedAt: string
}

const route = useRoute()
const router = useRouter()
const groupId = route.params.id as string
const HEARTBEAT_INTERVAL_MS = 30000

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
let heartbeatTimer: ReturnType<typeof setInterval> | null = null

// Load student info from localStorage
const loadStudentInfo = () => {
  if (typeof window === 'undefined') return
  
  const joinedGroups = JSON.parse(localStorage.getItem('joinedGroups') || '{}')
  const groupData = joinedGroups[groupId]
  
  if (groupData) {
    studentInfo.value = groupData
    // Heartbeat will be started by watch() when studentInfo is set
  } else {
    // Not joined - redirect to join page
    router.push(`/join/${groupId}`)
  }
}

const sendHeartbeat = async () => {
  if (!studentInfo.value) {
    console.log('Heartbeat: No studentInfo, skipping')
    return
  }
  try {
    console.log(`Heartbeat: Sending heartbeat for device ${studentInfo.value.deviceId} in group ${groupId}`)
    const response = await $fetch<{ success: boolean; skipped?: boolean }>('/api/heartbeat/update', {
      method: 'POST',
      body: {
        groupId,
        deviceId: studentInfo.value.deviceId
      }
    })
    
    // If heartbeat was skipped (e.g., student not found), stop sending heartbeats
    if (response.skipped) {
      console.warn('Heartbeat skipped - student may not be in group anymore')
      stopHeartbeat()
    } else if (response.success) {
      console.log('Heartbeat: Successfully sent')
    }
  } catch (error: any) {
    // Only log as warning, not error - heartbeat failures are non-critical
    if (error.statusCode !== 404) {
      console.warn('Heartbeat update failed:', error.message || error)
    }
    // If 404 or other error, stop heartbeat to avoid spam
    stopHeartbeat()
  }
}

const startHeartbeat = () => {
  if (!studentInfo.value) {
    console.log('Heartbeat: Cannot start - no studentInfo')
    return
  }
  console.log('Heartbeat: Starting heartbeat interval')
  stopHeartbeat()
  sendHeartbeat()
  heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
}

const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

// Load group info
const loadGroup = async () => {
  try {
    const response = await $fetch<{ success: boolean; group: Group }>(`/api/groups/${groupId}/info`)
    
    if (response.success) {
      group.value = {
        ...response.group,
        assignmentMode: response.group.assignmentMode || 'uniform'
      }
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
  const assignmentMode = group.value?.assignmentMode || 'uniform'
  const assignmentModeNote = assignmentMode === 'variant'
    ? 'Každý student dostává obdobné zadání, ale s jinými číselnými hodnotami – zachovejte stejnou obtížnost.'
    : 'Všichni studenti mají stejné zadání, aby bylo možné srovnat jejich postup.'
  
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
${groupDesc ? `- Vodítko pro vás (popis zaměření skupiny): ${groupDesc}\n` : ''}- Režim zadání: ${assignmentMode === 'variant' ? 'variantní zadání (jiné hodnoty, stejná obtížnost)' : 'stejné zadání pro všechny'}
- ${assignmentModeNote}${goalsContext}

VÁŠ ÚKOL:
- Dohlížejte na splnění cílů a pomáhejte studentovi je dosáhnout
- Sledujte pokrok studenta a povzbuzujte ho
- Buďte trpělivý a povzbuzující
- Odpovídejte v češtině

KRITICKÁ PRAVIDLA:
1. NIKDY NEDÁVEJTE STUDENTOVI PŘÍMOŘEŠENÍ ÚLOH
   - Můžete studenta NAVÉST k řešení pomocí otázek, nápověd nebo vysvětlení postupu
   - Můžete ukázat podobný příklad nebo vysvětlit metodu
   - NIKDY nepište kompletní řešení úlohy, kterou má student vyřešit

2. ČÁSTEČNÉ ODPOVĚDI:
   - Pokud student odpoví jen částečně správně, upozorněte ho na to
   - Řekněte mu, že má část správně, ale že je potřeba pokračovat nebo něco upravit
   - NIKDY neukazujte zbytek výsledku - jen ho navádějte, jak pokračovat
   - Například: "Dobře, máš správně první krok. Teď zkus pokračovat dál - co by mělo být dalším krokem?"

3. NAVÁDĚNÍ K ŘEŠENÍ:
   - Používejte otázky typu "Co by mělo být dalším krokem?", "Jaký vzorec bys mohl použít?", "Zkus se zamyslet nad..."
   - Můžete ukázat podobný příklad nebo vysvětlit princip
   - Můžete dát nápovědu, ale ne kompletní řešení

4. POMOC S ÚKOLY:
   - Vysvětlujte koncepty jasně
   - Pomáhejte s pochopením postupu
   - Pokud student něco nechápe, vysvětlete to jinak nebo použijte příklad
   - Pokud student nepracuje na cílech, upozorněte ho přátelsky

PŘÍKLADY:
- ŠPATNĚ: "Řešení je x = 2 nebo x = -3"
- SPRÁVNĚ: "Dobře, máš správně rozloženou rovnici. Teď zkus najít hodnoty x, pro které je každý činitel roven nule."

- ŠPATNĚ: "Derivace je f'(x) = 3x^2 + 4x - 5"
- SPRÁVNĚ: "Zkus použít pravidlo pro derivaci součtu. Jaká je derivace x^3? A jaká je derivace 2x^2?"

- ŠPATNĚ: "Správná odpověď je 42"
- SPRÁVNĚ: "Máš správně první část výpočtu. Teď zkus dokončit výpočet - co by mělo být výsledkem?"`
  
  return prompt
})

onMounted(async () => {
  loadStudentInfo()
  await loadGroup()
  
  // Load goals after student info is available
  if (studentInfo.value) {
    await loadGoals()
    // Start heartbeat if studentInfo is already loaded
    startHeartbeat()
  } else {
    // Wait a bit and try again if studentInfo wasn't loaded yet
    setTimeout(async () => {
      if (studentInfo.value) {
        await loadGoals()
        startHeartbeat()
      }
    }, 100)
  }
})

// Watch for studentInfo changes
watch(() => studentInfo.value, async (newVal) => {
  if (newVal && groupId) {
    await loadGoals()
    startHeartbeat()
  } else {
    stopHeartbeat()
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
const handleProgressUpdated = () => {
  setTimeout(() => {
    loadGoals()
  }, 500)
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('progress-updated', handleProgressUpdated)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('progress-updated', handleProgressUpdated)
  }
  stopHeartbeat()
})
</script>

