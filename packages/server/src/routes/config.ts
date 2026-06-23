import { route, jsonResponse } from "../router.ts";
import { config } from "../config.ts";

// Config endpoints — system prompt and MCP config management
route("GET", "/api/config", () => {
  return jsonResponse({
    systemPrompt: "", // TODO: persist in Task 4
    mcpServerUrls: config.mcpServerUrls,
  });
});

route("PUT", "/api/config", async (_req) => {
  // TODO: Implement config persistence
  return jsonResponse({ ok: true });
});
