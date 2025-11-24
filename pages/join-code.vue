<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Vstup do skupiny</h2>
          <p class="text-gray-600">
            Zadejte kód skupiny nebo naskenujte QR kód od učitele
          </p>
        </div>

        <form @submit.prevent="handleJoin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Kód skupiny
            </label>
            <input
              v-model="groupCode"
              type="text"
              placeholder="např. abc123-def456-ghi789"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
              required
              autofocus
              autocomplete="off"
              @input="groupCode = groupCode.trim()"
            />
            <p class="text-xs text-gray-500 mt-1">
              Zadejte kód skupiny, který vám poskytl učitel, nebo naskenujte QR kód
            </p>
          </div>

          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="isLoading || !groupCode.trim()"
            class="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Načítání...' : 'Vstoupit do skupiny' }}
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-gray-200">
          <p class="text-sm text-gray-600 text-center">
            Nemáte kód skupiny? Požádejte svého učitele o QR kód nebo kód skupiny.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const router = useRouter()
const groupCode = ref('')
const isLoading = ref(false)
const error = ref('')

const handleJoin = async () => {
  if (!groupCode.value.trim()) return
  
  error.value = ''
  isLoading.value = true
  
  try {
    // Extract group ID from the code (could be full URL or just the ID)
    let groupId = groupCode.value.trim()
    
    // If it's a full URL, extract the ID
    if (groupId.includes('/join/')) {
      const match = groupId.match(/\/join\/([a-f0-9-]+)/i)
      if (match) {
        groupId = match[1]
      }
    }
    
    // If it's a full URL with http/https, extract the ID
    if (groupId.includes('http')) {
      const match = groupId.match(/\/join\/([a-f0-9-]+)/i)
      if (match) {
        groupId = match[1]
      }
    }
    
    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(groupId)) {
      error.value = 'Neplatný formát kódu skupiny. Zkuste to prosím znovu.'
      isLoading.value = false
      return
    }
    
    // Redirect to the join page with the group ID
    await router.push(`/join/${groupId}`)
  } catch (e: any) {
    console.error('Error joining group:', e)
    error.value = 'Nepodařilo se zpracovat kód skupiny. Zkuste to prosím znovu.'
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Additional styles if needed */
</style>

