<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <!-- Already Joined State -->
      <div v-if="isJoined" class="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Již jste ve skupině!</h2>
        <p class="text-gray-600 mb-4">
          Toto zařízení je již zaregistrované ve skupině <strong>{{ group?.name }}</strong>
        </p>
        <p class="text-sm text-gray-500 mb-6">
          Vaše přezdívka: <span class="font-semibold text-gray-900">{{ studentInfo?.nickname }}</span>
        </p>
        <div class="space-y-3">
          <button
            @click="goToStudentView"
            class="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
          >
            Přejít do skupiny
          </button>
          <button
            @click="resetJoin"
            class="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Opustit skupinu
          </button>
        </div>
      </div>

      <!-- Join Form State -->
      <div v-else-if="!isLoading && group" class="bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Vstup do skupiny</h2>
          <p class="text-gray-600">{{ group.name }}</p>
          <p v-if="group.description" class="text-sm text-gray-500 mt-2">{{ group.description }}</p>
        </div>

        <form @submit.prevent="joinGroup" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Vaše přezdívka
            </label>
            <input
              v-model="nickname"
              type="text"
              placeholder="např. Honza Novák"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              required
              autofocus
              maxlength="50"
            />
            <p class="text-xs text-gray-500 mt-1">
              Tato přezdívka bude viditelná pro učitele ve skupině
            </p>
          </div>

          <div v-if="joinError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {{ joinError }}
          </div>

          <button
            type="submit"
            :disabled="isJoining || !nickname.trim()"
            class="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isJoining ? 'Připojování...' : 'Vstoupit do skupiny' }}
          </button>
        </form>
      </div>

      <!-- Loading State -->
      <div v-else-if="isLoading" class="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div class="loading-spinner w-16 h-16 mx-auto mb-4"></div>
        <p class="text-gray-600">Načítání skupiny...</p>
      </div>

      <!-- Error State -->
      <div v-else class="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Skupina nenalezena</h2>
        <p class="text-gray-600 mb-6">
          Skupina s tímto kódem neexistuje nebo byla smazána.
        </p>
        <button
          @click="$router.push('/')"
          class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Zpět na hlavní stránku
        </button>
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

const group = ref<Group | null>(null)
const nickname = ref('')
const isJoining = ref(false)
const isLoading = ref(true)
const joinError = ref('')
const isJoined = ref(false)
const studentInfo = ref<StudentInfo | null>(null)

// Generate or retrieve device ID
const getDeviceId = (): string => {
  if (typeof window === 'undefined') return ''
  
  let deviceId = localStorage.getItem('deviceId')
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem('deviceId', deviceId)
  }
  return deviceId
}

// Check if already joined
const checkJoinStatus = () => {
  if (typeof window === 'undefined') return false
  
  const joinedGroups = JSON.parse(localStorage.getItem('joinedGroups') || '{}')
  const groupData = joinedGroups[groupId]
  
  if (groupData) {
    isJoined.value = true
    studentInfo.value = groupData
    return true
  }
  return false
}

// Load group info
const loadGroup = async () => {
  isLoading.value = true
  joinError.value = ''
  
  try {
    const response = await $fetch<{ success: boolean; group: Group }>(`/api/groups/${groupId}/info`)
    
    if (response.success) {
      group.value = response.group
    } else {
      group.value = null
    }
  } catch (error: any) {
    console.error('Error loading group:', error)
    group.value = null
    joinError.value = 'Nepodařilo se načíst informace o skupině'
  } finally {
    isLoading.value = false
  }
}

// Join group
const joinGroup = async () => {
  if (!nickname.value.trim()) return
  
  isJoining.value = true
  joinError.value = ''
  
  try {
    const deviceId = getDeviceId()
    
    const response = await $fetch<{ success: boolean; message?: string }>('/api/groups/join', {
      method: 'POST',
      body: {
        groupId,
        nickname: nickname.value.trim(),
        deviceId
      }
    })
    
    if (response.success) {
      // Store in localStorage
      const joinedGroups = JSON.parse(localStorage.getItem('joinedGroups') || '{}')
      joinedGroups[groupId] = {
        nickname: nickname.value.trim(),
        deviceId,
        joinedAt: new Date().toISOString()
      }
      localStorage.setItem('joinedGroups', JSON.stringify(joinedGroups))
      
      // Update state
      isJoined.value = true
      studentInfo.value = joinedGroups[groupId]
      
      // Redirect to student view after a moment
      setTimeout(() => {
        goToStudentView()
      }, 1500)
    }
  } catch (error: any) {
    console.error('Error joining group:', error)
    joinError.value = error.data?.message || error.message || 'Nepodařilo se připojit ke skupině'
  } finally {
    isJoining.value = false
  }
}

// Go to student view
const goToStudentView = () => {
  router.push(`/student/${groupId}`)
}

// Reset join (leave group)
const resetJoin = () => {
  if (typeof window === 'undefined') return
  
  if (confirm('Opravdu chcete opustit tuto skupinu? Budete muset znovu naskenovat QR kód pro vstup.')) {
    const joinedGroups = JSON.parse(localStorage.getItem('joinedGroups') || '{}')
    delete joinedGroups[groupId]
    localStorage.setItem('joinedGroups', JSON.stringify(joinedGroups))
    
    isJoined.value = false
    studentInfo.value = null
    nickname.value = ''
  }
}

// Initialize
onMounted(() => {
  // Check if already joined first
  if (checkJoinStatus()) {
    // Still load group info for display
    loadGroup()
  } else {
    // Load group and show join form
    loadGroup()
  }
})
</script>

<style scoped>
.loading-spinner {
  display: inline-block;
  border: 4px solid rgba(59, 130, 246, 0.3);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

