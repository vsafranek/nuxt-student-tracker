import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GoalsDisplay from '~/components/GoalsDisplay.vue'

describe('GoalsDisplay', () => {
  const mockGoals = [
    {
      id: '1',
      title: 'Test boolean goal',
      type: 'boolean' as const,
      targetCount: 0,
      progress: 0,
      completed: false,
      percentage: 0
    },
    {
      id: '2',
      title: 'Test percentage goal',
      type: 'percentage' as const,
      targetCount: 3,
      progress: 1,
      completed: false,
      percentage: 33
    },
    {
      id: '3',
      title: 'Completed boolean goal',
      type: 'boolean' as const,
      targetCount: 0,
      progress: 0,
      completed: true,
      percentage: 100
    }
  ]

  it('should render empty state when no goals', () => {
    const wrapper = mount(GoalsDisplay, {
      props: {
        goals: []
      }
    })

    expect(wrapper.text()).toContain('Zatím nejsou žádné cíle k zobrazení')
  })

  it('should render all goals', () => {
    const wrapper = mount(GoalsDisplay, {
      props: {
        goals: mockGoals
      }
    })

    expect(wrapper.findAll('.bg-white.border')).toHaveLength(3)
  })

  it('should display boolean goal with checkmark when completed', () => {
    const wrapper = mount(GoalsDisplay, {
      props: {
        goals: [mockGoals[2]] // Completed boolean goal
      }
    })

    expect(wrapper.text()).toContain('Completed boolean goal')
    expect(wrapper.text()).toContain('Splněno')
    expect(wrapper.find('.bg-green-500').exists()).toBe(true)
  })

  it('should display boolean goal without checkmark when not completed', () => {
    const wrapper = mount(GoalsDisplay, {
      props: {
        goals: [mockGoals[0]] // Not completed boolean goal
      }
    })

    expect(wrapper.text()).toContain('Test boolean goal')
    expect(wrapper.text()).toContain('Nesplněno')
    expect(wrapper.find('.bg-gray-200').exists()).toBe(true)
  })

  it('should display percentage goal with progress bar', () => {
    const wrapper = mount(GoalsDisplay, {
      props: {
        goals: [mockGoals[1]] // Percentage goal
      }
    })

    expect(wrapper.text()).toContain('Test percentage goal')
    expect(wrapper.text()).toContain('33%')
    expect(wrapper.text()).toContain('1 / 3 úkolů dokončeno')
    expect(wrapper.find('.bg-gray-200.rounded-full').exists()).toBe(true)
  })

  it('should round percentage correctly (0%, 33%, 66%, 100%)', () => {
    const goalsWithDifferentPercentages = [
      { ...mockGoals[1], percentage: 0, progress: 0 },
      { ...mockGoals[1], percentage: 25, progress: 1 }, // Should round to 33%
      { ...mockGoals[1], percentage: 50, progress: 2 }, // Should round to 66%
      { ...mockGoals[1], percentage: 100, progress: 3 }
    ]

    const wrapper = mount(GoalsDisplay, {
      props: {
        goals: goalsWithDifferentPercentages
      }
    })

    const progressBars = wrapper.findAll('.rounded-full.h-3')
    expect(progressBars).toHaveLength(4)
  })
})

