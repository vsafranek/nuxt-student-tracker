<template>
    <Teleport to="body">
      <div class="fixed top-4 right-4 z-50 space-y-2">
        <TransitionGroup name="toast">
          <div
            v-for="toast in toasts"
            :key="toast.id"
            :class="[
              'px-6 py-4 rounded-lg shadow-lg max-w-md',
              'flex items-center gap-3',
              toast.type === 'success' && 'bg-green-500 text-white',
              toast.type === 'error' && 'bg-red-500 text-white',
              toast.type === 'warning' && 'bg-yellow-500 text-white',
              toast.type === 'info' && 'bg-blue-500 text-white'
            ]"
          >
            <div class="flex-1">{{ toast.message }}</div>
            <button @click="removeToast(toast.id)" class="text-white opacity-75 hover:opacity-100">
              ✕
            </button>
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </template>
  
  <script setup lang="ts">
  import { useToast } from '~/composables/useToast'
  
  const { toasts, removeToast } = useToast()
  </script>
  
  <style scoped>
  .toast-enter-active,
  .toast-leave-active {
    transition: all 0.3s ease;
  }
  
  .toast-enter-from {
    opacity: 0;
    transform: translateX(100%);
  }
  
  .toast-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }
  </style>
  