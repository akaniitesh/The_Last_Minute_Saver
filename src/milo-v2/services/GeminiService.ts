import { BaseService } from "./BaseService";
import { ChatMessage } from "../types/chat";
import { logger } from "../utils/logger";

export interface AssistantResponsePayload {
  transcript: string;
  reasoning?: string;
  generatedPlan?: string;
  priorityList?: string[];
  timeline?: string[];
  riskAssessment?: string;
  recommendedActions?: string[];
  clockTrigger?: string;
  actionType?: string;
  actionPayload?: any;
  suggestedChips?: Array<{ label: string; cmd: string }>;
}

export class GeminiService extends BaseService {
  protected name = "GeminiService";

  protected onInitialize(): void {
    // Initialized
  }

  protected onDispose(): void {
    // Clean up
  }

  async sendVoiceAssistantQuery(
    query: string,
    contextPayload: Record<string, any>
  ): Promise<AssistantResponsePayload> {
    try {
      logger.info(`Sending query to Voice Assistant: "${query}"`);
      const response = await fetch("/api/ai/voice-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, context: contextPayload })
      });

      if (!response.ok) {
        throw new Error(`Voice Assistant API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data as AssistantResponsePayload;
    } catch (error) {
      logger.error("Error calling Voice Assistant API:", error);
      throw error;
    }
  }

  async generateTaskPlan(
    taskTitle: string,
    dueDate?: string
  ): Promise<{ subtasks: Array<{ title: string; durationStr: string; milestoneIndex: number; riskLevel: string }> }> {
    try {
      logger.info(`Requesting task plan breakdown for: "${taskTitle}"`);
      const response = await fetch("/api/ai/task-planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskTitle, dueDate })
      });

      if (!response.ok) {
        throw new Error(`Task Planning API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error("Error generating task plan:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
export default geminiService;
