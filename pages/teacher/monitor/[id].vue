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
          <div class="flex items-center gap-3">
            <!-- Realtime Status Badge -->
            <div
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              :class="realtimeStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : realtimeStatus === 'connecting' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-gray-100 text-gray-600'"
              :title="realtimeStatus === 'connected' 
                ? 'Realtime aktualizace fungují' 
                : realtimeStatus === 'connecting' 
                ? 'Připojování k realtime...' 
                : 'Realtime nefunguje - používá se fallback refresh'"
            >
              <div
                class="w-2 h-2 rounded-full"
                :class="realtimeStatus === 'connected' 
                  ? 'bg-green-500 animate-pulse' 
                  : realtimeStatus === 'connecting' 
                  ? 'bg-yellow-500' 
                  : 'bg-gray-400'"
              ></div>
              <span>
                {{ realtimeStatus === 'connected' 
                  ? 'Realtime' 
                  : realtimeStatus === 'connecting' 
                  ? 'Připojování...' 
                  : 'Offline' }}
              </span>
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
              class="border-b border-gray-200 last:border-b-0"
            >
              <div class="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <button
                      @click.stop="toggleStudentDetail(student.id)"
                      type="button"
                      class="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                      :aria-expanded="expandedStudents.has(student.id)"
                    >
                      <svg 
                        class="w-5 h-5 transition-transform duration-200"
                        :class="{ 'rotate-90': expandedStudents.has(student.id) }"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {{ index + 1 }}
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{{ student.nickname }}</p>
                      <p class="text-sm text-gray-500">Připojil se {{ formatDate(student.joinedAt) }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-4 flex-wrap">
                    <div class="w-64">
                      <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Pokrok</span>
                        <span class="font-semibold text-gray-900">{{ student.progressPercentage ?? 0 }}%</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all duration-300"
                          :class="(student.progressPercentage ?? 0) >= 100 ? 'bg-green-500' : 'bg-blue-500'"
                          :style="{ width: `${student.progressPercentage ?? 0}%` }"
                        ></div>
                      </div>
                    </div>
                    <span
                      class="px-3 py-1 text-xs font-medium rounded-full"
                      :class="getActivityBadgeClass(student)"
                    >
                      {{ getActivityLabel(student) }}
                    </span>
                    <span
                      v-if="student.needsHelp && (student.progressPercentage ?? 0) < 100"
                      class="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1"
                    >
                      Potřebuje pomoc • {{ formatHelpDuration(student.helpRequestedAt) }}
                    </span>
                    <button
                      v-if="student.needsHelp && (student.progressPercentage ?? 0) < 100"
                      @click.stop="resolveHelp(student.id)"
                      class="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Označit jako vyřešené
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Student Detail -->
              <Transition name="slide-down">
                <div v-if="expandedStudents.has(student.id)" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <StudentDetail :student-id="student.id" :group-id="groupId" :key="student.id" />
                </div>
              </Transition>
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
import type { RealtimeChannel } from '@supabase/supabase-js'
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
  progressPercentage?: number
  needsHelp?: boolean
  helpRequestedAt?: string | null
  lastActiveAt?: string | null
  lastMessageContent?: string | null
  lastMessageIsRelevant?: boolean | null
  lastMessageGoalIndex?: number | null
  lastMessageProgress?: number | null
  lastMessageReason?: string | null
  lastMessageAt?: string | null
}

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const groupId = route.params.id as string

const group = ref<Group | null>(null)
const students = ref<Student[]>([])
const studentCount = ref(0)
const isLoading = ref(true)
const showQRModal = ref(false)
const averageProgress = ref(0)
const helpNeeded = ref(0)
const expandedStudents = ref<Set<string>>(new Set())

const ONLINE_THRESHOLD_MS = 60 * 1000
const FALLBACK_REFRESH_INTERVAL_MS = 30 * 1000 // Fallback refresh every 30 seconds if realtime doesn't work

let realtimeChannel: RealtimeChannel | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null
let fallbackRefreshTimer: ReturnType<typeof setInterval> | null = null
let lastRealtimeEvent = ref<number | null>(null)
const realtimeStatus = ref<'connected' | 'connecting' | 'disconnected'>('connecting')

// Load group details
const loadGroupDetails = async () => {
  isLoading.value = true
  try {
    const response = await $fetch<{
      success: boolean
      group: Group
      students: Student[]
      studentCount: number
      averageProgress?: number
      helpNeeded?: number
    }>(`/api/groups/${groupId}/details`)
    
    if (response.success) {
      group.value = response.group
      students.value = response.students
      studentCount.value = response.studentCount
      
      averageProgress.value = response.averageProgress ?? 0
      if (typeof response.helpNeeded === 'number') {
        helpNeeded.value = response.helpNeeded
      } else {
        updateHelpStats()
      }
    }
  } catch (error: any) {
    // Only log non-404 errors (404 is expected if group doesn't exist)
    if (error.statusCode !== 404) {
      console.error('Error loading group details:', error)
    }
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

const updateHelpStats = () => {
  helpNeeded.value = students.value.filter(student => student.needsHelp).length
}

const resolveHelp = async (studentId: string) => {
  try {
    await $fetch('/api/help/status', {
      method: 'POST',
      body: {
        groupId,
        memberId: studentId,
        needsHelp: false
      }
    })
    
    const student = students.value.find(student => student.id === studentId)
    if (student) {
      student.needsHelp = false
      student.helpRequestedAt = null
    }
    updateHelpStats()
  } catch (error) {
    console.error('Error resolving help:', error)
  }
}

const formatHelpDuration = (dateString?: string | null) => {
  if (!dateString) return ''
  
  // Normalize the date string - if it doesn't have timezone, assume UTC
  let normalizedDateString = dateString
  if (typeof normalizedDateString === 'string' && 
      !normalizedDateString.endsWith('Z') && 
      !normalizedDateString.includes('+') && 
      !normalizedDateString.includes('-', 10)) { // Check if timezone offset exists (after date part)
    normalizedDateString = normalizedDateString + 'Z'
  }
  
  const diffMs = Date.now() - new Date(normalizedDateString).getTime()
  if (diffMs < 60000) {
    return 'méně než 1 min'
  }
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes
    ? `${hours} h ${remainingMinutes} min`
    : `${hours} h`
}

// Reactive timestamp that updates every second to trigger online status recalculation
const currentTime = ref(Date.now())
let timeUpdateInterval: ReturnType<typeof setInterval> | null = null

// Computed function that Vue will track reactively
const isStudentOnline = (student: Student) => {
  // Access currentTime to make this reactive
  const _ = currentTime.value // Force dependency on currentTime
  
  if (!student.lastActiveAt) {
    return false
  }
  
  try {
    // Parse the date - handle both ISO strings with and without timezone
    let lastActive: number
    const dateStr = student.lastActiveAt
    
    // If the string doesn't end with Z or timezone, assume it's UTC
    if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
      // Add Z to make it UTC if it's not already there
      lastActive = new Date(dateStr + 'Z').getTime()
    } else {
      lastActive = new Date(dateStr).getTime()
    }
    
    const now = Date.now()
    const diff = now - lastActive
    
    // Check if the date is valid
    if (isNaN(lastActive)) {
      console.warn(`Invalid lastActiveAt for ${student.nickname}:`, dateStr)
      return false
    }
    
    // Log for debugging (only occasionally to avoid spam)
    if (Math.random() < 0.05) { // 5% chance to log
      console.log(`isStudentOnline check for ${student.nickname}:`, {
        lastActiveAt: dateStr,
        lastActiveTimestamp: lastActive,
        now,
        diff,
        diffSeconds: Math.round(diff / 1000),
        threshold: ONLINE_THRESHOLD_MS,
        isOnline: diff < ONLINE_THRESHOLD_MS
      })
    }
    
    return diff < ONLINE_THRESHOLD_MS
  } catch (error) {
    console.error('Error parsing lastActiveAt:', student.lastActiveAt, error)
    return false
  }
}

const getActivityLabel = (student: Student) => {
  const online = isStudentOnline(student)
  const isCompleted = (student.progressPercentage ?? 0) >= 100
  
  if (isCompleted && online) {
    return 'Hotovo • Online'
  }
  if (online) {
    return student.needsHelp ? 'Online • čeká na pomoc' : 'Online • pracuje'
  }
  if (isCompleted) {
    return 'Hotovo • Offline'
  }
  return 'Offline'
}

const getActivityBadgeClass = (student: Student) => {
  const online = isStudentOnline(student)
  const isCompleted = (student.progressPercentage ?? 0) >= 100
  
  if (isCompleted && online) {
    return 'bg-emerald-100 text-emerald-800'
  }
  if (isCompleted) {
    return 'bg-emerald-50 text-emerald-700'
  }
  if (online) {
    return student.needsHelp ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
  }
  return 'bg-gray-200 text-gray-700'
}

const toggleStudentDetail = (studentId: string) => {
  if (expandedStudents.value.has(studentId)) {
    expandedStudents.value.delete(studentId)
  } else {
    expandedStudents.value.add(studentId)
  }
  // Force reactivity
  expandedStudents.value = new Set(expandedStudents.value)
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

const scheduleRefresh = () => {
  if (refreshTimer) return
  refreshTimer = setTimeout(async () => {
    await loadGroupDetails()
    refreshTimer = null
  }, 800)
}

const subscribeToRealtime = () => {
  if (!supabase) return
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
  
  // Set status to connecting when starting subscription
  realtimeStatus.value = 'connecting'

  realtimeChannel = supabase
    .channel(`teacher-monitor-${groupId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'group_members',
      filter: `group_id=eq.${groupId}`
    }, payload => {
      console.log('Realtime UPDATE event for group_members:', payload)
      lastRealtimeEvent.value = Date.now() // Track when we last received a realtime event
      // Update status to connected if we receive events
      if (realtimeStatus.value !== 'connected') {
        realtimeStatus.value = 'connected'
      }
      const updated = payload.new as any
      if (!updated?.id) return
      const studentIndex = students.value.findIndex(student => student.id === updated.id)
      if (studentIndex !== -1) {
        const student = students.value[studentIndex]
        // Update all fields reactively - use Object.assign to ensure Vue reactivity
        if (updated.needs_help !== undefined) {
          student.needsHelp = updated.needs_help
        }
        if (updated.help_requested_at !== undefined) {
          student.helpRequestedAt = updated.help_requested_at
        }
        if (updated.last_active_at !== undefined) {
          // Ensure the date is properly formatted
          let lastActiveAtValue = updated.last_active_at
          
          // If the string doesn't have timezone info, assume it's UTC and add Z
          if (typeof lastActiveAtValue === 'string' && 
              !lastActiveAtValue.endsWith('Z') && 
              !lastActiveAtValue.includes('+') && 
              !lastActiveAtValue.match(/[+-]\d{2}:\d{2}$/)) {
            // Add Z to make it UTC
            lastActiveAtValue = lastActiveAtValue + 'Z'
          }
          
          // Force reactivity by creating new object reference
          students.value[studentIndex] = {
            ...student,
            lastActiveAt: lastActiveAtValue
          }
          
          const updatedStudent = students.value[studentIndex]
          const isOnline = isStudentOnline(updatedStudent)
          const now = Date.now()
          const lastActive = new Date(lastActiveAtValue).getTime()
          const diff = now - lastActive
          
          console.log(`Updated lastActiveAt for student ${student.nickname}:`, {
            originalValue: updated.last_active_at,
            normalizedValue: lastActiveAtValue,
            lastActiveTimestamp: lastActive,
            now,
            diffMs: diff,
            diffSeconds: Math.round(diff / 1000),
            thresholdMs: ONLINE_THRESHOLD_MS,
            isOnline
          })
        }
        if (updated.last_message_content !== undefined) {
          student.lastMessageContent = updated.last_message_content
        }
        if (updated.last_message_is_relevant !== undefined) {
          student.lastMessageIsRelevant = updated.last_message_is_relevant
        }
        if (updated.last_message_goal_index !== undefined) {
          student.lastMessageGoalIndex = updated.last_message_goal_index
        }
        if (updated.last_message_progress !== undefined) {
          student.lastMessageProgress = updated.last_message_progress
        }
        if (updated.last_message_reason !== undefined) {
          student.lastMessageReason = updated.last_message_reason
        }
        if (updated.last_message_at !== undefined) {
          student.lastMessageAt = updated.last_message_at
        }
        updateHelpStats()
      } else {
        scheduleRefresh()
      }
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'student_progress',
      filter: `group_id=eq.${groupId}`
    }, () => {
      scheduleRefresh()
    })
    .subscribe((status) => {
      console.log('Realtime subscription status:', status)
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to realtime updates')
        realtimeStatus.value = 'connected'
        lastRealtimeEvent.value = Date.now()
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Realtime channel error - will use fallback refresh')
        realtimeStatus.value = 'disconnected'
      } else if (status === 'TIMED_OUT') {
        console.warn('Realtime subscription timed out - will use fallback refresh')
        realtimeStatus.value = 'disconnected'
      } else if (status === 'CLOSED') {
        console.warn('Realtime subscription closed - will use fallback refresh')
        realtimeStatus.value = 'disconnected'
      } else if (status === 'JOINED') {
        realtimeStatus.value = 'connecting'
      }
    })
}

onMounted(() => {
  loadGroupDetails()
  subscribeToRealtime()
  
  // Update currentTime every second to trigger reactivity for online status
  timeUpdateInterval = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
  
  // Fallback: If realtime doesn't work, refresh periodically
  // Check if we received realtime events in the last minute
  fallbackRefreshTimer = setInterval(() => {
    const now = Date.now()
    // If we haven't received a realtime event in the last 2 minutes, use fallback
    if (lastRealtimeEvent.value === null || (now - lastRealtimeEvent.value) > 2 * 60 * 1000) {
      console.log('Realtime not working, using fallback refresh')
      if (realtimeStatus.value === 'connected') {
        realtimeStatus.value = 'disconnected'
      }
      loadGroupDetails()
    }
  }, FALLBACK_REFRESH_INTERVAL_MS)
})

onUnmounted(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
    timeUpdateInterval = null
  }
  if (fallbackRefreshTimer) {
    clearInterval(fallbackRefreshTimer)
    fallbackRefreshTimer = null
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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

