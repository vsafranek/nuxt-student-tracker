<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button
              @click="goBack"
              class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zpět na dashboard"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 class="text-xl font-bold text-gray-900">{{ group?.name || 'Načítání...' }}</h1>
              <p v-if="group?.description" class="text-sm text-gray-500 mt-1">{{ group.description }}</p>
            </div>
          </div>
          <button
            @click="showQRCode"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            QR kód
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="loading-spinner w-16 h-16 mx-auto mb-4"></div>
          <p class="text-gray-600">Načítání skupiny...</p>
        </div>
      </div>

      <!-- Content -->
      <div v-else-if="group">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Přihlášení studenti</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ studentCount }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Průměrný pokrok</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ averageProgress }}%</p>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Potřebují pomoc</p>
                <p class="text-3xl font-bold text-red-600 mt-2">{{ helpNeeded }}</p>
              </div>
              <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Students List -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900">Seznam studentů</h2>
              <span class="text-sm text-gray-500">{{ studentCount }} {{ studentCount === 1 ? 'student' : studentCount < 5 ? 'studenti' : 'studentů' }}</span>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="students.length === 0" class="p-12 text-center">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Zatím žádní studenti</h3>
            <p class="text-gray-600 mb-4">Studenti se mohou připojit pomocí QR kódu</p>
            <button
              @click="showQRCode"
              class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Zobrazit QR kód
            </button>
          </div>

          <!-- Students Table -->
          <div v-else class="divide-y divide-gray-200">
            <div
              v-for="(student, index) in students"
              :key="student.id"
              class="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {{ index + 1 }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ student.nickname }}</p>
                    <p class="text-sm text-gray-500">Připojil se {{ formatDate(student.joinedAt) }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Aktivní
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Skupina nenalezena</h2>
        <p class="text-gray-600 mb-6">Skupina s tímto ID neexistuje nebo nemáte oprávnění ji zobrazit.</p>
        <button
          @click="goBack"
          class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Zpět na dashboard
        </button>
      </div>
    </main>

    <!-- QR Code Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showQRModal"
          class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          @click.self="showQRModal = false"
        >
          <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-bold text-gray-900">QR kód pro vstup</h3>
              <button
                @click="showQRModal = false"
                class="text-gray-400 hover:text-gray-600"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="text-center">
              <p class="text-sm text-gray-600 mb-4">
                {{ group?.name }}
              </p>
              <div class="bg-gray-50 p-6 rounded-xl mb-4 flex items-center justify-center">
                <div v-if="group?.qrCode" v-html="group.qrCode" class="w-64 h-64"></div>
                <div v-else class="text-gray-400">Generování QR kódu...</div>
              </div>
              <p class="text-xs text-gray-500 mb-4">
                Studenti naskenují tento QR kód pro vstup do skupiny
              </p>
              <button
                @click="copyJoinLink"
                class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Zkopírovat odkaz pro vstup
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
interface Group {
  id: string
  name: string
  description?: string
  qrCode?: string
  createdAt?: string
}

interface Student {
  id: string
  nickname: string
  deviceId: string
  joinedAt: string
}

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const groupId = route.params.id as string

const group = ref<Group | null>(null)
const students = ref<Student[]>([])
const studentCount = ref(0)
const isLoading = ref(true)
const showQRModal = ref(false)
const averageProgress = ref(0)
const helpNeeded = ref(0)

// Load group details
const loadGroupDetails = async () => {
  isLoading.value = true
  try {
    const response = await $fetch<{
      success: boolean
      group: Group
      students: Student[]
      studentCount: number
    }>(`/api/groups/${groupId}/details`)
    
    if (response.success) {
      group.value = response.group
      students.value = response.students
      studentCount.value = response.studentCount
      
      // TODO: Load progress stats if needed
      averageProgress.value = 0
      helpNeeded.value = 0
    }
  } catch (error: any) {
    console.error('Error loading group details:', error)
    if (error.statusCode === 404 || error.statusCode === 403) {
      group.value = null
    }
  } finally {
    isLoading.value = false
  }
}

const goBack = () => {
  router.push('/teacher/dashboard')
}

const showQRCode = () => {
  showQRModal.value = true
}

const copyJoinLink = () => {
  if (!group.value) return
  const link = `${window.location.origin}/join/${group.value.id}`
  navigator.clipboard.writeText(link)
  alert('Odkaz zkopírován do schránky!')
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('cs-CZ', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadGroupDetails()
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

