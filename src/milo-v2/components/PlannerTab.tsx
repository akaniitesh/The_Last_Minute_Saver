import { useState } from "react";
import { useMilo } from "../context/useMilo";
import { geminiService } from "../services/GeminiService";
import { CheckSquare, Calendar, Hourglass, BarChart3, ChevronDown, Wand2, Sparkles, Loader2, PlayCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { logger } from "../utils/logger";

export default function PlannerTab() {
  const { state, dispatch } = useMilo();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  const tasks = state.planner.tasks || [];

  const handleBreakdown = async (taskId: string, title: string, deadline: string) => {
    try {
      setLoadingTaskId(taskId);
      const result = await geminiService.generateTaskPlan(title, deadline);
      
      // Update subtasks for this task inside our React state
      const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: result.subtasks.map((sub, idx) => ({
              id: `v-sub-${Date.now()}-${idx}`,
              title: sub.title,
              durationStr: sub.durationStr,
              milestoneIndex: sub.milestoneIndex + 1,
              riskLevel: sub.riskLevel || "low",
              completed: false
            }))
          };
        }
        return t;
      });

      dispatch({ type: "SET_TASKS", payload: updatedTasks });

      // Trigger standard browser storage sync to persist task subtasks back to parent application
      localStorage.setItem("saver_tasks", JSON.stringify(updatedTasks));
      window.dispatchEvent(new Event("storage"));

      logger.info(`Successfully generated AI subtask breakdown for task ${taskId}`);
    } catch (error) {
      console.error("AI Planner breakdown failed:", error);
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId && t.subtasks) {
        return {
          ...t,
          subtasks: t.subtasks.map((sub: any) =>
            sub.id === subsubIdMatch(sub, subtaskId) ? { ...sub, completed: !sub.completed } : sub
          )
        };
      }
      return t;
    });

    dispatch({ type: "SET_TASKS", payload: updatedTasks });
    localStorage.setItem("saver_tasks", JSON.stringify(updatedTasks));
    window.dispatchEvent(new Event("storage"));
  };

  const subsubIdMatch = (sub: any, targetId: string) => {
    return sub.id || sub._id || targetId;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs">
      
      {/* Header Panel */}
      <div className="bg-gray-50 border-b border-gray-150 p-3 px-4 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Smart Planner Sync</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Tracking your active workspace milestones in real-time.</p>
        </div>
        <div className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-[10px] font-mono font-bold text-indigo-600 uppercase">
          {tasks.length} Tasks Syncing
        </div>
      </div>

      {/* Main task scroll box */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FCFCFC]">
        {tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-150 flex items-center justify-center">
              <CheckSquare size={16} className="text-gray-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Clear Desk Strategy</h4>
              <p className="text-[10px] text-gray-400 max-w-[220px] mt-1 leading-relaxed">
                Zero active tasks found in your current view. Use manual cockpit entries or Milo verbal commands to load some tasks.
              </p>
            </div>
          </div>
        ) : (
          tasks.map(t => {
            const isExpanded = selectedTaskId === t.id;
            const isLoading = loadingTaskId === t.id;

            return (
              <div
                key={t.id}
                className="bg-white border border-gray-150 rounded-2xl hover:border-gray-200 shadow-3xs overflow-hidden transition-all"
              >
                {/* Header card view */}
                <div
                  onClick={() => setSelectedTaskId(isExpanded ? null : t.id)}
                  className="p-3.5 cursor-pointer flex items-center justify-between gap-3 hover:bg-gray-50/50"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-gray-950 truncate block leading-none">{t.title}</span>
                      {t.priority && (
                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-mono uppercase tracking-wider font-bold leading-none ${
                          t.priority === "high"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : t.priority === "medium"
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                          {t.priority}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2.5 text-[9px] font-mono text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {t.deadline || "No deadline"}
                      </span>
                      {t.effortEstimatedHours && (
                        <span className="flex items-center gap-1">
                          <Hourglass size={11} />
                          {t.effortEstimatedHours} hrs
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-indigo-500 font-bold bg-indigo-50/50 px-1.5 py-0.5 rounded-lg">
                      {t.riskScore ? `${t.riskScore}% risk` : "No risk"}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {/* Expanded Details Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="border-t border-gray-100 bg-gray-50/50 overflow-hidden text-xs"
                    >
                      <div className="p-4 space-y-4">
                        {/* Task justifications or suggestions */}
                        {t.justification && (
                          <div className="bg-white border border-gray-150 p-3 rounded-xl shadow-4xs">
                            <h4 className="text-[10px] font-mono uppercase tracking-widest font-bold text-indigo-600 mb-1 flex items-center gap-1">
                              <Sparkles size={11} />
                              Milo Assessment Checklist
                            </h4>
                            <p className="text-[11px] text-gray-600 leading-relaxed font-sans">{t.justification}</p>
                          </div>
                        )}

                        {/* Milestones and Subtasks Section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">Milestones Plan</h4>
                            
                            <button
                              onClick={() => handleBreakdown(t.id, t.title, t.deadline)}
                              disabled={isLoading}
                              className="px-2.5 py-1 bg-white border border-gray-200 hover:border-indigo-200 text-indigo-600 rounded-lg text-[9px] font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all shadow-4xs disabled:opacity-50"
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 size={11} className="animate-spin" />
                                  <span>Decomposing...</span>
                                </>
                              ) : (
                                <>
                                  <Wand2 size={11} />
                                  <span>AI Breakdown</span>
                                </>
                              )}
                            </button>
                          </div>

                          {t.subtasks && t.subtasks.length > 0 ? (
                            <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-100 shadow-4xs">
                              {t.subtasks.map((sub: any) => (
                                <div key={sub.id} className="p-2.5 flex items-start gap-2.5 hover:bg-gray-50/30 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={sub.completed}
                                    onChange={() => handleToggleSubtask(t.id, sub.id)}
                                    className="w-3.5 h-3.5 mt-0.5 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className={`text-[11px] font-medium leading-tight block ${
                                      sub.completed ? "line-through text-gray-400 font-normal" : "text-gray-700"
                                    }`}>
                                      {sub.title}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5 text-[8px] font-mono text-gray-400">
                                      <span>Index: {sub.milestoneIndex}</span>
                                      <span>•</span>
                                      <span>{sub.durationStr}</span>
                                      <span>•</span>
                                      <span className={
                                        sub.riskLevel === "high" ? "text-red-500 font-bold" : sub.riskLevel === "medium" ? "text-amber-500 font-medium" : "text-gray-400"
                                      }>
                                        {sub.riskLevel} risk
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center p-4 py-6 bg-white border border-dashed border-gray-200 rounded-xl">
                              <p className="text-[10px] text-gray-400">No milestones compiled yet. Click the "AI Breakdown" button to trigger automatic smart path decomposition.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
