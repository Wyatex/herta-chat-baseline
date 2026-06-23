import { route } from "../router.ts";
import { createSSEStream } from "../sse.ts";

// Chat streaming endpoint — agent logic implemented in later tasks
route("POST", "/api/chat/langgraph", (_req) => {
  return createSSEStream(async (_controller) => {
    // TODO: Implement LangGraph agent streaming
  });
});

route("POST", "/api/chat/pi", (_req) => {
  return createSSEStream(async (_controller) => {
    // TODO: Implement Pi agent-core streaming
  });
});
