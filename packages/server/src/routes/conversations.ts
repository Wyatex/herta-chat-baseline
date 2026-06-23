import { route, jsonResponse } from "../router.ts";
import type { Conversation } from "@herta/shared";

// In-memory placeholder — replaced by SQLite in Task 4
const conversations: Conversation[] = [];

route("GET", "/api/conversations", () => {
  return jsonResponse(conversations);
});

route("POST", "/api/conversations", async (req) => {
  const body = await req.json() as Partial<Conversation>;
  const now = Date.now();
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    title: body.title ?? "New Conversation",
    agentType: body.agentType ?? "langgraph",
    systemPrompt: body.systemPrompt ?? "",
    createdAt: now,
    updatedAt: now,
  };
  conversations.push(conversation);
  return jsonResponse(conversation, 201);
});

route("DELETE", "/api/conversations", async (req) => {
  const body = await req.json() as { id: string };
  const idx = conversations.findIndex(c => c.id === body.id);
  if (idx === -1) {
    return jsonResponse({ error: "Not found" }, 404);
  }
  conversations.splice(idx, 1);
  return jsonResponse({ ok: true });
});

route("GET", "/api/messages", (req) => {
  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId) {
    return jsonResponse({ error: "conversationId is required" }, 400);
  }
  // TODO: Return messages from SQLite in Task 4
  return jsonResponse([]);
});
