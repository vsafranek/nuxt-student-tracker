<template>
  <div class="space-y-4">
    <div v-if="goals.length === 0" class="text-center py-8 text-gray-500">
      <p>Zatím nejsou žádné cíle k zobrazení.</p>
    </div>
    
    <div
      v-for="goal in goals"
      :key="goal.id"
      class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <h3 class="font-semibold text-gray-900 mb-2">{{ goal.title }}</h3>
          
          <!-- Boolean type goal (splněno/nesplněno) -->
          <div v-if="goal.type === 'boolean'" class="flex items-center gap-2">
            <div
              :class="[
                'w-6 h-6 rounded-full flex items-center justify-center',
                goal.completed
                  ? 'bg-green-500'
                  : 'bg-gray-200 border-2 border-gray-300'
              ]"
            >
              <svg
                v-if="goal.completed"
                class="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span
              :class="[
                'text-sm font-medium',
                goal.completed ? 'text-green-700' : 'text-gray-600'
              ]"
            >
              {{ goal.completed ? 'Splněno' : 'Nesplněno' }}
            </span>
          </div>
          
          <!-- Percentage type goal (splněno %) -->
          <div v-else-if="goal.type === 'percentage'" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Průběh</span>
              <span class="text-sm font-semibold text-gray-900">
                {{ getRoundedPercentage(goal) }}%
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                :class="[
                  'h-full rounded-full transition-all duration-300',
                  getRoundedPercentage(goal) === 100
                    ? 'bg-green-500'
                    : getRoundedPercentage(goal) === 66
                    ? 'bg-blue-500'
                    : getRoundedPercentage(goal) === 33
                    ? 'bg-yellow-500'
                    : 'bg-gray-300'
                ]"
                :style="{ width: `${getRoundedPercentage(goal)}%` }"
              ></div>
            </div>
            <div class="text-xs text-gray-500">
              {{ goal.progress }} / {{ goal.targetCount }} úkolů dokončeno
            </div>
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
  type: 'boolean' | 'percentage'
  targetCount: number
  progress: number
  completed: boolean
  percentage: number
}

interface Props {
  goals: Goal[]
}

defineProps<Props>()

// Get rounded percentage for a specific goal (0%, 33%, 66%, 100%)
const getRoundedPercentage = (goal: Goal): number => {
  if (goal.type !== 'percentage') return goal.percentage
  
  const pct = goal.percentage
  if (pct === 0) return 0
  if (pct === 100) return 100
  if (pct >= 66) return 66
  if (pct >= 33) return 33
  return 0
}
</script>
