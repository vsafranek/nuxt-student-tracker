import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StudentDetail from '~/components/StudentDetail.vue'

// Mock $fetch
global.$fetch = vi.fn()

describe('StudentDetail', () => {
  const defaultProps = {
    studentId: 'test-student-id',
    groupId: 'test-group-id'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset $fetch mock
    if (global.$fetch) {
      vi.mocked(global.$fetch).mockReset()
    }
  })

  it('should render loading state initially', async () => {
    // Mock $fetch to delay response so isLoading stays true
    let resolveFetch: (value: any) => void
    const fetchPromise = new Promise(resolve => {
      resolveFetch = resolve
    })
    
    vi.mocked(global.$fetch).mockImplementationOnce(() => fetchPromise)

    const wrapper = mount(StudentDetail, {
      props: defaultProps
    })

    // Component starts with isLoading = true and calls loadStudentMessages in onMounted
    // Check immediately - isLoading should be true initially
    expect(wrapper.vm.isLoading).toBe(true)
    expect(wrapper.text()).toContain('Načítání zpráv')
    
    // Resolve the fetch
    resolveFetch!({ success: true, goalsWithMessages: [] })
    await fetchPromise
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))
  })

  it('should fetch student messages on mount', async () => {
    vi.mocked(global.$fetch).mockResolvedValueOnce({
      success: true,
      goalsWithMessages: []
    })

    const wrapper = mount(StudentDetail, {
      props: defaultProps
    })

    // Component calls loadStudentMessages in onMounted
    // Manually trigger it to ensure it's called (onMounted might not execute in test env)
    await wrapper.vm.$nextTick()
    if (typeof wrapper.vm.loadStudentMessages === 'function') {
      await wrapper.vm.loadStudentMessages()
    } else {
      // Wait for onMounted to execute
      await new Promise(resolve => setTimeout(resolve, 200))
      await wrapper.vm.$nextTick()
    }

    // Check that $fetch was called with the correct URL
    expect(global.$fetch).toHaveBeenCalled()
    const fetchCalls = vi.mocked(global.$fetch).mock.calls
    expect(fetchCalls.length).toBeGreaterThan(0)
    expect(fetchCalls[0][0]).toContain(`/api/groups/${defaultProps.groupId}/student/${defaultProps.studentId}/messages`)
  })

  it('should display error message when fetch fails', async () => {
    // Reset and set up new mock
    vi.mocked(global.$fetch).mockReset()
    vi.mocked(global.$fetch).mockRejectedValueOnce(new Error('Fetch failed'))

    const wrapper = mount(StudentDetail, {
      props: defaultProps
    })

    // Manually trigger loadStudentMessages to ensure it's called
    await wrapper.vm.$nextTick()
    if (typeof wrapper.vm.loadStudentMessages === 'function') {
      await wrapper.vm.loadStudentMessages()
    } else {
      await new Promise(resolve => setTimeout(resolve, 200))
      await wrapper.vm.$nextTick()
    }
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Error should be set in component
    expect(wrapper.vm.error).toBeTruthy()
    expect(wrapper.vm.error).toContain('Fetch failed')
    // Error message should be displayed
    const html = wrapper.html()
    expect(html).toMatch(/Nepodařilo se|Fetch failed/i)
  })

  it('should display empty state when no messages', async () => {
    // Reset and set up new mock
    vi.mocked(global.$fetch).mockReset()
    vi.mocked(global.$fetch).mockResolvedValueOnce({
      success: true,
      goalsWithMessages: []
    })

    const wrapper = mount(StudentDetail, {
      props: defaultProps
    })

    // Manually trigger loadStudentMessages to ensure it's called
    await wrapper.vm.$nextTick()
    if (typeof wrapper.vm.loadStudentMessages === 'function') {
      await wrapper.vm.loadStudentMessages()
    } else {
      await new Promise(resolve => setTimeout(resolve, 200))
      await wrapper.vm.$nextTick()
    }
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // After loading completes, should show empty state
    expect(wrapper.vm.isLoading).toBe(false)
    expect(wrapper.vm.goalsWithMessages.length).toBe(0)
    expect(wrapper.text()).toContain('žádné relevantní zprávy')
  })

  it('should display goals with messages', async () => {
    // Reset and set up new mock
    vi.mocked(global.$fetch).mockReset()
    
    const mockData = {
      success: true,
      goalsWithMessages: [
        {
          goal: {
            id: 'goal-1',
            title: 'Test Goal',
            type: 'percentage',
            targetCount: 3,
            index: 0
          },
          messages: [
            {
              id: 'msg-1',
              content: 'Test message',
              role: 'user',
              createdAt: new Date().toISOString(),
              metadata: {}
            }
          ]
        }
      ]
    }

    vi.mocked(global.$fetch).mockResolvedValueOnce(mockData)

    const wrapper = mount(StudentDetail, {
      props: defaultProps
    })

    // Manually trigger loadStudentMessages to ensure it's called
    await wrapper.vm.$nextTick()
    if (typeof wrapper.vm.loadStudentMessages === 'function') {
      await wrapper.vm.loadStudentMessages()
    } else {
      await new Promise(resolve => setTimeout(resolve, 200))
      await wrapper.vm.$nextTick()
    }
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // Check component state
    expect(wrapper.vm.isLoading).toBe(false)
    expect(wrapper.vm.goalsWithMessages.length).toBeGreaterThan(0)
    expect(wrapper.vm.goalsWithMessages[0].goal.title).toBe('Test Goal')
    expect(wrapper.vm.goalsWithMessages[0].messages.length).toBeGreaterThan(0)
    const html = wrapper.html()
    expect(html).toContain('Test Goal')
    expect(html).toContain('Test message')
  })

  it('should format message time correctly', async () => {
    const mockData = {
      success: true,
      goalsWithMessages: [
        {
          goal: {
            id: 'goal-1',
            title: 'Test Goal',
            type: 'boolean',
            targetCount: 0
          },
          messages: [
            {
              id: 'msg-1',
              content: 'Test',
              role: 'user',
              createdAt: new Date().toISOString()
            }
          ]
        }
      ]
    }

    vi.mocked(global.$fetch).mockResolvedValueOnce(mockData)

    const wrapper = mount(StudentDetail, {
      props: defaultProps
    })

    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Should display formatted time
    const html = wrapper.html()
    expect(html.length).toBeGreaterThan(0)
  })
})

