<script setup lang="ts">
import { ref, onMounted } from "vue";
import { systemPrompt } from "../stores/chat.ts";
import * as api from "../api/client.ts";

const mcpUrls = ref("");
const llmModel = ref("");
const llmBaseUrl = ref("");
const saved = ref(false);

onMounted(async () => {
  const config = await api.getConfig();
  systemPrompt.value = config.systemPrompt;
  mcpUrls.value = config.mcpServerUrls.join(", ");
  llmModel.value = config.llmModel;
  llmBaseUrl.value = config.llmBaseUrl;
});

async function saveConfig() {
  await api.updateConfig({
    systemPrompt: systemPrompt.value,
    mcpServerUrls: mcpUrls.value
      .split(",")
      .map(u => u.trim())
      .filter(Boolean),
  });
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
}
</script>

<template>
  <div class="config-panel">
    <h3>Configuration</h3>

    <div class="section">
      <label>LLM Model</label>
      <input :value="llmModel" disabled />
    </div>

    <div class="section">
      <label>LLM Base URL</label>
      <input :value="llmBaseUrl" disabled />
    </div>

    <div class="section">
      <label>System Prompt</label>
      <textarea v-model="systemPrompt" rows="6" placeholder="Enter system prompt..." />
    </div>

    <div class="section">
      <label>MCP Server URLs</label>
      <textarea
        v-model="mcpUrls"
        rows="3"
        placeholder="Comma-separated URLs: stdio://path, http://..."
      />
    </div>

    <button @click="saveConfig" class="save-btn" :class="{ saved }">
      {{ saved ? "Saved!" : "Save Config" }}
    </button>
  </div>
</template>

<style scoped>
.config-panel {
  padding: 16px;
}

h3 {
  font-size: 14px;
  margin-bottom: 16px;
  color: #a0a0a0;
}

.section {
  margin-bottom: 16px;
}

label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
}

input,
textarea {
  width: 100%;
  padding: 8px;
  background: #1a1a2e;
  border: 1px solid #333;
  color: #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
}

input:disabled {
  opacity: 0.6;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #533483;
}

.save-btn {
  width: 100%;
  padding: 8px;
  background: #533483;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.save-btn.saved {
  background: #27ae60;
}
</style>
