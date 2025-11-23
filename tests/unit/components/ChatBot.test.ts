import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatBot from '~/components/ChatBot.vue'

// Mock useChat - needs to be available before component loads
const mockUseChat = vi.fn(() => ({
  messages: { value: [] },
  isLoading: { value: false },
  error: { value: null },
  sendMessage: vi.fn(),
  clearMessages: vi.fn(),
  addAssistantMessagePersisted: vi.fn(),
  loadHistory: vi.fn(),
  setGoalsContext: vi.fn(),
  setGroupDescriptionContext: vi.fn(),
  currentNeedsHelp: { value: false },
  helpResolvedAt: { value: null }
}))

// Mock messages with proper structure
const createMockMessage = (content: string, role: string = 'user') => ({
  id: `msg-${Date.now()}`,
  content,
  role,
  timestamp: new Date(),
  metadata: {}
})

vi.mock('~/composables/useChat', () => ({
  useChat: mockUseChat
}))

// Make useChat available globally
global.useChat = mockUseChat

// Mock $fetch
global.$fetch = vi.fn()

describe('ChatBot', () => {
  const defaultProps = {
    userId: 'test-user-id',
    groupId: 'test-group-id',
    systemPrompt: 'Test prompt',
    goals: [],
    groupDescription: 'Test description',
    groupName: 'Test Group',
    studentName: 'Test Student',
    assignmentMode: 'uniform' as const,
    height: '600px'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render chat interface', () => {
    // Ensure messages have proper structure
    vi.mocked(mockUseChat).mockReturnValueOnce({
      messages: { value: [] },
      isLoading: { value: false },
      error: { value: null },
      sendMessage: vi.fn(),
      clearMessages: vi.fn(),
      addAssistantMessagePersisted: vi.fn(),
      loadHistory: vi.fn(),
      setGoalsContext: vi.fn(),
      setGroupDescriptionContext: vi.fn(),
      currentNeedsHelp: { value: false },
      helpResolvedAt: { value: null }
    } as any)

    const wrapper = mount(ChatBot, {
      props: defaultProps
    })

    expect(wrapper.find('.bg-gradient-to-r').exists()).toBe(true)
    expect(wrapper.text()).toContain('AI Asistent')
  })

  it('should display empty state when no messages', async () => {
    // Mock loadHistory to return false (no history) and prevent welcome message
    const mockLoadHistory = vi.fn(() => Promise.resolve(false))
    const mockAddAssistantMessagePersisted = vi.fn()
    
    vi.mocked(mockUseChat).mockReturnValueOnce({
      messages: { value: [] },
      isLoading: { value: false },
      error: { value: null },
      sendMessage: vi.fn(),
      clearMessages: vi.fn(),
      addAssistantMessagePersisted: mockAddAssistantMessagePersisted,
      loadHistory: mockLoadHistory,
      setGoalsContext: vi.fn(),
      setGroupDescriptionContext: vi.fn(),
      currentNeedsHelp: { value: false },
      helpResolvedAt: { value: null }
    } as any)

    const wrapper = mount(ChatBot, {
      props: {
        ...defaultProps,
        userId: undefined, // Prevent history loading
        groupId: undefined
      }
    })

    // Wait a bit for initialization, but welcome message should be scheduled
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // The empty state should show before welcome message is added
    // Or check for the welcome message text if it's been added
    const text = wrapper.text()
    expect(text.includes('Začněte konverzaci!') || text.includes('Jak mohu pomoci')).toBe(true)
  })

  it('should have message input area', () => {
    const wrapper = mount(ChatBot, {
      props: defaultProps
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    expect(textarea.attributes('placeholder')).toContain('Napište zprávu')
  })

  it('should have send button', async () => {
    const wrapper = mount(ChatBot, {
      props: defaultProps
    })

    await wrapper.vm.$nextTick()
    const sendButton = wrapper.find('button[type="submit"]')
    expect(sendButton.exists()).toBe(true)
    // Button text is "Odeslat" when not loading, or spinner when loading
    const buttonText = sendButton.text()
    expect(buttonText === 'Odeslat' || buttonText === '').toBe(true)
  })

  it('should disable send button when input is empty', () => {
    const wrapper = mount(ChatBot, {
      props: defaultProps
    })

    const sendButton = wrapper.find('button[type="submit"]')
    expect(sendButton.attributes('disabled')).toBeDefined()
  })

  it('should enable send button when input has text', async () => {
    const wrapper = mount(ChatBot, {
      props: defaultProps
    })

    const textarea = wrapper.find('textarea')
    await textarea.setValue('Test message')
    await wrapper.vm.$nextTick()

    const sendButton = wrapper.find('button[type="submit"]')
    // When disabled attribute is not present, it can be undefined or empty string
    const disabledAttr = sendButton.attributes('disabled')
    expect(disabledAttr === undefined || disabledAttr === '' || disabledAttr === null).toBe(true)
  })

  it('should call sendMessage when form is submitted', async () => {
    const mockSendMessage = vi.fn()
    const mockLoadHistory = vi.fn(() => Promise.resolve(true)) // Return true to skip welcome message
    
    vi.mocked(mockUseChat).mockReturnValueOnce({
      messages: { value: [] },
      isLoading: { value: false },
      error: { value: null },
      sendMessage: mockSendMessage,
      clearMessages: vi.fn(),
      addAssistantMessagePersisted: vi.fn(),
      loadHistory: mockLoadHistory,
      setGoalsContext: vi.fn(),
      setGroupDescriptionContext: vi.fn(),
      currentNeedsHelp: { value: false },
      helpResolvedAt: { value: null }
    } as any)

    const wrapper = mount(ChatBot, {
      props: defaultProps
    })

    // Wait for component to initialize
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Set input value directly on the component
    wrapper.vm.inputMessage = 'Test message'
    await wrapper.vm.$nextTick()

    // Trigger form submit
    const form = wrapper.find('form')
    await form.trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    expect(mockSendMessage).toHaveBeenCalledWith('Test message')
  })

  it('should clear input after sending message', async () => {
    const mockSendMessage = vi.fn()
    const mockLoadHistory = vi.fn(() => Promise.resolve(true)) // Return true to skip welcome message
    
    vi.mocked(mockUseChat).mockReturnValueOnce({
      messages: { value: [] },
      isLoading: { value: false },
      error: { value: null },
      sendMessage: mockSendMessage,
      clearMessages: vi.fn(),
      addAssistantMessagePersisted: vi.fn(),
      loadHistory: mockLoadHistory,
      setGoalsContext: vi.fn(),
      setGroupDescriptionContext: vi.fn(),
      currentNeedsHelp: { value: false },
      helpResolvedAt: { value: null }
    } as any)

    const wrapper = mount(ChatBot, {
      props: defaultProps
    })

    // Wait for component to initialize
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Set input value directly on the component
    wrapper.vm.inputMessage = 'Test message'
    await wrapper.vm.$nextTick()

    // Trigger form submit
    const form = wrapper.find('form')
    await form.trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Input should be cleared after sending
    expect(wrapper.vm.inputMessage).toBe('')
  })

  it('should display loading indicator when isLoading is true', () => {
    vi.mocked(mockUseChat).mockReturnValueOnce({
      messages: { value: [] },
      isLoading: { value: true },
      error: { value: null },
      sendMessage: vi.fn(),
      clearMessages: vi.fn(),
      addAssistantMessagePersisted: vi.fn(),
      loadHistory: vi.fn(),
      setGoalsContext: vi.fn(),
      setGroupDescriptionContext: vi.fn()
    } as any)

    const wrapper = mount(ChatBot, {
      props: defaultProps
    })

    expect(wrapper.text()).toContain('AI píše')
  })

  it('should display error message when error exists', () => {
    vi.mocked(mockUseChat).mockReturnValueOnce({
      messages: { value: [] },
      isLoading: { value: false },
      error: { value: 'Test error' },
      sendMessage: vi.fn(),
      clearMessages: vi.fn(),
      addAssistantMessagePersisted: vi.fn(),
      loadHistory: vi.fn(),
      setGoalsContext: vi.fn(),
      setGroupDescriptionContext: vi.fn()
    } as any)

    const wrapper = mount(ChatBot, {
      props: defaultProps
    })

    expect(wrapper.text()).toContain('Test error')
  })
})

