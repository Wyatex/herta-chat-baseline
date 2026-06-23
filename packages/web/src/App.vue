<script setup lang="ts">
import { onMounted } from "vue";
import ChatView from "./components/ChatView.vue";
import ConversationList from "./components/ConversationList.vue";
import ConfigPanel from "./components/ConfigPanel.vue";
import { loadConversations } from "./stores/chat.ts";

onMounted(() => {
  loadConversations();
});
</script>

<template>
  <div class="app">
    <aside class="sidebar">
      <ConversationList />
    </aside>
    <main class="main">
      <ChatView />
    </main>
    <aside class="config-panel">
      <ConfigPanel />
    </aside>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #1a1a2e;
  color: #e0e0e0;
  height: 100vh;
}

.app {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 260px;
  background: #16213e;
  border-right: 1px solid #0f3460;
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.config-panel {
  width: 300px;
  background: #16213e;
  border-left: 1px solid #0f3460;
  overflow-y: auto;
}
</style>
