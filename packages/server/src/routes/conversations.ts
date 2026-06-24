import { route, jsonResponse } from "../router.ts";
import * as db from "../db.ts";
import { randomUUID } from "crypto";

route("GET", "/api/conversations", () => {
  return jsonResponse(db.getConversations());
});

route("POST", "/api/conversations", async (req) => {
  const body = await req.json() as { title?: string; agentType?: string; systemPrompt?: string };
  const id = randomUUID();
  const conv = db.createConversation(
    id,
    body.title ?? "New Conversation",
    body.agentType ?? "langchain",
    body.systemPrompt ?? ""
  );
  return jsonResponse(conv, 201);
});

route("DELETE", "/api/conversations", async (req) => {
  const body = await req.json() as { id: string };
  db.deleteConversation(body.id);
  return jsonResponse({ ok: true });
});

route("GET", "/api/messages", (req) => {
  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId) return jsonResponse({ error: "conversationId required" }, 400);
  return jsonResponse(db.getMessages(conversationId));
});
