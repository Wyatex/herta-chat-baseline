<script setup lang="ts">
import { ref, nextTick, watch } from "vue";
import AgentSwitcher from "./AgentSwitcher.vue";
import {
  messages,
  isStreaming,
  currentConversation,
  sendMessage,
  stopStreaming,
  agentType,
  newConversation,
} from "../stores/chat.ts";

const input = ref("");
const messagesContainer = ref<HTMLElement>();

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

watch(messages, scrollToBottom, { deep: true });

function handleSend() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  if (!currentConversation.value) {
    newConversation(agentType.value).then(() => {
      sendMessage(text);
    });
  } else {
    sendMessage(text);
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}
</script>

<template>
  <div class="chat-view">
    <AgentSwitcher />
    <div class="messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty">
        <p>Start a conversation</p>
      </div>
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['message', msg.role]"
      >
        <div class="message-role">{{ msg.role }}</div>
        <div class="message-content">{{ msg.content }}</div>
      </div>
    </div>
    <div class="input-area">
      <textarea
        v-model="input"
        placeholder="Type a message..."
        @keydown="handleKeydown"
        rows="1"
      />
      <button v-if="isStreaming" @click="stopStreaming" class="stop-btn">
        Stop
      </button>
      <button v-else @click="handleSend" class="send-btn" :disabled="!input.trim()">
        Send
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.message {
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  max-width: 80%;
}

.message.user {
  background: #533483;
  margin-left: auto;
}

.message.assistant {
  background: #0f3460;
}

.message.system {
  background: #1a3a1a;
  font-style: italic;
  font-size: 13px;
}

.message-role {
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.message-content {
  white-space: pre-wrap;
  line-height: 1.5;
}

.input-area {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #0f3460;
  border-top: 1px solid #533483;
}

textarea {
  flex: 1;
  resize: none;
  border: 1px solid #333;
  background: #1a1a2e;
  color: #e0e0e0;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

textarea:focus {
  outline: none;
  border-color: #533483;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.send-btn {
  background: #533483;
  color: #fff;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stop-btn {
  background: #e74c3c;
  color: #fff;
}
</style>
