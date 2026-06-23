export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: number;
  conversationId: string;
  toolCalls?: ToolCall[];
  toolResult?: ToolResult;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ToolResult {
  toolCallId: string;
  content: string;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  agentType: AgentType;
  systemPrompt: string;
  createdAt: number;
  updatedAt: number;
}

export type AgentType = "langgraph" | "pi";

export interface ChatRequest {
  conversationId: string;
  message: string;
  agentType: AgentType;
}

export interface AgentConfig {
  systemPrompt: string;
  mcpServerUrls: string[];
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface SSEEvent {
  type: "text_delta" | "tool_call" | "tool_result" | "error" | "done";
  data: string;
}
