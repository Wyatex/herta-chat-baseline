# Herta Chat Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a monorepo-based intelligent agent chat platform with LangGraph and Pi agent-core backends, unified Vue3 frontend, MCP Client support, and SQLite persistence.

**Architecture:** Bun monorepo with 3 packages (shared, server, web). Single HTTP server exposes two agent backends via SSE streaming. Vue3 frontend can switch between agents. Configuration via .env file.

**Tech Stack:** Bun, Vue 3, TypeScript, Vite, @langchain/langgraph, @earendil-works/pi-agent-core, @modelcontextprotocol/sdk, bun:sqlite

## Global Constraints

- Bun >= 1.0 as runtime and package manager
- All packages use ESM (`"type": "module"`)
- TypeScript strict mode enabled
- SSE streaming for all agent responses
- OpenAI-compatible API as default LLM provider
- No placeholder code — every step has complete implementation

---

### Task 1: Monorepo Scaffolding

**Covers:** S2

**Files:**
- Modify: `package.json`
- Create: `packages/shared/package.json`
- Create: `packages/server/package.json`
- Create: `packages/web/package.json`
- Create: `tsconfig.base.json`
- Create: `bunfig.toml`
- Create: `.env.example`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/server/tsconfig.json`
- Create: `packages/web/tsconfig.json`

- [ ] **Step 1: Update root package.json for workspaces**

```json
{
  "name": "herta-chat-baseline",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "bun run --filter '*' dev",
    "dev:server": "bun run --filter @herta/server dev",
    "dev:web": "bun run --filter @herta/web dev",
    "build": "bun run --filter '*' build"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create shared package.json**

```json
{
  "name": "@herta/shared",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 3: Create server package.json**

```json
{
  "name": "@herta/server",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@herta/shared": "workspace:*",
    "@langchain/langgraph": "^0.2.0",
    "@langchain/openai": "^0.5.0",
    "@langchain/core": "^0.3.0",
    "@earendil-works/pi-agent-core": "^0.79.0",
    "@earendil-works/pi-ai": "^0.79.0",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.23.0"
  }
}
```

- [ ] **Step 4: Create web package.json**

```json
{
  "name": "@herta/web",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "typecheck": "vue-tsc --noEmit"
  },
  "dependencies": {
    "@herta/shared": "workspace:*",
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5",
    "vite": "^6.0.0",
    "vue-tsc": "^2.0.0"
  }
}
```

- [ ] **Step 5: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

- [ ] **Step 6: Create shared tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["bun"]
  },
  "include": ["src"]
}
```

- [ ] **Step 7: Create server tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["bun"]
  },
  "include": ["src"]
}
```

- [ ] **Step 8: Create web tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "vue"
  },
  "include": ["src", "env.d.ts"]
}
```

- [ ] **Step 9: Create .env.example**

```env
# LLM Configuration (OpenAI-compatible)
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=gpt-4o-mini

# Pi Agent (optional, falls back to LLM_* vars)
PI_MODEL_PROVIDER=openai
PI_MODEL_NAME=gpt-4o-mini

# MCP Server URLs (comma-separated)
MCP_SERVER_URLS=

# Server
PORT=3000
```

- [ ] **Step 10: Create bunfig.toml**

```toml
[install.scopes]

[run]
bun = true
```

- [ ] **Step 11: Install dependencies**

Run: `bun install`
Expected: Dependencies installed successfully

- [ ] **Step 12: Commit**

```bash
git add package.json packages/*/package.json tsconfig.base.json packages/*/tsconfig.json .env.example bunfig.toml
git commit -m "chore: scaffold monorepo with bun workspaces"
```

---

### Task 2: Shared Types and Constants

**Covers:** S1

**Files:**
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/constants.ts`

- [ ] **Step 1: Create shared types**

```typescript
// packages/shared/src/types.ts
export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: number;
  conversationId: string;
  toolCalls?: ToolCall[];
  toolResult?: ToolResult;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ToolResult {
  toolCallId: string;
  content: string;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  agentType: AgentType;
  systemPrompt: string;
  createdAt: number;
  updatedAt: number;
}

export type AgentType = "langgraph" | "pi";

export interface ChatRequest {
  conversationId: string;
  message: string;
  agentType: AgentType;
}

export interface AgentConfig {
  systemPrompt: string;
  mcpServerUrls: string[];
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface SSEEvent {
  type: "text_delta" | "tool_call" | "tool_result" | "error" | "done";
  data: string;
}
```

- [ ] **Step 2: Create shared constants**

```typescript
// packages/shared/src/constants.ts
export const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant.";
export const DEFAULT_MODEL = "gpt-4o-mini";
export const DEFAULT_PORT = 3000;
```

- [ ] **Step 3: Create shared index**

```typescript
// packages/shared/src/index.ts
export * from "./types.ts";
export * from "./constants.ts";
```

- [ ] **Step 4: Typecheck shared package**

Run: `bun run --filter @herta/shared typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/
git commit -m "feat(shared): add types and constants"
```

---

### Task 3: Server Base and SSE Utilities

**Covers:** S3

**Files:**
- Create: `packages/server/src/index.ts`
- Create: `packages/server/src/router.ts`
- Create: `packages/server/src/sse.ts`
- Create: `packages/server/src/config.ts`

- [ ] **Step 1: Create config module**

```typescript
// packages/server/src/config.ts
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const config = {
  get llmBaseUrl() { return getEnv("LLM_BASE_URL"); },
  get llmApiKey() { return getEnv("LLM_API_KEY"); },
  get llmModel() { return getEnv("LLM_MODEL", "gpt-4o-mini"); },
  get piModelProvider() { return getEnv("PI_MODEL_PROVIDER", "openai"); },
  get piModelName() { return getEnv("PI_MODEL_NAME", this.llmModel); },
  get mcpServerUrls() {
    const urls = getEnv("MCP_SERVER_URLS", "");
    return urls ? urls.split(",").map(u => u.trim()).filter(Boolean) : [];
  },
  get port() { return Number(getEnv("PORT", "3000")); },
};
```

- [ ] **Step 2: Create SSE utility**

```typescript
// packages/server/src/sse.ts
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
```

- [ ] **Step 3: Create router**

```typescript
// packages/server/src/router.ts
import { config } from "./config.ts";

type RouteHandler = (req: Request) => Response | Promise<Response>;

const routes = new Map<string, RouteHandler>();

export function route(method: string, path: string, handler: RouteHandler) {
  routes.set(`${method}:${path}`, handler);
}

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;
  const key = `${method}:${url.pathname}`;

  const handler = routes.get(key);
  if (handler) {
    return handler(req);
  }

  // CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  return new Response("Not Found", { status: 404 });
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
```

- [ ] **Step 4: Create server entry point**

```typescript
// packages/server/src/index.ts
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
```

- [ ] **Step 5: Create route directories**

Run: `mkdir -p packages/server/src/routes`

- [ ] **Step 6: Typecheck server package**

Run: `bun run --filter @herta/server typecheck`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add packages/server/src/
git commit -m "feat(server): add base server with router and SSE utilities"
```

---

### Task 4: SQLite Persistence

**Covers:** S3

**Files:**
- Create: `packages/server/src/db.ts`

- [ ] **Step 1: Create database module**

```typescript
// packages/server/src/db.ts
import { Database } from "bun:sqlite";
import type { Conversation, Message } from "@herta/shared";

const db = new Database("herta-chat.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    system_prompt TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    tool_calls TEXT,
    tool_result TEXT,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );
`);

export function createConversation(
  id: string,
  title: string,
  agentType: string,
  systemPrompt: string
): Conversation {
  const now = Date.now();
  db.query(
    "INSERT INTO conversations (id, title, agent_type, system_prompt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, title, agentType, systemPrompt, now, now);
  return { id, title, agentType: agentType as Conversation["agentType"], systemPrompt, createdAt: now, updatedAt: now };
}

export function getConversations(): Conversation[] {
  const rows = db.query("SELECT * FROM conversations ORDER BY updated_at DESC").all() as any[];
  return rows.map(rowToConversation);
}

export function getConversation(id: string): Conversation | null {
  const row = db.query("SELECT * FROM conversations WHERE id = ?").get(id) as any;
  return row ? rowToConversation(row) : null;
}

export function deleteConversation(id: string): void {
  db.query("DELETE FROM messages WHERE conversation_id = ?").run(id);
  db.query("DELETE FROM conversations WHERE id = ?").run(id);
}

export function addMessage(msg: Message): void {
  db.query(
    "INSERT INTO messages (id, conversation_id, role, content, timestamp, tool_calls, tool_result) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(
    msg.id,
    msg.conversationId,
    msg.role,
    msg.content,
    msg.timestamp,
    msg.toolCalls ? JSON.stringify(msg.toolCalls) : null,
    msg.toolResult ? JSON.stringify(msg.toolResult) : null
  );
  db.query("UPDATE conversations SET updated_at = ? WHERE id = ?").run(msg.timestamp, msg.conversationId);
}

export function getMessages(conversationId: string): Message[] {
  const rows = db.query("SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC").all(conversationId) as any[];
  return rows.map(rowToMessage);
}

function rowToConversation(row: any): Conversation {
  return {
    id: row.id,
    title: row.title,
    agentType: row.agent_type,
    systemPrompt: row.system_prompt,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToMessage(row: any): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    timestamp: row.timestamp,
    toolCalls: row.tool_calls ? JSON.parse(row.tool_calls) : undefined,
    toolResult: row.tool_result ? JSON.parse(row.tool_result) : undefined,
  };
}
```

- [ ] **Step 2: Create route stubs**

Create empty route files to prevent import errors:

```typescript
// packages/server/src/routes/chat.ts
// Placeholder — implemented in Tasks 5 and 6
```

```typescript
// packages/server/src/routes/conversations.ts
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
    body.agentType ?? "langgraph",
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
```

```typescript
// packages/server/src/routes/config.ts
// Placeholder — implemented in Task 8
```

- [ ] **Step 3: Typecheck**

Run: `bun run --filter @herta/server typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/db.ts packages/server/src/routes/
git commit -m "feat(server): add SQLite persistence and conversation routes"
```

---

### Task 5: LangGraph Agent Integration

**Covers:** S3

**Files:**
- Modify: `packages/server/src/routes/chat.ts`
- Create: `packages/server/src/agents/langgraph.ts`

- [ ] **Step 1: Create LangGraph agent module**

```typescript
// packages/server/src/agents/langgraph.ts
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { config } from "../config.ts";
import type { Message, McpTool } from "@herta/shared";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export function createLangGraphAgent(systemPrompt: string, mcpTools: McpTool[] = []) {
  const model = new ChatOpenAI({
    openAIApiKey: config.llmApiKey,
    modelName: config.llmModel,
    configuration: { baseURL: config.llmBaseUrl },
    streaming: true,
  });

  const tools = mcpTools.map(tool =>
    new DynamicStructuredTool({
      name: tool.name,
      description: tool.description,
      schema: z.object(
        Object.fromEntries(
          Object.entries(tool.inputSchema.properties ?? {}).map(([key, prop]: [string, any]) => [
            key,
            prop.type === "string" ? z.string() : prop.type === "number" ? z.number() : z.any(),
          ])
        )
      ),
      func: async (input) => {
        return `Tool ${tool.name} called with ${JSON.stringify(input)}`;
      },
    })
  );

  return createReactAgent({ llm: model, tools });
}

export function messagesToLangChain(messages: Message[]): (SystemMessage | HumanMessage | AIMessage | ToolMessage)[] {
  return messages.map(m => {
    switch (m.role) {
      case "system":
        return new SystemMessage(m.content);
      case "user":
        return new HumanMessage(m.content);
      case "assistant":
        return new AIMessage(m.content);
      case "tool":
        return new ToolMessage({
          content: m.content,
          tool_call_id: m.toolResult?.toolCallId ?? "",
        });
      default:
        return new HumanMessage(m.content);
    }
  });
}
```

- [ ] **Step 2: Implement LangGraph chat route**

```typescript
// packages/server/src/routes/chat.ts (append to file)
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
```

- [ ] **Step 3: Create agents directory**

Run: `mkdir -p packages/server/src/agents`

- [ ] **Step 4: Typecheck**

Run: `bun run --filter @herta/server typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/agents/ packages/server/src/routes/chat.ts
git commit -m "feat(server): add LangGraph agent with SSE streaming"
```

---

### Task 6: Pi Agent-Core Integration

**Covers:** S3

**Files:**
- Create: `packages/server/src/agents/pi.ts`
- Modify: `packages/server/src/routes/chat.ts`

- [ ] **Step 1: Create Pi agent module**

```typescript
// packages/server/src/agents/pi.ts
import { Agent } from "@earendil-works/pi-agent-core";
import { getModel } from "@earendil-works/pi-ai";
import type { Message, McpTool, SSEEvent } from "@herta/shared";
import { config } from "../config.ts";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "typebox";

export function createPiAgent(systemPrompt: string, mcpTools: McpTool[] = []) {
  const model = getModel(config.piModelProvider, config.piModelName);

  const tools: AgentTool[] = mcpTools.map(tool => ({
    name: tool.name,
    label: tool.name,
    description: tool.description,
    parameters: Type.Object(
      Object.fromEntries(
        Object.entries(tool.inputSchema.properties ?? {}).map(([key, prop]: [string, any]) => [
          key,
          prop.type === "string" ? Type.String() : prop.type === "number" ? Type.Number() : Type.Any(),
        ])
      )
    ),
    execute: async (_toolCallId: string, params: any) => {
      return {
        content: [{ type: "text" as const, text: `Tool ${tool.name} called with ${JSON.stringify(params)}` }],
      };
    },
  }));

  const agent = new Agent({
    initialState: {
      systemPrompt,
      model,
      tools,
    },
  });

  return agent;
}

export function messagesToPiMessages(messages: Message[]) {
  return messages.map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
    timestamp: m.timestamp,
  }));
}
```

- [ ] **Step 2: Add Pi chat route**

Append to `packages/server/src/routes/chat.ts`:

```typescript
import { createPiAgent } from "../agents/pi.ts";

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
```

- [ ] **Step 3: Typecheck**

Run: `bun run --filter @herta/server typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/agents/pi.ts packages/server/src/routes/chat.ts
git commit -m "feat(server): add Pi agent-core with SSE streaming"
```

---

### Task 7: MCP Client Integration

**Covers:** S3

**Files:**
- Create: `packages/server/src/mcp-client.ts`
- Modify: `packages/server/src/agents/langgraph.ts`
- Modify: `packages/server/src/agents/pi.ts`

- [ ] **Step 1: Create MCP client module**

```typescript
// packages/server/src/mcp-client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { McpTool } from "@herta/shared";

const clients: Client[] = [];

export async function connectMcpServers(urls: string[]): Promise<McpTool[]> {
  const allTools: McpTool[] = [];

  for (const url of urls) {
    try {
      const client = new Client({ name: "herta-chat", version: "0.1.0" });

      if (url.startsWith("stdio://")) {
        const command = url.replace("stdio://", "");
        const [cmd, ...args] = command.split(" ");
        const transport = new StdioClientTransport({ command: cmd!, args });
        await client.connect(transport);
      } else {
        const transport = new SSEClientTransport(new URL(url));
        await client.connect(transport);
      }

      clients.push(client);

      const toolsResult = await client.listTools();
      for (const tool of toolsResult.tools) {
        allTools.push({
          name: tool.name,
          description: tool.description ?? "",
          inputSchema: tool.inputSchema as Record<string, unknown>,
        });
      }
    } catch (error) {
      console.error(`Failed to connect to MCP server ${url}:`, error);
    }
  }

  return allTools;
}

export async function callMcpTool(toolName: string, args: Record<string, unknown>): Promise<string> {
  for (const client of clients) {
    try {
      const result = await client.callTool({ name: toolName, arguments: args });
      return JSON.stringify(result.content);
    } catch {
      continue;
    }
  }
  throw new Error(`Tool not found: ${toolName}`);
}

export async function disconnectAll(): Promise<void> {
  await Promise.all(clients.map(c => c.close()));
  clients.length = 0;
}
```

- [ ] **Step 2: Update LangGraph agent to use real MCP tools**

Modify `packages/server/src/agents/langgraph.ts` — replace the tool `func` body:

```typescript
import { callMcpTool } from "../mcp-client.ts";

// In createLangGraphAgent, replace the func:
func: async (input) => {
  return await callMcpTool(tool.name, input as Record<string, unknown>);
},
```

- [ ] **Step 3: Update Pi agent to use real MCP tools**

Modify `packages/server/src/agents/pi.ts` — replace the tool `execute` body:

```typescript
import { callMcpTool } from "../mcp-client.ts";

// In createPiAgent, replace the execute:
execute: async (_toolCallId: string, params: any) => {
  const result = await callMcpTool(tool.name, params);
  return {
    content: [{ type: "text" as const, text: result }],
  };
},
```

- [ ] **Step 4: Initialize MCP on server startup**

Modify `packages/server/src/index.ts` to connect MCP servers on boot:

```typescript
import { connectMcpServers } from "./mcp-client.ts";
import { config } from "./config.ts";

// At top of file, after imports:
let mcpTools: any[] = [];
if (config.mcpServerUrls.length > 0) {
  mcpTools = await connectMcpServers(config.mcpServerUrls);
  console.log(`Connected to ${mcpTools.length} MCP tools`);
}
```

- [ ] **Step 5: Typecheck**

Run: `bun run --filter @herta/server typecheck`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/mcp-client.ts packages/server/src/agents/ packages/server/src/index.ts
git commit -m "feat(server): add MCP client integration"
```

---

### Task 8: Config API

**Covers:** S3

**Files:**
- Modify: `packages/server/src/routes/config.ts`

- [ ] **Step 1: Implement config routes**

```typescript
// packages/server/src/routes/config.ts
import { route, jsonResponse } from "../router.ts";
import { config } from "../config.ts";
import { connectMcpServers } from "../mcp-client.ts";

let currentSystemPrompt = "You are a helpful assistant.";
let currentMcpUrls: string[] = config.mcpServerUrls;

route("GET", "/api/config", () => {
  return jsonResponse({
    systemPrompt: currentSystemPrompt,
    mcpServerUrls: currentMcpUrls,
    llmModel: config.llmModel,
    llmBaseUrl: config.llmBaseUrl,
  });
});

route("PUT", "/api/config", async (req) => {
  const body = await req.json() as {
    systemPrompt?: string;
    mcpServerUrls?: string[];
  };

  if (body.systemPrompt !== undefined) {
    currentSystemPrompt = body.systemPrompt;
  }

  if (body.mcpServerUrls !== undefined) {
    currentMcpUrls = body.mcpServerUrls;
    try {
      await connectMcpServers(body.mcpServerUrls);
    } catch (error) {
      console.error("Failed to reconnect MCP servers:", error);
    }
  }

  return jsonResponse({
    systemPrompt: currentSystemPrompt,
    mcpServerUrls: currentMcpUrls,
  });
});
```

- [ ] **Step 2: Typecheck**

Run: `bun run --filter @herta/server typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/routes/config.ts
git commit -m "feat(server): add config API for system prompt and MCP"
```

---

### Task 9: Frontend Base Setup

**Covers:** S2

**Files:**
- Create: `packages/web/index.html`
- Create: `packages/web/vite.config.ts`
- Create: `packages/web/env.d.ts`
- Create: `packages/web/src/main.ts`
- Create: `packages/web/src/App.vue`
- Create: `packages/web/src/api/client.ts`
- Create: `packages/web/src/stores/chat.ts`

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Herta Chat</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 2: Create vite.config.ts**

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
```

- [ ] **Step 3: Create env.d.ts**

```typescript
/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
```

- [ ] **Step 4: Create main.ts**

```typescript
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

- [ ] **Step 5: Create API client**

```typescript
// packages/web/src/api/client.ts
import type { Conversation, Message, AgentType, SSEEvent } from "@herta/shared";

const BASE = "/api";

export async function getConversations(): Promise<Conversation[]> {
  const res = await fetch(`${BASE}/conversations`);
  return res.json();
}

export async function createConversation(
  title: string,
  agentType: AgentType,
  systemPrompt: string
): Promise<Conversation> {
  const res = await fetch(`${BASE}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, agentType, systemPrompt }),
  });
  return res.json();
}

export async function deleteConversation(id: string): Promise<void> {
  await fetch(`${BASE}/conversations`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const res = await fetch(`${BASE}/messages?conversationId=${conversationId}`);
  return res.json();
}

export async function getConfig(): Promise<{
  systemPrompt: string;
  mcpServerUrls: string[];
  llmModel: string;
  llmBaseUrl: string;
}> {
  const res = await fetch(`${BASE}/config`);
  return res.json();
}

export async function updateConfig(config: {
  systemPrompt?: string;
  mcpServerUrls?: string[];
}): Promise<void> {
  await fetch(`${BASE}/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
}

export function streamChat(
  agentType: AgentType,
  conversationId: string,
  message: string,
  systemPrompt: string,
  onDelta: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): AbortController {
  const controller = new AbortController();

  fetch(`/api/chat/${agentType}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, message, systemPrompt }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        onError(`HTTP ${res.status}`);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: SSEEvent = JSON.parse(line.slice(6));
              if (event.type === "text_delta") onDelta(event.data);
              else if (event.type === "error") onError(event.data);
              else if (event.type === "done") onDone();
            } catch {}
          }
        }
      }
      onDone();
    })
    .catch((err) => {
      if (err.name !== "AbortError") onError(err.message);
    });

  return controller;
}
```

- [ ] **Step 6: Create chat store**

```typescript
// packages/web/src/stores/chat.ts
import { reactive, ref } from "vue";
import type { Conversation, Message, AgentType } from "@herta/shared";
import * as api from "../api/client.ts";

export const conversations = ref<Conversation[]>([]);
export const currentConversation = ref<Conversation | null>(null);
export const messages = ref<Message[]>([]);
export const isStreaming = ref(false);
export const agentType = ref<AgentType>("langgraph");
export const systemPrompt = ref("You are a helpful assistant.");

export async function loadConversations() {
  conversations.value = await api.getConversations();
}

export async function selectConversation(id: string) {
  currentConversation.value = conversations.value.find(c => c.id === id) ?? null;
  messages.value = await api.getMessages(id);
}

export async function newConversation(type: AgentType) {
  const conv = await api.createConversation("New Conversation", type, systemPrompt.value);
  conversations.value.unshift(conv);
  currentConversation.value = conv;
  messages.value = [];
}

export async function removeConversation(id: string) {
  await api.deleteConversation(id);
  conversations.value = conversations.value.filter(c => c.id !== id);
  if (currentConversation.value?.id === id) {
    currentConversation.value = null;
    messages.value = [];
  }
}

let abortController: AbortController | null = null;

export function sendMessage(content: string) {
  if (!currentConversation.value || isStreaming.value) return;

  const userMsg: Message = {
    id: crypto.randomUUID(),
    role: "user",
    content,
    timestamp: Date.now(),
    conversationId: currentConversation.value.id,
  };
  messages.value.push(userMsg);

  isStreaming.value = true;
  let assistantContent = "";

  const assistantMsg: Message = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "",
    timestamp: Date.now(),
    conversationId: currentConversation.value.id,
  };
  messages.value.push(assistantMsg);

  abortController = api.streamChat(
    agentType.value,
    currentConversation.value.id,
    content,
    systemPrompt.value,
    (delta) => {
      assistantContent += delta;
      assistantMsg.content = assistantContent;
    },
    () => {
      isStreaming.value = false;
      loadConversations();
    },
    (error) => {
      assistantMsg.content += `\n[Error: ${error}]`;
      isStreaming.value = false;
    }
  );
}

export function stopStreaming() {
  abortController?.abort();
  isStreaming.value = false;
}
```

- [ ] **Step 7: Create App.vue**

```vue
<script setup lang="ts">
import { onMounted } from "vue";
import ChatView from "./components/ChatView.vue";
import ConversationList from "./components/ConversationList.vue";
import ConfigPanel from "./components/ConfigPanel.vue";
import { loadConversations } from "./stores/chat.ts";

onMounted(() => {
  loadConversations();
});
</script>

<template>
  <div class="app">
    <aside class="sidebar">
      <ConversationList />
    </aside>
    <main class="main">
      <ChatView />
    </main>
    <aside class="config-panel">
      <ConfigPanel />
    </aside>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #1a1a2e;
  color: #e0e0e0;
  height: 100vh;
}

.app {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 260px;
  background: #16213e;
  border-right: 1px solid #0f3460;
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.config-panel {
  width: 300px;
  background: #16213e;
  border-left: 1px solid #0f3460;
  overflow-y: auto;
}
</style>
```

- [ ] **Step 8: Create components directory**

Run: `mkdir -p packages/web/src/components packages/web/src/api packages/web/src/stores`

- [ ] **Step 9: Commit**

```bash
git add packages/web/
git commit -m "feat(web): add frontend base with Vue3, API client, and store"
```

---

### Task 10: Chat UI Component

**Covers:** S2

**Files:**
- Create: `packages/web/src/components/ChatView.vue`
- Create: `packages/web/src/components/AgentSwitcher.vue`

- [ ] **Step 1: Create AgentSwitcher component**

```vue
<script setup lang="ts">
import { agentType } from "../stores/chat.ts";
import type { AgentType } from "@herta/shared";

const agents: { value: AgentType; label: string }[] = [
  { value: "langgraph", label: "LangGraph" },
  { value: "pi", label: "Pi Agent" },
];
</script>

<template>
  <div class="agent-switcher">
    <button
      v-for="agent in agents"
      :key="agent.value"
      :class="{ active: agentType === agent.value }"
      @click="agentType = agent.value"
    >
      {{ agent.label }}
    </button>
  </div>
</template>

<style scoped>
.agent-switcher {
  display: flex;
  gap: 4px;
  padding: 8px 16px;
  background: #0f3460;
}

button {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #533483;
  background: transparent;
  color: #a0a0a0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

button.active {
  background: #533483;
  color: #fff;
  border-color: #533483;
}
</style>
```

- [ ] **Step 2: Create ChatView component**

```vue
<script setup lang="ts">
import { ref, nextTick, watch } from "vue";
import AgentSwitcher from "./AgentSwitcher.vue";
import {
  messages,
  isStreaming,
  currentConversation,
  sendMessage,
  stopStreaming,
  agentType,
  newConversation,
} from "../stores/chat.ts";

const input = ref("");
const messagesContainer = ref<HTMLElement>();

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

watch(messages, scrollToBottom, { deep: true });

function handleSend() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  if (!currentConversation.value) {
    newConversation(agentType.value).then(() => {
      sendMessage(text);
    });
  } else {
    sendMessage(text);
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}
</script>

<template>
  <div class="chat-view">
    <AgentSwitcher />
    <div class="messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty">
        <p>Start a conversation</p>
      </div>
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['message', msg.role]"
      >
        <div class="message-role">{{ msg.role }}</div>
        <div class="message-content">{{ msg.content }}</div>
      </div>
    </div>
    <div class="input-area">
      <textarea
        v-model="input"
        placeholder="Type a message..."
        @keydown="handleKeydown"
        rows="1"
      />
      <button v-if="isStreaming" @click="stopStreaming" class="stop-btn">
        Stop
      </button>
      <button v-else @click="handleSend" class="send-btn" :disabled="!input.trim()">
        Send
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.message {
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  max-width: 80%;
}

.message.user {
  background: #533483;
  margin-left: auto;
}

.message.assistant {
  background: #0f3460;
}

.message.system {
  background: #1a3a1a;
  font-style: italic;
  font-size: 13px;
}

.message-role {
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.message-content {
  white-space: pre-wrap;
  line-height: 1.5;
}

.input-area {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #0f3460;
  border-top: 1px solid #533483;
}

textarea {
  flex: 1;
  resize: none;
  border: 1px solid #333;
  background: #1a1a2e;
  color: #e0e0e0;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

textarea:focus {
  outline: none;
  border-color: #533483;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.send-btn {
  background: #533483;
  color: #fff;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stop-btn {
  background: #e74c3c;
  color: #fff;
}
</style>
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/components/
git commit -m "feat(web): add ChatView and AgentSwitcher components"
```

---

### Task 11: Conversation List Component

**Covers:** S2

**Files:**
- Create: `packages/web/src/components/ConversationList.vue`

- [ ] **Step 1: Create ConversationList component**

```vue
<script setup lang="ts">
import {
  conversations,
  currentConversation,
  selectConversation,
  removeConversation,
  newConversation,
  agentType,
} from "../stores/chat.ts";

function formatTime(ts: number) {
  return new Date(ts).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div class="conversation-list">
    <div class="header">
      <h2>Herta Chat</h2>
      <button @click="newConversation(agentType)" class="new-btn">+</button>
    </div>
    <div class="list">
      <div
        v-for="conv in conversations"
        :key="conv.id"
        :class="['item', { active: currentConversation?.id === conv.id }]"
        @click="selectConversation(conv.id)"
      >
        <div class="item-title">{{ conv.title }}</div>
        <div class="item-meta">
          <span class="agent-badge">{{ conv.agentType }}</span>
          <span class="time">{{ formatTime(conv.updatedAt) }}</span>
        </div>
        <button class="delete-btn" @click.stop="removeConversation(conv.id)">×</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversation-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #0f3460;
}

h2 {
  font-size: 16px;
  color: #e0e0e0;
}

.new-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #533483;
  background: transparent;
  color: #533483;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list {
  flex: 1;
  overflow-y: auto;
}

.item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #0a1628;
  position: relative;
}

.item:hover {
  background: #1a2a4e;
}

.item.active {
  background: #0f3460;
}

.item-title {
  font-size: 14px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 20px;
}

.item-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.agent-badge {
  font-size: 11px;
  background: #533483;
  color: #fff;
  padding: 1px 6px;
  border-radius: 3px;
}

.time {
  font-size: 11px;
  color: #666;
}

.delete-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 16px;
  opacity: 0;
  transition: opacity 0.2s;
}

.item:hover .delete-btn {
  opacity: 1;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/ConversationList.vue
git commit -m "feat(web): add ConversationList component"
```

---

### Task 12: Config Panel Component

**Covers:** S2, S5

**Files:**
- Create: `packages/web/src/components/ConfigPanel.vue`

- [ ] **Step 1: Create ConfigPanel component**

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { systemPrompt } from "../stores/chat.ts";
import * as api from "../api/client.ts";

const mcpUrls = ref("");
const llmModel = ref("");
const llmBaseUrl = ref("");
const saved = ref(false);

onMounted(async () => {
  const config = await api.getConfig();
  systemPrompt.value = config.systemPrompt;
  mcpUrls.value = config.mcpServerUrls.join(", ");
  llmModel.value = config.llmModel;
  llmBaseUrl.value = config.llmBaseUrl;
});

async function saveConfig() {
  await api.updateConfig({
    systemPrompt: systemPrompt.value,
    mcpServerUrls: mcpUrls.value
      .split(",")
      .map(u => u.trim())
      .filter(Boolean),
  });
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
}
</script>

<template>
  <div class="config-panel">
    <h3>Configuration</h3>

    <div class="section">
      <label>LLM Model</label>
      <input :value="llmModel" disabled />
    </div>

    <div class="section">
      <label>LLM Base URL</label>
      <input :value="llmBaseUrl" disabled />
    </div>

    <div class="section">
      <label>System Prompt</label>
      <textarea v-model="systemPrompt" rows="6" placeholder="Enter system prompt..." />
    </div>

    <div class="section">
      <label>MCP Server URLs</label>
      <textarea
        v-model="mcpUrls"
        rows="3"
        placeholder="Comma-separated URLs: stdio://path, http://..."
      />
    </div>

    <button @click="saveConfig" class="save-btn" :class="{ saved }">
      {{ saved ? "Saved!" : "Save Config" }}
    </button>
  </div>
</template>

<style scoped>
.config-panel {
  padding: 16px;
}

h3 {
  font-size: 14px;
  margin-bottom: 16px;
  color: #a0a0a0;
}

.section {
  margin-bottom: 16px;
}

label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
}

input,
textarea {
  width: 100%;
  padding: 8px;
  background: #1a1a2e;
  border: 1px solid #333;
  color: #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
}

input:disabled {
  opacity: 0.6;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #533483;
}

.save-btn {
  width: 100%;
  padding: 8px;
  background: #533483;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.save-btn.saved {
  background: #27ae60;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/ConfigPanel.vue
git commit -m "feat(web): add ConfigPanel component"
```

---

### Task 13: Final Integration and Verification

**Covers:** S1-S5

- [ ] **Step 1: Verify server builds**

Run: `bun run --filter @herta/server typecheck`
Expected: No errors

- [ ] **Step 2: Verify frontend builds**

Run: `bun run --filter @herta/web typecheck`
Expected: No errors

- [ ] **Step 3: Verify server starts**

Run: `bun run --filter @herta/server dev`
Expected: "Herta Chat server running on http://localhost:3000"
Then: Ctrl+C to stop

- [ ] **Step 4: Verify frontend starts**

Run: `bun run --filter @herta/web dev`
Expected: Vite dev server starts on port 5173
Then: Ctrl+C to stop

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -chore: final integration verification"
```
