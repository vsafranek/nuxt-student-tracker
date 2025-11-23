<template>
  <div ref="messageContentRef" class="message-content" v-html="renderedContent"></div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import katex from 'katex'
import Prism from 'prismjs'
import 'katex/dist/katex.min.css'
import 'prismjs/themes/prism-tomorrow.css'

// Load Prism components in correct order (dependencies first)
// Base languages
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'

// C must be loaded before C++ (cpp extends c)
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'

// Other languages
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-xml-doc'

interface Props {
  content: string
}

const props = defineProps<Props>()

// Configure marked to support code blocks and math
marked.setOptions({
  breaks: true,
  gfm: true
})

// Map language aliases to Prism language names
const languageMap: Record<string, string> = {
  'html': 'markup',
  'xml': 'markup',
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'cs': 'csharp',
  'cpp': 'cpp',
  'c': 'c',
  'sh': 'bash',
  'shell': 'bash'
}

// Get the correct Prism language name
const getPrismLanguage = (lang: string): string | null => {
  if (!lang || lang === 'text') return null
  
  // Check if it's already a valid Prism language
  if (Prism.languages[lang]) {
    return lang
  }
  
  // Try mapped name
  const mapped = languageMap[lang.toLowerCase()]
  if (mapped && Prism.languages[mapped]) {
    return mapped
  }
  
  return null
}

// Custom renderer for code blocks with syntax highlighting
const renderer: any = {
  code(code: string, language: string | undefined) {
    const lang = language || 'text'
    let highlighted = code
    
    const prismLang = getPrismLanguage(lang)
    if (prismLang && Prism.languages[prismLang]) {
      try {
        highlighted = Prism.highlight(code, Prism.languages[prismLang], prismLang)
      } catch (e) {
        console.warn('Error highlighting code:', e)
        highlighted = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }
    } else {
      // No language or language not supported, just escape HTML
      highlighted = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }
    
    return `<pre class="language-${lang}"><code class="language-${lang}">${highlighted}</code></pre>`
  },
  codespan(code: string) {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<code class="inline-code">${escaped}</code>`
  }
}

marked.use({ renderer })

// Process math expressions directly in the rendered HTML (after markdown processing)
const processMathInHTML = (html: string): string => {
  // Handle block math: $$...$$ or \[...\]
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false })
    } catch (e) {
      return match
    }
  })
  
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false })
    } catch (e) {
      return match
    }
  })
  
  // Handle inline math: $...$ or \(...\)
  html = html.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false })
    } catch (e) {
      return match
    }
  })
  
  html = html.replace(/\\\(([^\\]+?)\\\)/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false })
    } catch (e) {
      return match
    }
  })
  
  // Handle simple parentheses format: ( ... ) for inline math
  // This handles cases like "( x = \frac{1}{2} )" or "( 2\left(...\right) = 0 )"
  html = html.replace(/\(([^()]+?)\)/g, (match, formula) => {
    // Trim and clean the formula
    let trimmed = formula.trim()
    // Remove any HTML entities that might have been introduced
    trimmed = trimmed.replace(/&#x27;/g, "'").replace(/&apos;/g, "'").replace(/&quot;/g, '"')
    
    // Only process if it contains LaTeX commands (backslash + letters) or clear math symbols
    // This avoids matching regular text in parentheses
    if (/\\[a-zA-Z]|\\left|\\right|[\^_\{\}]|[\+\-\*\/=<>]|\d+\/\d+/.test(trimmed)) {
      try {
        return katex.renderToString(trimmed, { 
          displayMode: false, 
          throwOnError: false 
        })
      } catch (e) {
        // If KaTeX fails, return original match
        return match
      }
    }
    return match
  })
  
  return html
}

const messageContentRef = ref<HTMLElement | null>(null)

const renderedContent = computed(() => {
  if (!props.content) return ''
  
  // First render markdown (this will escape $ and other special chars in code blocks)
  const parsed = marked.parse(props.content)
  let html = typeof parsed === 'string' ? parsed : ''
  
  // Then process math expressions in the rendered HTML
  html = processMathInHTML(html)
  
  // Highlight code blocks after rendering
  nextTick(() => {
    highlightCode()
  })
  
  return html
})

// Highlight code blocks when component is mounted or content changes
onMounted(() => {
  highlightCode()
})

watch(() => props.content, () => {
  nextTick(() => {
    highlightCode()
  })
})

const highlightCode = () => {
  if (typeof document !== 'undefined' && messageContentRef.value) {
    const codeBlocks = messageContentRef.value.querySelectorAll('pre code')
    codeBlocks.forEach((block) => {
      const lang = block.className.replace('language-', '') || 'text'
      const prismLang = getPrismLanguage(lang)
      
      if (prismLang && Prism.languages[prismLang]) {
        try {
          const originalText = block.textContent || ''
          block.innerHTML = Prism.highlight(originalText, Prism.languages[prismLang], prismLang)
        } catch (e) {
          console.warn('Error highlighting code:', e)
        }
      }
    })
  }
}
</script>

<style scoped>
.message-content {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.message-content :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5rem 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.message-content :deep(pre code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
  color: inherit;
  font-size: inherit;
}

.message-content :deep(code.inline-code) {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: 'Courier New', monospace;
}

.message-content :deep(p) {
  margin: 0.5rem 0;
}

.message-content :deep(p:first-child) {
  margin-top: 0;
}

.message-content :deep(p:last-child) {
  margin-bottom: 0;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.message-content :deep(li) {
  margin: 0.25rem 0;
}

.message-content :deep(blockquote) {
  border-left: 4px solid #e5e7eb;
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: #6b7280;
}

.message-content :deep(h1),
.message-content :deep(h2),
.message-content :deep(h3),
.message-content :deep(h4),
.message-content :deep(h5),
.message-content :deep(h6) {
  margin: 1rem 0 0.5rem 0;
  font-weight: 600;
}

.message-content :deep(h1) {
  font-size: 1.5rem;
}

.message-content :deep(h2) {
  font-size: 1.25rem;
}

.message-content :deep(h3) {
  font-size: 1.125rem;
}

.message-content :deep(strong) {
  font-weight: 600;
}

.message-content :deep(em) {
  font-style: italic;
}

.message-content :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.message-content :deep(a:hover) {
  color: #2563eb;
}

/* KaTeX styles */
.message-content :deep(.katex) {
  font-size: 1.1em;
}

.message-content :deep(.katex-display) {
  margin: 1rem 0;
  overflow-x: auto;
  overflow-y: hidden;
}
</style>

