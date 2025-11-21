<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ group?.name || 'Skupina' }}</h1>
            <p v-if="group?.description" class="text-gray-600 mt-1">{{ group.description }}</p>
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

      <!-- Content -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="text-center py-12">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Vítejte ve skupině!</h2>
          <p class="text-gray-600">
            Zde uvidíte své úkoly a pokrok. Funkce jsou ve vývoji.
          </p>
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

const group = ref<Group | null>(null)
const studentInfo = ref<StudentInfo | null>(null)

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

const goHome = () => {
  router.push('/')
}

onMounted(() => {
  loadStudentInfo()
  loadGroup()
})
</script>

