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
