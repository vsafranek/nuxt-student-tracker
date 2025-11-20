<template>
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 class="text-xl font-bold text-gray-900">StudentTracker</h1>
                <p class="text-sm text-gray-500">Dashboard učitele</p>
              </div>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900">{{ user?.user_metadata?.full_name || user?.email }}</p>
                <p class="text-xs text-gray-500">Učitel</p>
              </div>
              <button
                @click="handleSignOut"
                class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Odhlásit se
              </button>
            </div>
          </div>
        </div>
      </header>
  
      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Celkem skupin</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ groups.length }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
  
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Aktivní studenti</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ totalActiveStudents }}</p>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
  
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Potřebují pomoc</p>
                <p class="text-3xl font-bold text-red-600 mt-2">{{ studentsNeedingHelp }}</p>
              </div>
              <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Actions Bar -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Moje skupiny</h2>
          <button
            @click="showCreateGroupModal = true"
            class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Vytvořit skupinu
          </button>
        </div>
  
        <!-- Groups Grid -->
        <div v-if="groups.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="group in groups"
            :key="group.id"
            class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            @click="goToGroup(group.id)"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ group.name }}</h3>
                <p class="text-sm text-gray-600">{{ group.description }}</p>
              </div>
              <span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Aktivní
              </span>
            </div>
  
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Studenti:</span>
                <span class="font-medium text-gray-900">{{ group.studentCount || 0 }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Průměrný pokrok:</span>
                <span class="font-medium text-gray-900">{{ group.averageProgress || 0 }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                  :style="{ width: (group.averageProgress || 0) + '%' }"
                ></div>
              </div>
            </div>
  
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span class="text-xs text-gray-500">
                Vytvořeno {{ formatDate(group.createdAt) }}
              </span>
              <button
                @click.stop="showQRCode(group)"
                class="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                QR kód
              </button>
            </div>
          </div>
        </div>
  
        <!-- Empty State -->
        <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Zatím žádné skupiny</h3>
          <p class="text-gray-600 mb-4">Začněte vytvořením své první skupiny studentů</p>
          <button
            @click="showCreateGroupModal = true"
            class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Vytvořit první skupinu
          </button>
        </div>
      </main>
  
      <!-- Create Group Modal -->
      <Teleport to="body">
        <div
          v-if="showCreateGroupModal"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          @click.self="showCreateGroupModal = false"
        >
          <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-bold text-gray-900">Vytvořit novou skupinu</h3>
              <button
                @click="showCreateGroupModal = false"
                class="text-gray-400 hover:text-gray-600"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
  
            <form @submit.prevent="createGroup" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Název skupiny
                </label>
                <input
                  v-model="newGroup.name"
                  type="text"
                  placeholder="např. A2 - kvadratické rovnice 1"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
  
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Popis cíle
                </label>
                <textarea
                  v-model="newGroup.description"
                  placeholder="např. vyřeší samostatně 3 různé kvadratické rovnice typu ax² + bx + c pomocí diskriminantu"
                  rows="3"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                ></textarea>
              </div>
  
              <div v-if="createError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {{ createError }}
              </div>
  
              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  @click="showCreateGroupModal = false"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  :disabled="isCreating"
                  class="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {{ isCreating ? 'Vytváření...' : 'Vytvořit' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>
  
      <!-- QR Code Modal -->
      <Teleport to="body">
        <div
          v-if="showQRModal"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
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
                {{ selectedGroup?.name }}
              </p>
              <div class="bg-gray-50 p-6 rounded-xl mb-4">
                <div v-if="selectedGroup?.qrCode" v-html="selectedGroup.qrCode"></div>
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
      </Teleport>
    </div>
  </template>
  
  <script setup lang="ts">
  definePageMeta({
    middleware: 'auth'
  })
  
  const supabase = useSupabaseClient()
  const router = useRouter()
  const user = useSupabaseUser()
  
  // State
  const groups = ref([])
  const showCreateGroupModal = ref(false)
  const showQRModal = ref(false)
  const selectedGroup = ref(null)
  const isCreating = ref(false)
  const createError = ref('')
  
  const newGroup = ref({
    name: '',
    description: ''
  })
  
  // Computed
  const totalActiveStudents = computed(() => {
    return groups.value.reduce((sum, group) => sum + (group.studentCount || 0), 0)
  })
  
  const studentsNeedingHelp = computed(() => {
    return groups.value.reduce((sum, group) => sum + (group.helpNeeded || 0), 0)
  })
  
  // Methods
  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('teacherId', user.value?.id)
        .order('createdAt', { ascending: false })
      
      if (error) throw error
      groups.value = data || []
    } catch (error) {
      console.error('Error loading groups:', error)
    }
  }
  
  const createGroup = async () => {
    isCreating.value = true
    createError.value = ''
    
    try {
      // Vytvoření skupiny na serveru (který vygeneruje QR kód)
      const response = await $fetch('/api/groups/create', {
        method: 'POST',
        body: {
          name: newGroup.value.name,
          description: newGroup.value.description,
          teacherId: user.value?.id
        }
      })
      
      if (response.error) throw new Error(response.error)
      
      // Obnovit seznam skupin
      await loadGroups()
      
      // Reset formuláře a zavření modalu
      newGroup.value = { name: '', description: '' }
      showCreateGroupModal.value = false
    } catch (error) {
      console.error('Error creating group:', error)
      createError.value = error.message || 'Nepodařilo se vytvořit skupinu'
    } finally {
      isCreating.value = false
    }
  }
  
  const showQRCode = (group) => {
    selectedGroup.value = group
    showQRModal.value = true
  }
  
  const copyJoinLink = () => {
    const link = `${window.location.origin}/join/${selectedGroup.value.id}`
    navigator.clipboard.writeText(link)
    alert('Odkaz zkopírován do schránky!')
  }
  
  const goToGroup = (groupId) => {
    router.push(`/teacher/monitor/${groupId}`)
  }
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  
  // Load data on mount
  onMounted(() => {
    loadGroups()
  })
  </script>
  