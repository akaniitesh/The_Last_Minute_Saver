/**
 * Shared, system-wide types for the Milo V2 module.
 */

export type Status = "idle" | "loading" | "success" | "error";

export type Priority = "low" | "medium" | "high" | "critical";

export interface ErrorPayload {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface DateRange {
  startDate: string; // ISO String or YYYY-MM-DD
  endDate: string;   // ISO String or YYYY-MM-DD
}
