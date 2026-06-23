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
