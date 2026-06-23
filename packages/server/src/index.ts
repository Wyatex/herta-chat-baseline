import { handleRequest } from "./router.ts";
import { config } from "./config.ts";
import "./routes/chat.ts";
import "./routes/conversations.ts";
import "./routes/config.ts";

const server = Bun.serve({
  port: config.port,
  fetch: handleRequest,
});

console.log(`Herta Chat server running on http://localhost:${server.port}`);
