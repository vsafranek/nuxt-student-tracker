export const extractMessageContent = (content: any): string => {
  if (!content) {
    return ''
  }

  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part) return ''
        if (typeof part === 'string') return part
        if (typeof part === 'object' && 'text' in part) {
          return part.text || ''
        }
        return ''
      })
      .join('\n')
      .trim()
  }

  if (typeof content === 'object' && 'text' in content) {
    return content.text || ''
  }

  return ''
}

