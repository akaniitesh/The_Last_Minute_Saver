import { Status } from "./common";

export type ActionCategory = "task" | "planner" | "calendar" | "navigation" | "medicine" | "document" | "voice";

export interface ActionParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
}

export interface MiloAction {
  id: string;
  name: string;
  description: string;
  category: ActionCategory;
  parameters: ActionParameter[];
  handler: (args: Record<string, any>) => Promise<any> | any;
}

export interface ActionExecution {
  id: string;
  actionId: string;
  actionName: string;
  arguments: Record<string, any>;
  status: Status;
  result?: any;
  error?: string;
  timestamp: number;
}

export interface ActionState {
  registeredActions: Record<string, MiloAction>;
  executions: ActionExecution[];
  status: Status;
}
