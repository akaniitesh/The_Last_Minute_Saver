import { Status } from "./common";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  reasoning?: string; // For thinking/reasoning outputs (Gemini Flash Thinking etc)
  status: "sending" | "sent" | "error";
  error?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  status: Status;
  isStreaming: boolean;
  currentError: string | null;
}
