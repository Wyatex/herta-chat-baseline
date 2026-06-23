import { route, jsonResponse } from "../router.ts";
import { config } from "../config.ts";
import { connectMcpServers } from "../mcp-client.ts";

let currentSystemPrompt = "You are a helpful assistant.";
let currentMcpUrls: string[] = config.mcpServerUrls;

route("GET", "/api/config", () => {
  return jsonResponse({
    systemPrompt: currentSystemPrompt,
    mcpServerUrls: currentMcpUrls,
    llmModel: config.llmModel,
    llmBaseUrl: config.llmBaseUrl,
  });
});

route("PUT", "/api/config", async (req) => {
  const body = await req.json() as {
    systemPrompt?: string;
    mcpServerUrls?: string[];
  };

  if (body.systemPrompt !== undefined) {
    currentSystemPrompt = body.systemPrompt;
  }

  if (body.mcpServerUrls !== undefined) {
    currentMcpUrls = body.mcpServerUrls;
    try {
      await connectMcpServers(body.mcpServerUrls);
    } catch (error) {
      console.error("Failed to reconnect MCP servers:", error);
    }
  }

  return jsonResponse({
    systemPrompt: currentSystemPrompt,
    mcpServerUrls: currentMcpUrls,
  });
});
