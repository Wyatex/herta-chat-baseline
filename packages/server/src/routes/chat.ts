import { route } from "../router.ts";
import { createSSEStream, sendSSE } from "../sse.ts";
import { createLangChainAgent } from "../agents/langchain.ts";
import { createPiAgent } from "../agents/pi.ts";
import * as db from "../db.ts";
import { randomUUID } from "crypto";
import { DEFAULT_SYSTEM_PROMPT } from "@herta/shared";
import type { ToolCall, ToolResult } from "@herta/shared";
import { mcpTools } from "../mcp-client.ts";

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
      ...messages.map(m => {
        if (m.role === "tool" && m.toolResult) {
          return { role: "tool" as const, content: m.content, tool_call_id: m.toolResult.toolCallId };
        }
        return { role: m.role as "user" | "assistant", content: m.content, tool_calls: m.toolCalls };
      }),
    ];

    let fullResponse = "";
    let pendingToolCalls: ToolCall[] = [];

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
      else if (event.event === "on_chat_model_end") {
        const output = event.data?.output;
        if (output?.tool_calls?.length) {
          const toolCalls: ToolCall[] = output.tool_calls.map((tc: any) => ({
            id: tc.id,
            name: tc.name,
            arguments: typeof tc.args === "string" ? tc.args : JSON.stringify(tc.args),
          }));

          db.addMessage({
            id: randomUUID(),
            role: "assistant",
            content: fullResponse,
            timestamp: Date.now(),
            conversationId,
            toolCalls,
          });
          fullResponse = "";
          pendingToolCalls = toolCalls;
          sendSSE(controller, { type: "tool_call", data: toolCalls });
        }
      }
      else if (event.event === "on_tool_end") {
        const toolCallId = pendingToolCalls.length > 0 ? pendingToolCalls[0].id : "";
        const isError = !!event.data?.error;
        const content = isError
          ? String(event.data.error)
          : typeof event.data?.output === "string"
            ? event.data.output
            : JSON.stringify(event.data?.output ?? "");

        const toolResult: ToolResult = { toolCallId, content, isError };

        db.addMessage({
          id: randomUUID(),
          role: "tool",
          content,
          timestamp: Date.now(),
          conversationId,
          toolResult,
        });

        if (pendingToolCalls.length > 1) {
          pendingToolCalls = pendingToolCalls.slice(1);
        } else {
          pendingToolCalls = [];
        }

        sendSSE(controller, { type: "tool_result", data: toolResult });
      }
    }

    if (fullResponse) {
      db.addMessage({
        id: randomUUID(),
        role: "assistant",
        content: fullResponse,
        timestamp: Date.now(),
        conversationId,
      });
    }
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
