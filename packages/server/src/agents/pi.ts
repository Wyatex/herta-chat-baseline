import type {AgentTool} from "@earendil-works/pi-agent-core";
import {Agent} from "@earendil-works/pi-agent-core";
import {
  createModels,
  Type,
  createProvider,
  envApiKeyAuth
} from "@earendil-works/pi-ai";
import {callMcpTool} from "../mcp-client.ts";
import type {McpTool, Message} from "@herta/shared";
import {config} from "../config.ts";
import {openAICompletionsApi} from "@earendil-works/pi-ai/compat";

// @todo
export function createPiAgent(systemPrompt: string, mcpTools: McpTool[] = []) {
  const models = createModels();
  models.setProvider(createProvider({
    id: "custom",
    name: "custom",
    baseUrl: config.llmBaseUrl,
    auth: {
      apiKey: envApiKeyAuth("API key", ["LLM_API_KEY"])
    },
    models: [{
      id: config.llmModel,
      name: config.llmModel,
      api: "openai-completions",
      provider: "custom",
      baseUrl: config.llmBaseUrl,
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "requiresReasoningContentOnAssistantMessages": true, "thinkingFormat": "deepseek" },
      reasoning: true,
      thinkingLevelMap: { "minimal": null, "low": null, "medium": null, "high": "high", "xhigh": "max" },
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 0.0028,
        cacheWrite: 0,
      },
      contextWindow: 1000000,
      maxTokens: 384000,
    }],
    api: openAICompletionsApi(),
  }))
  const model = models.getModel('custom', config.llmModel);
  if (!model) {
    throw new Error(`Model not found: custom/${config.llmModel}`);
  }

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
        content: [{type: "text" as const, text: result}],
        details: undefined,
      };
    },
  }));

  return new Agent({
    initialState: {
      systemPrompt,
      model,
      tools,
    },
  });
}

export function messagesToPiMessages(messages: Message[]) {
  return messages.map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
    timestamp: m.timestamp,
  }));
}
