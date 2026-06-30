import React, { createContext } from "react";
import { AssistantState } from "../types/assistant";
import { ChatState, ChatMessage, Conversation } from "../types/chat";
import { MemoryState, MemoryEntry } from "../types/memory";
import { SettingsState } from "../types/settings";
import { PlannerState } from "../types/planner";

export interface MiloState {
  assistant: AssistantState;
  chat: ChatState;
  memory: MemoryState;
  planner: PlannerState;
  settings: SettingsState;
}

export type MiloReducerAction =
  | { type: "TOGGLE_ASSISTANT" }
  | { type: "SET_ASSISTANT_VIEW"; payload: "chat" | "planner" | "memory" | "settings" }
  | { type: "SET_ASSISTANT_STATUS"; payload: "idle" | "thinking" | "speaking" | "listening" | "error" }
  | { type: "SET_ASSISTANT_ERROR"; payload: string | null }
  | { type: "UPDATE_CONFIG"; payload: Partial<AssistantState["config"]> }
  // Chat actions
  | { type: "START_STREAMING" }
  | { type: "STOP_STREAMING" }
  | { type: "SET_CONVERSATIONS"; payload: Conversation[] }
  | { type: "SELECT_CONVERSATION"; payload: string | null }
  | { type: "ADD_MESSAGE"; payload: { conversationId: string; message: ChatMessage } }
  | { type: "UPDATE_MESSAGE_STATUS"; payload: { conversationId: string; messageId: string; status: "sending" | "sent" | "error"; error?: string } }
  | { type: "CREATE_CONVERSATION"; payload: Conversation }
  | { type: "DELETE_CONVERSATION"; payload: string }
  | { type: "CLEAR_CONVERSATIONS" }
  // Memory actions
  | { type: "SET_MEMORIES"; payload: MemoryEntry[] }
  | { type: "ADD_MEMORY"; payload: MemoryEntry }
  | { type: "DELETE_MEMORY"; payload: string }
  | { type: "UPDATE_MEMORY"; payload: MemoryEntry }
  // Settings actions
  | { type: "UPDATE_SETTINGS"; payload: Partial<SettingsState> }
  // Planner actions
  | { type: "SET_TASKS"; payload: any[] }
  | { type: "SET_PLANNER_STATUS"; payload: "idle" | "loading" | "success" | "error" };

export interface MiloContextValue {
  state: MiloState;
  dispatch: React.Dispatch<MiloReducerAction>;
  sendMessage: (text: string) => Promise<void>;
  startVoiceSession: () => void;
  stopVoiceSession: () => void;
  speakText: (text: string) => void;
  addFactMemory: (content: string, category: MemoryEntry["category"]) => void;
  deleteFactMemory: (id: string) => void;
  updateSettings: (settings: Partial<SettingsState>) => void;
}

export const MiloContext = createContext<MiloContextValue | null>(null);
MiloContext.displayName = "MiloContext";
export default MiloContext;
