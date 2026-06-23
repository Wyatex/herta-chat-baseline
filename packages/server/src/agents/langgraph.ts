import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { config } from "../config.ts";
import { callMcpTool } from "../mcp-client.ts";
import type { Message, McpTool } from "@herta/shared";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export function createLangGraphAgent(systemPrompt: string, mcpTools: McpTool[] = []) {
  const model = new ChatOpenAI({
    openAIApiKey: config.llmApiKey,
    modelName: config.llmModel,
    configuration: { baseURL: config.llmBaseUrl },
    streaming: true,
  });

  const tools = mcpTools.map(tool =>
    new DynamicStructuredTool({
      name: tool.name,
      description: tool.description,
      schema: z.object(
        Object.fromEntries(
          Object.entries(tool.inputSchema.properties ?? {}).map(([key, prop]: [string, any]) => [
            key,
            prop.type === "string" ? z.string() : prop.type === "number" ? z.number() : z.any(),
          ])
        )
      ),
      func: async (input) => {
        return await callMcpTool(tool.name, input as Record<string, unknown>);
      },
    })
  );

  return createReactAgent({ llm: model, tools });
}

export function messagesToLangChain(messages: Message[]): (SystemMessage | HumanMessage | AIMessage | ToolMessage)[] {
  return messages.map(m => {
    switch (m.role) {
      case "system":
        return new SystemMessage(m.content);
      case "user":
        return new HumanMessage(m.content);
      case "assistant":
        return new AIMessage(m.content);
      case "tool":
        return new ToolMessage({
          content: m.content,
          tool_call_id: m.toolResult?.toolCallId ?? "",
        });
      default:
        return new HumanMessage(m.content);
    }
  });
}
