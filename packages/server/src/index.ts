import { handleRequest } from "./router.ts";
import { config } from "./config.ts";
import { setupMCP } from "./mcp-client.ts";
import "./routes/chat.ts";
import "./routes/conversations.ts";
import "./routes/config.ts";

await setupMCP()

const server = Bun.serve({
  port: config.port,
  fetch: handleRequest,
  idleTimeout: 180
});

console.log(`Herta Chat server running on http://localhost:${server.port}`);
