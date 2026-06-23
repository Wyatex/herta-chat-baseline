import { handleRequest } from "./router.ts";
import { config } from "./config.ts";
import { connectMcpServers } from "./mcp-client.ts";
import "./routes/chat.ts";
import "./routes/conversations.ts";
import "./routes/config.ts";

let mcpTools: any[] = [];
if (config.mcpServerUrls.length > 0) {
  mcpTools = await connectMcpServers(config.mcpServerUrls);
  console.log(`Connected to ${mcpTools.length} MCP tools`);
}

const server = Bun.serve({
  port: config.port,
  fetch: handleRequest,
});

console.log(`Herta Chat server running on http://localhost:${server.port}`);
