import { route } from "../router.ts";
import { createSSEStream, sendSSE } from "../sse.ts";
import { createLangGraphAgent } from "../agents/langgraph.ts";
import * as db from "../db.ts";
import { randomUUID } from "crypto";
import { DEFAULT_SYSTEM_PROMPT } from "@herta/shared";

route("POST", "/api/chat/langgraph", async (req) => {
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
    const agent = createLangGraphAgent(systemPrompt);
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

route("POST", "/api/chat/pi", (_req) => {
  return createSSEStream(async (_controller) => {
    // TODO: Implement Pi agent-core streaming
  });
});
