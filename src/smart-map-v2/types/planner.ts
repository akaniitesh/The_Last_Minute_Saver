import { PlaceCategory } from "./map";

export interface PlannerTimelineItem {
  id: string;
  title: string;
  notes: string;
  deadline: Date | null;
  location: string;
  category: PlaceCategory;
  isCompleted: boolean;
  durationMin?: number;
}
