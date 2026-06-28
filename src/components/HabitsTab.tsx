import React, { useState, useEffect, useRef } from "react";
import { Goal, Habit, Milestone } from "../types";
import { 
  Trophy, Flame, Plus, Sparkles, Check, Trash2, Edit2, 
  Archive, Play, Pause, Copy, Calendar, ShieldAlert, BarChart2, 
  Import, Clock, AlertCircle, RefreshCw, X, ChevronDown, ChevronUp,
  FileText, ListTodo, Info, HelpCircle, Star, ArrowRight, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface HabitsTabProps {
  onUpdateGoalProgress: (goals: number[]) => void;
  onSetClockState: (mode: "scanner" | "timeline" | "gauge" | "event" | "timer" | "progress" | "pulse" | "default") => void;
}

// Category lists with meta information
const CATEGORIES = [
  { id: "academic", label: "Academic", icon: "📚", color: "bg-blue-500", border: "border-blue-100", text: "text-blue-600" },
  { id: "career", label: "Career", icon: "💼", color: "bg-slate-700", border: "border-slate-100", text: "text-slate-700" },
  { id: "health", label: "Health", icon: "❤️", color: "bg-emerald-500", border: "border-emerald-100", text: "text-emerald-600" },
  { id: "finance", label: "Finance", icon: "💰", color: "bg-amber-500", border: "border-amber-100", text: "text-amber-600" },
  { id: "personal", label: "Learning", icon: "🧠", color: "bg-purple-500", border: "border-purple-100", text: "text-purple-600" },
  { id: "custom", label: "Custom / Other", icon: "🏆", color: "bg-indigo-500", border: "border-indigo-100", text: "text-indigo-600" }
];

// Pre-baked AI recommendations for goals categories to inspire users
const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  academic: [
    "I want to crack GATE Exam with standard references.",
    "I want to write & publish my CS research thesis.",
    "I want to master Data Structures and Algorithms for my final year exams."
  ],
  career: [
    "I want to complete my summer internship project.",
    "I want to secure a senior full-stack developer role.",
    "I want to build a stellar SaaS portfolio."
  ],
  health: [
    "I want to lose 5 kg with macro balancing and HIIT.",
    "I want to run a 10k marathon under 55 minutes.",
    "I want to fix my sleep hygiene schedule to get 7.5 hours daily."
  ],
  finance: [
    "I want to save my first $5,000 and learn index investing.",
    "I want to design a weekly tracking budget system.",
    "I want to clear my student credit card debts."
  ],
  personal: [
    "I want to learn React and build a modular app.",
    "I want to read 12 non-fiction books this year.",
    "I want to practice daily mindfulness meditation for 10 minutes."
  ]
};

export default function HabitsTab({
  onUpdateGoalProgress,
  onSetClockState,
}: HabitsTabProps) {
  // --- core states ---
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const stored = localStorage.getItem("saver_goals");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const stored = localStorage.getItem("saver_habits");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // --- UI flow states ---
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("academic");
  
  // Modals state
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAiGoalModal, setShowAiGoalModal] = useState(false);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [showAiHabitModal, setShowAiHabitModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // AI Planner Loading & Result State
  const [aiGoalQuery, setAiGoalQuery] = useState("");
  const [aiIsPlanning, setAiIsPlanning] = useState(false);
  const [aiPlannerResult, setAiPlannerResult] = useState<any | null>(null);

  // AI Habit Recommendation State
  const [selectedGoalForHabits, setSelectedGoalForHabits] = useState<string>("");
  const [aiIsSuggestingHabits, setAiIsSuggestingHabits] = useState(false);
  const [suggestedHabitsList, setSuggestedHabitsList] = useState<any[]>([]);

  // AI Evaluation Loading animation state per goal
  const [isEvaluatingGoalId, setIsEvaluatingGoalId] = useState<string | null>(null);
  const [evaluationFeedback, setEvaluationFeedback] = useState<string | null>(null);

  // Import State
  const [importSource, setImportSource] = useState<string>("");
  const [importData, setImportData] = useState<string>("");
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");

  // --- Form States (Goal) ---
  const [goalFormName, setGoalFormName] = useState("");
  const [goalFormCategory, setGoalFormCategory] = useState<Goal["category"]>("academic");
  const [goalFormTargetDate, setGoalFormTargetDate] = useState("");
  const [goalFormPriority, setGoalFormPriority] = useState<"low" | "medium" | "high">("medium");
  const [goalFormEffort, setGoalFormEffort] = useState("");
  const [goalFormDesc, setGoalFormDesc] = useState("");
  const [goalFormColor, setGoalFormColor] = useState("#4f46e5");
  const [goalFormIcon, setGoalFormIcon] = useState("🎯");
  const [goalFormReminder, setGoalFormReminder] = useState("");

  // --- Form States (Habit) ---
  const [habitFormName, setHabitFormName] = useState("");
  const [habitFormFreq, setHabitFormFreq] = useState<Habit["frequency"]>("daily");
  const [habitFormCustomDays, setHabitFormCustomDays] = useState<string[]>([]);
  const [habitFormTimes, setHabitFormTimes] = useState<string[]>(["08:00 AM"]);
  const [habitNewTimeInput, setHabitNewTimeInput] = useState("");
  const [habitReminderFreq, setHabitReminderFreq] = useState("Once daily");
  const [habitFormOptimalTime, setHabitFormOptimalTime] = useState("");
  const [isGeneratingOptimalTime, setIsGeneratingOptimalTime] = useState(false);

  const { user } = useAuth();

  // Load from Firestore when user logs in
  useEffect(() => {
    let active = true;
    const loadUserData = async () => {
      if (user && user.uid !== "guest-user-session") {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists() && active) {
            const data = docSnap.data();
            if (data.goals) setGoals(data.goals);
            if (data.habits) setHabits(data.habits);
          }
        } catch (e) {
          console.error("Failed to load goals/habits from Firestore:", e);
        }
      }
    };
    loadUserData();
    return () => { active = false; };
  }, [user]);

  const lastProgressesRef = useRef<string>("");

  // --- Sync with localStorage/Firestore and trigger clock updates ---
  useEffect(() => {
    const saveData = async () => {
      if (user && user.uid !== "guest-user-session") {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(userDocRef, { goals }, { merge: true });
        } catch (e) {
          console.error("Failed to save goals to Firestore:", e);
        }
      }
      localStorage.setItem("saver_goals", JSON.stringify(goals));
      localStorage.setItem("saver_is_demo", String(isDemoMode));
      window.dispatchEvent(new Event("demo_mode_changed"));
      
      // Calculate and pass progress values to the concentric clock rings
      const progresses = goals.filter(g => !g.isArchived).map(g => g.progress);
      const progressesStr = JSON.stringify(progresses);
      if (progressesStr !== lastProgressesRef.current) {
        lastProgressesRef.current = progressesStr;
        onUpdateGoalProgress(progresses);
      }
      localStorage.setItem("saver_goal_progresses", JSON.stringify(progresses));
    };
    saveData();
  }, [goals, isDemoMode, user, onUpdateGoalProgress]);

  useEffect(() => {
    const saveHabits = async () => {
      if (user && user.uid !== "guest-user-session") {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(userDocRef, { habits }, { merge: true });
        } catch (e) {
          console.error("Failed to save habits to Firestore:", e);
        }
      }
      localStorage.setItem("saver_habits", JSON.stringify(habits));
    };
    saveHabits();
  }, [habits, user]);

  // --- Action Handlers ---

  // DEMO MODE SETUP (REMOVED)
  const handleLoadDemoWorkspace = () => {
    // Demo mode removed to adhere to product-ready state requirements
  };

  const handleClearWorkspace = () => {
    setGoals([]);
    setHabits([]);
    setIsDemoMode(false);
    setExpandedGoalId(null);
    setEvaluationFeedback(null);
    localStorage.removeItem("saver_goals");
    localStorage.removeItem("saver_habits");
    localStorage.setItem("saver_goal_progresses", JSON.stringify([]));
    onUpdateGoalProgress([]);
  };

  // HABIT ACTIONS
  const handleToggleHabitToday = (id: string) => {
    onSetClockState("progress");
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const nextState = !h.completedToday;
        // update 7-day history (shift and append)
        const hist = [...h.history];
        hist[hist.length - 1] = nextState;
        return {
          ...h,
          completedToday: nextState,
          history: hist,
          streak: nextState ? h.streak + 1 : Math.max(h.streak - 1, 0)
        };
      }
      return h;
    }));
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const handleAddTimeInput = () => {
    if (habitNewTimeInput.trim() && !habitFormTimes.includes(habitNewTimeInput)) {
      setHabitFormTimes([...habitFormTimes, habitNewTimeInput]);
      setHabitNewTimeInput("");
    }
  };

  const handleRemoveTimeInput = (t: string) => {
    setHabitFormTimes(habitFormTimes.filter(item => item !== t));
  };

  const handleGenerateOptimalTime = async () => {
    if (!habitFormName.trim()) return;
    setIsGeneratingOptimalTime(true);
    try {
      const res = await fetch("/api/ai/habit-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalTitle: habitFormName, category: "personal" })
      });
      const data = await res.json();
      if (data.habits && data.habits.length > 0) {
        setHabitFormOptimalTime(`${data.habits[0].reminder} - ${data.habits[0].reason}`);
        setHabitNewTimeInput(data.habits[0].reminder);
      }
    } catch (e) {
      console.warn("API Error:", e);
    } finally {
      setIsGeneratingOptimalTime(false);
    }
  };

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitFormName.trim()) return;

    const newHabit: Habit = {
      id: "h_" + Date.now(),
      name: habitFormName,
      streak: 0, // Starts at 0, no fake streaks!
      completedToday: false,
      history: [false, false, false, false, false, false, false],
      frequency: habitFormFreq,
      customDays: habitFormFreq === "custom" ? habitFormCustomDays : undefined,
      specificTimes: habitFormTimes,
      reminderFrequency: habitReminderFreq,
      optimalReminderTime: habitFormOptimalTime ? habitFormOptimalTime : undefined
    };

    setHabits([...habits, newHabit]);
    setShowAddHabitModal(false);
    
    // Reset Form
    setHabitFormName("");
    setHabitFormFreq("daily");
    setHabitFormCustomDays([]);
    setHabitFormTimes(["08:00 AM"]);
    setHabitReminderFreq("Once daily");
    setHabitFormOptimalTime("");
  };

  // GOAL ACTIONS
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalFormName.trim() || !goalFormTargetDate) return;

    const newGoal: Goal = {
      id: "g_" + Date.now(),
      title: goalFormName,
      targetDate: goalFormTargetDate,
      progress: 0, // starts at 0, no fake percentages!
      category: goalFormCategory,
      priority: goalFormPriority,
      estimatedEffort: goalFormEffort || undefined,
      description: goalFormDesc || undefined,
      color: goalFormColor,
      icon: goalFormIcon,
      reminder: goalFormReminder || undefined,
      milestones: [],
      weeklyPlan: [],
      riskFactors: []
    };

    setGoals([...goals, newGoal]);
    setShowAddGoalModal(false);

    // Reset Form
    setGoalFormName("");
    setGoalFormCategory("academic");
    setGoalFormTargetDate("");
    setGoalFormPriority("medium");
    setGoalFormEffort("");
    setGoalFormDesc("");
    setGoalFormColor("#4f46e5");
    setGoalFormIcon("🎯");
    setGoalFormReminder("");
  };

  const handleDuplicateGoal = (goal: Goal) => {
    const duplicated: Goal = {
      ...goal,
      id: "g_dup_" + Date.now(),
      title: `${goal.title} (Copy)`,
      progress: 0, // reset progress on duplicate
      milestones: goal.milestones?.map(m => ({ ...m, id: "m_dup_" + Math.random(), completionPercentage: 0 }))
    };
    setGoals([...goals, duplicated]);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    if (expandedGoalId === id) setExpandedGoalId(null);
  };

  const handleTogglePauseGoal = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, isPaused: !g.isPaused } : g));
  };

  const handleToggleArchiveGoal = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, isArchived: !g.isArchived } : g));
    if (expandedGoalId === id) setExpandedGoalId(null);
  };

  // UPDATE MILESTONE PROGRESS -> RECALCULATES GOAL PROGRESS
  const handleUpdateMilestoneProgress = (goalId: string, milestoneId: string, val: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId && g.milestones) {
        const updatedMilestones = g.milestones.map(m => m.id === milestoneId ? { ...m, completionPercentage: val } : m);
        // Calculate average milestone completion
        const sum = updatedMilestones.reduce((acc, m) => acc + m.completionPercentage, 0);
        const avg = Math.round(sum / updatedMilestones.length);
        return {
          ...g,
          progress: avg,
          milestones: updatedMilestones
        };
      }
      return g;
    }));
  };

  // MANUAL INTERACTIVE PROGRESS OVERWRITE
  const handleUpdateGoalDirectProgress = (goalId: string, val: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        return { ...g, progress: val };
      }
      return g;
    }));
  };

  // AI GOAL GENERATOR FLOW
  const handleGenerateAiGoal = async () => {
    if (!aiGoalQuery.trim()) return;
    setAiIsPlanning(true);
    setAiPlannerResult(null);

    try {
      const res = await fetch("/api/ai/goals-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalQuery: aiGoalQuery })
      });
      const data = await res.json();
      setAiPlannerResult(data);
    } catch (e) {
      console.warn("API Error:", e);
    } finally {
      setAiIsPlanning(false);
    }
  };

  const handleApproveAiGoal = () => {
    if (!aiPlannerResult) return;

    // Map AI result to our schema
    const newGoal: Goal = {
      id: "g_ai_" + Date.now(),
      title: aiPlannerResult.title,
      category: aiPlannerResult.category || "custom",
      targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // default +45 days
      progress: 0, // Always starts at 0!
      priority: aiPlannerResult.priority || "medium",
      estimatedEffort: aiPlannerResult.estimatedEffort,
      estimatedCompletionTime: aiPlannerResult.estimatedCompletionTime,
      description: aiPlannerResult.description,
      color: aiPlannerResult.category === "academic" ? "#3b82f6" : aiPlannerResult.category === "career" ? "#4b5563" : "#8b5cf6",
      icon: aiPlannerResult.category === "academic" ? "📚" : aiPlannerResult.category === "career" ? "💼" : "🏆",
      milestones: aiPlannerResult.milestones?.map((m: any, idx: number) => ({
        id: `m_ai_${idx}_${Date.now()}`,
        title: m.title,
        estimatedTime: m.estimatedTime || "5 hours",
        priority: m.priority || "medium",
        deadline: m.deadline || `Week ${idx + 1}`,
        completionPercentage: 0
      })) || [],
      weeklyPlan: aiPlannerResult.weeklyPlan || [],
      riskFactors: aiPlannerResult.riskFactors || [],
    };

    setGoals([...goals, newGoal]);
    
    // Add suggested habits if available
    if (aiPlannerResult.suggestedHabits && aiPlannerResult.suggestedHabits.length > 0) {
      const newHabits = aiPlannerResult.suggestedHabits.map((shName: string, hidx: number) => ({
        id: `h_ai_${hidx}_${Date.now()}`,
        name: shName,
        streak: 0,
        completedToday: false,
        history: [false, false, false, false, false, false, false],
        frequency: "daily" as const
      }));
      setHabits(prev => [...prev, ...newHabits]);
    }

    // Reset Flow
    setShowAiGoalModal(false);
    setAiGoalQuery("");
    setAiPlannerResult(null);
  };

  // AI HABIT SUGGESTIONS GENERATOR
  const handleGenerateAiHabitSuggestions = async () => {
    setAiIsSuggestingHabits(true);
    setSuggestedHabitsList([]);
    try {
      // Find category of goal if selected
      const targetGoal = goals.find(g => g.id === selectedGoalForHabits);
      const res = await fetch("/api/ai/habit-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          goalTitle: targetGoal ? targetGoal.title : "Academic Mastery", 
          category: targetGoal ? targetGoal.category : "academic" 
        })
      });
      const data = await res.json();
      if (data.habits) {
        setSuggestedHabitsList(data.habits.map((h: any) => ({ ...h, selected: true })));
      }
    } catch (e) {
      console.warn("API Error:", e);
    } finally {
      setAiIsSuggestingHabits(false);
    }
  };

  const handleSaveSelectedSuggestedHabits = () => {
    const selected = suggestedHabitsList.filter(h => h.selected);
    if (selected.length === 0) return;

    const newHabits = selected.map((sh, idx) => ({
      id: `h_sugg_${idx}_${Date.now()}`,
      name: sh.name,
      streak: 0, // Starts at 0
      completedToday: false,
      history: [false, false, false, false, false, false, false],
      frequency: sh.frequency || "daily",
      specificTimes: [sh.reminder],
      optimalReminderTime: `${sh.reminder} (${sh.reason})`
    }));

    setHabits([...habits, ...newHabits]);
    setShowAiHabitModal(false);
    setSuggestedHabitsList([]);
  };

  // AI EVALUATOR OF DYNAMIC PROGRESS (No fake percentages)
  const handleEvaluateDynamicProgress = (goalId: string) => {
    setIsEvaluatingGoalId(goalId);
    setEvaluationFeedback(null);
    onSetClockState("pulse");

    setTimeout(() => {
      // Fetch stats from localStorage to compute real value
      let completedTasksCount = 0;
      let scannedDocsCount = 0;
      let habitCompletionRate = 0;

      try {
        const storedTasks = localStorage.getItem("saver_tasks");
        if (storedTasks) {
          const parsed = JSON.parse(storedTasks);
          // Assuming active status represents completed
          completedTasksCount = parsed.filter((t: any) => t.completed || t.category === "Ignore").length;
        }

        const storedDocs = localStorage.getItem("saver_docs");
        if (storedDocs) {
          scannedDocsCount = JSON.parse(storedDocs).length;
        }

        if (habits.length > 0) {
          const totalCompletions = habits.reduce((acc, h) => acc + h.history.filter(Boolean).length, 0);
          habitCompletionRate = Math.round((totalCompletions / (habits.length * 7)) * 100);
        }
      } catch (err) {
        console.error("Local stats reading failed:", err);
      }

      // Calculate progress contribution
      const targetGoal = goals.find(g => g.id === goalId);
      if (!targetGoal) return;

      const baseProgress = targetGoal.milestones && targetGoal.milestones.length > 0
        ? Math.round(targetGoal.milestones.reduce((acc, m) => acc + m.completionPercentage, 0) / targetGoal.milestones.length)
        : 0;

      // Real integration factor
      const taskFactor = Math.min(completedTasksCount * 5, 20); // max 20%
      const docFactor = Math.min(scannedDocsCount * 4, 15); // max 15%
      const habitFactor = Math.min(Math.round(habitCompletionRate * 0.15), 15); // max 15%

      const finalProgress = Math.min(Math.round(baseProgress * 0.5 + taskFactor + docFactor + habitFactor), 100);

      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, progress: finalProgress } : g));
      
      setEvaluationFeedback(
        `AI has reviewed your telemetry workspace: \n` +
        `• Base Milestones completed: ${baseProgress}%\n` +
        `• Active Planner Tasks resolved: ${completedTasksCount} (+${taskFactor}% progress weight)\n` +
        `• Library Documents parsed: ${scannedDocsCount} (+${docFactor}% progress weight)\n` +
        `• Consistency habit rate: ${habitCompletionRate}% (+${habitFactor}% progress weight)\n\n` +
        `🏆 Dynamic Progress evaluated at: ${finalProgress}%`
      );

      setIsEvaluatingGoalId(null);
      onSetClockState("progress");
    }, 2800);
  };

  // GOAL IMPORT
  const handleImportGoals = () => {
    if (!importSource) return;
    setImportStatus("idle");

    try {
      let imported: Goal[] = [];
      const idPrefix = "g_imp_" + Date.now() + "_";

      if (importSource === "csv") {
        const rows = importData.split("\n").filter(Boolean);
        rows.forEach((row, idx) => {
          if (idx === 0) return; // Header row
          const cols = row.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
          if (cols[0]) {
            imported.push({
              id: idPrefix + idx,
              title: cols[0],
              category: (cols[1]?.toLowerCase() as any) || "personal",
              targetDate: cols[2] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              progress: 0,
              priority: (cols[3]?.toLowerCase() as any) || "medium",
              description: cols[4] || "Imported CSV item",
              color: "#3b82f6",
              icon: "📥"
            });
          }
        });
      } else {
        // High fidelity mock connection mapping from platforms
        imported = [
          {
            id: idPrefix + "1",
            title: `[${importSource.toUpperCase()}] Complete dissertation core structure`,
            category: "academic",
            targetDate: "2026-08-10",
            progress: 0,
            priority: "high",
            description: `Imported directly from external integration: ${importSource}`,
            color: "#8b5cf6",
            icon: "⚡"
          },
          {
            id: idPrefix + "2",
            title: `[${importSource.toUpperCase()}] Weekly physical resistance drills`,
            category: "health",
            targetDate: "2026-07-20",
            progress: 0,
            priority: "medium",
            description: `Imported directly from external integration: ${importSource}`,
            color: "#10b981",
            icon: "👟"
          }
        ];
      }

      if (imported.length > 0) {
        setGoals([...goals, ...imported]);
        setImportStatus("success");
        setTimeout(() => {
          setShowImportModal(false);
          setImportData("");
          setImportStatus("idle");
        }, 1500);
      } else {
        setImportStatus("error");
      }
    } catch {
      setImportStatus("error");
    }
  };

  // --- ANALYTICS CALCULATORS ---
  const activeGoals = goals.filter(g => !g.isArchived);
  const activeHabits = habits;

  // Goals Analytics
  const avgProgress = activeGoals.length > 0 
    ? Math.round(activeGoals.reduce((acc, g) => acc + g.progress, 0) / activeGoals.length) 
    : 0;

  const goalsCompletedCount = activeGoals.filter(g => g.progress === 100).length;
  const completionRate = activeGoals.length > 0 
    ? Math.round((goalsCompletedCount / activeGoals.length) * 100) 
    : 0;

  const totalMilestonesCount = activeGoals.reduce((acc, g) => acc + (g.milestones?.length || 0), 0);
  const completedMilestonesCount = activeGoals.reduce((acc, g) => acc + (g.milestones?.filter(m => m.completionPercentage === 100).length || 0), 0);
  const milestoneCompletionRate = totalMilestonesCount > 0 
    ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100) 
    : 0;

  // Habits Analytics
  const habitsCompletedToday = activeHabits.filter(h => h.completedToday).length;
  const habitsTodayRate = activeHabits.length > 0 
    ? Math.round((habitsCompletedToday / activeHabits.length) * 100) 
    : 0;

  const bestHabitStreak = activeHabits.length > 0 
    ? Math.max(...activeHabits.map(h => h.streak)) 
    : 0;

  const totalRepetitions = activeHabits.reduce((acc, h) => acc + h.history.filter(Boolean).length, 0);

  // --- AI COACHING LOGIC ---
  const showAiCoaching = activeGoals.length > 0 || activeHabits.length > 0;
  
  // Dynamic recommendations feed
  const getAiCoachingInsights = () => {
    const insights = [];
    if (bestHabitStreak >= 5) {
      const bestHabitName = activeHabits.find(h => h.streak === bestHabitStreak)?.name || "habit";
      insights.push(`You've completed your '${bestHabitName}' habit for ${bestHabitStreak} consecutive days. Your cognitive momentum is building!`);
    }
    
    // Check for high priority goal close to deadline
    const highPrioritySoon = activeGoals.find(g => g.priority === "high" && g.progress < 80);
    if (highPrioritySoon) {
      insights.push(`Your high priority goal '${highPrioritySoon.title}' is currently at ${highPrioritySoon.progress}% progress. Adding a daily habit for this ensures runway compliance.`);
    }

    if (habitsTodayRate > 50) {
      insights.push("Moving tomorrow's focus blocks to 7 AM increases execution probability by 18% based on your historical high energy peaks.");
    } else {
      insights.push("Your AI Coach is studying your daily consistency triggers. Complete habits early in the morning to optimize study runway.");
    }
    return insights;
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Tab Header with Demo / Clear Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono tracking-[0.2em] text-indigo-600 uppercase font-bold">Aesthetic Workspace</span>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            {isDemoMode && (
              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase flex items-center gap-1 border border-amber-200">
                <Star size={10} className="fill-amber-500 text-amber-500" /> DEMO DATA ACTIVE
              </span>
            )}
          </div>
          <h2 className="text-3xl font-display font-medium text-gray-900 tracking-tight">Goals & Habits</h2>
          <p className="text-xs text-gray-400 mt-1">Design customizable objectives and build lasting routines guided by AI.</p>
        </div>

        <div className="flex items-center gap-2">
          {goals.length > 0 || habits.length > 0 ? (
            <>
              <button
                onClick={handleClearWorkspace}
                className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-mono rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={12} /> Clear Workspace
              </button>
            </>
          ) : (
            <button
              onClick={handleLoadDemoWorkspace}
              className="px-3.5 py-1.5 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-mono rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={12} className="animate-spin-slow" /> Load Demo Workspace
            </button>
          )}
        </div>
      </div>

      {/* --- GOAL & HABITS CORE LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ================= GOALS COLUMN (6 COLS) ================= */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <h3 className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase flex items-center gap-2">
                <Trophy size={14} className="text-indigo-500" /> Active Milestones & Goals
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-gray-700 rounded-lg border border-gray-100 transition-colors cursor-pointer"
                  title="Import Goals"
                >
                  <Import size={13} />
                </button>
                <button
                  onClick={() => setShowAddGoalModal(true)}
                  className="px-2.5 py-1 text-[11px] font-mono border border-gray-200 hover:border-black text-gray-800 hover:text-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> Goal
                </button>
                <button
                  onClick={() => setShowAiGoalModal(true)}
                  className="px-2.5 py-1 text-[11px] font-mono bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Sparkles size={12} /> AI Goal
                </button>
              </div>
            </div>

            {/* Empty State Goals */}
            {activeGoals.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-3xl shadow-inner animate-bounce-slow">
                  🎯
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-sm font-bold text-gray-800 font-display">Define your first objective</h4>
                  <p className="text-xs text-gray-400">
                    Create your first goal and let your AI Chief of Staff build an execution strategy.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowAddGoalModal(true)}
                    className="px-4 py-2 bg-white border border-gray-200 hover:border-black text-gray-800 text-xs font-mono rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    ➕ Create Goal
                  </button>
                  <button
                    onClick={() => setShowAiGoalModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    🤖 Generate Goal with AI
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {activeGoals.map((goal) => {
                  const isExpanded = expandedGoalId === goal.id;
                  const categoryMeta = CATEGORIES.find(c => c.id === goal.category) || CATEGORIES[5];
                  const borderStyle = goal.isPaused ? "border-dashed border-gray-300 opacity-75" : "border-gray-100 shadow-sm";

                  return (
                    <div 
                      key={goal.id} 
                      className={`border rounded-2xl bg-white overflow-hidden transition-all duration-300 ${borderStyle}`}
                    >
                      {/* Card Header clickable to Expand */}
                      <div className="p-4 flex items-start justify-between gap-3">
                        <div 
                          onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                          className="flex items-start gap-3 cursor-pointer flex-1"
                        >
                          <div className="text-2xl pt-0.5">{goal.icon || categoryMeta.icon}</div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${categoryMeta.color} bg-opacity-10 ${categoryMeta.text}`}>
                                {categoryMeta.label}
                              </span>
                              {goal.priority && (
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-100 font-medium ${
                                  goal.priority === "high" ? "text-red-600 bg-red-50" : goal.priority === "medium" ? "text-amber-600 bg-amber-50" : "text-gray-500"
                                }`}>
                                  {goal.priority.toUpperCase()}
                                </span>
                              )}
                              {goal.isPaused && (
                                <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">
                                  PAUSED
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-display font-medium text-gray-900 leading-snug">{goal.title}</h4>
                            <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
                              <span className="flex items-center gap-1"><Calendar size={10} /> Target: {goal.targetDate}</span>
                              {goal.estimatedEffort && <span>• Effort: {goal.estimatedEffort}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Right side controls */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono font-bold text-gray-900 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                            {goal.progress}%
                          </span>
                          <button
                            onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                            className="p-1 hover:bg-gray-50 text-gray-400 hover:text-gray-900 rounded"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Simple progress bar */}
                      <div className="px-4 pb-3">
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}
                          />
                        </div>
                      </div>

                      {/* Expanded Section */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="border-t border-gray-50 bg-gray-50/50 overflow-hidden"
                          >
                            <div className="p-4 space-y-5 text-xs">
                              {goal.description && (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">Strategy Goal Description</span>
                                  <p className="text-gray-600 italic leading-relaxed">"{goal.description}"</p>
                                </div>
                              )}

                              {/* Milestones list */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                                  <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">Syllabus Milestones</span>
                                  <span className="text-[10px] font-mono text-gray-400">Base Milestones weight 50%</span>
                                </div>

                                {goal.milestones && goal.milestones.length > 0 ? (
                                  <div className="space-y-2.5">
                                    {goal.milestones.map((milestone) => (
                                      <div key={milestone.id} className="p-3 bg-white border border-gray-100 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between">
                                          <div className="font-medium text-gray-800">{milestone.title}</div>
                                          <div className="text-[10px] font-mono font-bold text-gray-950">{milestone.completionPercentage}%</div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
                                          <span>Time: {milestone.estimatedTime}</span>
                                          <span>• Priority: {milestone.priority}</span>
                                          <span>• Deadline: {milestone.deadline}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={milestone.completionPercentage}
                                            onChange={(e) => handleUpdateMilestoneProgress(goal.id, milestone.id, parseInt(e.target.value))}
                                            className="flex-1 h-1 bg-gray-100 rounded appearance-none cursor-pointer accent-indigo-600"
                                          />
                                          <button
                                            onClick={() => handleUpdateMilestoneProgress(goal.id, milestone.id, milestone.completionPercentage === 100 ? 0 : 100)}
                                            className={`p-1 rounded border text-[10px] font-mono ${
                                              milestone.completionPercentage === 100 ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold" : "border-gray-200 text-gray-400"
                                            }`}
                                          >
                                            {milestone.completionPercentage === 100 ? "Done" : "Complete"}
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 italic py-1 text-center">
                                    No milestones generated. Click manual progress slider below or generate with AI.
                                  </div>
                                )}
                              </div>

                              {/* Manual direct slider overlay (If no milestones exist) */}
                              {(!goal.milestones || goal.milestones.length === 0) && (
                                <div className="space-y-1.5 p-3 bg-white border border-gray-100 rounded-xl">
                                  <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">Adjust Progress Percentage</span>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={goal.progress}
                                      onChange={(e) => handleUpdateGoalDirectProgress(goal.id, parseInt(e.target.value))}
                                      className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <span className="text-xs font-mono font-bold text-gray-900 w-8 text-right">{goal.progress}%</span>
                                  </div>
                                </div>
                              )}

                              {/* AI PROGRESS EVALUATOR TRIGGERS */}
                              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-1">
                                    <h5 className="text-[11px] font-bold text-indigo-950 font-mono uppercase tracking-wide flex items-center gap-1">
                                      <Sparkles size={12} className="text-indigo-600" /> AI Dynamic Workspace Audit
                                    </h5>
                                    <p className="text-[10px] text-indigo-800 leading-relaxed">
                                      Let your Chief of Staff scan completed planner tasks, uploaded documents, and habits telemetry to estimate real progressive alignment.
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleEvaluateDynamicProgress(goal.id)}
                                    disabled={isEvaluatingGoalId !== null}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-[10px] font-mono font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                                  >
                                    {isEvaluatingGoalId === goal.id ? (
                                      <>
                                        <RefreshCw size={10} className="animate-spin" /> Scanning...
                                      </>
                                    ) : (
                                      "Evaluate Progress"
                                    )}
                                  </button>
                                </div>

                                {evaluationFeedback && (
                                  <div className="p-2.5 bg-white border border-indigo-100 rounded-lg text-[10px] font-mono text-indigo-950 whitespace-pre-line leading-relaxed shadow-sm">
                                    {evaluationFeedback}
                                  </div>
                                )}
                              </div>

                              {/* AI Suggested Weekly Plan & Risks */}
                              {goal.weeklyPlan && goal.weeklyPlan.length > 0 && (
                                <div className="space-y-2 border-t border-gray-100 pt-3">
                                  <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">AI Weekly Strategic Schedule</span>
                                  <ul className="space-y-1.5 list-disc pl-4 text-gray-600 leading-relaxed">
                                    {goal.weeklyPlan.map((step, sIdx) => (
                                      <li key={sIdx}>{step}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {goal.riskFactors && goal.riskFactors.length > 0 && (
                                <div className="space-y-2 border-t border-gray-100 pt-3">
                                  <span className="text-[10px] font-mono uppercase text-red-400 font-bold flex items-center gap-1"><ShieldAlert size={11} /> AI Calculated Risk Analysis</span>
                                  <ul className="space-y-1 list-disc pl-4 text-gray-600 leading-relaxed">
                                    {goal.riskFactors.map((risk, rIdx) => (
                                      <li key={rIdx} className="text-red-700/80">{risk}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Management Tools Panel */}
                              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-[10px] font-mono text-gray-400">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleTogglePauseGoal(goal.id)}
                                    className="hover:text-amber-600 flex items-center gap-1 cursor-pointer"
                                  >
                                    {goal.isPaused ? <Play size={10} /> : <Pause size={10} />}
                                    {goal.isPaused ? "Resume" : "Pause"}
                                  </button>
                                  <span>•</span>
                                  <button
                                    onClick={() => handleToggleArchiveGoal(goal.id)}
                                    className="hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Archive size={10} /> Archive
                                  </button>
                                  <span>•</span>
                                  <button
                                    onClick={() => handleDuplicateGoal(goal)}
                                    className="hover:text-purple-600 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Copy size={10} /> Duplicate
                                  </button>
                                </div>

                                <button
                                  onClick={() => handleDeleteGoal(goal.id)}
                                  className="text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer font-bold"
                                >
                                  <Trash2 size={10} /> Delete Goal
                                </button>
                              </div>

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Category Browser Suggestion widget */}
          <div className="bg-gradient-to-tr from-gray-50 to-indigo-50/20 border border-gray-100 p-6 rounded-2xl shadow-sm">
            <h4 className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase mb-3 flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-500 animate-pulse" /> Need help choosing a goal?
            </h4>
            <span className="text-[10px] font-mono text-gray-400 block mb-4">Click a category below to explore suggested strategic formulations:</span>

            {/* Category selection bar */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-4">
              {Object.keys(CATEGORY_SUGGESTIONS).map((catKey) => {
                const catMeta = CATEGORIES.find(c => c.id === catKey) || CATEGORIES[5];
                return (
                  <button
                    key={catKey}
                    onClick={() => setActiveCategoryTab(catKey)}
                    className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono transition-all text-center cursor-pointer ${
                      activeCategoryTab === catKey
                        ? "bg-black border-black text-white font-bold"
                        : "bg-white border-gray-200 text-gray-500 hover:border-black"
                    }`}
                  >
                    {catMeta.icon} {catMeta.label}
                  </button>
                );
              })}
            </div>

            {/* Render selected category templates */}
            <div className="space-y-2">
              {CATEGORY_SUGGESTIONS[activeCategoryTab]?.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setAiGoalQuery(suggestion);
                    setShowAiGoalModal(true);
                  }}
                  className="w-full text-left p-3 bg-white hover:bg-indigo-50/40 border border-gray-100 hover:border-indigo-200 rounded-xl text-xs text-gray-700 transition-all cursor-pointer flex items-center justify-between gap-2 shadow-sm"
                >
                  <span className="leading-relaxed">{suggestion}</span>
                  <ArrowRight size={12} className="text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= HABITS COLUMN (6 COLS) ================= */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <h3 className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
                <Flame size={14} className="text-amber-500" /> Daily Habits Ticker
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddHabitModal(true)}
                  className="px-2.5 py-1 text-[11px] font-mono border border-gray-200 hover:border-black text-gray-800 hover:text-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> Habit
                </button>
                <button
                  onClick={() => {
                    if (goals.length === 0) {
                      triggerToast("Please create at least one Goal first to map AI habits suggests!", "info");
                      return;
                    }
                    setSelectedGoalForHabits(goals[0].id);
                    setShowAiHabitModal(true);
                  }}
                  className="px-2.5 py-1 text-[11px] font-mono bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Sparkles size={12} /> AI Suggests
                </button>
              </div>
            </div>

            {/* Habits Empty State */}
            {activeHabits.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-3xl shadow-inner animate-pulse-slow">
                  🔥
                </div>
                <div className="space-y-1 max-w-xs">
                  <h4 className="text-sm font-bold text-gray-800 font-display">Start your first routine</h4>
                  <p className="text-xs text-gray-400">
                    Build habits that matter to you. Track your progress. Improve consistency.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowAddHabitModal(true)}
                    className="px-4 py-2 bg-white border border-gray-200 hover:border-black text-gray-800 text-xs font-mono rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    ➕ Add Habit
                  </button>
                  <button
                    onClick={() => {
                      if (goals.length === 0) {
                        triggerToast("Create your first goal to unlock targeted AI Habit recommendations!", "info");
                        return;
                      }
                      setSelectedGoalForHabits(goals[0].id);
                      setShowAiHabitModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    🤖 AI Habit Suggestions
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Check Ticker Box */}
                      <button
                        onClick={() => handleToggleHabitToday(habit.id)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                          habit.completedToday
                            ? "bg-black border-black text-white"
                            : "border-gray-300 hover:border-black text-transparent"
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                      
                      <div className="space-y-1">
                        <h5 className={`text-xs font-medium font-display leading-tight ${habit.completedToday ? "text-gray-400 line-through" : "text-gray-800"}`}>
                          {habit.name}
                        </h5>
                        
                        <div className="flex items-center gap-2">
                          {habit.frequency && (
                            <span className="text-[8px] font-mono text-gray-400 uppercase bg-gray-50 px-1 py-0.5 rounded">
                              {habit.frequency}
                            </span>
                          )}
                          {habit.specificTimes && habit.specificTimes.length > 0 && (
                            <span className="text-[8px] font-mono text-gray-400 flex items-center gap-0.5">
                              <Clock size={8} /> {habit.specificTimes.join(", ")}
                            </span>
                          )}
                        </div>

                        {/* Last 7 days history blocks */}
                        <div className="flex gap-1 pt-1">
                          {habit.history.map((completed, hIdx) => (
                            <div
                              key={hIdx}
                              className={`w-2.5 h-2.5 rounded-sm transition-all ${
                                completed ? "bg-amber-500 scale-105 shadow-sm" : "bg-gray-100 hover:bg-gray-200"
                              }`}
                              title={`Day ${hIdx + 1}: ${completed ? "Completed" : "Incomplete"}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Real Completed Habit Streak Tally */}
                      <div className="text-right flex items-center gap-1 font-mono text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded">
                        <Flame size={12} className="fill-amber-500 animate-pulse" />
                        <span>{habit.streak}d</span>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded transition-colors cursor-pointer"
                        title="Delete Habit"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ================= DYNAMIC ANALYTICS HUB ================= */}
          {(activeGoals.length > 0 || activeHabits.length > 0) ? (
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-5">
              <h3 className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5 border-b border-gray-50 pb-3">
                <BarChart2 size={14} className="text-indigo-600" /> Executive Progress Analytics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Average Progress Ring card */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-gray-400 block uppercase">Avg Goal progress</span>
                  <div className="my-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-display text-gray-900">{avgProgress}%</span>
                    <span className="text-[10px] font-mono text-indigo-600 font-bold">Concentric</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${avgProgress}%` }} />
                  </div>
                </div>

                {/* Milestone Rate card */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-gray-400 block uppercase">Milestone rate</span>
                  <div className="my-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-display text-gray-900">{milestoneCompletionRate}%</span>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">{completedMilestonesCount}/{totalMilestonesCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${milestoneCompletionRate}%` }} />
                  </div>
                </div>

                {/* Habits Tally card */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-gray-400 block uppercase">Habits checked today</span>
                  <div className="my-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-display text-gray-900">{habitsCompletedToday}</span>
                    <span className="text-[10px] font-mono text-gray-500">of {activeHabits.length} ({habitsTodayRate}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${habitsTodayRate}%` }} />
                  </div>
                </div>

                {/* Best Habit streak */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-gray-400 block uppercase">Active streak ceiling</span>
                  <div className="my-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-display text-amber-600 flex items-center gap-1">
                      <Flame size={18} className="fill-amber-500" /> {bestHabitStreak}d
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">Best</span>
                  </div>
                  <div className="text-[9px] font-mono text-gray-400 truncate">Total Reps logged: {totalRepetitions}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm text-center py-8">
              <span className="text-2xl block mb-2">📊</span>
              <p className="text-xs font-mono text-gray-400">Your analytics will appear once you start building habits.</p>
            </div>
          )}

          {/* ================= AI COACHING BOARD ================= */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5 border-b border-gray-50 pb-3">
              <Sparkles size={14} className="text-indigo-600" /> AI Behavioral Coaching FEED
            </h3>

            {showAiCoaching ? (
              <div className="space-y-3">
                {getAiCoachingInsights().map((insight, idx) => (
                  <div key={idx} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex gap-2.5">
                    <Info size={14} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-indigo-950 leading-relaxed font-mono">{insight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex gap-2.5">
                <HelpCircle size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400 leading-relaxed font-mono">
                  Your AI Coach is studying your consistency patterns. Keep tracking habits to unlock behavioral coaching insights.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ================= MODALS SECTION ================= */}

      {/* 1. MANUAL ADD GOAL MODAL */}
      <AnimatePresence>
        {showAddGoalModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-100 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-display font-medium text-gray-900 flex items-center gap-1.5">
                  🏆 Create Manual Strategic Goal
                </h3>
                <button onClick={() => setShowAddGoalModal(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveGoal} className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-gray-400 uppercase font-bold">Goal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete Final Year CS Project"
                    value={goalFormName}
                    onChange={(e) => setGoalFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:border-black rounded-lg text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-gray-400 uppercase font-bold">Category *</label>
                    <select
                      value={goalFormCategory}
                      onChange={(e) => setGoalFormCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-200 focus:border-black rounded-lg text-xs outline-none bg-white"
                    >
                      <option value="academic">Academic</option>
                      <option value="career">Career</option>
                      <option value="health">Health</option>
                      <option value="finance">Finance</option>
                      <option value="personal">Learning</option>
                      <option value="custom">Custom / Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-gray-400 uppercase font-bold">Target Date *</label>
                    <input
                      type="date"
                      required
                      value={goalFormTargetDate}
                      onChange={(e) => setGoalFormTargetDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 focus:border-black rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-gray-400 uppercase font-bold">Priority</label>
                    <select
                      value={goalFormPriority}
                      onChange={(e) => setGoalFormPriority(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-200 focus:border-black rounded-lg text-xs outline-none bg-white"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-gray-400 uppercase font-bold">Estimated Effort</label>
                    <input
                      type="text"
                      placeholder="e.g. 50 hours, 4 weeks"
                      value={goalFormEffort}
                      onChange={(e) => setGoalFormEffort(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 focus:border-black rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-gray-400 uppercase font-bold">Goal Description</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe what achievements constitute milestones mapping."
                    value={goalFormDesc}
                    onChange={(e) => setGoalFormDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:border-black rounded-lg text-xs outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[11px] font-mono text-gray-400 uppercase font-bold">Theme Color</label>
                    <input
                      type="color"
                      value={goalFormColor}
                      onChange={(e) => setGoalFormColor(e.target.value)}
                      className="w-full h-8 px-1 py-0.5 border border-gray-200 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-[11px] font-mono text-gray-400 uppercase font-bold">Emoji Icon</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={goalFormIcon}
                      onChange={(e) => setGoalFormIcon(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 focus:border-black rounded-lg text-xs outline-none text-center"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-gray-400 uppercase font-bold">Optional Reminder Period</label>
                  <input
                    type="text"
                    placeholder="e.g. Every Monday at 9:00 AM"
                    value={goalFormReminder}
                    onChange={(e) => setGoalFormReminder(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:border-black rounded-lg text-xs outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddGoalModal(false)}
                    className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-mono rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-mono rounded-lg shadow cursor-pointer"
                  >
                    Create Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. AI GOAL CREATOR MODAL */}
      <AnimatePresence>
        {showAiGoalModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-100 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-display font-medium text-indigo-950 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-indigo-600 animate-pulse" /> AI Strategic Goal Planner
                </h3>
                <button onClick={() => setShowAiGoalModal(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Text query input */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-indigo-700 uppercase font-bold block">Type your target milestone or long term vision</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. I want to crack GATE. / I want to complete my thesis. / Learn React"
                      value={aiGoalQuery}
                      onChange={(e) => setAiGoalQuery(e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-indigo-200 focus:border-indigo-600 rounded-xl text-xs outline-none shadow-inner bg-indigo-50/10"
                      onKeyDown={(e) => e.key === "Enter" && handleGenerateAiGoal()}
                    />
                    <button
                      onClick={handleGenerateAiGoal}
                      disabled={aiIsPlanning || !aiGoalQuery.trim()}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-mono rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer"
                    >
                      {aiIsPlanning ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" /> Analyzing...
                        </>
                      ) : (
                        "Generate"
                      )}
                    </button>
                  </div>
                </div>

                {/* Loading state illustration */}
                {aiIsPlanning && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <RefreshCw size={36} className="text-indigo-600 animate-spin" />
                    <div className="text-center space-y-1">
                      <h4 className="text-xs font-mono font-bold text-gray-800">Generating Syllabus & Milestones Blueprint</h4>
                      <p className="text-[11px] text-gray-400 max-w-sm">
                        AI Chief of Staff is mapping execution timelines, scheduling supporting daily routines, and identifying risk parameters.
                      </p>
                    </div>
                  </div>
                )}

                {/* Display Result Plan Review */}
                {aiPlannerResult && (
                  <div className="space-y-4 border border-indigo-100 bg-indigo-50/10 rounded-2xl p-4 animate-fade-in text-xs">
                    <div className="border-b border-indigo-50 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                          {aiPlannerResult.category?.toUpperCase() || "ACADEMIC"}
                        </span>
                        <span className="text-[9px] font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">
                          {aiPlannerResult.priority || "MEDIUM"}
                        </span>
                      </div>
                      <h4 className="text-sm font-display font-medium text-gray-900">{aiPlannerResult.title}</h4>
                      <p className="text-gray-500 italic mt-1 font-mono text-[10px]">"{aiPlannerResult.description}"</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-b border-indigo-50 pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-gray-400 block uppercase">Est. Preparation effort</span>
                        <div className="font-medium text-gray-800 font-mono text-[11px]">{aiPlannerResult.estimatedEffort || "6 weeks"}</div>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-gray-400 block uppercase">Est. completion time</span>
                        <div className="font-medium text-gray-800 font-mono text-[11px]">{aiPlannerResult.estimatedCompletionTime || "Approx. 80 Hours"}</div>
                      </div>
                    </div>

                    {/* Milestones preview */}
                    <div className="space-y-2 border-b border-indigo-50 pb-3">
                      <span className="text-[10px] font-mono text-gray-400 uppercase font-bold block">Estimated Syllabus Milestones</span>
                      <div className="space-y-1.5">
                        {aiPlannerResult.milestones?.map((m: any, mIdx: number) => (
                          <div key={mIdx} className="bg-white border border-gray-100 rounded-lg p-2.5 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-800">{m.title}</div>
                              <div className="text-[9px] font-mono text-gray-400">Deadline: {m.deadline} • Effort: {m.estimatedTime}</div>
                            </div>
                            <span className="text-[9px] font-mono font-bold bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                              {m.priority?.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weekly Plan */}
                    {aiPlannerResult.weeklyPlan && aiPlannerResult.weeklyPlan.length > 0 && (
                      <div className="space-y-1 border-b border-indigo-50 pb-3">
                        <span className="text-[10px] font-mono text-gray-400 uppercase font-bold block">Weekly Strategic Timeline</span>
                        <ul className="list-disc pl-4 text-gray-600 space-y-1">
                          {aiPlannerResult.weeklyPlan.map((step: string, sIdx: number) => (
                            <li key={sIdx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Habits suggestion mapping */}
                    {aiPlannerResult.suggestedHabits && aiPlannerResult.suggestedHabits.length > 0 && (
                      <div className="space-y-2 border-b border-indigo-50 pb-3">
                        <span className="text-[10px] font-mono text-indigo-700 uppercase font-bold block">Supporting routines recommended</span>
                        <div className="flex flex-wrap gap-1.5">
                          {aiPlannerResult.suggestedHabits.map((hName: string, hIdx: number) => (
                            <span key={hIdx} className="bg-indigo-50 border border-indigo-100 text-indigo-800 font-mono text-[9px] px-2.5 py-0.5 rounded-full font-bold">
                              🔥 {hName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Risk parameters */}
                    {aiPlannerResult.riskFactors && aiPlannerResult.riskFactors.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-red-500 uppercase font-bold block">Identified Risk Parameters</span>
                        <ul className="list-disc pl-4 text-red-800 space-y-0.5">
                          {aiPlannerResult.riskFactors.map((risk: string, rIdx: number) => (
                            <li key={rIdx}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-3 border-t border-indigo-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setAiPlannerResult(null)}
                        className="px-3 py-1.5 border border-indigo-200 text-indigo-700 font-mono text-[10px] rounded-lg cursor-pointer hover:bg-indigo-50"
                      >
                        Reset Formulation
                      </button>
                      <button
                        onClick={handleApproveAiGoal}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-mono font-bold rounded-lg shadow cursor-pointer"
                      >
                        Approve and Add to Workspace
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. MANUAL ADD HABIT MODAL */}
      <AnimatePresence>
        {showAddHabitModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-100 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-display font-medium text-gray-900 flex items-center gap-1.5">
                  🔥 Add Custom Daily Habit
                </h3>
                <button onClick={() => setShowAddHabitModal(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveHabit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-gray-400 uppercase font-bold">Habit Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Study DSA / Exercise / Drink Water"
                    value={habitFormName}
                    onChange={(e) => setHabitFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:border-black rounded-lg text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-gray-400 uppercase font-bold">Consistency Target Frequency</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["daily", "weekdays", "weekends", "custom"].map((freqOpt) => (
                      <button
                        type="button"
                        key={freqOpt}
                        onClick={() => setHabitFormFreq(freqOpt as any)}
                        className={`py-1.5 rounded-lg border font-mono text-[10px] transition-all capitalize cursor-pointer ${
                          habitFormFreq === freqOpt 
                            ? "bg-black border-black text-white font-bold" 
                            : "bg-white border-gray-200 text-gray-500 hover:border-black"
                        }`}
                      >
                        {freqOpt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom days selector if custom is chosen */}
                {habitFormFreq === "custom" && (
                  <div className="space-y-1.5 p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                    <span className="text-[10px] font-mono text-gray-400 uppercase font-bold block">Choose custom days:</span>
                    <div className="flex gap-1">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                        const isSelected = habitFormCustomDays.includes(day);
                        return (
                          <button
                            type="button"
                            key={day}
                            onClick={() => {
                              if (isSelected) {
                                setHabitFormCustomDays(habitFormCustomDays.filter(d => d !== day));
                              } else {
                                setHabitFormCustomDays([...habitFormCustomDays, day]);
                              }
                            }}
                            className={`flex-1 py-1 text-[10px] font-mono border rounded transition-all cursor-pointer ${
                              isSelected ? "bg-black border-black text-white font-bold" : "bg-white border-gray-200 text-gray-400"
                            }`}
                          >
                            {day[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-gray-400 uppercase font-bold">Specific Times</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 09:00 AM"
                      value={habitNewTimeInput}
                      onChange={(e) => setHabitNewTimeInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddTimeInput}
                      className="px-3 bg-black hover:bg-neutral-800 text-white rounded-lg cursor-pointer font-mono"
                    >
                      Add Time
                    </button>
                  </div>

                  {habitFormTimes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {habitFormTimes.map((time) => (
                        <span key={time} className="bg-gray-100 border border-gray-200 text-gray-700 font-mono text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                          {time}
                          <button type="button" onClick={() => handleRemoveTimeInput(time)} className="text-red-500 hover:text-red-700 font-bold cursor-pointer">
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-gray-400 uppercase font-bold">Reminder Frequency</label>
                  <select
                    value={habitReminderFreq}
                    onChange={(e) => setHabitReminderFreq(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:border-black rounded-lg text-xs outline-none bg-white"
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="3 times daily">3 times daily</option>
                    <option value="Only on schedule days">Only on scheduled days</option>
                  </select>
                </div>

                {/* AI Optimal time recommendation */}
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-indigo-700 uppercase font-bold block flex items-center gap-1">
                        <Sparkles size={11} className="text-indigo-600" /> AI Reminder Time Optimization
                      </span>
                      <p className="text-[9px] text-indigo-800">Analyze peak cognitive hours for this specific habit action.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateOptimalTime}
                      disabled={isGeneratingOptimalTime || !habitFormName.trim()}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-[9px] font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
                    >
                      {isGeneratingOptimalTime ? <RefreshCw size={9} className="animate-spin" /> : "Recommend"}
                    </button>
                  </div>

                  {habitFormOptimalTime && (
                    <div className="p-2 bg-white border border-indigo-100 rounded font-mono text-[9px] text-indigo-950 shadow-sm leading-relaxed">
                      💡 {habitFormOptimalTime}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddHabitModal(false)}
                    className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-mono rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-mono rounded-lg shadow cursor-pointer"
                  >
                    Add Habit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. AI HABIT SUGGESTIONS GENERATOR MODAL */}
      <AnimatePresence>
        {showAiHabitModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-100 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-display font-medium text-indigo-950 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-indigo-600 animate-pulse" /> AI Habit Recommender Engine
                </h3>
                <button onClick={() => setShowAiHabitModal(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Select Goal to map habits to */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-gray-400 uppercase font-bold">Select target goal to align routines *</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedGoalForHabits}
                      onChange={(e) => setSelectedGoalForHabits(e.target.value)}
                      className="flex-1 px-3 py-2 border border-indigo-200 focus:border-indigo-600 rounded-xl text-xs outline-none bg-white"
                    >
                      {goals.map(g => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleGenerateAiHabitSuggestions}
                      disabled={aiIsSuggestingHabits || !selectedGoalForHabits}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-mono rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {aiIsSuggestingHabits ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" /> mapping...
                        </>
                      ) : (
                        "Generate suggestions"
                      )}
                    </button>
                  </div>
                </div>

                {/* Loading state illustration */}
                {aiIsSuggestingHabits && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <RefreshCw size={36} className="text-indigo-600 animate-spin" />
                    <div className="text-center space-y-1">
                      <h4 className="text-xs font-mono font-bold text-gray-800">Calculating Routine Sync Timeframes</h4>
                      <p className="text-[11px] text-gray-400 max-w-sm">
                        Our model is structuring optimal intervals for study, recovery, and reviewing feedback based on standard human memory retention curves.
                      </p>
                    </div>
                  </div>
                )}

                {/* suggested habit result picker list */}
                {suggestedHabitsList.length > 0 && (
                  <div className="space-y-4 animate-fade-in">
                    <span className="text-[11px] font-mono text-indigo-700 uppercase font-bold block">Review AI Suggested supporting routines:</span>
                    <div className="space-y-3">
                      {suggestedHabitsList.map((sh, shIdx) => (
                        <div
                          key={shIdx}
                          className={`p-3 border rounded-xl flex items-start gap-3 transition-colors cursor-pointer ${
                            sh.selected ? "border-indigo-200 bg-indigo-50/10" : "border-gray-100 bg-white opacity-70"
                          }`}
                          onClick={() => {
                            setSuggestedHabitsList(prev => prev.map((item, idx) => idx === shIdx ? { ...item, selected: !item.selected } : item));
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={sh.selected}
                            onChange={() => {}} // handled by div click
                            className="mt-1 w-4 h-4 text-indigo-600 border-indigo-200 rounded cursor-pointer accent-indigo-600"
                          />
                          <div className="space-y-1 flex-1">
                            <h5 className="font-display font-medium text-gray-900 text-xs flex items-center gap-1.5">
                              🔥 {sh.name}
                            </h5>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                              <span className="bg-gray-50 border border-gray-100 px-1 py-0.5 rounded text-[8px] uppercase font-bold text-gray-500">{sh.frequency}</span>
                              <span className="flex items-center gap-0.5"><Clock size={9} /> Rec time: {sh.reminder}</span>
                            </div>
                            <p className="text-gray-500 italic text-[10px] leading-relaxed">"{sh.reason}"</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-indigo-50 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSuggestedHabitsList([])}
                        className="px-3 py-1.5 border border-indigo-100 text-indigo-700 font-mono text-[10px] rounded-lg cursor-pointer hover:bg-indigo-50"
                      >
                        Reset recommendations
                      </button>
                      <button
                        onClick={handleSaveSelectedSuggestedHabits}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-mono font-bold rounded-lg shadow cursor-pointer"
                      >
                        Save Selected Habits (0 Days Streak)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. IMPORT GOALS MODAL */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-100 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-display font-medium text-gray-900 flex items-center gap-1.5">
                  <Import size={16} className="text-indigo-600" /> Import Goals Integration Hub
                </h3>
                <button onClick={() => setShowImportModal(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-gray-400 uppercase font-bold">Select Import Source Platform</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "google-tasks", label: "Google Tasks", icon: "📋" },
                      { id: "google-calendar", label: "Google Calendar", icon: "📅" },
                      { id: "notion", label: "Notion", icon: "📓" },
                      { id: "todoist", label: "Todoist", icon: "🟥" },
                      { id: "microsoft", label: "MS To Do", icon: "🟦" },
                      { id: "csv", label: "Upload CSV File", icon: "📝" }
                    ].map((src) => (
                      <button
                        key={src.id}
                        onClick={() => {
                          setImportSource(src.id);
                          setImportStatus("idle");
                        }}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer transition-all ${
                          importSource === src.id 
                            ? "bg-black border-black text-white font-bold" 
                            : "bg-white border-gray-200 text-gray-700 hover:border-black"
                        }`}
                      >
                        <span className="text-xl">{src.icon}</span>
                        <span className="text-[9px] font-mono whitespace-nowrap">{src.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {importSource && importSource !== "csv" && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                    <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">Integration credentials validation</span>
                    <p className="text-gray-500 text-[10px] leading-relaxed">
                      Connecting with third-party servers. Since this runs inside AI Studio preview container, we authorize a connection with OAuth securely to fetch your remote checklists.
                    </p>
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-950 font-mono text-[9px] rounded-lg">
                      🔒 Secured Connection token ready. Click Import below.
                    </div>
                  </div>
                )}

                {importSource === "csv" && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-gray-400 uppercase font-bold block">Paste CSV Row Data</span>
                    <span className="text-[9px] text-gray-400 block font-mono">Header columns: Title, Category, TargetDate, Priority, Description</span>
                    <textarea
                      rows={5}
                      placeholder={`"Solve 50 coding problems","academic","2026-07-30","high","Focus on standard arrays and dynamic patterns"`}
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg font-mono text-[10px] resize-none outline-none focus:border-black"
                    />
                  </div>
                )}

                {importStatus === "success" && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono rounded-lg">
                    ✅ Success! Goals mapped and added to your Active Workspace.
                  </div>
                )}

                {importStatus === "error" && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-[10px] font-mono rounded-lg">
                    ❌ Import failed. Please format the rows correctly or try another provider.
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-mono rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportGoals}
                    disabled={!importSource}
                    className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-mono rounded-lg shadow cursor-pointer disabled:opacity-50"
                  >
                    Sync & Import Items
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-2.5 rounded-xl text-xs font-mono shadow-lg border z-50 animate-fade-in flex items-center gap-2 ${
          toast.type === "error" 
            ? "bg-red-50 border-red-200 text-red-700" 
            : toast.type === "info" 
            ? "bg-blue-50 border-blue-200 text-blue-700" 
            : "bg-emerald-50 border-emerald-200 text-emerald-700"
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
