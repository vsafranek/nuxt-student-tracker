interface Toast {
    id: number
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    duration?: number
  }
  
  const toasts = ref<Toast[]>([])
  let toastId = 0
  
  export const useToast = () => {
    const showToast = (options: Omit<Toast, 'id'>) => {
      const id = toastId++
      const toast: Toast = {
        id,
        message: options.message,
        type: options.type,
        duration: options.duration ?? 5000
      }
      
      toasts.value.push(toast)
      
      if (toast.duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, toast.duration)
      }
    }
    
    const removeToast = (id: number) => {
      const index = toasts.value.findIndex(t => t.id === id)
      if (index > -1) {
        toasts.value.splice(index, 1)
      }
    }
    
    return {
      toasts: readonly(toasts),
      showToast,
      removeToast
    }
  }
  