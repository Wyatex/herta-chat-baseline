import { route } from "../router.ts";
import { createSSEStream, sendSSE } from "../sse.ts";
import { createLangChainAgent } from "../agents/langchain.ts";
import { createPiAgent } from "../agents/pi.ts";
import * as db from "../db.ts";
import { randomUUID } from "crypto";
import { DEFAULT_SYSTEM_PROMPT } from "@herta/shared";
import {mcpTools} from "../mcp-client.ts";

route("POST", "/api/chat/langchain", async (req) => {
  const body = await req.json() as {
    conversationId: string;
    message: string;
    systemPrompt?: string;
  };

  const conversationId = body.conversationId;
  const systemPrompt = body.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;

  db.addMessage({
    id: randomUUID(),
    role: "user",
    content: body.message,
    timestamp: Date.now(),
    conversationId,
  });

  return createSSEStream(async (controller) => {
    const agent = createLangChainAgent(systemPrompt, mcpTools);
    const messages = db.getMessages(conversationId);
    const langChainMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    let fullResponse = "";

    const eventStream = agent.streamEvents(
      { messages: langChainMessages },
      { version: "v2" }
    );

    for await (const event of eventStream) {
      if (event.event === "on_chat_model_stream") {
        const chunk = event.data?.chunk;
        if (chunk?.content) {
          const text = typeof chunk.content === "string" ? chunk.content : "";
          if (text) {
            fullResponse += text;
            sendSSE(controller, { type: "text_delta", data: text });
          }
        }
      }
    }

    db.addMessage({
      id: randomUUID(),
      role: "assistant",
      content: fullResponse,
      timestamp: Date.now(),
      conversationId,
    });
  });
});

route("POST", "/api/chat/pi", async (req) => {
  const body = await req.json() as {
    conversationId: string;
    message: string;
    systemPrompt?: string;
  };

  const conversationId = body.conversationId;
  const systemPrompt = body.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;

  db.addMessage({
    id: randomUUID(),
    role: "user",
    content: body.message,
    timestamp: Date.now(),
    conversationId,
  });

  return createSSEStream(async (controller) => {
    const agent = createPiAgent(systemPrompt);

    let fullResponse = "";

    agent.subscribe((event) => {
      console.log(event)
      if (event.type === "message_update") {
        const delta = event.assistantMessageEvent;
        if (delta?.type === "text_delta" && delta.delta) {
          fullResponse += delta.delta;
          sendSSE(controller, { type: "text_delta", data: delta.delta });
        }
      }
    });

    await agent.prompt(body.message);

    db.addMessage({
      id: randomUUID(),
      role: "assistant",
      content: fullResponse,
      timestamp: Date.now(),
      conversationId,
    });
  });
});
