import { Status } from "./common";

export type AssistantStatus = "idle" | "thinking" | "speaking" | "listening" | "error";

export type AssistantView = "chat" | "planner" | "memory" | "settings";

export interface AssistantConfig {
  personality: "balanced" | "coach" | "rescue" | "silent";
  smartSilence: boolean;
  voiceEnabled: boolean;
  isMuted: boolean;
  model: string;
}

export interface AssistantState {
  isOpen: boolean;
  view: AssistantView;
  status: AssistantStatus;
  config: AssistantConfig;
  currentError: string | null;
}
