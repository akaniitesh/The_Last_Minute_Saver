import { Coordinates } from "../types/map";
import { TravelMode, RouteInfo } from "../types/navigation";
import { RoutingService } from "./routing";
import { Task } from "../../types";

export interface TravelRecommendation {
  taskId: string;
  taskTitle: string;
  destinationName: string;
  coords: Coordinates;
  route: RouteInfo;
  mode: TravelMode;
  deadlineStr: string;
  isCompleted: boolean;
}

/**
 * Service to process planner/tasks database collections and match items with navigation targets.
 */
export class PlannerService {
  /**
   * Filters all tasks that contain destination labels and coordinates, returning navigation recommendations.
   */
  static extractTravelRecommendations(
    tasks: Task[],
    currentLocation: Coordinates
  ): TravelRecommendation[] {
    const travelTasks = tasks.filter(
      (task) =>
        !task.isArchived &&
        task.destination &&
        task.destinationCoords &&
        typeof task.destinationCoords.lat === "number" &&
        typeof task.destinationCoords.lng === "number"
    );

    return travelTasks.map((task) => {
      const destinationCoords: Coordinates = {
        lat: task.destinationCoords!.lat,
        lng: task.destinationCoords!.lng,
      };

      // Map global Task.travelMode to our strict TravelMode
      let mode: TravelMode = "car";
      if (task.travelMode) {
        if (task.travelMode === "walking") mode = "walking";
        else if (task.travelMode === "bicycle" || task.travelMode === "bike") mode = "bicycle";
        else if (task.travelMode === "train" || task.travelMode === "metro" || task.travelMode === "bus") mode = "train";
      }

      const route = RoutingService.calculateRoute(currentLocation, destinationCoords, mode, false);

      return {
        taskId: task.id,
        taskTitle: task.title,
        destinationName: task.destination || "Target Location",
        coords: destinationCoords,
        route,
        mode,
        deadlineStr: task.deadline,
        isCompleted: !!task.isCompleted,
      };
    });
  }
}
