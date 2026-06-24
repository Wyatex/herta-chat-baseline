import type { Conversation, Message, AgentType, SSEEvent, ToolCall, ToolResult } from "@herta/shared";

const BASE = "/api";

export async function getConversations(): Promise<Conversation[]> {
  const res = await fetch(`${BASE}/conversations`);
  return (await res.json()) as Conversation[];
}

export async function createConversation(
  title: string,
  agentType: AgentType,
  systemPrompt: string
): Promise<Conversation> {
  const res = await fetch(`${BASE}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, agentType, systemPrompt }),
  });
  return (await res.json()) as Conversation;
}

export async function deleteConversation(id: string): Promise<void> {
  await fetch(`${BASE}/conversations`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const res = await fetch(`${BASE}/messages?conversationId=${conversationId}`);
  return (await res.json()) as Message[];
}

export async function getConfig(): Promise<{
  systemPrompt: string;
  mcpServerUrls: string[];
  llmModel: string;
  llmBaseUrl: string;
}> {
  const res = await fetch(`${BASE}/config`);
  return (await res.json()) as {
    systemPrompt: string;
    mcpServerUrls: string[];
    llmModel: string;
    llmBaseUrl: string;
  };
}

export async function updateConfig(config: {
  systemPrompt?: string;
  mcpServerUrls?: string[];
}): Promise<void> {
  await fetch(`${BASE}/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
}

export function streamChat(
  agentType: AgentType,
  conversationId: string,
  message: string,
  systemPrompt: string,
  callbacks: {
    onDelta: (text: string) => void;
    onToolCall: (toolCalls: ToolCall[]) => void;
    onToolResult: (toolResult: ToolResult) => void;
    onDone: () => void;
    onError: (error: string) => void;
  }
): AbortController {
  const controller = new AbortController();

  fetch(`/api/chat/${agentType}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, message, systemPrompt }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        callbacks.onError(`HTTP ${res.status}`);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6)) as SSEEvent;
              if (event.type === "text_delta") callbacks.onDelta(event.data as string);
              else if (event.type === "tool_call") callbacks.onToolCall(event.data as ToolCall[]);
              else if (event.type === "tool_result") callbacks.onToolResult(event.data as ToolResult);
              else if (event.type === "error") callbacks.onError(event.data as string);
              else if (event.type === "done") callbacks.onDone();
            } catch {}
          }
        }
      }
      callbacks.onDone();
    })
    .catch((err) => {
      if (err.name !== "AbortError") callbacks.onError(err.message);
    });

  return controller;
}
