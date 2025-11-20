<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        @click.self="close"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const isOpen = useState('modal-open', () => false)

const open = () => {
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
}

// Expose methods for parent components
defineExpose({
  open,
  close
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

