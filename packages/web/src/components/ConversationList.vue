<script setup lang="ts">
import {
  conversations,
  currentConversation,
  selectConversation,
  removeConversation,
  newConversation,
  agentType,
} from "../stores/chat.ts";

function formatTime(ts: number) {
  return new Date(ts).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div class="conversation-list">
    <div class="header">
      <h2>Herta Chat</h2>
      <button @click="newConversation(agentType)" class="new-btn">+</button>
    </div>
    <div class="list">
      <div
        v-for="conv in conversations"
        :key="conv.id"
        :class="['item', { active: currentConversation?.id === conv.id }]"
        @click="selectConversation(conv.id)"
      >
        <div class="item-title">{{ conv.title }}</div>
        <div class="item-meta">
          <span class="agent-badge">{{ conv.agentType }}</span>
          <span class="time">{{ formatTime(conv.updatedAt) }}</span>
        </div>
        <button class="delete-btn" @click.stop="removeConversation(conv.id)">×</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversation-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #0f3460;
}

h2 {
  font-size: 16px;
  color: #e0e0e0;
}

.new-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #533483;
  background: transparent;
  color: #533483;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list {
  flex: 1;
  overflow-y: auto;
}

.item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #0a1628;
  position: relative;
}

.item:hover {
  background: #1a2a4e;
}

.item.active {
  background: #0f3460;
}

.item-title {
  font-size: 14px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 20px;
}

.item-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.agent-badge {
  font-size: 11px;
  background: #533483;
  color: #fff;
  padding: 1px 6px;
  border-radius: 3px;
}

.time {
  font-size: 11px;
  color: #666;
}

.delete-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 16px;
  opacity: 0;
  transition: opacity 0.2s;
}

.item:hover .delete-btn {
  opacity: 1;
}
</style>
