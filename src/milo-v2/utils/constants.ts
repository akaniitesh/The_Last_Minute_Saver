export const STORAGE_KEYS = {
  SETTINGS: "milo_settings",
  CHAT_HISTORY: "milo_chat_history",
  MEMORIES: "milo_memories",
  TASK_HISTORY: "milo_task_history",
  ACTIVE_CONVERSATION: "milo_active_conv_id"
} as const;

export const DEFAULT_SETTINGS = {
  theme: "light" as const,
  model: "gemini-3.5-flash",
  temperature: 0.7,
  maxTokens: 2048,
  voice: {
    gender: "neutral" as const,
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voiceName: undefined
  },
  enableAnimations: true,
  keyboardShortcutsEnabled: true
} as const;

export const ASSISTANT_NAMES = ["milo", "mylo"] as const;
