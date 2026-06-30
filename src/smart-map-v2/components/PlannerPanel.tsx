import React, { useContext, useEffect } from "react";
import { SmartMapContext } from "../context/SmartMapContext";
import { PlannerService, TravelRecommendation } from "../services/planner";
import { formatDuration } from "../utils/format";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { Task } from "../../types";

interface PlannerPanelProps {
  tasks: Task[];
}

export const PlannerPanel: React.FC<PlannerPanelProps> = ({ tasks }) => {
  const context = useContext(SmartMapContext);
  if (!context) return null;

  const {
    currentLocation,
    plannerRecommendations,
    setPlannerRecommendations,
    selectedRecommendation,
    setSelectedRecommendation,
    setSelectedPlace,
  } = context;

  // Sync tasks on mount / update
  useEffect(() => {
    const recs = PlannerService.extractTravelRecommendations(tasks, currentLocation);
    setPlannerRecommendations(recs);
  }, [tasks, currentLocation, setPlannerRecommendations]);

  const handleSelectRecommendation = (rec: TravelRecommendation) => {
    setSelectedRecommendation(rec);
    setSelectedPlace({
      id: rec.taskId,
      name: rec.taskTitle,
      address: rec.destinationName,
      lat: rec.coords.lat,
      lng: rec.coords.lng,
    });
  };

  const travelTasks = plannerRecommendations.filter((r) => !r.isCompleted);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 space-y-3">
      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
        Today's Smart Schedule
      </h3>

      {travelTasks.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-xs text-neutral-400 font-medium">No travel-bound tasks scheduled</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {travelTasks.map((item) => {
            const isSelected = selectedRecommendation?.taskId === item.taskId;

            return (
              <div
                key={item.taskId}
                onClick={() => handleSelectRecommendation(item)}
                className={`flex flex-col p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? "bg-indigo-50/50 border-indigo-200"
                    : "bg-neutral-50 border-neutral-150 hover:bg-neutral-100/50 hover:border-neutral-250"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate">
                    <p className="text-xs font-semibold text-neutral-800 truncate">{item.taskTitle}</p>
                    <div className="flex items-center text-[10px] text-neutral-400 font-medium mt-1 truncate">
                      <MapPin className="w-3 h-3 mr-1 shrink-0 text-neutral-400" />
                      <span className="truncate">{item.destinationName}</span>
                    </div>
                  </div>
                  
                  {/* Mode indicator */}
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                    {item.mode}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-150/50">
                  <div className="flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    <Clock className="w-3 h-3 mr-1" />
                    Leave by {item.route.suggestedLeaveTime}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-semibold">
                    <span>ETA: {formatDuration(item.route.durationMin)}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default PlannerPanel;
