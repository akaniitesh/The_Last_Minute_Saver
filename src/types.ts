export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO date or descriptive string
  notes?: string;
  priority?: "high" | "medium" | "low";
  effortEstimatedHours?: number;
  riskScore?: number;
  completionProbability?: number;
  category?: "Do Now" | "Do Today" | "Can Wait" | "Delegate" | "Ignore";
  justification?: string;
  subtasks?: Subtask[];
  suggestedAction?: string;
  destination?: string;
  arrivalTime?: string;
  travelMode?: "walking" | "bicycle" | "bike" | "car" | "taxi" | "bus" | "train" | "metro" | "flight";
  destinationCoords?: { lat: number; lng: number };
  isCompleted?: boolean;
  isArchived?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  durationStr: string;
  milestoneIndex: number;
  riskLevel: "low" | "medium" | "high";
  completed: boolean;
}

export interface CoachGuidance {
  recommendation: string;
  warning: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startHour: number; // 0-24
  durationHours: number;
  type: "focus" | "meeting" | "class" | "personal";
}

export interface Goal {
  id: string;
  title: string;
  targetDate: string;
  progress: number; // 0-100
  category: "academic" | "career" | "personal" | "health" | "finance" | "custom";
  priority?: "low" | "medium" | "high";
  estimatedEffort?: string;
  description?: string;
  color?: string;
  icon?: string;
  reminder?: string;
  milestones?: Milestone[];
  weeklyPlan?: string[];
  riskFactors?: string[];
  estimatedCompletionTime?: string;
  isPaused?: boolean;
  isArchived?: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  estimatedTime: string;
  priority: "low" | "medium" | "high";
  deadline: string;
  completionPercentage: number;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
  history: boolean[]; // last 7 days
  frequency?: "daily" | "weekdays" | "weekends" | "custom";
  customDays?: string[]; // e.g. ["Mon", "Wed", "Fri"]
  specificTimes?: string[]; // e.g. ["09:00 AM", "06:00 PM"]
  reminderFrequency?: string; // e.g. "Once daily", "Twice daily"
  optimalReminderTime?: string; // AI Recommended time
}

export interface VoiceMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  reasoning?: string;
  generatedPlan?: string;
  priorityList?: string[];
  timeline?: string[];
  riskAssessment?: string;
  recommendedActions?: string[];
}

export interface ScannedDoc {
  id: string;
  fileName: string;
  title?: string;
  deadlines?: string[];
  keyRequirements?: string[];
  risks?: string[];
  estimatedHours?: number;
  studyPlan?: Array<{ week: string; focus: string }>;
  rawText?: string;
}
