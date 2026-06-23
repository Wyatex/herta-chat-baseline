import { ref } from "vue";
import type { Conversation, Message, AgentType } from "@herta/shared";
import * as api from "../api/client.ts";

export const conversations = ref<Conversation[]>([]);
export const currentConversation = ref<Conversation | null>(null);
export const messages = ref<Message[]>([]);
export const isStreaming = ref(false);
export const agentType = ref<AgentType>("langgraph");
export const systemPrompt = ref("You are a helpful assistant.");

export async function loadConversations() {
  conversations.value = await api.getConversations();
}

export async function selectConversation(id: string) {
  currentConversation.value = conversations.value.find(c => c.id === id) ?? null;
  messages.value = await api.getMessages(id);
}

export async function newConversation(type: AgentType) {
  const conv = await api.createConversation("New Conversation", type, systemPrompt.value);
  conversations.value.unshift(conv);
  currentConversation.value = conv;
  messages.value = [];
}

export async function removeConversation(id: string) {
  await api.deleteConversation(id);
  conversations.value = conversations.value.filter(c => c.id !== id);
  if (currentConversation.value?.id === id) {
    currentConversation.value = null;
    messages.value = [];
  }
}

let abortController: AbortController | null = null;

export function sendMessage(content: string) {
  if (!currentConversation.value || isStreaming.value) return;

  const userMsg: Message = {
    id: crypto.randomUUID(),
    role: "user",
    content,
    timestamp: Date.now(),
    conversationId: currentConversation.value.id,
  };
  messages.value.push(userMsg);

  isStreaming.value = true;
  let assistantContent = "";

  const assistantMsg: Message = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "",
    timestamp: Date.now(),
    conversationId: currentConversation.value.id,
  };
  messages.value.push(assistantMsg);

  abortController = api.streamChat(
    agentType.value,
    currentConversation.value.id,
    content,
    systemPrompt.value,
    (delta) => {
      assistantContent += delta;
      assistantMsg.content = assistantContent;
    },
    () => {
      isStreaming.value = false;
      loadConversations();
    },
    (error) => {
      assistantMsg.content += `\n[Error: ${error}]`;
      isStreaming.value = false;
    }
  );
}

export function stopStreaming() {
  abortController?.abort();
  isStreaming.value = false;
}
