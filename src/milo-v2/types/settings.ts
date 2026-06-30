export interface VoiceSettings {
  gender: "male" | "female" | "neutral";
  rate: number;   // 0.5 to 2.0
  pitch: number;  // 0.5 to 2.0
  volume: number; // 0.0 to 1.0
  voiceName?: string;
}

export interface SettingsState {
  theme: "light" | "dark" | "system";
  model: string;
  temperature: number; // 0.0 to 1.0
  maxTokens: number;
  voice: VoiceSettings;
  enableAnimations: boolean;
  keyboardShortcutsEnabled: boolean;
}
