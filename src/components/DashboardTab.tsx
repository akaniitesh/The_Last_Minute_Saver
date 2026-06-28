import React, { useState, useEffect, FormEvent } from "react";
import { Task, CoachGuidance } from "../types";
import { useAuth } from "../context/AuthContext";
import { useLocalization } from "../context/LocalizationContext";
import { 
  AlertCircle, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles, 
  Zap, 
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  Info,
  Bell,
  X,
  CalendarRange,
  Flame,
  Clock,
  UserCheck,
  Minimize2,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  VolumeX,
  Volume2,
  ThumbsUp,
  Timer,
  Edit,
  Copy,
  Trash,
  FileDown,
  CheckSquare,
  Archive,
  Mic,
  Calendar,
  Lightbulb
} from "lucide-react";

interface DashboardTabProps {
  tasks: Task[];
  onNavigateTab?: (tab: string) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onDuplicateTask: (task: Task) => void;
  onClearAllTasks: () => void;
  onReorderTasks: (tasks: Task[]) => void;
  isDemoMode: boolean;
  onSetClockState: (risk: number, activeTasks: number) => void;
  isRescueMode: boolean;
  attentionMuted: boolean;
  setAttentionMuted: (muted: boolean) => void;
  muteDuration: string;
  setMuteDuration: (duration: string) => void;
  muteSecondsLeft: number | null;
  setMuteSecondsLeft: (sec: number | null) => void;
  cooldowns: Record<string, number>;
  setCooldowns: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  acknowledgedWarnings: string[];
  setAcknowledgedWarnings: React.Dispatch<React.SetStateAction<string[]>>;
  quietRecoveryMode: boolean;
  setQuietRecoveryMode: (enabled: boolean) => void;
  ignoredCount: number;
  setIgnoredCount: React.Dispatch<React.SetStateAction<number>>;
  closedCount: number;
  setClosedCount: React.Dispatch<React.SetStateAction<number>>;
  completedCount: number;
  setCompletedCount: React.Dispatch<React.SetStateAction<number>>;
  budgetUsed: number;
  setBudgetUsed: (used: number) => void;
}

export default function DashboardTab({
  tasks,
  onNavigateTab,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
  onClearAllTasks,
  onReorderTasks,
  isDemoMode,
  onSetClockState,
  isRescueMode,
  attentionMuted,
  setAttentionMuted,
  muteDuration,
  setMuteDuration,
  muteSecondsLeft,
  setMuteSecondsLeft,
  cooldowns,
  setCooldowns,
  acknowledgedWarnings,
  setAcknowledgedWarnings,
  quietRecoveryMode,
  setQuietRecoveryMode,
  ignoredCount,
  setIgnoredCount,
  closedCount,
  setClosedCount,
  completedCount,
  setCompletedCount,
  budgetUsed,
  setBudgetUsed,
}: DashboardTabProps) {
  const { user } = useAuth();
  const { productivitySuggestions } = useLocalization();
  const [taskName, setTaskName] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ taskName?: string; deadlineDate?: string }>({});
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("Analyzing task...");
  const [aiError, setAiError] = useState(false);
  
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [sessionsScheduled, setSessionsScheduled] = useState(false);
  const [dailyPlanCreated, setDailyPlanCreated] = useState(false);
  
  const [draggedOverCategory, setDraggedOverCategory] = useState<string | null>(null);
  const [density, setDensity] = useState<"standard" | "compact" | "minimal">("standard");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    "Can Wait": false,
    "Delegate": false,
    "Ignore": false,
  });
  
  // --- Intelligent Pacing Modes ---
  const [pacingMode, setPacingMode] = useState<"Relaxed" | "Balanced" | "Focused" | "Sprint" | "Adaptive">(() => {
    return (localStorage.getItem("saver_pacing_mode") as any) || "Adaptive";
  });

  const activePacingMode = React.useMemo(() => {
    if (pacingMode !== "Adaptive") return pacingMode;
    // Auto-select mode based on workload tasks:
    const activeTasks = tasks.filter(t => t.category === "Do Now" || t.category === "Do Today");
    const totalHours = tasks.reduce((sum, t) => sum + (t.effortEstimatedHours || 0), 0);
    
    if (activeTasks.length >= 4 || totalHours >= 24) return "Sprint";
    if (activeTasks.length >= 2 || totalHours >= 12) return "Focused";
    if (tasks.length >= 1 || totalHours >= 4) return "Balanced";
    return "Relaxed";
  }, [pacingMode, tasks]);

  const handlePacingModeChange = (mode: "Relaxed" | "Balanced" | "Focused" | "Sprint" | "Adaptive") => {
    setPacingMode(mode);
    localStorage.setItem("saver_pacing_mode", mode);
    triggerToast(`Pacing mode calibrated to ${mode}.`);
  };

  const pacingRecommendations = {
    Relaxed: {
      title: "Mindful Pacing Zone",
      intensity: 1,
      desc: "Low-density workload detected. Your cognitive calendar corridors are fully open. Perfect time to focus on deep, unhurried learning, creative exploration, or habit cultivation.",
      tips: [
        "Schedule longer, low-intensity focus sessions (30-45 minutes) with generous cooldown breaks.",
        "Dedicate time to establishing daily mindfulness, wellness habits, and self-care routines.",
        "Begin exploratory research on upcoming future goals to avoid downstream compression."
      ],
      color: "text-emerald-700 bg-emerald-50 border-emerald-100",
      badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    },
    Balanced: {
      title: "Steady Flow Zone",
      intensity: 2,
      desc: "Nominal moderate workload. Maintain a steady, sustainable progress rate to stay ahead of future deadlines without risk of cognitive fatigue.",
      tips: [
        "Divide tasks into standard Pomodoro intervals (25 mins work, 5 mins active recovery).",
        "Target exactly one high-priority milestone today before shifting attention to smaller chores.",
        "Keep daily expected focus effort under 3 hours to preserve energy reserves."
      ],
      color: "text-indigo-700 bg-indigo-50 border-indigo-100",
      badgeColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
    },
    Focused: {
      title: "High Focus Corridor",
      intensity: 3,
      desc: "High density workload. Multiple critical tasks in progress. The AI pacing engine recommends strict calendar slotting and active distraction isolation.",
      tips: [
        "Isolate heavy milestones into dedicated 50-minute work sprints followed by 10-minute quiet blocks.",
        "Mute peripheral alert channels and close secondary browser tabs during work intervals.",
        "Explicitly log subtask goals before commencing focus timers to preserve contextual alignment."
      ],
      color: "text-amber-700 bg-amber-50 border-amber-100",
      badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20"
    },
    Sprint: {
      title: "Tactical Compression Zone",
      intensity: 4,
      desc: "Critical schedule compression detected. Heavy backlog with tight deadlines. Immediate, highly-structured execution is required to avoid delay.",
      tips: [
        "Execute subtask milestones strictly in chronological sequence; avoid planning or meta-work.",
        "Engage Rescue Mode immediately to automatically compress attention noise.",
        "Limit intense study to 90-minute hyper-focus cycles followed by 15 minutes of complete physical rest."
      ],
      color: "text-red-700 bg-red-50 border-red-100",
      badgeColor: "bg-red-500/10 text-red-500 border-red-500/20"
    }
  };

  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [coachGuidance, setCoachGuidance] = useState<CoachGuidance | null>(null);
  const [loadingCoach, setLoadingCoach] = useState(false);

  // --- Adaptive Reminder Engine States ---
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([]);
  const [adjustedReminders, setAdjustedReminders] = useState<Record<string, string>>({});
  const [delegatedReminders, setDelegatedReminders] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDeadline, setEditingDeadline] = useState("");
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showConfirmDeleteAllModal, setShowConfirmDeleteAllModal] = useState(false);

  const [forceShowSuggestions, setForceShowSuggestions] = useState(false);
  const [showNotNowMenu, setShowNotNowMenu] = useState(false);

  // Trigger a self-dismissing toast notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Helper to dynamically build fatigue-free interactive reminders based on tasks
  const generateAdaptiveReminders = () => {
    // 1. If daily attention budget is fully used, block all proactive items unless risk is extreme (>90)
    // 2. If a cooldown is active for a specific risk level, filter out recommendations at that risk level!
    // 3. Filter out any acknowledged warnings in acknowledgedWarnings.

    const isCooldownActive = (risk: number) => {
      const now = Date.now();
      if (risk > 90 && cooldowns.critical && cooldowns.critical > now) return true;
      if (risk > 70 && risk <= 90 && cooldowns.high && cooldowns.high > now) return true;
      if (risk > 40 && risk <= 70 && cooldowns.medium && cooldowns.medium > now) return true;
      if (risk <= 40 && cooldowns.low && cooldowns.low > now) return true;
      return false;
    };

    const list: Array<{
      id: string;
      title: string;
      type: "habit" | "deadline" | "escalation";
      tag: string;
      message: string;
      suggestedAction: string;
      risk?: number;
    }> = [];

    // Habit spacing and consistency can only show if budget allows and not muted
    if (budgetUsed < 5) {
      list.push({
        id: "rem-habit-read",
        title: "Adaptive Spacing: Read 20 Pages",
        type: "habit",
        tag: "Daily Habit - High Consistency Streak",
        message: "You have completed your daily reading 8 days in a row! AI predicts fatigue will reduce evening motivation by 40% if delayed past 9:00 PM.",
        suggestedAction: "Execute habit in your 4:30 PM calendar opening for a 94% success probability."
      });

      list.push({
        id: "rem-habit-water",
        title: "Anti-Fatigue Filter: Drink Water Habit",
        type: "habit",
        tag: "Varying Habit Interval - Passive Mode",
        message: "Skip yesterday's water alert? To prevent cognitive alarm blindness, the engine has shifted prompts to your active mid-morning recovery gap.",
        suggestedAction: "Pacing shifted (+45 mins) to protect attention reservoir."
      });
    }

    // 2. Task Deadlines (staged notifications depending on risk)
    tasks.forEach(task => {
      const riskVal = task.riskScore || 50;

      // Skip if this specific task warning is in acknowledged list
      if (acknowledgedWarnings.includes(`ack-${task.id}`)) return;

      // Skip if cooldown is active for this risk level
      if (isCooldownActive(riskVal)) return;

      // If budget is exhausted, only critical alerts above 90 risk can break through
      if (budgetUsed >= 5 && riskVal <= 90) return;

      if (riskVal > 85) {
        list.push({
          id: `rem-dl-emerg-${task.id}`,
          title: `CRITICAL COMPRESSION BLOCK: ${task.title}`,
          type: "escalation",
          tag: "4 Hours Left - Emergency Target",
          message: `Active compression required. Remaining effort (${task.effortEstimatedHours || 3}h) exceeds standard blocks. Recovery plan suggested.`,
          suggestedAction: "Deploy Emergency Rescue, skip non-essential edits, and assign subtasks.",
          risk: riskVal
        });
      } else if (riskVal > 70) {
        list.push({
          id: `rem-dl-recov-${task.id}`,
          title: `Late Stage Recovery Plan: ${task.title}`,
          type: "deadline",
          tag: "1 Day Left - High Risk Limit",
          message: "A single, gentle reminder is insufficient. Escalating frequency with automated pacing. Delay likelihood is high based on historic activity levels.",
          suggestedAction: "Postpone secondary items; delegate 'Literature summary' to team member.",
          risk: riskVal
        });
      } else if (riskVal > 40) {
        list.push({
          id: `rem-dl-milestone-${task.id}`,
          title: `Actionable Pacing Prompt: ${task.title}`,
          type: "deadline",
          tag: "3 Days Left - Action Trigger",
          message: "Timeline comfort buffer shrinking. Groundwork outline verified?",
          suggestedAction: "Complete the primary content section today to lock in consistent margin.",
          risk: riskVal
        });
      } else {
        list.push({
          id: `rem-dl-comfort-${task.id}`,
          title: `Comfort Pace Anchor: ${task.title}`,
          type: "info" as any,
          tag: "7 Days Left - Minimal Intrusion",
          message: "Standard pacing secure. Comfort limits hold.",
          suggestedAction: "Single quiet pacing review scheduled for Thursday afternoon.",
          risk: riskVal
        });
      }
    });

    return list.filter(item => !dismissedReminders.includes(item.id));
  };

  // Fetch AI Coaching suggestions based on current tasks
  const fetchCoachAdvice = async () => {
    setLoadingCoach(true);
    try {
      const activeTasks = tasks.filter(t => t.category === "Do Now" || t.category === "Do Today");
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentTaskCount: tasks.length,
          deadlineProximity: activeTasks.length > 0 ? "Due in 24 hours" : "None immediate",
          energyLevel: isRescueMode ? "Emergency" : "Medium"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCoachGuidance(data);
      }
    } catch (e) {
      console.warn("API Error:", e);
    } finally {
      setLoadingCoach(false);
    }
  };

  useEffect(() => {
    fetchCoachAdvice();
  }, [tasks.length, isRescueMode]);

  useEffect(() => {
    if (!loading) return;
    const messages = [
      "Analyzing task...",
      "Estimating workload...",
      "Calculating difficulty...",
      "Checking calendar...",
      "Checking existing deadlines...",
      "Estimating required focus hours...",
      "Generating execution strategy...",
      "Building milestone plan...",
      "Finalizing recommendations..."
    ];
    let index = 0;
    setProgressMessage(messages[0]);
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setProgressMessage(messages[index]);
    }, 800);
    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyzeDeadline = async (e: FormEvent) => {
    e.preventDefault();
    
    // Form Validation
    const newErrors: { taskName?: string; deadlineDate?: string } = {};
    if (!taskName.trim()) {
      newErrors.taskName = "Task title is required.";
    }
    if (!deadlineDate) {
      newErrors.deadlineDate = "Deadline is required.";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setAiError(false);
    setLoading(true);

    try {
      const payload = {
        taskName,
        deadline: deadlineDate,
        notes: notes + (description ? " | " + description : ""),
        priority,
        existingTasks: tasks,
        userWorkSchedule: localStorage.getItem("saver_work_schedule") || "Standard 9-5",
        habits: JSON.parse(localStorage.getItem("saver_goals") || "[]"),
        travelPlans: localStorage.getItem("saver_travel_mode_type") || "none",
        medicineSchedule: JSON.parse(localStorage.getItem("saver_medications") || "[]"),
        focusSessions: JSON.parse(localStorage.getItem("saver_cooldowns") || "{}"),
        previousProductivityHistory: {
          ignoredCount,
          closedCount,
          completedCount
        }
      };

      const res = await fetch("/api/ai/deadline-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Unable to analyze the task.");
      }
      
      const result = await res.json();
      setAnalysisResult(result);
    } catch (err) {
      console.error("AI deadline intelligence calibration failed:", err);
      setAiError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCalibratedTask = () => {
    if (!analysisResult) return;

    // Determine category based on priority selection
    const categoryMap: Record<string, string> = {
      "Urgent": "Do Now",
      "High": "Do Today",
      "Medium": "Can Wait",
      "Low": "Delegate"
    };
    const cat = (categoryMap[priority] || "Can Wait") as "Can Wait" | "Do Now" | "Do Today" | "Delegate" | "Ignore";

    // Add task with AI results
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskName,
      deadline: deadlineDate,
      notes: notes + (description ? " | " + description : ""),
      effortEstimatedHours: parseInt(analysisResult.estimatedWorkHours) || 8,
      riskScore: analysisResult.riskScore,
      completionProbability: analysisResult.completionProbability,
      category: cat,
      justification: analysisResult.delayReason || "Calibrated via AI Deadline Engine.",
      suggestedAction: analysisResult.suggestions?.[0] || "Execute planned milestones chronologically.",
      subtasks: analysisResult.milestones.map((step: any, sIdx: number) => ({
        id: `sub-${Date.now()}-${sIdx}`,
        title: step.title,
        durationStr: step.duration,
        milestoneIndex: sIdx + 1,
        completed: false,
        riskLevel: analysisResult.riskLevel?.toLowerCase() === "high" ? "high" : analysisResult.riskLevel?.toLowerCase() === "medium" ? "medium" : "low"
      }))
    };

    onAddTask(newTask);
    onSetClockState(analysisResult.riskScore, tasks.length + 1);

    // Reset Inputs & Results
    setTaskName("");
    setDeadlineDate("");
    setNotes("");
    setPriority("Medium");
    setDescription("");
    setAnalysisResult(null);
    setErrors({});
    setCalendarAdded(false);
    setSessionsScheduled(false);
    setDailyPlanCreated(false);
    triggerToast("Calibrated task successfully saved!");
  };

  const handleEditCalibratedTask = () => {
    setAnalysisResult(null);
  };

  const handleDiscardCalibratedTask = () => {
    setTaskName("");
    setDeadlineDate("");
    setNotes("");
    setPriority("Medium");
    setDescription("");
    setAnalysisResult(null);
    setErrors({});
    setAiError(false);
    setCalendarAdded(false);
    setSessionsScheduled(false);
    setDailyPlanCreated(false);
  };

  const handleSaveWithoutAI = () => {
    // Determine category based on priority selection
    const categoryMap: Record<string, string> = {
      "Urgent": "Do Now",
      "High": "Do Today",
      "Medium": "Can Wait",
      "Low": "Delegate"
    };
    const cat = (categoryMap[priority] || "Can Wait") as "Can Wait" | "Do Now" | "Do Today" | "Delegate" | "Ignore";

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskName,
      deadline: deadlineDate,
      notes: notes + (description ? " | " + description : ""),
      effortEstimatedHours: 4,
      riskScore: 30,
      completionProbability: 85,
      category: cat,
      justification: "Created manually without AI calibration.",
      suggestedAction: "Complete task manually.",
      subtasks: [
        {
          id: `sub-${Date.now()}-1`,
          title: "Initial Draft",
          durationStr: "2 Hours",
          milestoneIndex: 1,
          completed: false,
          riskLevel: "low"
        },
        {
          id: `sub-${Date.now()}-2`,
          title: "Final Review",
          durationStr: "2 Hours",
          milestoneIndex: 2,
          completed: false,
          riskLevel: "low"
        }
      ]
    };

    onAddTask(newTask);
    onSetClockState(30, tasks.length + 1);
    
    // Reset Inputs
    setTaskName("");
    setDeadlineDate("");
    setNotes("");
    setPriority("Medium");
    setDescription("");
    setAnalysisResult(null);
    setAiError(false);
    setErrors({});
    triggerToast("Task saved without AI analysis.");
  };

  // Group tasks by priority category
  const categories = ["Do Now", "Do Today", "Can Wait", "Delegate", "Ignore"];
  const getTasksByCategory = (cat: string) => tasks.filter(t => t.category === cat);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono tracking-[0.2em] text-gray-400 uppercase">Productivity Cockpit</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <h2 className="text-2xl font-display font-medium text-gray-900 tracking-tight">
            Welcome back, <span className="font-bold text-indigo-600">{user?.displayName || user?.email?.split("@")[0] || "Nitesh"}</span> 👋
          </h2>
        </div>
        <div className="text-left sm:text-right font-mono text-[10px] text-gray-400 uppercase leading-relaxed shrink-0">
          <div>Today: {new Date().toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          <div>Intel Level: <span className="text-emerald-500 font-bold">Workspace Active</span></div>
        </div>
      </div>

      {/* Today's Productivity Insights (Replacement of Cognitive Pacing Control) */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-mono tracking-wider text-indigo-600 uppercase flex items-center gap-1.5 font-bold">
              <Sparkles size={14} className="text-indigo-600 animate-pulse" /> Today's Productivity Insights
            </h3>
            <p className="text-[11px] text-gray-400">
              Personalized execution overview and environmental triggers calculated by Milo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              Live Synthesis Active
            </span>
          </div>
        </div>

        {/* Bento Grid: Summary Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Column 1: Priority & Next Action */}
          <div className="bg-gray-50/40 border border-gray-150/75 p-4 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase text-indigo-500 font-bold block">PRIORITY METRICS</span>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 block">Highest Priority:</span>
                <span className="text-xs font-bold text-gray-900 block truncate">
                  {tasks.find(t => t.category === "Do Now" && !t.isCompleted)?.title || tasks.find(t => !t.isCompleted)?.title || "No outstanding tasks! 🎉"}
                </span>
              </div>
              <div className="space-y-1 pt-1.5">
                <span className="text-xs text-gray-400 block">Recommended Next Task:</span>
                <span className="text-xs font-bold text-indigo-600 block truncate">
                  {tasks.find(t => !t.isCompleted && t.category !== "Do Now")?.title || "Plan a new focus block"}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Time & Deadlines */}
          <div className="bg-gray-50/40 border border-gray-150/75 p-4 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase text-indigo-500 font-bold block">TIME CALIBRATION</span>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 block">Closest Deadline:</span>
                <span className="text-xs font-bold text-gray-900 block truncate">
                  {(() => {
                    const sortedDeadlines = [...tasks]
                      .filter(t => !t.isCompleted && t.deadline)
                      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
                    if (sortedDeadlines.length > 0) {
                      return `${sortedDeadlines[0].title} (${new Date(sortedDeadlines[0].deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
                    }
                    return "None scheduled";
                  })()}
                </span>
              </div>
              <div className="space-y-1 pt-1.5">
                <span className="text-xs text-gray-400 block">Estimated Free Time Today:</span>
                <span className="text-xs font-bold text-emerald-600 block">
                  {(() => {
                    const outstandingHours = tasks.filter(t => !t.isCompleted).reduce((sum, t) => sum + (t.effortEstimatedHours || 0), 0);
                    return `${Math.max(1.5, Math.round((8 - (outstandingHours * 0.5)) * 10) / 10)} Hours remaining`;
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Environmental & Health Reminders */}
          <div className="bg-gray-50/40 border border-gray-150/75 p-4 rounded-2xl space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase text-indigo-500 font-bold block">TRIGGERS & REMINDERS</span>
              <div className="flex items-start gap-1.5 text-[11px] text-gray-600 leading-normal">
                <span className="text-amber-500 shrink-0 mt-0.5">☀️</span>
                <span className="truncate">Weather Impact: Clear and mild. Perfect for library study sessions.</span>
              </div>
              <div className="flex items-start gap-1.5 text-[11px] text-gray-600 leading-normal">
                <span className="text-blue-500 shrink-0 mt-0.5">🚗</span>
                <span className="truncate">Travel: Class transit paths clear. Departure alert scheduled.</span>
              </div>
              <div className="flex items-start gap-1.5 text-[11px] text-gray-600 leading-normal">
                <span className="text-rose-500 shrink-0 mt-0.5">❤️</span>
                <span className="truncate">Health: Dosage windows synchronized with study sessions.</span>
              </div>
            </div>
          </div>

        </div>

        {/* Quick Action Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
          <span className="text-[10px] font-mono uppercase text-gray-400 mr-1">One-Click Actions:</span>
          <button
            onClick={() => onNavigateTab?.("focus")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase rounded-xl transition-all shadow-2xs hover:shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Clock size={13} />
            <span>Start Focus Session</span>
          </button>
          <button
            onClick={() => onNavigateTab?.("voice")}
            className="px-4 py-2 bg-neutral-950 hover:bg-black text-white text-xs font-mono font-bold uppercase rounded-xl transition-all shadow-2xs hover:shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Mic size={13} />
            <span>Ask Milo</span>
          </button>
          <button
            onClick={() => onNavigateTab?.("planner")}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-mono font-bold uppercase border border-gray-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Calendar size={13} />
            <span>View Plan</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: Left Input / Right Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Form Card */}
        <div className="lg:col-span-7 bg-white border border-gray-100 p-6 rounded-2xl relative overflow-hidden shadow-sm transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sparkles size={120} className="text-gray-400" />
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-fade-in" id="calibration-loader">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={20} className="text-black animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold font-mono text-gray-800 uppercase tracking-wider animate-pulse">
                  Calibrating Deadline
                </h4>
                <p className="text-xs text-gray-500 font-mono">
                  {progressMessage}
                </p>
              </div>
              <div className="w-48 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-black h-full animate-[loading-bar_4s_infinite_linear] rounded-full" style={{ width: "60%" }} />
              </div>
            </div>
          )}

          {!loading && aiError && (
            <div className="py-8 text-center space-y-6" id="calibration-error">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold font-mono text-gray-800 uppercase tracking-wider">
                  Unable to analyze the task
                </h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  The deadline calibration engine encountered an issue while communicating with the AI workspace.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleAnalyzeDeadline}
                  className="w-full sm:w-auto bg-black text-white hover:opacity-90 font-mono text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Retry
                </button>
                <button
                  onClick={() => setAiError(false)}
                  className="w-full sm:w-auto bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-mono text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Edit Task
                </button>
                <button
                  onClick={handleSaveWithoutAI}
                  className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 font-mono text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Save Without AI
                </button>
              </div>
            </div>
          )}

          {!loading && !aiError && analysisResult && (
            <div className="space-y-6 animate-fade-in" id="calibration-results">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-mono font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-600" /> AI Calibrated Plan
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono uppercase">Task: {taskName}</p>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase ${
                  analysisResult.riskLevel?.toLowerCase() === "high" || analysisResult.riskLevel?.toLowerCase() === "critical"
                    ? "bg-red-50 text-red-600 border border-red-100"
                    : analysisResult.riskLevel?.toLowerCase() === "medium"
                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                }`}>
                  {analysisResult.riskLevel} Risk
                </span>
              </div>

              {/* Grid of Key AI Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 border border-gray-50 bg-gray-50/50 rounded-xl text-center space-y-1">
                  <span className="block text-[9px] font-mono text-gray-400 uppercase">Difficulty</span>
                  <span className="block text-xs font-mono font-bold text-gray-800">{analysisResult.difficulty}</span>
                </div>
                <div className="p-3 border border-gray-50 bg-gray-50/50 rounded-xl text-center space-y-1">
                  <span className="block text-[9px] font-mono text-gray-400 uppercase">Estimated Effort</span>
                  <span className="block text-xs font-mono font-bold text-gray-800">{analysisResult.estimatedWorkHours}</span>
                </div>
                <div className="p-3 border border-gray-50 bg-gray-50/50 rounded-xl text-center space-y-1">
                  <span className="block text-[9px] font-mono text-gray-400 uppercase">Focus Sessions</span>
                  <span className="block text-xs font-mono font-bold text-gray-800">{analysisResult.recommendedSessionsCount} Sessions</span>
                </div>
                <div className="p-3 border border-gray-50 bg-gray-50/50 rounded-xl text-center space-y-1">
                  <span className="block text-[9px] font-mono text-gray-400 uppercase">Daily Target</span>
                  <span className="block text-xs font-mono font-bold text-gray-800">{analysisResult.dailyTargetHours}</span>
                </div>
                <div className="p-3 border border-gray-50 bg-gray-50/50 rounded-xl text-center space-y-1">
                  <span className="block text-[9px] font-mono text-gray-400 uppercase">AI Confidence</span>
                  <span className="block text-xs font-mono font-bold text-emerald-600">{analysisResult.confidenceScore}</span>
                </div>
                <div className="p-3 border border-gray-50 bg-gray-50/50 rounded-xl text-center space-y-1">
                  <span className="block text-[9px] font-mono text-gray-400 uppercase">Predicted Finish</span>
                  <span className="block text-[10px] font-mono font-bold text-indigo-600 truncate">{analysisResult.predictedCompletion}</span>
                </div>
              </div>

              {/* Start Timeline Advice */}
              <div className="p-4 border border-indigo-50 bg-indigo-50/30 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-900 uppercase">
                  <Clock size={14} className="text-indigo-600" /> Start Timing calibration
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between font-mono bg-white/50 px-2 py-1.5 rounded border border-indigo-50/40">
                    <span className="text-gray-500">Best Start:</span>
                    <span className="font-bold text-gray-800">{analysisResult.bestStartTime}</span>
                  </div>
                  <div className="flex justify-between font-mono bg-white/50 px-2 py-1.5 rounded border border-indigo-50/40">
                    <span className="text-gray-500">Latest Safe Start:</span>
                    <span className="font-bold text-red-600">{analysisResult.latestSafeStartTime}</span>
                  </div>
                </div>
                {analysisResult.delayReason && (
                  <p className="text-[11px] text-gray-500 italic mt-1 font-sans">
                    {analysisResult.delayReason}
                  </p>
                )}
              </div>

              {/* Milestones Vertical List */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase">
                  Execution Milestones
                </h4>
                <div className="border-l-2 border-gray-100 pl-4 space-y-4 ml-2">
                  {analysisResult.milestones?.map((milestone: any, idx: number) => (
                    <div key={idx} className="relative">
                      {/* Left timeline dot */}
                      <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 bg-white border-2 border-black rounded-full" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="space-y-0.5">
                          <span className="block text-xs font-bold text-gray-800">{milestone.title}</span>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                            <span>Duration: {milestone.duration}</span>
                            <span>•</span>
                            <span className="uppercase">Priority: {milestone.priority}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded shrink-0 w-fit">
                          Due: {milestone.suggestedDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Calendar Actions */}
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <h4 className="text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-2">
                  Integrated Scheduling Actions
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setCalendarAdded(true);
                      triggerToast("Task events successfully added to your Calendar!");
                    }}
                    disabled={calendarAdded}
                    className="flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 disabled:bg-emerald-50 disabled:text-emerald-700 disabled:border-emerald-200 text-[11px] font-mono uppercase font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
                  >
                    {calendarAdded ? <CheckCircle2 size={12} /> : <CalendarRange size={12} />}
                    <span>{calendarAdded ? "Added to Calendar" : "Add to Calendar"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSessionsScheduled(true);
                      triggerToast("Four 90-minute focus sessions auto-scheduled!");
                    }}
                    disabled={sessionsScheduled}
                    className="flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 disabled:bg-emerald-50 disabled:text-emerald-700 disabled:border-emerald-200 text-[11px] font-mono uppercase font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
                  >
                    {sessionsScheduled ? <CheckCircle2 size={12} /> : <Timer size={12} />}
                    <span>{sessionsScheduled ? "Sessions Reserved" : "Schedule Focus"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setDailyPlanCreated(true);
                      triggerToast("Dynamic daily pacing action plan generated!");
                    }}
                    disabled={dailyPlanCreated}
                    className="flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 disabled:bg-emerald-50 disabled:text-emerald-700 disabled:border-emerald-200 text-[11px] font-mono uppercase font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
                  >
                    {dailyPlanCreated ? <CheckCircle2 size={12} /> : <Plus size={12} />}
                    <span>{dailyPlanCreated ? "Daily Plan Loaded" : "Create Daily Plan"}</span>
                  </button>

                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("navigate_tab", { detail: "focus" }));
                      triggerToast("Opening Focus Room tab. First session initiated!");
                    }}
                    className="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-[11px] font-mono uppercase font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
                  >
                    <Flame size={12} className="text-indigo-600 animate-pulse" />
                    <span>Start First Session</span>
                  </button>
                </div>
              </div>

              {/* AI Contextual Suggestions */}
              {analysisResult.suggestions?.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <h4 className="text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase">
                    AI Contextual Suggestions
                  </h4>
                  <ul className="space-y-2">
                    {analysisResult.suggestions.map((suggestion: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100/50">
                        <Sparkles size={12} className="text-indigo-500 shrink-0 mt-0.5" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SAVE / EDIT / DISCARD ACTION BLOCK */}
              <div className="border-t-2 border-dashed border-gray-100 pt-4 space-y-4">
                <div className="text-center">
                  <p className="text-xs font-mono font-bold text-gray-700">Save this task and action plan?</p>
                  <p className="text-[10px] text-gray-400">Saving registers the task across your Dashboard, Calendar, and Risk Engine.</p>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={handleSaveCalibratedTask}
                    className="col-span-1 bg-black hover:opacity-90 text-white text-xs font-mono font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 size={14} />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleEditCalibratedTask}
                    className="col-span-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-mono font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Edit size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDiscardCalibratedTask}
                    className="col-span-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-mono font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <X size={14} />
                    <span>Discard</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !aiError && !analysisResult && (
            <>
              <h3 className="text-sm font-mono font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Zap size={14} className="text-black" /> Assess New Deadline
              </h3>

              <form onSubmit={handleAnalyzeDeadline} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-1.5">Task / Assignment Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Thesis Chapter 2 Draft or Q4 Tax Reporting"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className={`w-full bg-white border ${errors.taskName ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-black"} rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all font-sans`}
                  />
                  {errors.taskName && (
                    <p className="text-red-500 text-[10px] font-mono mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> {errors.taskName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-1.5">Deadline Date & Time</label>
                    <input
                      type="datetime-local"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className={`w-full bg-white border ${errors.deadlineDate ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-black"} rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none transition-all font-mono`}
                    />
                    {errors.deadlineDate && (
                      <p className="text-red-500 text-[10px] font-mono mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.deadlineDate}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-1.5">Priority Urgency</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none transition-all font-mono"
                    >
                      <option value="Urgent">Urgent (Immediate action)</option>
                      <option value="High">High (Needs to do today)</option>
                      <option value="Medium">Medium (Can wait or schedule)</option>
                      <option value="Low">Low (Delegate or minor)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-1.5">Context / Key Constraints (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Needs 5 references, pdf only"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-1.5">Detailed Description / Context (Optional)</label>
                    <textarea
                      placeholder="Specify workflow, background, obstacles, or instructions..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={1}
                      className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all font-sans resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-white hover:opacity-90 disabled:bg-gray-100 disabled:text-gray-400 font-mono text-xs font-bold uppercase tracking-widest py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Analyze & Calibrate Deadline</span>
                </button>
              </form>
            </>
          )}
        </div>

        {/* Right column: Coaching & Regional Intelligence */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* AI Coaching Insights Card */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl relative overflow-hidden shadow-sm flex-1 flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 border-b border-gray-100 pb-3">
                <h3 className="text-xs font-mono tracking-wider text-gray-500 uppercase flex items-center gap-1.5 shrink-0">
                  <Sparkles size={14} className="text-gray-400 shrink-0" /> Coach Intelligence
                </h3>
                <span className="text-[9px] font-mono bg-gray-50 border border-gray-150 text-gray-500 px-2.5 py-0.5 rounded-md shrink-0">Live Suggestion</span>
              </div>

              {loadingCoach ? (
                <div className="space-y-2 py-4">
                  <div className="h-2 bg-gray-100 rounded-full animate-pulse w-3/4" />
                  <div className="h-2 bg-gray-100 rounded-full animate-pulse w-5/6" />
                  <div className="h-2 bg-gray-100 rounded-full animate-pulse w-1/2" />
                </div>
              ) : coachGuidance ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block mb-1">Execution Recommendation:</span>
                    <p className="text-sm text-gray-700 font-sans leading-relaxed italic break-words">
                      "{coachGuidance.recommendation}"
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase text-red-500 font-bold block mb-1">Bottleneck Trap Alert:</span>
                    <p className="text-xs text-red-600 font-sans leading-relaxed break-words">
                      "{coachGuidance.warning}"
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic py-6">
                  Enter your current tasks to generate personalized context-aware workflow guidance.
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span>Energy State: {isRescueMode ? "CRITICAL (100% Compressed)" : "Nominal"}</span>
              <button type="button" onClick={fetchCoachAdvice} className="hover:text-black transition-colors">Re-analyze</button>
            </div>
          </div>

          {/* AI Regional Suggestions Card */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl relative overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 border-b border-gray-100 pb-3">
                <h3 className="text-xs font-mono tracking-wider text-amber-700 uppercase flex items-center gap-1.5 shrink-0 font-bold">
                  <Lightbulb size={14} className="text-amber-500 shrink-0" /> AI Regional Suggestions
                </h3>
                <span className="text-[9px] font-mono bg-amber-50 border border-amber-100 text-amber-800 px-2.5 py-0.5 rounded-md shrink-0">Adaptive Hub</span>
              </div>

              <ul className="space-y-3">
                {productivitySuggestions.length > 0 ? (
                  productivitySuggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-700 font-sans leading-relaxed">
                      <span className="text-amber-500 mt-0.5 shrink-0 font-bold">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic py-4">No localized productivity suggestions currently configured for your location.</p>
                )}
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] font-mono text-gray-400">
              Synced with your current regional settings context
            </div>
          </div>
        </div>

      </div>

      {/* AI Task Prioritization Rings */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/50 p-3 rounded-2xl border border-gray-150/50 shadow-xs">
          <div className="space-y-0.5">
            <h3 className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500 fill-amber-500/10 shrink-0" /> Task Orbit Priority Rails
            </h3>
            <p className="text-[10px] text-gray-400 font-sans flex items-center gap-1">
              <Info size={11} className="text-gray-400 shrink-0" /> Adjust rail width or density below as needed. Drag &amp; drop tasks between orbits.
            </p>
          </div>
          
          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-gray-400 font-bold uppercase">Card Density:</span>
              <div className="flex items-center bg-gray-200/50 p-0.5 rounded-lg text-[9px] font-mono border border-gray-200">
                {(["standard", "compact", "minimal"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDensity(d)}
                    className={`px-2 py-1 rounded-md transition-all font-bold uppercase ${
                      density === d
                        ? "bg-white text-black shadow-xs"
                        : "text-gray-500 hover:text-black cursor-pointer"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                const completedCount = tasks.filter(t => t.isCompleted).length;
                if (completedCount === 0) {
                  triggerToast("No completed tasks to clear.");
                  return;
                }
                tasks.filter(t => t.isCompleted).forEach(t => onDeleteTask(t.id));
                triggerToast(`Cleared ${completedCount} completed tasks`);
              }}
              className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg transition-all cursor-pointer flex items-center gap-1"
            >
              <CheckSquare size={10} /> Clear Completed
            </button>

            <button
              onClick={() => setShowConfirmDeleteAllModal(true)}
              className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg transition-all cursor-pointer flex items-center gap-1"
            >
              <Trash size={10} /> Clear All Tasks
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full items-stretch min-h-[220px] overflow-x-auto pb-2">
          {categories.map((category) => {
            const list = getTasksByCategory(category);
            const isDraggedOver = draggedOverCategory === category;
            const isCollapsed = !!collapsedCategories[category];
            
            let borderClass = "border-gray-100 bg-white";
            let textClass = "text-gray-500";
            let dotColor = "bg-gray-300";

            if (category === "Do Now") {
              borderClass = isRescueMode ? "border-red-200 bg-red-50/20" : "border-amber-200 bg-amber-50/20";
              textClass = isRescueMode ? "text-red-600" : "text-amber-600";
              dotColor = isRescueMode ? "bg-red-500" : "bg-amber-500";
            } else if (category === "Do Today") {
              borderClass = "border-gray-150 bg-white";
              textClass = "text-gray-900";
              dotColor = "bg-black";
            }

            const toggleCollapse = (cat: string) => {
              setCollapsedCategories(prev => ({
                ...prev,
                [cat]: !prev[cat]
              }));
            };

            // Density adjustments
            const paddingClass = density === "standard" ? "p-2.5" : density === "compact" ? "p-2" : "p-1.5";
            const titleTextClass = density === "standard" ? "text-[11px] line-clamp-3" : density === "compact" ? "text-[10px] line-clamp-2" : "text-[9.5px] line-clamp-1";
            const footerGapClass = density === "standard" ? "gap-1.5 mt-2 pt-2" : density === "compact" ? "gap-1 mt-1.5 pt-1.5" : "gap-0.5 mt-1 pt-1";
            const maxScrollHeight = density === "standard" ? "max-h-[260px]" : density === "compact" ? "max-h-[200px]" : "max-h-[150px]";

            if (isCollapsed) {
              return (
                <div
                  key={category}
                  onClick={() => toggleCollapse(category)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDraggedOverCategory(category);
                  }}
                  onDragLeave={() => setDraggedOverCategory(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDraggedOverCategory(null);
                    const taskId = e.dataTransfer.getData("taskId");
                    if (taskId) {
                      const found = tasks.find(t => t.id === taskId);
                      if (found) {
                        onUpdateTask({ ...found, category: category as any });
                        triggerToast(`Moved "${found.title}" to ${category}`);
                      }
                    }
                  }}
                  className={`border rounded-xl transition-all duration-200 cursor-pointer flex flex-row md:flex-col items-center justify-between text-center select-none hover:bg-neutral-100/50 ${
                    isDraggedOver 
                      ? "border-dashed border-neutral-900 bg-neutral-100 scale-[1.02] shadow-sm"
                      : "border-gray-200 bg-neutral-50/50"
                  } p-2 md:w-14 md:h-[300px] shrink-0 w-full`}
                  title="Click to expand rail"
                >
                  <div className="flex items-center gap-1.5 md:flex-col md:gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    <span className="hidden md:inline-block font-mono text-[9px] font-bold uppercase tracking-widest text-gray-400 [writing-mode:vertical-lr] rotate-180 py-1 select-none">
                      {category}
                    </span>
                    <span className="md:hidden font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 md:flex-col md:gap-2">
                    <span className="text-[9px] font-mono font-bold text-gray-400 bg-gray-200/60 px-1.5 py-0.5 rounded-full">
                      {list.length}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollapse(category);
                      }}
                      className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-black transition-all"
                    >
                      <Maximize2 size={11} />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={category} 
                className={`border rounded-xl flex flex-col min-h-[200px] transition-all duration-200 flex-1 min-w-[170px] md:min-w-[190px] p-3.5 ${
                  isDraggedOver 
                    ? "border-dashed border-neutral-900 bg-neutral-50 scale-[1.01] shadow-md" 
                    : borderClass
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDraggedOverCategory(category);
                }}
                onDragLeave={() => setDraggedOverCategory(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDraggedOverCategory(null);
                  const taskId = e.dataTransfer.getData("taskId");
                  if (taskId) {
                    const found = tasks.find(t => t.id === taskId);
                    if (found) {
                      onUpdateTask({ ...found, category: category as any });
                      triggerToast(`Moved "${found.title}" to ${category}`);
                    }
                  }
                }}
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="checkbox"
                      checked={list.length > 0 && list.every(t => selectedTaskIds.includes(t.id))}
                      onChange={() => {
                        const allSelected = list.every(t => selectedTaskIds.includes(t.id));
                        if (allSelected) {
                          setSelectedTaskIds(prev => prev.filter(id => !list.some(t => t.id === id)));
                        } else {
                          const idsToAdd = list.map(t => t.id).filter(id => !selectedTaskIds.includes(id));
                          setSelectedTaskIds(prev => [...prev, ...idsToAdd]);
                        }
                      }}
                      className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      title="Select all in orbit"
                    />
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    <span className={`text-[10px] font-mono font-bold tracking-wide uppercase ${textClass}`}>{category}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                      {list.length}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollapse(category);
                      }}
                      className="p-0.5 hover:bg-neutral-100 rounded text-gray-400 hover:text-black transition-all cursor-pointer"
                      title="Compress Column"
                    >
                      <Minimize2 size={11} />
                    </button>
                  </div>
                </div>

                {list.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-2 opacity-30 select-none">
                    <p className="text-[9px] font-mono italic text-gray-400">Orbit clear</p>
                  </div>
                ) : (
                  <div className={`flex-1 space-y-2 overflow-y-auto pr-1 ${maxScrollHeight}`}>
                    {list.map((task) => {
                      const isEditing = editingTaskId === task.id;
                      const isSelected = selectedTaskIds.includes(task.id);

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("taskId", task.id);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const draggedId = e.dataTransfer.getData("taskId");
                            if (draggedId && draggedId !== task.id) {
                              const draggedIdx = tasks.findIndex(t => t.id === draggedId);
                              const targetIdx = tasks.findIndex(t => t.id === task.id);
                              if (draggedIdx !== -1 && targetIdx !== -1) {
                                const newTasks = [...tasks];
                                const [draggedTask] = newTasks.splice(draggedIdx, 1);
                                draggedTask.category = task.category; // Ensure it gets target's category
                                newTasks.splice(targetIdx, 0, draggedTask);
                                onReorderTasks(newTasks);
                                triggerToast("Reordered tasks successfully");
                              }
                            }
                          }}
                          className={`${paddingClass} ${isSelected ? 'border-indigo-400 bg-indigo-50/25 ring-1 ring-indigo-400' : 'bg-gray-50'} hover:bg-neutral-100/75 border border-gray-150 rounded-lg group transition-all cursor-grab active:cursor-grabbing hover:shadow-sm`}
                          onClick={() => {
                            if (task.riskScore) {
                              onSetClockState(task.riskScore, tasks.length);
                            }
                          }}
                        >
                          {isEditing ? (
                            <div className="space-y-2 p-1 text-left" onClick={(e) => e.stopPropagation()}>
                              <div>
                                <label className="block text-[8px] font-mono tracking-wider text-gray-400 uppercase mb-0.5">Title</label>
                                <input 
                                  type="text" 
                                  value={editingTitle} 
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 focus:outline-none focus:border-black"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-mono tracking-wider text-gray-400 uppercase mb-0.5">Deadline</label>
                                <input 
                                  type="datetime-local" 
                                  value={editingDeadline} 
                                  onChange={(e) => setEditingDeadline(e.target.value)}
                                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-[10px] font-mono text-gray-900 focus:outline-none focus:border-black"
                                />
                              </div>
                              <div className="flex justify-end gap-1 pt-1">
                                <button 
                                  onClick={() => setEditingTaskId(null)}
                                  className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-[10px] font-bold rounded text-gray-600"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={() => {
                                    onUpdateTask({ ...task, title: editingTitle, deadline: editingDeadline });
                                    setEditingTaskId(null);
                                    triggerToast("Task updated successfully");
                                  }}
                                  className="px-2 py-0.5 bg-black text-white hover:opacity-90 text-[10px] font-bold rounded"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                <div className="flex items-start gap-1.5 flex-1 min-w-0 text-left">
                                  <input 
                                    type="checkbox"
                                    checked={isSelected}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={() => {
                                      if (isSelected) {
                                        setSelectedTaskIds(prev => prev.filter(id => id !== task.id));
                                      } else {
                                        setSelectedTaskIds(prev => [...prev, task.id]);
                                      }
                                    }}
                                    className="mt-1 w-3 h-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <h4 className={`${titleTextClass} font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'} group-hover:text-black transition-colors break-words leading-snug`} title={task.title}>
                                      {task.title}
                                    </h4>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {task.isCompleted && (
                                        <span className="inline-block bg-emerald-100 text-emerald-800 text-[7px] font-mono font-bold px-1 py-0.25 rounded uppercase">
                                          COMPLETED
                                        </span>
                                      )}
                                      {task.isArchived && (
                                        <span className="inline-block bg-slate-100 text-slate-700 text-[7px] font-mono font-bold px-1 py-0.25 rounded uppercase">
                                          ARCHIVED
                                        </span>
                                      )}
                                      {isDemoMode && (
                                        <span className="inline-block bg-orange-500 text-white text-[7px] font-mono font-bold px-1 py-0.25 rounded uppercase">
                                          DEMO
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => {
                                      setEditingTaskId(task.id);
                                      setEditingTitle(task.title);
                                      setEditingDeadline(task.deadline);
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-black transition-all cursor-pointer"
                                    title="Edit details"
                                  >
                                    <Edit size={10} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      onUpdateTask({ ...task, isCompleted: !task.isCompleted });
                                      triggerToast(task.isCompleted ? "Marked assignment incomplete" : "Marked assignment complete! 🎉");
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-emerald-600 transition-all cursor-pointer"
                                    title={task.isCompleted ? "Mark Incomplete" : "Mark Completed"}
                                  >
                                    <CheckCircle2 size={10} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      onUpdateTask({ ...task, isArchived: !task.isArchived });
                                      triggerToast(task.isArchived ? "Moved task from archive to rail" : "Archived task");
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-indigo-600 transition-all cursor-pointer"
                                    title={task.isArchived ? "Unarchive" : "Archive"}
                                  >
                                    <Archive size={10} />
                                  </button>
                                  <button
                                    onClick={() => onDuplicateTask(task)}
                                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-amber-600 transition-all cursor-pointer"
                                    title="Duplicate Task"
                                  >
                                    <Copy size={10} />
                                  </button>
                                  <button
                                    onClick={() => onDeleteTask(task.id)}
                                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-600 transition-all cursor-pointer"
                                    title="Delete permanently"
                                  >
                                    <Trash size={10} />
                                  </button>
                                </div>
                              </div>
                              
                              <div className={`flex flex-col ${footerGapClass} border-t border-gray-100 pt-1.5`}>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[8px] font-mono text-gray-400">
                                    {new Date(task.deadline).toLocaleDateString([], { month: "short", day: "numeric" })}
                                  </span>
                                  {task.riskScore !== undefined && (
                                    <span 
                                      className="text-[8px] font-mono font-bold px-1.5 py-0.25 rounded shrink-0"
                                      style={{
                                        color: task.riskScore > 75 ? "#EF4444" : task.riskScore > 40 ? "#D97706" : "#10B981",
                                        backgroundColor: task.riskScore > 75 ? "rgba(239, 68, 68, 0.05)" : task.riskScore > 40 ? "rgba(217, 119, 6, 0.05)" : "rgba(16, 185, 129, 0.05)"
                                      }}
                                    >
                                      Risk: {task.riskScore}%
                                    </span>
                                  )}
                                </div>

                                {density !== "minimal" && (
                                  <div 
                                    className="flex items-center justify-between gap-1 mt-0.5" 
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="text-[8px] font-mono uppercase text-gray-400 tracking-wider">Orbit:</span>
                                    <select
                                      value={task.category || "Do Now"}
                                      onChange={(e) => {
                                        onUpdateTask({ ...task, category: e.target.value as any });
                                        triggerToast(`Adjusted "${task.title}" orbit to ${e.target.value}`);
                                      }}
                                      className="text-[9px] font-mono bg-white border border-gray-200 hover:border-black rounded px-1.5 py-0.5 text-gray-600 focus:outline-none transition-all cursor-pointer font-bold max-w-[85px] truncate"
                                    >
                                      <option value="Do Now">Do Now</option>
                                      <option value="Do Today">Do Today</option>
                                      <option value="Can Wait">Can Wait</option>
                                      <option value="Delegate">Delegate</option>
                                      <option value="Ignore">Ignore</option>
                                    </select>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Adaptive Attention Feed & Intelligent Reminder Engine --- */}
      <div className="space-y-4 border-t border-gray-100 pt-6">
        
        {/* SECTION HEADER WITH CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="text-left">
            <h3 className="text-sm font-mono tracking-wider text-gray-500 uppercase flex items-center gap-2">
              <Bell size={14} className="text-indigo-500" />
              <span>AI Adaptive Attention Feed</span>
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5 font-sans">
              Dynamic coaching recommendations controlled by anti-fatigue loops.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* NOT NOW / STOP AI DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setShowNotNowMenu(!showNotNowMenu)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  attentionMuted 
                    ? "bg-amber-50 border-amber-200 text-amber-700 font-bold" 
                    : "bg-white border-gray-200 hover:border-gray-400 text-gray-700"
                }`}
              >
                <VolumeX size={13} className={attentionMuted ? "text-amber-500" : "text-gray-400"} />
                <span>{attentionMuted ? "🔕 Stopped (Focus Shield)" : "🔕 Not Now"}</span>
              </button>

              {showNotNowMenu && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white border border-gray-150 rounded-xl shadow-lg z-50 py-1 font-mono text-xs text-left animate-fade-in">
                  <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                    Mute AI Proactivity
                  </div>
                  {[
                    { label: "Stop for 15 Minutes", duration: "15 Min", sec: 15 * 60 },
                    { label: "Stop for 30 Minutes", duration: "30 Min", sec: 30 * 60 },
                    { label: "Stop for 1 Hour", duration: "1 Hour", sec: 60 * 60 },
                    { label: "Stop Until Session Ends", duration: "Until Focus Session Ends", sec: null },
                    { label: "Stop Until Tomorrow", duration: "Until Tomorrow", sec: 12 * 60 * 60 },
                    { label: "Stop Until I Ask Again", duration: "Until I Ask Again", sec: null }
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => {
                        setAttentionMuted(true);
                        setMuteDuration(opt.duration);
                        setMuteSecondsLeft(opt.sec);
                        setShowNotNowMenu(false);
                        triggerToast(`AI Proactivity Muted: ${opt.label}`);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-neutral-50 text-gray-700 transition-colors font-sans hover:font-bold"
                    >
                      {opt.label}
                    </button>
                  ))}
                  {attentionMuted && (
                    <button
                      onClick={() => {
                        setAttentionMuted(false);
                        setMuteDuration("None");
                        setMuteSecondsLeft(null);
                        setShowNotNowMenu(false);
                        triggerToast("AI Proactivity restored successfully.");
                      }}
                      className="w-full text-left px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold border-t border-gray-50 transition-colors"
                    >
                      Unmute AI Alerts Now
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quiet Recovery Mode Status Indicator Toggle */}
            <button
              onClick={() => {
                setQuietRecoveryMode(!quietRecoveryMode);
                triggerToast(quietRecoveryMode ? "Quiet Recovery disabled." : "Quiet Recovery enabled. Tips queued silently.");
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                quietRecoveryMode 
                  ? "bg-purple-50 border-purple-200 text-purple-700" 
                  : "bg-white border-gray-200 hover:border-gray-400 text-gray-700"
              }`}
            >
              <EyeOff size={13} className={quietRecoveryMode ? "text-purple-500" : "text-gray-400"} />
              <span>Quiet Recovery: {quietRecoveryMode ? "ON" : "OFF"}</span>
            </button>
          </div>
        </div>

        {/* FEED ADAPTATION INSIGHTS BANNER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Attention Budget Tracker Banner */}
          <div className="p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl text-left space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-gray-500">
              <span>Attention Token Budget</span>
              <span className="text-indigo-600">{5 - budgetUsed} / 5 Left</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1.5">
              {[...Array(5)].map((_, idx) => (
                <span 
                  key={idx} 
                  className={`h-2 rounded-full transition-all flex-1 ${
                    idx < (5 - budgetUsed) 
                      ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.2)]" 
                      : "bg-gray-200"
                  }`} 
                />
              ))}
            </div>
            <p className="text-[9px] text-gray-400 font-sans leading-relaxed pt-1">
              Limits proactive triggers to 5/day. Only critical alerts break budget.
            </p>
          </div>

          {/* Self-Awareness Fatigue Meter Banner */}
          <div className="p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl text-left space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-gray-500">
              <span>AI Self-Aware Fatigue Index</span>
              <span className={(ignoredCount + closedCount) / (ignoredCount + closedCount + completedCount || 1) * 100 > 60 ? "text-red-500" : (ignoredCount + closedCount) / (ignoredCount + closedCount + completedCount || 1) * 100 > 30 ? "text-amber-600" : "text-emerald-600"}>
                {ignoredCount + closedCount + completedCount > 0 ? Math.round(((ignoredCount + closedCount) / (ignoredCount + closedCount + completedCount)) * 100) : 0}% Strain
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex mt-1">
              <div 
                className={`h-full rounded-full transition-all ${
                  ((ignoredCount + closedCount) / (ignoredCount + closedCount + completedCount || 1) * 100) > 60 ? "bg-red-500" : ((ignoredCount + closedCount) / (ignoredCount + closedCount + completedCount || 1) * 100) > 30 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.max(4, ignoredCount + closedCount + completedCount > 0 ? Math.round(((ignoredCount + closedCount) / (ignoredCount + closedCount + completedCount)) * 100) : 0)}%` }}
              />
            </div>
            <span className="text-[9px] font-mono font-bold block pt-1.5" style={{
              color: ((ignoredCount + closedCount) / (ignoredCount + closedCount + completedCount || 1) * 100) > 60 ? "#EF4444" : ((ignoredCount + closedCount) / (ignoredCount + closedCount + completedCount || 1) * 100) > 30 ? "#D97706" : "#10B981"
            }}>
              {((ignoredCount + closedCount) / (ignoredCount + closedCount + completedCount || 1) * 100) > 60 
                ? "● High strain: Auto Dampen Mode" 
                : ((ignoredCount + closedCount) / (ignoredCount + closedCount + completedCount || 1) * 100) > 30 
                  ? "● Moderate strain: Light Coaching" 
                  : "● Optimal: Regular Coaching"
              }
            </span>
          </div>

          {/* Active Cooldown States Tracker */}
          <div className="p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl text-left space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-gray-500 block">Active Cooldown Shields</span>
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {[
                { key: "critical", label: "Critical Shield", color: "bg-red-100 text-red-700" },
                { key: "high", label: "High Shield", color: "bg-orange-100 text-orange-700" },
                { key: "medium", label: "Med Shield", color: "bg-amber-100 text-amber-700" },
                { key: "low", label: "Low Shield", color: "bg-emerald-100 text-emerald-700" }
              ].map((shield) => {
                const expires = (cooldowns as any)[shield.key];
                const active = expires && expires > Date.now();
                return (
                  <span 
                    key={shield.key} 
                    className={`text-[8px] font-mono px-2 py-0.5 rounded transition-all ${
                      active ? shield.color + " font-bold shadow-sm" : "bg-gray-100 text-gray-300 line-through"
                    }`}
                  >
                    {active ? "🛡️ " : ""}{shield.label}
                  </span>
                );
              })}
            </div>
            <p className="text-[9px] text-gray-400 font-sans leading-relaxed pt-1.5">
              Mutes repeated recovery plans following dismissed advice.
            </p>
          </div>

        </div>

        {/* QUIET RECOVERY MODE BANNER OVERLAY */}
        {(quietRecoveryMode || attentionMuted || (((ignoredCount + closedCount) / (ignoredCount + closedCount + completedCount || 1) * 100) > 60)) && (
          <div className="p-4 border border-purple-100 bg-purple-50/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in text-left">
            <div className="flex items-center gap-2.5">
              <EyeOff size={16} className="text-purple-600 animate-pulse shrink-0" />
              <div>
                <span className="text-[10px] font-mono tracking-widest text-purple-600 uppercase font-bold block">
                  {((ignoredCount + closedCount) / (ignoredCount + closedCount + completedCount || 1) * 100) > 60 ? "Auto Dampener Engaged (Fatigue Lockout)" : "Quiet Recovery Active (Focus Shield)"}
                </span>
                <p className="text-xs text-purple-900 mt-0.5 font-sans leading-relaxed">
                  {generateAdaptiveReminders().length} dynamic alerts and coaching prompts have been queued silently to preserve your mental bandwidth.
                </p>
              </div>
            </div>
            <button
              onClick={() => setForceShowSuggestions(!forceShowSuggestions)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer whitespace-nowrap"
            >
              {forceShowSuggestions ? "Hide Standby Feed" : "View Silently"}
            </button>
          </div>
        )}

        {/* FEED CONTENT AREA */}
        {((quietRecoveryMode || attentionMuted || (((ignoredCount + closedCount) / (ignoredCount + closedCount + completedCount || 1) * 100) > 60)) && !forceShowSuggestions) ? null : (
          <>
            {generateAdaptiveReminders().length === 0 ? (
              <div className="p-8 border border-dashed border-gray-150 rounded-2xl bg-gray-50/50 text-center text-gray-400">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                <p className="text-xs font-mono font-medium text-gray-700">Attention cockpit fully de-congested.</p>
                <p className="text-[10px] font-mono text-gray-400 mt-1">
                  Filters successfully held standby warnings. Safe from cognitive alarm fatigue.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generateAdaptiveReminders().map((rem) => {
                  // Custom borders depending on severity/type
                  let cardStyle = "border-gray-100 bg-white";
                  let badgeStyle = "bg-gray-100 text-gray-500";
                  let iconColor = "text-gray-400";

                  if (rem.type === "escalation") {
                    cardStyle = "border-red-100 bg-red-50/20";
                    badgeStyle = "bg-red-100 text-red-600 font-bold";
                    iconColor = "text-red-500";
                  } else if (rem.type === "habit") {
                    cardStyle = "border-amber-100 bg-amber-50/10";
                    badgeStyle = "bg-amber-100 text-amber-700 font-bold";
                    iconColor = "text-amber-500";
                  }

                  const isAdjusted = adjustedReminders[rem.id];
                  const isDelegated = delegatedReminders[rem.id];

                  return (
                    <div key={rem.id} className={`border p-4 rounded-xl flex flex-col justify-between shadow-sm transition-all ${cardStyle}`}>
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[9px] font-mono tracking-wider px-2 py-0.5 rounded uppercase ${badgeStyle}`}>
                            {rem.tag}
                          </span>
                          <button 
                            onClick={() => {
                              setDismissedReminders(prev => [...prev, rem.id]);
                              setIgnoredCount(prev => prev + 1);
                              triggerToast("Notification dismissed. Anti-fatigue index adjusted.");
                            }}
                            className="text-gray-400 hover:text-black hover:bg-gray-100 p-1 rounded transition-colors cursor-pointer"
                            title="Dismiss (Increments Fatigue Index)"
                          >
                            <X size={12} />
                          </button>
                        </div>

                        <h4 className="text-xs font-mono font-bold text-gray-900 mt-1 flex items-center gap-1.5 break-words">
                          {rem.type === "escalation" ? <ShieldAlert size={12} className={iconColor} /> : rem.type === "habit" ? <Flame size={12} className={iconColor} /> : <Clock size={12} className={iconColor} />}
                          <span className="break-words">{rem.title}</span>
                        </h4>

                        <p className="text-xs text-gray-600 mt-2 leading-relaxed break-words">
                          {rem.message}
                        </p>

                        <div className="mt-3 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 min-w-0">
                          <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block mb-0.5">✨ AI Recommendation:</span>
                          <p className="text-[11px] text-gray-700 italic break-words">
                            "{rem.suggestedAction}"
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                        {/* Execute action */}
                        <button 
                          onClick={() => {
                            setDismissedReminders(prev => [...prev, rem.id]);
                            setCompletedCount(prev => prev + 1);
                            setBudgetUsed(budgetUsed + 1);
                            triggerToast("Action Executed! Budget used token logged.");
                          }}
                          className="text-[9px] font-mono bg-black text-white hover:opacity-90 px-2.5 py-1.5 rounded uppercase font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Zap size={10} />
                          <span>Execute Now</span>
                        </button>

                        {/* Adjust pacing */}
                        <button 
                          onClick={() => {
                            setAdjustedReminders(prev => ({ ...prev, [rem.id]: "shifted" }));
                            triggerToast("Adaptive Rescheduling: Pushed by +45 minutes.");
                          }}
                          disabled={!!isAdjusted}
                          className={`text-[9px] font-mono px-2.5 py-1.5 rounded uppercase font-bold flex items-center gap-1 border cursor-pointer transition-colors ${
                            isAdjusted 
                              ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed" 
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-black"
                          }`}
                        >
                          <Clock size={10} />
                          <span>{isAdjusted ? "Pacing Delayed" : "Adjust Pacing (+45m)"}</span>
                        </button>

                        {/* Delegate item */}
                        <button 
                          onClick={() => {
                            setDelegatedReminders(prev => ({ ...prev, [rem.id]: "Sarah" }));
                            triggerToast("Delegated successfully to Sarah Lin!");
                          }}
                          disabled={!!isDelegated}
                          className={`text-[9px] font-mono px-2.5 py-1.5 rounded uppercase font-bold flex items-center gap-1 border cursor-pointer transition-colors ${
                            isDelegated 
                              ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed" 
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-black"
                          }`}
                        >
                          <UserCheck size={10} />
                          <span>{isDelegated ? "Delegated" : "Delegate"}</span>
                        </button>

                        {/* I Know / Stop Reminding Me Button for warning cards */}
                        {(rem.type === "escalation" || rem.type === "deadline") && (
                          <button
                            onClick={() => {
                              // Mark task associated as acknowledged
                              const taskIdMatch = rem.id.split("-").pop();
                              if (taskIdMatch) {
                                setAcknowledgedWarnings(prev => [...prev, `ack-${taskIdMatch}`]);
                              }
                              
                              // Trigger corresponding cooldown based on risk score
                              const risk = rem.risk || 50;
                              const cooldownSec = risk > 85 ? 15 * 60 : risk > 70 ? 60 * 60 : risk > 40 ? 6 * 60 * 60 : 24 * 60 * 60;
                              const key = risk > 85 ? "critical" : risk > 70 ? "high" : risk > 40 ? "medium" : "low";
                              
                              setCooldowns(prev => ({
                                ...prev,
                                [key]: Date.now() + cooldownSec * 1000
                              }));

                              // Dismiss reminder and increment closed count
                              setDismissedReminders(prev => [...prev, rem.id]);
                              setClosedCount(prev => prev + 1);

                              triggerToast(`Warning Acknowledged. Entered ${key.toUpperCase()} risk cooldown shield.`);
                            }}
                            className="text-[9px] font-mono bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 px-2.5 py-1.5 rounded uppercase font-bold flex items-center gap-1 cursor-pointer transition-all"
                            title="Acknowledge seen; suppresses similar plans for this risk class"
                          >
                            <ThumbsUp size={10} />
                            <span>I Know</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modals & Floating Bulk Operations Bar */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white border border-slate-800 rounded-full px-6 py-3.5 flex items-center gap-6 shadow-2xl z-40 animate-fade-in text-[10px] sm:text-xs font-mono">
          <span className="font-bold text-gray-300">
            <span className="text-indigo-400 font-black">{selectedTaskIds.length}</span> SELECTED
          </span>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                selectedTaskIds.forEach(id => {
                  const t = tasks.find(x => x.id === id);
                  if (t) onUpdateTask({ ...t, isCompleted: true });
                });
                setSelectedTaskIds([]);
                triggerToast(`Completed ${selectedTaskIds.length} tasks!`);
              }}
              className="hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <CheckSquare size={13} /> Complete
            </button>
            <button
              onClick={() => {
                selectedTaskIds.forEach(id => {
                  const t = tasks.find(x => x.id === id);
                  if (t) onUpdateTask({ ...t, isArchived: true });
                });
                setSelectedTaskIds([]);
                triggerToast(`Archived ${selectedTaskIds.length} tasks`);
              }}
              className="hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Archive size={13} /> Archive
            </button>
            <button
              onClick={() => {
                const selectedTasks = tasks.filter(t => selectedTaskIds.includes(t.id));
                const blob = new Blob([JSON.stringify(selectedTasks, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `saver_tasks_export_${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                triggerToast("Exported selected tasks");
              }}
              className="hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FileDown size={13} /> Export
            </button>
            <button
              onClick={() => setShowConfirmDeleteModal(true)}
              className="hover:text-red-400 flex items-center gap-1 transition-colors font-bold cursor-pointer"
            >
              <Trash size={13} /> Delete
            </button>
            <button
              onClick={() => setSelectedTaskIds([])}
              className="hover:text-gray-400 flex items-center gap-1 transition-colors text-gray-400 border border-slate-800 rounded-full px-2 py-0.5 cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {showConfirmDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-gray-150">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-900 font-display">Delete {selectedTaskIds.length} Selected Tasks?</h4>
              <p className="text-xs text-gray-500">
                This operation is permanent. Once deleted, they cannot be recovered.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmDeleteModal(false)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  selectedTaskIds.forEach(id => onDeleteTask(id));
                  setSelectedTaskIds([]);
                  setShowConfirmDeleteModal(false);
                  triggerToast("Selected tasks permanently deleted");
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase rounded-xl transition-all shadow-md cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDeleteAllModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-gray-150">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-900 font-display">Permanently Delete All Tasks?</h4>
              <p className="text-xs text-gray-500">
                This will permanently delete all tasks in your workspace. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmDeleteAllModal(false)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllTasks();
                  setSelectedTaskIds([]);
                  setShowConfirmDeleteAllModal(false);
                  triggerToast("All tasks cleared");
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase rounded-xl transition-all shadow-md cursor-pointer"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
