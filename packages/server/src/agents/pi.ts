import { Agent } from "@earendil-works/pi-agent-core";
import { getModel, Type } from "@earendil-works/pi-ai";
import { callMcpTool } from "../mcp-client.ts";
import type { Message, McpTool } from "@herta/shared";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import { config } from "../config.ts";

export function createPiAgent(systemPrompt: string, mcpTools: McpTool[] = []) {
  const model = getModel(config.piModelProvider as any, config.piModelName as any);

  const tools: AgentTool[] = mcpTools.map(tool => ({
    name: tool.name,
    label: tool.name,
    description: tool.description,
    parameters: Type.Object(
      Object.fromEntries(
        Object.entries(tool.inputSchema.properties ?? {}).map(([key, prop]: [string, any]) => [
          key,
          prop.type === "string" ? Type.String() : prop.type === "number" ? Type.Number() : Type.Any(),
        ])
      )
    ),
    execute: async (_toolCallId: string, params: any) => {
      const result = await callMcpTool(tool.name, params);
      return {
        content: [{ type: "text" as const, text: result }],
        details: undefined,
      };
    },
  }));

  const agent = new Agent({
    initialState: {
      systemPrompt,
      model,
      tools,
    },
  });

  return agent;
}

export function messagesToPiMessages(messages: Message[]) {
  return messages.map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
    timestamp: m.timestamp,
  }));
}
