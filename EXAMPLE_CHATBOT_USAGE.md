# Azure OpenAI Chatbot Implementation

This document explains how to use the Azure OpenAI chatbot that has been implemented in your Nuxt.js application.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
AZURE_OPENAI_API_BASE=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-api-key
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=models-gpt-4o
```

## Usage

### 1. Basic Usage in a Vue Component

```vue
<template>
  <div class="container mx-auto p-4">
    <ChatBot 
      :height="'600px'"
      :system-prompt="'You are a helpful assistant for students.'"
    />
  </div>
</template>

<script setup lang="ts">
// ChatBot component is auto-imported by Nuxt
</script>
```

### 2. Using the Composable Directly

```vue
<template>
  <div>
    <div v-for="(message, index) in displayMessages" :key="index">
      <div :class="message.role === 'user' ? 'user-msg' : 'assistant-msg'">
        {{ message.content }}
      </div>
    </div>
    <input v-model="input" @keyup.enter="sendMessage(input)" />
    <button @click="sendMessage(input)" :disabled="isLoading">
      Send
    </button>
  </div>
</template>

<script setup lang="ts">
const { messages, isLoading, sendMessage } = useChat({
  userId: 'user-123',
  groupId: 'group-456',
  systemPrompt: 'You are a helpful assistant.'
})

const input = ref('')

// Filter out system messages for display
const displayMessages = computed(() => 
  messages.value.filter(msg => msg.role !== 'system')
)
</script>
```

### 3. API Endpoint

The chat API endpoint is available at `/api/chat` and accepts POST requests:

```typescript
const response = await $fetch('/api/chat', {
  method: 'POST',
  body: {
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
    userId: 'optional-user-id',
    groupId: 'optional-group-id'
  }
})
```

## Files Created

1. **`nuxt.config.ts`** - Updated with Azure OpenAI configuration
2. **`server/api/chat.post.ts`** - Server-side API endpoint for chat
3. **`composables/useChat.ts`** - Composable for chat functionality
4. **`components/ChatBot.vue`** - Ready-to-use chatbot UI component

## Component Props

The `ChatBot` component accepts the following props:

- `userId` (optional): User ID for tracking conversations
- `groupId` (optional): Group ID for context
- `systemPrompt` (optional): System prompt to customize AI behavior
- `height` (optional, default: '600px'): Height of the chat container

## Features

- ✅ Azure OpenAI integration with GPT-4o
- ✅ Real-time chat interface
- ✅ Message history management
- ✅ Loading states and error handling
- ✅ Auto-scrolling to latest messages
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript support

