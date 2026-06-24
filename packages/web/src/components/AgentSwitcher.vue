<script setup lang="ts">
import { agentType } from "../stores/chat.ts";
import type { AgentType } from "@herta/shared";

const agents: { value: AgentType; label: string }[] = [
  { value: "langchain", label: "LangChain" },
  { value: "pi", label: "Pi Agent" },
];
</script>

<template>
  <div class="agent-switcher">
    <button
      v-for="agent in agents"
      :key="agent.value"
      :class="{ active: agentType === agent.value }"
      @click="agentType = agent.value"
    >
      {{ agent.label }}
    </button>
  </div>
</template>

<style scoped>
.agent-switcher {
  display: flex;
  gap: 4px;
  padding: 8px 16px;
  background: #0f3460;
}

button {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #533483;
  background: transparent;
  color: #a0a0a0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

button.active {
  background: #533483;
  color: #fff;
  border-color: #533483;
}
</style>
