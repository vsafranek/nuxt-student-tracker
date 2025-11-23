<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="handleClose"
      >
        <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 class="text-2xl font-bold text-gray-900">Nastavení aplikace</h2>
            <button
              @click="handleClose"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="p-6 space-y-6">
            <!-- Inactivity Timeout -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Čas neaktivity (minuty)
              </label>
              <p class="text-xs text-gray-500 mb-3">
                Jak dlouho má chatbot čekat, než upozorní studenta na neaktivitu
              </p>
              <div class="flex items-center gap-4">
                <input
                  v-model.number="localSettings.inactivityTimeoutMinutes"
                  type="number"
                  min="1"
                  max="60"
                  class="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span class="text-sm text-gray-600">minut</span>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                Rozsah: 1-60 minut (aktuálně: {{ localSettings.inactivityTimeoutMinutes }} minut)
              </p>
            </div>

            <!-- Allow Direct Answers -->
            <div>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="localSettings.allowDirectAnswers"
                  type="checkbox"
                  class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span class="block text-sm font-medium text-gray-700">
                    Povolit chatbotu prozradit správnou odpověď
                  </span>
                  <p class="text-xs text-gray-500 mt-1">
                    Pokud je povoleno, chatbot může na vyžádání studenta prozradit správnou odpověď. 
                    Pokud je zakázáno, chatbot pouze navádí studenta k řešení.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              @click="handleClose"
              class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Zrušit
            </button>
            <button
              @click="handleSave"
              :disabled="isSaving"
              class="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isSaving">Ukládání...</span>
              <span v-else>Uložit změny</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  settings: {
    inactivityTimeoutMinutes: number
    allowDirectAnswers: boolean
  }
}

interface Emits {
  (e: 'close'): void
  (e: 'saved', settings: { inactivityTimeoutMinutes: number; allowDirectAnswers: boolean }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localSettings = ref({
  inactivityTimeoutMinutes: props.settings.inactivityTimeoutMinutes,
  allowDirectAnswers: props.settings.allowDirectAnswers
})

const isSaving = ref(false)

// Update local settings when props change
watch(() => props.settings, (newSettings) => {
  localSettings.value = {
    inactivityTimeoutMinutes: newSettings.inactivityTimeoutMinutes,
    allowDirectAnswers: newSettings.allowDirectAnswers
  }
}, { deep: true })

const handleClose = () => {
  // Reset to original values
  localSettings.value = {
    inactivityTimeoutMinutes: props.settings.inactivityTimeoutMinutes,
    allowDirectAnswers: props.settings.allowDirectAnswers
  }
  emit('close')
}

const handleSave = async () => {
  isSaving.value = true
  
  try {
    const response = await $fetch<{ success: boolean; settings: any }>('/api/settings/update', {
      method: 'POST',
      body: {
        inactivityTimeoutMinutes: localSettings.value.inactivityTimeoutMinutes,
        allowDirectAnswers: localSettings.value.allowDirectAnswers
      }
    })
    
    if (response.success) {
      emit('saved', response.settings)
      emit('close')
    }
  } catch (error: any) {
    console.error('Error saving settings:', error)
    alert('Nepodařilo se uložit nastavení: ' + (error.message || 'Neznámá chyba'))
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

