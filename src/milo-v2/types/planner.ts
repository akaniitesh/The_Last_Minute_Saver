import { Task, Goal, Habit } from "../../types";
import { Status, Priority } from "./common";

export type TaskCategory = "Do Now" | "Do Today" | "Can Wait" | "Delegate" | "Ignore";

export interface PlannerFilter {
  searchQuery?: string;
  category?: TaskCategory;
  priority?: Priority;
  completed?: boolean;
}

export interface PlannerState {
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  filters: PlannerFilter;
  status: Status;
  currentError: string | null;
}
