import type { SSEEvent } from "@herta/shared";

export function createSSEStream(
  handler: (controller: ReadableStreamDefaultController<SSEEvent>) => Promise<void>
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await handler(controller);
      } catch (error) {
        const event: SSEEvent = {
          type: "error",
          data: error instanceof Error ? error.message : String(error),
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      } finally {
        const done: SSEEvent = { type: "done", data: "" };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(done)}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export function sendSSE(
  controller: ReadableStreamDefaultController,
  event: SSEEvent
) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}
