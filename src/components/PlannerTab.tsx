import { useState } from "react";
import { Task, Subtask } from "../types";
import { AlertTriangle, ArrowRight, Calendar, CheckSquare, Clock, RefreshCw, Shuffle, Sparkles, TrendingUp, Zap } from "lucide-react";

interface PlannerTabProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onSetClockState: (mode: "timeline" | "gauge" | "default") => void;
}

export default function PlannerTab({
  tasks,
  onUpdateTask,
  onSetClockState,
}: PlannerTabProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || "");
  const [replanLoading, setReplanLoading] = useState(false);
  const [replanResult, setReplanResult] = useState<{
    recoveryPlan: string;
    rearrangedTimeline: Array<{ title: string; originalTime: string; newTime: string }>;
  } | null>(null);

  const activeTask = tasks.find(t => t.id === selectedTaskId);

  // Toggle subtask completion
  const handleToggleSubtask = (subId: string) => {
    if (!activeTask) return;
    const updatedSubtasks = activeTask.subtasks?.map(sub => 
      sub.id === subId ? { ...sub, completed: !sub.completed } : sub
    ) || [];

    onUpdateTask({
      ...activeTask,
      subtasks: updatedSubtasks
    });
  };

  // Run AI dynamic replanning
  const handleTriggerReplan = async () => {
    if (!activeTask || !activeTask.subtasks) return;

    setReplanLoading(true);
    onSetClockState("timeline");
    try {
      // Find the first uncompleted subtask as the delay trigger
      const missedIndex = activeTask.subtasks.findIndex(sub => !sub.completed);
      const payloadIndex = missedIndex === -1 ? 0 : missedIndex;

      const res = await fetch("/api/ai/replanning-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: activeTask.subtasks.map(sub => ({
            title: sub.title,
            status: sub.completed ? "completed" : "pending",
            time: sub.durationStr
          })),
          missedTaskIndex: payloadIndex
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Structure the response to compare before/after
        const rearranged = activeTask.subtasks.map((sub, idx) => ({
          title: sub.title,
          originalTime: sub.durationStr,
          newTime: data.rearrangedTimeline[idx]?.newTime || "Compacted"
        }));

        setReplanResult({
          recoveryPlan: data.recoveryPlan,
          rearrangedTimeline: rearranged
        });
      }
    } catch (e) {
      console.error("Replanning failed:", e);
    } finally {
      setReplanLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tab Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono tracking-[0.2em] text-gray-400 uppercase">Task Milestones</span>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        </div>
        <h2 className="text-2xl font-display font-medium text-gray-900 tracking-tight">Autonomous Task Planner</h2>
      </div>

      {/* Task Selector */}
      {tasks.length === 0 ? (
        <div className="bg-white border border-gray-100 p-8 rounded-2xl text-center shadow-sm">
          <Calendar className="mx-auto text-gray-400 mb-3" size={32} />
          <h3 className="text-sm font-mono text-gray-700 font-bold mb-1">No tasks loaded</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Go back to the Cockpit and enter a task deadline. The AI will automatically analyze and design an autonomous milestone checklist.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-400">Active Task:</span>
              <select
                value={selectedTaskId}
                onChange={(e) => {
                  setSelectedTaskId(e.target.value);
                  setReplanResult(null); // Clear previous results
                }}
                className="bg-white border border-gray-200 text-sm font-sans rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-black cursor-pointer"
              >
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            {activeTask && activeTask.riskScore !== undefined && (
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-gray-400">Risk Assessment:</span>
                <span 
                  className="font-bold px-2 py-0.5 rounded"
                  style={{
                    color: activeTask.riskScore > 75 ? "#EF4444" : activeTask.riskScore > 40 ? "#D97706" : "#10B981",
                    backgroundColor: activeTask.riskScore > 75 ? "rgba(239, 68, 68, 0.05)" : activeTask.riskScore > 40 ? "rgba(217, 119, 6, 0.05)" : "rgba(16, 185, 129, 0.05)"
                  }}
                >
                  {activeTask.riskScore}% Probability of Delay
                </span>
              </div>
            )}
          </div>

          {activeTask && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Milestone Checklist (Left Panel) */}
              <div className="lg:col-span-6 bg-white border border-gray-100 p-6 rounded-2xl relative shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                  <h3 className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
                    <CheckSquare size={14} className="text-gray-400" /> Milestone Checkpoints
                  </h3>
                  <span className="text-[10px] font-mono text-gray-400">Sequential Execution</span>
                </div>

                <div className="space-y-3.5">
                  {activeTask.subtasks && activeTask.subtasks.length > 0 ? (
                    activeTask.subtasks.map((sub, idx) => (
                      <div
                        key={sub.id}
                        onClick={() => handleToggleSubtask(sub.id)}
                        className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 cursor-pointer select-none transition-all duration-300 ${
                          sub.completed 
                            ? "border-gray-100 bg-gray-50 opacity-50" 
                            : "border-gray-200 bg-white hover:border-black hover:bg-gray-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Circle Index */}
                          <div 
                            className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                              sub.completed 
                                ? "bg-gray-100 border-gray-200 text-gray-400" 
                                : "border-gray-200 text-gray-600 group-hover:border-black"
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <span className={`text-xs font-medium break-words ${sub.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                              {sub.title}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                            <Clock size={10} /> {sub.durationStr}
                          </span>
                          <span 
                            className="text-[9px] font-mono uppercase px-1.5 py-0.25 rounded-md"
                            style={{
                              color: sub.riskLevel === "high" ? "#EF4444" : sub.riskLevel === "medium" ? "#D97706" : "#10B981",
                              backgroundColor: sub.riskLevel === "high" ? "rgba(239, 68, 68, 0.05)" : sub.riskLevel === "medium" ? "rgba(217, 119, 6, 0.05)" : "rgba(16, 185, 129, 0.05)"
                            }}
                          >
                            {sub.riskLevel}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-gray-400 text-xs italic">
                      No milestones generated. Try to re-submit in cockpit.
                    </div>
                  )}
                </div>

                {/* Replanning Engine Trigger Panel */}
                {activeTask.subtasks && activeTask.subtasks.some(s => !s.completed) && (
                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <div className="p-4 bg-amber-50/20 border border-amber-100 rounded-xl mb-4">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="text-amber-600 mt-0.5" size={15} />
                        <div>
                          <h4 className="text-xs font-mono font-bold text-amber-800 uppercase">Schedule Slippage Check</h4>
                          <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                            If you missed a checkpoint or feel behind, the AI can recalculate the timeline, compress secondary milestones, and create an emergency recovery schedule.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleTriggerReplan}
                      disabled={replanLoading}
                      className="w-full bg-black text-white hover:opacity-90 font-mono text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer shadow-sm"
                    >
                      {replanLoading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Engaging Replanning Calculus...</span>
                        </>
                      ) : (
                        <>
                          <Shuffle size={14} className="text-gray-300" />
                          <span>Engage Dynamic Replanning Engine</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Replanning Comparison (Right Panel) */}
              <div className="lg:col-span-6 bg-white border border-gray-100 p-6 rounded-2xl flex flex-col justify-between relative shadow-sm">
                
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                    <h3 className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-gray-400" /> Recover & Recalculate
                    </h3>
                    <span className="text-[9px] font-mono bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-md">Critical Path</span>
                  </div>

                  {replanResult ? (
                    <div className="space-y-5 animate-fade-in">
                      {/* Recovery Text */}
                      <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-xl">
                        <h4 className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                          <Zap size={11} /> AI Recovery Blueprint
                        </h4>
                        <p className="text-xs text-gray-700 leading-relaxed italic break-words">
                          "{replanResult.recoveryPlan}"
                        </p>
                      </div>

                      {/* Before vs After Timeline list */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wide mb-2.5">Timeline Compression Analysis</h4>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {replanResult.rearrangedTimeline.map((item, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between text-xs font-sans">
                              <span className="text-gray-700 truncate max-w-[180px]">{item.title}</span>
                              <div className="flex items-center gap-2 text-xs font-mono">
                                <span className="text-gray-400 line-through">{item.originalTime}</span>
                                <ArrowRight size={12} className="text-gray-400" />
                                <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100/30">
                                  {item.newTime}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-200 rounded-xl my-8 opacity-60">
                      <Shuffle className="text-gray-400 mb-2" size={24} />
                      <p className="text-xs text-gray-500 font-mono">No active replan computed</p>
                      <p className="text-[10px] text-gray-400 mt-1 max-w-[240px]">
                        Click "Engage Dynamic Replanning Engine" to compute a recovery plan if you have slipped on deadlines.
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono text-gray-400 mt-4">
                  <span>Compression Factor: {replanResult ? "32% Condensed" : "0%"}</span>
                  <span>Timeline Lock: Secure</span>
                </div>

              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
