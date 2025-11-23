import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToast } from '~/composables/useToast'

describe('useToast', () => {
  beforeEach(() => {
    // Reset state before each test
    const { toasts, removeToast } = useToast()
    toasts.value.forEach(toast => removeToast(toast.id))
  })

  it('should initialize with empty toasts array', () => {
    const { toasts } = useToast()
    expect(toasts.value).toEqual([])
  })

  it('should add a toast message', () => {
    const { toasts, showToast } = useToast()
    
    showToast({
      message: 'Test message',
      type: 'success'
    })

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Test message')
    expect(toasts.value[0].type).toBe('success')
    expect(toasts.value[0].id).toBeDefined()
  })

  it('should remove a toast by id', () => {
    const { toasts, showToast, removeToast } = useToast()
    
    showToast({ message: 'Test 1', type: 'info' })
    showToast({ message: 'Test 2', type: 'error' })
    
    expect(toasts.value).toHaveLength(2)
    
    const firstId = toasts.value[0].id
    removeToast(firstId)
    
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Test 2')
  })

  it('should auto-remove toast after timeout', async () => {
    vi.useFakeTimers()
    const { toasts, showToast } = useToast()
    
    showToast({
      message: 'Auto remove',
      type: 'success',
      duration: 1000
    })

    expect(toasts.value).toHaveLength(1)
    
    vi.advanceTimersByTime(1000)
    await vi.runAllTimersAsync()
    
    expect(toasts.value).toHaveLength(0)
    vi.useRealTimers()
  })

  it('should support different toast types', () => {
    const { toasts, showToast } = useToast()
    
    showToast({ message: 'Success', type: 'success' })
    showToast({ message: 'Error', type: 'error' })
    showToast({ message: 'Warning', type: 'warning' })
    showToast({ message: 'Info', type: 'info' })

    expect(toasts.value).toHaveLength(4)
    expect(toasts.value.map(t => t.type)).toEqual(['success', 'error', 'warning', 'info'])
  })
})

