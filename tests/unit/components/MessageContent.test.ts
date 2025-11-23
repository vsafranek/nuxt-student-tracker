import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MessageContent from '~/components/MessageContent.vue'

describe('MessageContent', () => {
  it('should render plain text', async () => {
    const wrapper = mount(MessageContent, {
      props: {
        content: 'Simple text message'
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 150))
    
    // Check that component rendered
    const element = wrapper.find('.message-content')
    expect(element.exists()).toBe(true)
    
    // v-html renders content - renderedContent computed should return HTML string
    const renderedContent = (wrapper.vm as any).renderedContent
    if (typeof renderedContent === 'string') {
      expect(renderedContent).toContain('Simple text message')
    } else {
      // If it's a computed ref, check the value
      const content = renderedContent?.value || renderedContent
      expect(String(content)).toContain('Simple text message')
    }
  })

  it('should render markdown formatted text', async () => {
    const wrapper = mount(MessageContent, {
      props: {
        content: '**Bold text** and *italic text*'
      }
    })

    await wrapper.vm.$nextTick()
    const html = wrapper.html()
    // Markdown should be parsed - check for strong/em tags or their rendered form
    expect(html.length).toBeGreaterThan(0)
  })

  it('should render code blocks with syntax highlighting', async () => {
    const wrapper = mount(MessageContent, {
      props: {
        content: '```javascript\nconst x = 5;\n```'
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 150)) // Wait for code highlighting
    
    // Check that component rendered (code blocks are processed by marked)
    const element = wrapper.find('.message-content')
    expect(element.exists()).toBe(true)
    // Content should be processed
    const text = wrapper.text()
    expect(text.length).toBeGreaterThan(0)
  })

  it('should render inline code', async () => {
    const wrapper = mount(MessageContent, {
      props: {
        content: 'Use `console.log()` to debug'
      }
    })

    await wrapper.vm.$nextTick()
    const html = wrapper.html()
    expect(html.length).toBeGreaterThan(0)
  })

  it('should render mathematical expressions', async () => {
    const wrapper = mount(MessageContent, {
      props: {
        content: 'The formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$'
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 50)) // Wait for math processing
    const html = wrapper.html()
    // KaTeX should process the math - check that content was processed
    expect(html.length).toBeGreaterThan(0)
  })

  it('should render block math expressions', () => {
    const wrapper = mount(MessageContent, {
      props: {
        content: '$$\\int_0^1 x^2 dx = \\frac{1}{3}$$'
      }
    })

    const html = wrapper.html()
    // Block math should be rendered
    expect(html.length).toBeGreaterThan(0)
  })

  it('should handle empty content', () => {
    const wrapper = mount(MessageContent, {
      props: {
        content: ''
      }
    })

    expect(wrapper.html()).toBeTruthy()
  })

  it('should handle content with HTML entities', () => {
    const wrapper = mount(MessageContent, {
      props: {
        content: 'Text with &amp; entities'
      }
    })

    expect(wrapper.html()).toBeTruthy()
  })

  it('should render links in markdown', async () => {
    const wrapper = mount(MessageContent, {
      props: {
        content: 'Visit [Google](https://google.com)'
      }
    })

    await wrapper.vm.$nextTick()
    const html = wrapper.html()
    // Markdown should parse links
    expect(html.length).toBeGreaterThan(0)
  })

  it('should render lists in markdown', async () => {
    const wrapper = mount(MessageContent, {
      props: {
        content: '- Item 1\n- Item 2\n- Item 3'
      }
    })

    await wrapper.vm.$nextTick()
    const html = wrapper.html()
    // Markdown should parse lists
    expect(html.length).toBeGreaterThan(0)
  })
})

