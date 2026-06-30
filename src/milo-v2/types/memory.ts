import { Status } from "./common";

export type MemoryCategory = "user_preference" | "fact" | "summary" | "task_context" | "system_log";

export interface MemoryEntry {
  id: string;
  content: string;
  category: MemoryCategory;
  importance: number; // Scale of 1 to 10
  createdAt: number;
  lastAccessedAt: number;
  tags?: string[];
  isPinned?: boolean;
}

export interface MemorySearchResult {
  entry: MemoryEntry;
  score: number; // Search match rating
}

export interface MemoryState {
  entries: MemoryEntry[];
  status: Status;
  currentError: string | null;
}
