import React, { useState, useEffect, useRef, TouchEvent, useCallback } from "react";
import { applyGlobalStyles } from "./utils/styles";
import { motion, AnimatePresence } from "motion/react";
import { Task, ScannedDoc } from "./types";
import GlobalAIClock from "./components/GlobalAIClock";
import DashboardHomeTab from "./components/DashboardHomeTab";
import DashboardTab from "./components/DashboardTab";
import PlannerTab from "./components/PlannerTab";
import FocusTab from "./components/FocusTab";
import ScannerTab from "./components/ScannerTab";
import VoiceTab from "./components/VoiceTab";
import HabitsTab from "./components/HabitsTab";
import CollaborationTab from "./components/CollaborationTab";
import GuidanceTab from "./components/GuidanceTab";
import SettingsTab from "./components/SettingsTab";
import { SmartMapPage } from "./smart-map-v2";
import MedicineTab from "./components/MedicineTab";
import SuccessPlannerTab from "./components/SuccessPlannerTab";
import EventCaptureTab from "./components/EventCaptureTab";
import { MiloProvider, MiloShell } from "./milo-v2";
import NotificationCenter, { AppNotification } from "./components/NotificationCenter";
import { useAuth } from "./context/AuthContext";
import { AuthView } from "./components/AuthView";
import { useLocalization } from "./context/LocalizationContext";
import { db, handleFirestoreError, OperationType } from "./lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { 
  Clock, 
  Compass, 
  Calendar, 
  CheckSquare, 
  Sparkles, 
  Flame, 
  ShieldAlert, 
  Zap, 
  User, 
  Mic, 
  Activity, 
  Cpu,
  FileText,
  Users,
  LogOut,
  VolumeX,
  Languages,
  Menu,
  X,
  Bell,
  Home,
  Settings as SettingsIcon,
  Plus,
  ChevronRight,
  ChevronLeft,
  Globe,
  Brain,
  LayoutGrid,
  Sliders,
  Layers,
  Bookmark,
  RotateCcw,
  Target,
  ArrowRight,
  Map as MapIcon,
  CheckCircle,
  Heart,
  BookOpen,
  Camera,
  GraduationCap
} from "lucide-react";

export default function App() {
  const { user, loading, logout } = useAuth();
  const { t, clockRotationTrigger, travelNotification, handleTravelDecision, isOffline, setIsOffline } = useLocalization();

  // Navigation active tab
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "productivity_cockpit" | "planner" | "focus" | "scanner" | "voice" | "habits" | "success_planner" | "collaboration" | "settings" | "smart_map" | "medicine" | "guidance" | "event_capture"
  >("dashboard");

  // Optional voice query parameter passed from Guidance tab
  const [voiceQueryParam, setVoiceQueryParam] = useState<string | undefined>(undefined);

  // Keep track of the last active tab that was NOT "voice"
  const [lastActiveTab, setLastActiveTab] = useState<string>("dashboard");

  useEffect(() => {
    if (activeTab && activeTab !== "voice") {
      setLastActiveTab(activeTab);
    }
  }, [activeTab]);

  // Preserve scroll positions when navigating between tabs
  const tabScrollPositions = useRef<Record<string, number>>({});
  const prevTabRef = useRef<string>(activeTab);

  useEffect(() => {
    // Save scroll position of the previous tab
    const prevTab = prevTabRef.current;
    if (prevTab) {
      tabScrollPositions.current[prevTab] = window.scrollY;
    }
    prevTabRef.current = activeTab;

    // Restore scroll position of the new active tab
    const targetScroll = tabScrollPositions.current[activeTab] || 0;
    const timer = setTimeout(() => {
      window.scrollTo({
        top: targetScroll,
        behavior: "instant" as any
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [activeTab]);

  // Responsive Drawer/Sidebar states
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isTabletExpanded, setIsTabletExpanded] = useState(false);

  // Quick Add task modal
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskDeadline, setQuickTaskDeadline] = useState("");
  const [quickTaskNotes, setQuickTaskNotes] = useState("");

  // --- Onboarding & First-Time User States ---
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(() => {
    return localStorage.getItem("saver_onboarding_complete") === "true";
  });
  const [demoDeleted, setDemoDeleted] = useState<boolean>(() => {
    return localStorage.getItem("saver_demo_deleted") === "true";
  });
  const [activeTourStep, setActiveTourStep] = useState<number>(0); // 0 = not in tour, 1-4 = tour steps
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [firstUploadCelebrated, setFirstUploadCelebrated] = useState<boolean>(() => {
    return localStorage.getItem("saver_first_upload_celebrated") === "true";
  });

  // --- Local Profile Sync States ---
  const [localAvatar, setLocalAvatar] = useState(() => localStorage.getItem("set_acc_avatar") || user?.photoURL || "");
  const [localProfileName, setLocalProfileName] = useState(() => localStorage.getItem("set_acc_name") || user?.displayName || user?.email?.split("@")[0] || "Active Commander");

  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem("set_app_theme") || "Light";
  });

  const handleUpdateTheme = (theme: string) => {
    localStorage.setItem("set_app_theme", theme);
    setCurrentTheme(theme);
    applyGlobalStyles();
    window.dispatchEvent(new Event("theme_updated"));
  };

  useEffect(() => {
    const handleThemeChange = () => {
      setCurrentTheme(localStorage.getItem("set_app_theme") || "Light");
    };
    window.addEventListener("theme_updated", handleThemeChange);
    return () => {
      window.removeEventListener("theme_updated", handleThemeChange);
    };
  }, []);

  useEffect(() => {
    applyGlobalStyles();
  }, []);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setLocalAvatar(localStorage.getItem("set_acc_avatar") || "");
      setLocalProfileName(localStorage.getItem("set_acc_name") || "");
      applyGlobalStyles();
    };
    window.addEventListener("profile_updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profile_updated", handleProfileUpdate);
    };
  }, [user]);

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem("saver_is_demo") === "true";
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setIsDemoMode(localStorage.getItem("saver_is_demo") === "true");
    };
    const handleNavigateTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("demo_mode_changed", handleStorageChange);
    window.addEventListener("navigate_tab", handleNavigateTab);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("demo_mode_changed", handleStorageChange);
      window.removeEventListener("navigate_tab", handleNavigateTab);
    };
  }, []);

  // --- Toolbar Workspace Customizable Layout States ---
  const [spacingTheme, setSpacingTheme] = useState<"compact" | "comfortable" | "expanded">("comfortable");
  const [focusModeActive, setFocusModeActive] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<"standard" | "focus" | "split" | "analytics" | "planning" | "collaboration">("standard");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null); // "layout" | "quick" | "ai" | "theme" | "widgets" | "presets" | null
  const toggleDropdown = (key: string) => {
    setActiveDropdown(activeDropdown === key ? null : key);
  };
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("saver_visible_widgets");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      risk: true,
      calendar: true,
      stats: true,
      goals: true,
      habits: true,
      voice: true,
      notifications: true,
      clock: true
    };
  });

  // Persistent user state loaded from localStorage
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scannedDocs, setScannedDocs] = useState<ScannedDoc[]>([]);
  
  // Emergency Rescue Mode State (Countdown, compressed schedule, red alarms)
  const [isRescueMode, setIsRescueMode] = useState(false);

  // Quick Action triggers
  const [autoStartCamera, setAutoStartCamera] = useState(false);

  // Responsive panel collapse states for user layout customization
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clockCollapsed, setClockCollapsed] = useState(false);

  // Dynamic Clock Parameters
  const [clockMode, setClockMode] = useState<"scanner" | "timeline" | "gauge" | "event" | "timer" | "progress" | "pulse" | "default">("default");
  const [riskScore, setRiskScore] = useState(0);
  const [focusPercent, setFocusPercent] = useState(0);
  const [focusTimeLeftStr, setFocusTimeLeftStr] = useState("25:00");
  const [voiceIntensity, setVoiceIntensity] = useState(0);
  const [goalProgresses, setGoalProgresses] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem("saver_goal_progresses");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleUpdateGoalProgress = useCallback((gProgresses: number[]) => {
    setGoalProgresses(prev => {
      if (prev.length === gProgresses.length && prev.every((v, i) => v === gProgresses[i])) {
        return prev;
      }
      return gProgresses;
    });
  }, []);

  const hasRealTasks = tasks.some(t => t.id !== "demo-assignment");

  // Dynamic Risk Engine: Recalculate risk whenever tasks change
  useEffect(() => {
    if (tasks.length === 0) {
      setRiskScore(0);
    } else {
      // Basic dynamic risk calculation (example)
      const highPriorityTasks = tasks.filter(t => t.priority === "high");
      const baseRisk = tasks.length * 5; // e.g. 5% per task
      const priorityRisk = highPriorityTasks.length * 10; // e.g. 10% per high priority task
      setRiskScore(Math.min(100, baseRisk + priorityRisk));
    }
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem("saver_visible_widgets", JSON.stringify(visibleWidgets));
  }, [visibleWidgets]);

  useEffect(() => {
    const savedTasks = localStorage.getItem("saver_tasks");
    
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      setTasks([]);
    }

    const savedDocs = localStorage.getItem("saver_docs");
    if (savedDocs) {
      setScannedDocs(JSON.parse(savedDocs));
    }
  }, []);

  // --- Real-time Notification System States ---
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [toast, setToast] = useState<{ id: string; title: string; message: string; type: string } | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const stored = localStorage.getItem("saver_notifications");
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { }
    }
    return [];
  });

  // Load tasks, docs & notifications from Firestore when user logs in
  useEffect(() => {
    let active = true;
    const loadUserData = async () => {
      if (user && user.uid !== "guest-user-session") {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists() && active) {
            const data = docSnap.data();
            if (data.tasks) setTasks(data.tasks);
            if (data.scannedDocs) setScannedDocs(data.scannedDocs);
            if (data.notifications) setNotifications(data.notifications);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
        }
      }
    };
    loadUserData();
    return () => { active = false; };
  }, [user]);

  // Save tasks, docs & notifications to Firestore when they change
  useEffect(() => {
    const saveUserData = async () => {
      if (user && user.uid !== "guest-user-session") {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(userDocRef, { tasks, scannedDocs, notifications }, { merge: true });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    };
    saveUserData();
  }, [tasks, scannedDocs, notifications, user]);

  // AI Attention Control System States
  const [attentionMuted, setAttentionMuted] = useState(false);
  const [muteDuration, setMuteDuration] = useState("1 Hour"); // "15 Min", "30 Min", "1 Hour", "Until Task Complete", "Until Tomorrow", "Custom"
  const [muteSecondsLeft, setMuteSecondsLeft] = useState<number | null>(null);
  const [personalityMode, setPersonalityMode] = useState<"silent" | "balanced" | "coach" | "rescue">("balanced");
  const [smartSilenceEnabled, setSmartSilenceEnabled] = useState(true);
  const [detectedSession, setDetectedSession] = useState<string>("none"); // "none", "deep_work", "study", "meeting", "interview", "presentation", "screen_sharing"
  const [dndCalendarSync, setDndCalendarSync] = useState(true);
  const [budgetUsed, setBudgetUsed] = useState(2); // out of 5 daily tokens
  const [reengagementSummary, setReengagementSummary] = useState<{
    deadlinesAnalyzed: number;
    scheduleAdjustments: number;
    criticalRisksDetected: boolean;
  } | null>(null);

  const [lastNotifiedRisk, setLastNotifiedRisk] = useState<number>(0);

  // Sync notifications to localStorage
  useEffect(() => {
    localStorage.setItem("saver_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Auto-dismiss Toast Timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Monitor Risk for Notification Trigger and Toast Display
  useEffect(() => {
    if (riskScore > 75 && Math.abs(riskScore - lastNotifiedRisk) > 5) {
      const similarExists = notifications.some(n => n.type === "risk" && !n.read && n.message.includes(`${riskScore}%`));
      if (!similarExists) {
        const id = `risk-notif-${Date.now()}`;
        const title = `🚨 Severe Delay Risk Detected: ${riskScore}%`;
        const message = `Pacing engine evaluated a severe risk score of ${riskScore}% on your current deliverables path. AI Chief-of-Staff suggests review of your Emergency Recovery checklist immediately.`;
        const newNotif: AppNotification = {
          id,
          type: "risk",
          title,
          message,
          time: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
          archived: false,
          pinned: true
        };
        setNotifications(prev => [newNotif, ...prev]);
        setLastNotifiedRisk(riskScore);

        setToast({
          id,
          title: "🚨 High Risk Detected",
          message: `Pacing risk rating at ${riskScore}%. Stored in your Notification Center.`,
          type: "risk"
        });
      }
    }
  }, [riskScore, lastNotifiedRisk, notifications]);

  // Notification action handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkUnread = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
  };

  const handleClearAllRead = () => {
    setNotifications(prev => prev.filter(n => !n.read));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleArchiveNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, archived: true } : n));
  };

  const handleTogglePinNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const handleMuteSimilarNotifications = (type: AppNotification["type"]) => {
    setNotifications(prev => prev.map(n => n.type === type ? { ...n, mutedType: true } : n));
    alert(`Muted similar ${type} notification alerts in this session.`);
  };

  const handleCreateTaskFromNotification = (notif: AppNotification) => {
    const parsedTask: Task = {
      id: `notif-task-${Date.now()}`,
      title: notif.title.replace("🚨 ", "").replace("⏳ ", ""),
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      notes: "Sourced from alert: " + notif.message,
      effortEstimatedHours: 4,
      riskScore: 50,
      completionProbability: 75,
      category: "Do Today",
      justification: "Risk mitigation task automatically compiled from warning bulletin.",
      suggestedAction: "Focus 1.5 hours in deep work mode to satisfy requirements.",
      subtasks: [
        { id: `notif-sub-${Date.now()}-1`, title: "Review requirements", durationStr: "1 hour", milestoneIndex: 1, riskLevel: "low", completed: false },
        { id: `notif-sub-${Date.now()}-2`, title: "Execute correction sprint", durationStr: "3 hours", milestoneIndex: 2, riskLevel: "medium", completed: false }
      ]
    };
    handleAddTask(parsedTask);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    alert(`Task "${parsedTask.title}" successfully compiled and synchronized to your Cockpit and Timeline!`);
  };

  // --- AI Cooldown & Fatigue Control System States ---
  const [cooldowns, setCooldowns] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("saver_cooldowns");
    return saved ? JSON.parse(saved) : {};
  });

  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState<string[]>(() => {
    const saved = localStorage.getItem("saver_acknowledged_warnings");
    return saved ? JSON.parse(saved) : [];
  });

  const [quietRecoveryMode, setQuietRecoveryMode] = useState(() => {
    const saved = localStorage.getItem("saver_quiet_recovery");
    return saved ? JSON.parse(saved) === "true" : false;
  });

  // Smart notification frequency statistics
  const [ignoredCount, setIgnoredCount] = useState(() => parseInt(localStorage.getItem("saver_ignored_count") || "0"));
  const [closedCount, setClosedCount] = useState(() => parseInt(localStorage.getItem("saver_closed_count") || "0"));
  const [completedCount, setCompletedCount] = useState(() => parseInt(localStorage.getItem("saver_completed_count") || "0"));

  // Voice Assistant Silence States
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceMuteDuration, setVoiceMuteDuration] = useState("None"); // "15 Min", "1 Hour", "Today", "Until Focus Session Ends"
  const [voiceMuteSecondsLeft, setVoiceMuteSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem("saver_cooldowns", JSON.stringify(cooldowns));
  }, [cooldowns]);

  useEffect(() => {
    localStorage.setItem("saver_acknowledged_warnings", JSON.stringify(acknowledgedWarnings));
  }, [acknowledgedWarnings]);

  useEffect(() => {
    localStorage.setItem("saver_quiet_recovery", quietRecoveryMode ? "true" : "false");
  }, [quietRecoveryMode]);

  useEffect(() => {
    localStorage.setItem("saver_ignored_count", ignoredCount.toString());
  }, [ignoredCount]);

  useEffect(() => {
    localStorage.setItem("saver_closed_count", closedCount.toString());
  }, [closedCount]);

  useEffect(() => {
    localStorage.setItem("saver_completed_count", completedCount.toString());
  }, [completedCount]);

  const [pendingCriticalAlert, setPendingCriticalAlert] = useState<{
    title: string;
    description: string;
    action: string;
  } | null>(null);

  const triggerCriticalOverride = () => {
    setPendingCriticalAlert({
      title: "⚠️ Critical Override: High-Intensity Risk Block",
      description: "Your CS102 Data Structures Final Project deadline is in 4 hours and 12 hours of estimated effort remain. User is at high risk of milestone failure.",
      action: "Initiate Emergency Rescue Sprints"
    });
  };

  // Sync personalityMode and isRescueMode
  useEffect(() => {
    if (isRescueMode) {
      setPersonalityMode("rescue");
    } else if (personalityMode === "rescue") {
      setPersonalityMode("balanced");
    }
  }, [isRescueMode]);

  // Handle Mute Timer Countdown & Voice Mute Countdown
  useEffect(() => {
    let interval: any = null;
    if (
      (attentionMuted && muteSecondsLeft !== null && muteSecondsLeft > 0) ||
      (voiceMuted && voiceMuteSecondsLeft !== null && voiceMuteSecondsLeft > 0)
    ) {
      interval = setInterval(() => {
        if (attentionMuted && muteSecondsLeft !== null) {
          setMuteSecondsLeft(prev => {
            if (prev === null) return null;
            if (prev <= 1) {
              // Mute ended!
              setAttentionMuted(false);
              setReengagementSummary({
                deadlinesAnalyzed: tasks.length,
                scheduleAdjustments: Math.floor(Math.random() * 2) + 1,
                criticalRisksDetected: false
              });
              return null;
            }
            return prev - 1;
          });
        }
        if (voiceMuted && voiceMuteSecondsLeft !== null) {
          setVoiceMuteSecondsLeft(prev => {
            if (prev === null) return null;
            if (prev <= 1) {
              setVoiceMuted(false);
              setVoiceMuteDuration("None");
              return null;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [attentionMuted, muteSecondsLeft, voiceMuted, voiceMuteSecondsLeft, tasks]);

  // Listen for Escape key on window to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Swipe left to close drawer touch helpers
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartXRef.current - touchEndXRef.current;
    if (swipeDistance > 60) { // Swiped left by at least 60px
      setIsMobileDrawerOpen(false);
    }
  };

  // Sync tasks to localStorage when altered
  const syncTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem("saver_tasks", JSON.stringify(newTasks));
  };

  const handleAddTask = (task: Task) => {
    const updated = [task, ...tasks];
    syncTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    if (id === "demo-assignment") {
      setDemoDeleted(true);
      localStorage.setItem("saver_demo_deleted", "true");
    }
    syncTasks(updated);
  };

  const handleDuplicateTask = (taskToCopy: Task) => {
    const clonedTask: Task = {
      ...taskToCopy,
      id: `task-clone-${Date.now()}`,
      title: taskToCopy.title.replace("📄 ", "") + " (Copy)"
    };
    // Remove demo traits if cloned
    delete (clonedTask as any).isDemo;
    const updated = [clonedTask, ...tasks];
    syncTasks(updated);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updated = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    syncTasks(updated);
  };

  const handleAddScannedDoc = (doc: ScannedDoc) => {
    const updated = [doc, ...scannedDocs];
    setScannedDocs(updated);
    localStorage.setItem("saver_docs", JSON.stringify(updated));

    // Also inject document extraction into tasks automatically to fulfill "Help me finish it"
    const parsedTask: Task = {
      id: `doc-task-${Date.now()}`,
      title: doc.title || "Scanned Assignment",
      deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 4 days out
      notes: "Auto-extracted from " + doc.fileName,
      effortEstimatedHours: doc.estimatedHours || 8,
      riskScore: 65,
      completionProbability: 45,
      category: "Do Today",
      justification: "Complex PDF criteria extracted. Suggest scheduling study phases early.",
      suggestedAction: "Initiate Phase 1: " + (doc.studyPlan?.[0]?.focus || "Review requirements"),
      subtasks: doc.studyPlan?.map((plan, idx) => ({
        id: `doc-sub-${Date.now()}-${idx}`,
        title: plan.week + ": " + plan.focus,
        durationStr: "3 hours",
        milestoneIndex: idx + 1,
        riskLevel: idx === 1 ? "high" : "medium",
        completed: false
      })) || []
    };
    handleAddTask(parsedTask);

    // If first real document is uploaded, celebrate!
    if (!onboardingComplete && !firstUploadCelebrated) {
      setShowCelebration(true);
      setFirstUploadCelebrated(true);
      localStorage.setItem("saver_first_upload_celebrated", "true");
    }
  };

  // --- Workspace Customizable Layout Handlers ---
  const applyWorkspacePreset = (presetName: string) => {
    const presets: Record<string, any> = {
      Study: {
        layoutMode: "focus",
        spacingTheme: "comfortable",
        visibleWidgets: { risk: false, calendar: true, stats: false, goals: true, habits: true, voice: false, notifications: false, clock: true },
        personalityMode: "coach",
        focusModeActive: true
      },
      Office: {
        layoutMode: "standard",
        spacingTheme: "comfortable",
        visibleWidgets: { risk: true, calendar: true, stats: true, goals: true, habits: true, voice: true, notifications: true, clock: true },
        personalityMode: "balanced",
        focusModeActive: false
      },
      Minimal: {
        layoutMode: "focus",
        spacingTheme: "compact",
        visibleWidgets: { risk: false, calendar: false, stats: false, goals: false, habits: false, voice: false, notifications: false, clock: true },
        personalityMode: "silent",
        focusModeActive: true
      },
      Presentation: {
        layoutMode: "standard",
        spacingTheme: "expanded",
        visibleWidgets: { risk: false, calendar: true, stats: true, goals: false, habits: false, voice: false, notifications: false, clock: false },
        personalityMode: "silent",
        focusModeActive: false
      },
      Hackathon: {
        layoutMode: "split",
        spacingTheme: "compact",
        visibleWidgets: { risk: true, calendar: true, stats: true, goals: true, habits: true, voice: true, notifications: true, clock: true },
        personalityMode: "rescue",
        focusModeActive: false
      }
    };

    const preset = presets[presetName];
    if (preset) {
      setLayoutMode(preset.layoutMode);
      setSpacingTheme(preset.spacingTheme);
      setVisibleWidgets(preset.visibleWidgets);
      setPersonalityMode(preset.personalityMode);
      setFocusModeActive(preset.focusModeActive);
      
      if (preset.layoutMode === "focus") {
        setSidebarCollapsed(true);
        setClockCollapsed(true);
        setAttentionMuted(true);
      } else if (preset.layoutMode === "split") {
        setSidebarCollapsed(true);
        setClockCollapsed(false);
      } else {
        setSidebarCollapsed(false);
        setClockCollapsed(false);
      }
      
      if (preset.layoutMode === "analytics") {
        setActiveTab("productivity_cockpit");
      } else if (preset.layoutMode === "planning") {
        setActiveTab("planner");
      } else if (preset.layoutMode === "collaboration") {
        setActiveTab("collaboration");
      } else if (preset.layoutMode === "focus") {
        setActiveTab("focus");
      } else {
        setActiveTab("dashboard");
      }
    }
    setActiveDropdown(null);
  };

  const handleResetWorkspace = () => {
    setLayoutMode("standard");
    setSpacingTheme("comfortable");
    setVisibleWidgets({
      risk: true,
      calendar: true,
      stats: true,
      goals: true,
      habits: true,
      voice: true,
      notifications: true,
      clock: true
    });
    setPersonalityMode("balanced");
    setFocusModeActive(false);
    setSidebarCollapsed(false);
    setClockCollapsed(false);
    setAttentionMuted(false);
    setActiveTab("dashboard");
    setActiveDropdown(null);
  };

  // Switch clock mode based on active tab
  useEffect(() => {
    if (activeTab === "dashboard") {
      setClockMode("gauge");
    } else if (activeTab === "planner") {
      setClockMode("timeline");
    } else if (activeTab === "focus") {
      setClockMode("timer");
    } else if (activeTab === "scanner") {
      setClockMode("default");
    } else if (activeTab === "voice") {
      setClockMode("pulse");
    } else if (activeTab === "habits") {
      setClockMode("progress");
    }
  }, [activeTab]);

  // Calculate risk score whenever tasks change
  useEffect(() => {
    const activeRisks = tasks.filter(t => t.riskScore !== undefined);
    if (activeRisks.length > 0) {
      const highestRisk = Math.max(...activeRisks.map(t => t.riskScore || 0));
      setRiskScore(highestRisk);
    } else {
      setRiskScore(0);
    }
  }, [tasks]);

  // Early returns placed safely AFTER all hook declarations
  if (loading) {
    return (
      <div id="auth-loading-spinner" className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-mono text-xs text-gray-500 space-y-4">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <span className="uppercase tracking-widest animate-pulse">Syncing Session...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthView onAuthSuccess={() => {}} />;
  }

  // Toggle Rescue Mode
  const handleToggleRescueMode = () => {
    const nextState = !isRescueMode;
    setIsRescueMode(nextState);
    setClockMode("timer"); // Countdown mode takes priority
    
    if (nextState) {
      setFocusTimeLeftStr("15:00"); // Standard emergency focus sprint
      setFocusPercent(10);
      
      // Compress tasks category to Do Now / Do Today
      const compressedTasks = tasks.map(t => {
        if (t.category === "Can Wait" || t.category === "Delegate") {
          return {
            ...t,
            category: "Do Today" as const,
            justification: "EMERGENCY COMPRESSION: Moved to Today to avoid schedule cascade block."
          };
        }
        return t;
      });
      syncTasks(compressedTasks);
    } else {
      setFocusTimeLeftStr("25:00");
      setFocusPercent(0);
      setClockMode("default");
    }
  };

  // Synchronize personality mode clicks with rescue mode state
  const handleSetPersonalityMode = (mode: "silent" | "balanced" | "coach" | "rescue") => {
    setPersonalityMode(mode);
    if (mode === "rescue") {
      if (!isRescueMode) {
        setIsRescueMode(true);
        setFocusTimeLeftStr("15:00");
        setFocusPercent(10);
        setClockMode("timer");
        const compressedTasks = tasks.map(t => {
          if (t.category === "Can Wait" || t.category === "Delegate") {
            return {
              ...t,
              category: "Do Today" as const,
              justification: "EMERGENCY COMPRESSION: Moved to Today to avoid schedule cascade block."
            };
          }
          return t;
        });
        syncTasks(compressedTasks);
      }
    } else {
      if (isRescueMode) {
        setIsRescueMode(false);
        setFocusTimeLeftStr("25:00");
        setFocusPercent(0);
        setClockMode("default");
      }
    }
  };

  return (
    <div className={`h-[100dvh] md:h-auto md:min-h-screen flex flex-col md:block overflow-hidden md:overflow-visible transition-colors duration-700 bg-[#FAFAFA] ${
      isRescueMode ? "bg-red-50/40 text-red-950" : "text-gray-900"
    }`}>
      
      <MiloProvider
        parentTasks={tasks}
        parentIsRescueMode={isRescueMode}
        onAddTask={handleAddTask}
        onNavigateTab={setActiveTab}
        onToggleRescueMode={handleToggleRescueMode}
        onSetClockMode={setClockMode}
        onSetVoiceIntensity={setVoiceIntensity}
      >

      {/* Offline Mode Banner */}
      {isOffline && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 text-xs font-mono text-center flex items-center justify-center gap-2 animate-pulse shadow-inner">
          <span>⚠️ OFFLINE MODE ACTIVE — Showing cached milestones & document indexes</span>
          <button 
            onClick={() => setIsOffline(false)} 
            className="underline hover:text-gray-200 ml-3 font-bold uppercase tracking-wider text-[10px]"
          >
            Reconnect
          </button>
        </div>
      )}
      
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50 shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Icon */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:text-black rounded-xl hover:bg-gray-50 transition-all cursor-pointer shrink-0"
              aria-label="Open Navigation Drawer"
            >
              <Menu size={20} />
            </button>

            {/* App Brand Identity */}
            <div className="flex items-center gap-3">
              <div className="relative w-7 h-7 rounded-full bg-black flex items-center justify-center text-white shrink-0">
                <div className="w-1.5 h-3.5 bg-white rounded-full rotate-45" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-medium tracking-[0.25em] text-gray-400 block leading-none">THE LAST-MINUTE</span>
                <span className="text-sm font-display font-bold text-black tracking-tight mt-0.5 block leading-none">SAVER</span>
              </div>
            </div>
          </div>

          {/* Quick Engine Status Indicator (No AI Slop / True Professionalism) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2 text-gray-500">
              <Activity size={14} className="text-gray-400" />
              <span>Execution Engine:</span>
              <span className="text-emerald-600 font-bold uppercase">Online</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Cpu size={14} className="text-gray-400" />
              <span>AI Core Model:</span>
              <span className="text-indigo-600 font-bold uppercase">Gemini-Flash</span>
            </div>
          </div>

          {/* Right Header: Notification Bell + Theme Toggle + Profile Avatar */}
          <div className="flex items-center gap-3.5">
            {/* Quick Theme Toggle */}
            <div className="flex items-center bg-gray-50 dark:bg-gray-900 p-0.5 rounded-xl border border-gray-200 dark:border-gray-700 select-none">
              {[
                { id: "Light", icon: "☀️", label: "Light" },
                { id: "Dark", icon: "🌙", label: "Dark" },
                { id: "System", icon: "🌓", label: "System" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleUpdateTheme(t.id)}
                  title={`${t.label} Theme`}
                  className={`px-2 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center justify-center ${
                    currentTheme === t.id 
                      ? "bg-white dark:bg-neutral-800 text-black dark:text-white shadow-xs font-bold" 
                      : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span className="hidden lg:inline text-[10px] ml-1">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Notification Bell */}
            <button 
              onClick={() => setShowNotificationPanel(true)}
              className="relative p-2 text-gray-400 hover:text-black rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
            >
              <Bell size={16} />
              {notifications.some(n => !n.read && !n.archived) && (
                <>
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-mono font-bold flex items-center justify-center rounded-full border border-white">
                    {notifications.filter(n => !n.read && !n.archived).length}
                  </span>
                </>
              )}
            </button>

            {/* User Profile Info */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block min-w-0">
                <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-wider block">Active Agent</span>
                <span className="text-xs font-bold text-gray-800 block -mt-0.5 truncate max-w-[150px] md:max-w-[220px]" title={user.email || ""}>
                  {localProfileName}
                </span>
              </div>
              
              {localAvatar ? (
                <img 
                  src={localAvatar} 
                  alt="Profile" 
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-mono font-bold uppercase">
                  {(localProfileName || "U")[0].toUpperCase()}
                </div>
              )}

              {/* Logout button (Desktop only, settings handles on mobile) */}
              <button
                onClick={() => logout()}
                title="Sign Out of Cockpit"
                className="hidden md:block p-1.5 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50/50 transition-all cursor-pointer"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* 2. DUAL-COLUMN LAYOUT: Side Dashboard + Main Interface + Animated Clock */}
      <div 
        className="max-w-7xl mx-auto w-full px-4 md:px-6 py-4 md:py-8 space-y-6 flex-1 overflow-y-auto md:overflow-visible overscroll-behavior-contain pb-[var(--mobile-pb,2rem)] md:pb-8"
        style={{
          '--mobile-pb': 'calc(100px + env(safe-area-inset-bottom))'
        } as React.CSSProperties}
      >
        
        {/* CRITICAL OVERRIDE SYSTEM INTERRUPT ALERT BANNER */}
        {pendingCriticalAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-600 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg border border-red-500 font-sans"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/15 rounded-xl text-white shrink-0">
                <ShieldAlert size={18} className="animate-bounce" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-widest text-red-200 uppercase font-bold">⚠️ CRITICAL OVERRIDE SYSTEM INTERRUPT</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-300 animate-ping" />
                </div>
                <h4 className="text-sm font-bold">{pendingCriticalAlert.title}</h4>
                <p className="text-xs text-red-100 mt-0.5">{pendingCriticalAlert.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setPendingCriticalAlert(null)}
                className="px-3 py-1.5 text-xs text-red-200 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                Dismiss Alert
              </button>
              <button 
                onClick={() => {
                  setPendingCriticalAlert(null);
                  handleToggleRescueMode();
                }}
                className="px-3.5 py-1.5 bg-white text-red-600 hover:bg-red-50 rounded-lg text-xs font-mono font-bold uppercase shadow-sm"
              >
                {pendingCriticalAlert.action}
              </button>
            </div>
          </motion.div>
        )}

        {/* FOCUS ACTIVE MUTED AI SUGGESTIONS STATUS BANNER */}
        {attentionMuted && !pendingCriticalAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-950 rounded-2xl flex items-center justify-between gap-3 shadow-xs font-sans"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-indigo-500 text-white rounded-lg">
                <VolumeX size={14} className="animate-pulse" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-mono tracking-widest text-indigo-500 uppercase font-bold">🔕 FOCUS MODE ACTIVE</span>
                <p className="text-xs text-indigo-800 font-medium">
                  AI suggestions paused {muteSecondsLeft !== null ? `for another ${Math.floor(muteSecondsLeft / 60)}m ${muteSecondsLeft % 60}s` : `until current focus blocks complete`}.
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                setAttentionMuted(false);
                setMuteSecondsLeft(null);
                setReengagementSummary({
                  deadlinesAnalyzed: tasks.length,
                  scheduleAdjustments: 1,
                  criticalRisksDetected: false
                });
              }}
              className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl text-[10px] font-mono font-bold uppercase transition-all"
            >
              Pause Focus Mode
            </button>
          </motion.div>
        )}

        {/* REDESIGNED PRODUCTIVITY-FOCUSED WORKSPACE CONTROLLER TOOLBAR */}
        <div id="workspace-controller-toolbar" className="flex flex-wrap items-center justify-between bg-white border border-gray-150 p-2 rounded-2xl gap-2 text-xs font-mono shadow-[0_1px_3px_rgba(0,0,0,0.02)] select-none">
          
          {/* LEFT AREA: Collapse Sidebar & Focus Mode */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-xl border cursor-pointer transition-all ${
                sidebarCollapsed 
                  ? "bg-neutral-950 text-white border-neutral-900" 
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:text-black hover:border-gray-300"
              }`}
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu size={13} />
            </button>

            {/* FOCUS MODE BUTTON */}
            <button
              onClick={() => {
                const nextVal = !focusModeActive;
                setFocusModeActive(nextVal);
                if (nextVal) {
                  // Enable focus mode
                  setSidebarCollapsed(true);
                  setClockCollapsed(true);
                  setAttentionMuted(true);
                  setActiveTab("focus");
                  setLayoutMode("focus");
                } else {
                  setSidebarCollapsed(false);
                  setClockCollapsed(false);
                  setAttentionMuted(false);
                  setActiveTab("dashboard");
                  setLayoutMode("standard");
                }
              }}
              className={`px-3 py-1.5 rounded-xl border font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                focusModeActive
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md animate-pulse"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:text-black hover:border-gray-300"
              }`}
              title="Toggle Focus Mode (starts distraction-free workspace, silences AI)"
            >
              <Target size={13} className={focusModeActive ? "text-white" : "text-indigo-500"} />
              <span className="text-[10px]">{focusModeActive ? "Focus Active" : "Focus Mode"}</span>
            </button>
          </div>

          {/* MIDDLE AREA: Dropdowns with Tooltips */}
          <div className="flex flex-wrap items-center gap-1">
            
            {/* 1. WORKSPACE LAYOUT */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("layout")}
                className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                  activeDropdown === "layout" ? "bg-black text-white border-black" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline font-bold">Layout:</span>
                <span className="capitalize">{layoutMode === "split" ? "Split View" : layoutMode}</span>
              </button>
              {activeDropdown === "layout" && (
                <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-150 rounded-xl shadow-lg p-1.5 z-40 min-w-[150px] space-y-1">
                  {[
                    { id: "standard", label: "Standard" },
                    { id: "focus", label: "Focus" },
                    { id: "split", label: "Split View" },
                    { id: "analytics", label: "Analytics" },
                    { id: "planning", label: "Planning" },
                    { id: "collaboration", label: "Collaboration" }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setLayoutMode(opt.id as any);
                        if (opt.id === "focus") {
                          setSidebarCollapsed(true);
                          setClockCollapsed(true);
                          setAttentionMuted(true);
                          setActiveTab("focus");
                        } else if (opt.id === "split") {
                          setSidebarCollapsed(true);
                          setClockCollapsed(false);
                          setActiveTab("dashboard");
                        } else if (opt.id === "analytics") {
                          setSidebarCollapsed(false);
                          setActiveTab("productivity_cockpit");
                        } else if (opt.id === "planning") {
                          setSidebarCollapsed(false);
                          setActiveTab("planner");
                        } else if (opt.id === "collaboration") {
                          setSidebarCollapsed(false);
                          setActiveTab("collaboration");
                        } else {
                          setSidebarCollapsed(false);
                          setClockCollapsed(false);
                          setActiveTab("dashboard");
                        }
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg hover:bg-neutral-50 text-[11px] font-medium block ${layoutMode === opt.id ? "bg-indigo-50 text-indigo-700 font-bold" : "text-gray-700"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. QUICK ACTIONS */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("quick")}
                className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                  activeDropdown === "quick" ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Zap size={13} className="text-amber-500" />
                <span className="font-bold text-amber-700">Quick Actions</span>
              </button>
              {activeDropdown === "quick" && (
                <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-150 rounded-xl shadow-lg p-1.5 z-40 min-w-[170px] space-y-1">
                  {[
                    { label: "Upload Document", action: () => setActiveTab("scanner") },
                    { label: "Create Task", action: () => setIsQuickAddOpen(true) },
                    { label: "Create Goal", action: () => setActiveTab("habits") },
                    { label: "Start Focus Session", action: () => { setActiveTab("focus"); setClockMode("timer"); } },
                    { label: "Ask AI", action: () => setActiveTab("voice") },
                    { label: "Open Smart Map", action: () => setActiveTab("smart_map") },
                    { label: "Analyze Schedule", action: () => { setClockMode("gauge"); handleToggleRescueMode(); } }
                  ].map((act, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        act.action();
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-neutral-50 text-[11px] font-medium text-gray-700 block border-b border-gray-50 last:border-0"
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. AI MODE */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("ai")}
                className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                  activeDropdown === "ai" ? "bg-black text-white border-black" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Brain size={13} className="text-purple-500" />
                <span className="hidden sm:inline font-bold">AI:</span>
                <span className="capitalize">{personalityMode}</span>
              </button>
              {activeDropdown === "ai" && (
                <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-150 rounded-xl shadow-lg p-1.5 z-40 min-w-[130px] space-y-1">
                  {[
                    { id: "silent", label: "Silent" },
                    { id: "balanced", label: "Balanced" },
                    { id: "coach", label: "Coach" },
                    { id: "rescue", label: "Rescue" }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setPersonalityMode(opt.id as any);
                        if (opt.id === "rescue") {
                          setIsRescueMode(true);
                          setClockMode("pulse");
                        } else {
                          setIsRescueMode(false);
                        }
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg hover:bg-neutral-50 text-[11px] font-medium block ${personalityMode === opt.id ? "bg-purple-50 text-purple-700 font-bold" : "text-gray-700"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. WORKSPACE THEME (SPACING) */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("theme")}
                className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                  activeDropdown === "theme" ? "bg-black text-white border-black" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Sliders size={13} />
                <span className="hidden sm:inline font-bold">Theme:</span>
                <span className="capitalize">{spacingTheme}</span>
              </button>
              {activeDropdown === "theme" && (
                <div className="absolute top-full right-0 sm:left-0 mt-1.5 bg-white border border-gray-150 rounded-xl shadow-lg p-1.5 z-40 min-w-[130px] space-y-1">
                  {[
                    { id: "compact", label: "Compact Density" },
                    { id: "comfortable", label: "Comfortable" },
                    { id: "expanded", label: "Expanded Spacing" }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSpacingTheme(opt.id as any);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg hover:bg-neutral-50 text-[11px] font-medium block ${spacingTheme === opt.id ? "bg-indigo-50 text-indigo-700 font-bold" : "text-gray-700"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. WIDGET MANAGER */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("widgets")}
                className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                  activeDropdown === "widgets" ? "bg-black text-white border-black" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Layers size={13} className="text-indigo-500" />
                <span className="font-bold">Widgets</span>
              </button>
              {activeDropdown === "widgets" && (
                <div className="absolute top-full right-0 mt-1.5 bg-white border border-gray-150 rounded-xl shadow-lg p-3 z-40 min-w-[200px] space-y-2 text-left">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-50">Active Widgets</div>
                  {[
                    { id: "risk", label: "Risk Bottlenecks" },
                    { id: "calendar", label: "Calendar Timeline" },
                    { id: "stats", label: "Productivity Stats" },
                    { id: "goals", label: "Goals Panel" },
                    { id: "habits", label: "Habits Grid" },
                    { id: "voice", label: "Voice Chief of Staff" },
                    { id: "notifications", label: "Notifications Feed" },
                    { id: "clock", label: "AI Clock Companion" }
                  ].map((widget) => (
                    <label key={widget.id} className="flex items-center gap-2 cursor-pointer py-0.5 hover:bg-neutral-50 rounded px-1">
                      <input
                        type="checkbox"
                        checked={visibleWidgets[widget.id] !== false}
                        onChange={(e) => {
                          setVisibleWidgets({
                            ...visibleWidgets,
                            [widget.id]: e.target.checked
                          });
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] font-medium text-gray-700">{widget.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 6. WORKSPACE PRESETS */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("presets")}
                className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                  activeDropdown === "presets" ? "bg-black text-white border-black" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Bookmark size={13} className="text-pink-500" />
                <span className="font-bold">Presets</span>
              </button>
              {activeDropdown === "presets" && (
                <div className="absolute top-full right-0 mt-1.5 bg-white border border-gray-150 rounded-xl shadow-lg p-1.5 z-40 min-w-[140px] space-y-1">
                  {["Study", "Office", "Minimal", "Presentation", "Hackathon"].map((presetName) => (
                    <button
                      key={presetName}
                      onClick={() => applyWorkspacePreset(presetName)}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-neutral-50 text-[11px] font-medium text-gray-700 block text-left"
                    >
                      {presetName}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT AREA: RESET WORKSPACE */}
          <div>
            <button
              onClick={handleResetWorkspace}
              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 hover:border-red-200 rounded-xl cursor-pointer transition-all flex items-center gap-1"
              title="Reset workspace to default"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider">Reset</span>
            </button>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMN A: RESPONSIVE LEFT SIDEBAR NAVIGATION */}
          {!sidebarCollapsed && (
            <aside className={`
              hidden md:block 
              ${isTabletExpanded ? "md:col-span-3 lg:col-span-3" : "md:col-span-1 lg:col-span-3"} 
              transition-all duration-300 space-y-6
            `}>
              
              {/* Sidebar Container */}
              <div className="bg-white border border-gray-150 p-4 rounded-3xl shadow-xs space-y-4">
                
                {/* Tablet Toggle Button (visible on tablet md but hidden on lg desktop) */}
                <div className="hidden md:flex lg:hidden justify-end border-b border-gray-50 pb-2">
                  <button
                    onClick={() => setIsTabletExpanded(!isTabletExpanded)}
                    className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-500 hover:text-black transition-all cursor-pointer"
                    title={isTabletExpanded ? "Collapse Sidebar to Icons" : "Expand Sidebar"}
                  >
                    {isTabletExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                  </button>
                </div>

                {/* Navigation groups */}
                <div className="space-y-5">
                  {[
                    {
                      title: "Workspace",
                      items: [
                        { id: "dashboard" as const, label: "Dashboard", icon: Home, badge: null },
                        { id: "productivity_cockpit" as const, label: t("nav.cockpit") || "Productivity Cockpit", icon: Compass, badge: isRescueMode ? "RESCUE" : null },
                        { id: "planner" as const, label: t("nav.planner") || "Milestone Planner", icon: CheckSquare, badge: null },
                        { id: "focus" as const, label: t("nav.focus") || "Focus & Calendar", icon: Calendar, badge: null },
                        { id: "smart_map" as const, label: "Smart Map Planner", icon: MapIcon, badge: "GPS" },
                      ]
                    },
                    {
                      title: "AI Tools",
                      items: [
                        { id: "voice" as const, label: t("nav.voice") || "Voice Chief of Staff", icon: Mic, badge: "SPEECH" },
                        { id: "scanner" as const, label: t("nav.scanner") || "Document Scanner", icon: FileText, badge: "OCR" },
                        { id: "event_capture" as const, label: "AI Event Capture", icon: Camera, badge: "VISION" },
                      ]
                    },
                    {
                      title: "Personal",
                      items: [
                        { id: "habits" as const, label: t("nav.habits") || "Habits & Goals", icon: Flame, badge: "STREAK" },
                        { id: "success_planner" as const, label: "AI Success Planner", icon: Target, badge: "ROADMAP" },
                        { id: "medicine" as const, label: "Medicine & Health", icon: Heart, badge: "CLINICAL" },
                      ]
                    },
                    {
                      title: "Guidance",
                      items: [
                        { id: "guidance" as const, label: "Guidance", icon: BookOpen, badge: "INFO" }
                      ]
                    },
                    {
                      title: "Settings",
                      items: [
                        { id: "settings" as const, label: "Settings", icon: SettingsIcon, badge: null }
                      ]
                    }
                  ].map((group) => {
                    return (
                      <div key={group.title} className="space-y-1.5">
                        {/* Group Header - hidden on tablet collapsed */}
                        <span className="text-[9px] font-mono tracking-widest text-gray-400 uppercase font-bold px-3 hidden lg:block">
                          {group.title}
                        </span>
                        {isTabletExpanded && (
                          <span className="text-[9px] font-mono tracking-widest text-gray-400 uppercase font-bold px-3 block lg:hidden">
                            {group.title}
                          </span>
                        )}

                        <div className="space-y-1">
                          {group.items.map((item) => {
                            const IconComp = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                title={item.label}
                                className={`w-full text-left rounded-xl transition-all flex items-center justify-between font-mono font-bold uppercase tracking-wider cursor-pointer ${
                                  isTabletExpanded 
                                    ? "px-3 py-2.5 text-xs h-10" 
                                    : "md:p-3 lg:px-3 lg:py-2.5 text-[10px] lg:text-xs md:justify-center lg:justify-between h-10 lg:h-10"
                                } ${
                                  isActive 
                                    ? "bg-black text-white border-l-4 border-indigo-500 shadow-xs" 
                                    : "text-gray-500 hover:text-black hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <IconComp size={14} className="shrink-0" />
                                  {/* Label - hidden on tablet collapsed */}
                                  <span className={`hidden lg:inline ${isTabletExpanded ? "inline" : "md:hidden"}`}>
                                    {item.label}
                                  </span>
                                </div>
                                
                                {/* Badge or indicator - hidden on tablet collapsed */}
                                {item.badge && (
                                  <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                                    isActive ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"
                                  } hidden lg:inline ${isTabletExpanded ? "inline" : "md:hidden"}`}>
                                    {item.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* EMERGENCY RESCUE MODE CONTROLLER */}
              <div className={`p-5 rounded-3xl border transition-all duration-500 shadow-xs ${
                isRescueMode 
                  ? "bg-red-50 border-red-200 shadow-[0_0_20px_rgba(239,68,68,0.05)]" 
                  : "bg-white border-gray-150"
              } hidden lg:block ${isTabletExpanded ? "md:block" : "md:hidden"}`}>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className={isRescueMode ? "text-red-500 animate-pulse" : "text-gray-400"} size={16} />
                    <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isRescueMode ? "text-red-600" : "text-gray-400"}`}>
                      Rescue Mode
                    </span>
                  </div>
                  <span className={`text-[8px] font-mono px-1.5 py-0.25 rounded-md ${
                    isRescueMode ? "bg-red-100 text-red-600 border border-red-200/40" : "bg-gray-100 text-gray-400"
                  }`}>
                    {isRescueMode ? "ENGAGED" : "OFFLINE"}
                  </span>
                </div>

                <p className="text-[10px] text-gray-500 leading-relaxed font-sans mb-4">
                  Activate to compress timelines, prioritize high-value deliverables, suggestions for scope reduction, and force immediate micro-sprint sequences.
                </p>

                <button
                  onClick={handleToggleRescueMode}
                  className={`w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                    isRescueMode 
                      ? "bg-red-600 hover:bg-red-500 text-white shadow-md" 
                      : "bg-white hover:bg-gray-50 text-gray-500 hover:text-black border border-gray-200"
                  }`}
                >
                  <Zap size={12} className={isRescueMode ? "animate-pulse" : ""} />
                  <span>{isRescueMode ? "Mute Rescue" : "Deploy Rescue"}</span>
                </button>
              </div>

              {/* Static Chief of Staff Mantra card */}
              <div className={`bg-white border border-gray-100 p-5 rounded-3xl shadow-xs text-center hidden lg:block ${isTabletExpanded ? "md:block" : "md:hidden"}`}>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest block mb-1">MANTRA</span>
                <p className="text-xs text-gray-500 italic leading-relaxed">
                  "Don't remind me.<br />Help me finish it."
                </p>
              </div>

            </aside>
          )}

          {/* COLUMN B: CENTRAL INTERACTIVE WORKPLACE TABS (Col Span dynamic based on layouts) */}
          <main className={`
            min-h-[500px] 
            pb-24 md:pb-0 
            ${sidebarCollapsed ? "lg:col-span-12" : "lg:col-span-9 animate-fade"}
            ${!sidebarCollapsed && isTabletExpanded ? "md:col-span-9 lg:col-span-9" : ""}
            ${!sidebarCollapsed && !isTabletExpanded ? "md:col-span-11 lg:col-span-9" : ""}
          `}>
             {activeTab === "dashboard" && (
              <DashboardHomeTab 
                tasks={tasks}
                scannedDocs={scannedDocs}
                isRescueMode={isRescueMode}
                onNavigate={(tab) => setActiveTab(tab)}
                onQuickScanEvent={() => {
                  setAutoStartCamera(true);
                  setActiveTab("event_capture");
                }}
                onToggleRescueMode={handleToggleRescueMode}
                riskScore={riskScore}
                goalProgresses={goalProgresses}
                onDeleteTask={handleDeleteTask}
                onDuplicateTask={handleDuplicateTask}
                onboardingComplete={onboardingComplete}
                onSkipOnboarding={() => {
                  setOnboardingComplete(true);
                  localStorage.setItem("saver_onboarding_complete", "true");
                }}
                onStartTour={() => setActiveTourStep(1)}
                activeTourStep={activeTourStep}
                setActiveTourStep={setActiveTourStep}
                visibleWidgets={visibleWidgets}
                spacingTheme={spacingTheme}
              />
            )}

            {activeTab === "productivity_cockpit" && (
              <DashboardTab 
                tasks={tasks} 
                onNavigateTab={(tab) => setActiveTab(tab)}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onDuplicateTask={handleDuplicateTask}
                onClearAllTasks={() => syncTasks([])}
                onReorderTasks={(newTasks) => syncTasks(newTasks)}
                isDemoMode={isDemoMode}
                onSetClockState={(risk, count) => {
                  setClockMode("gauge");
                  setRiskScore(risk);
                }}
                isRescueMode={isRescueMode}
                attentionMuted={attentionMuted}
                setAttentionMuted={setAttentionMuted}
                muteDuration={muteDuration}
                setMuteDuration={setMuteDuration}
                muteSecondsLeft={muteSecondsLeft}
                setMuteSecondsLeft={setMuteSecondsLeft}
                cooldowns={cooldowns}
                setCooldowns={setCooldowns}
                acknowledgedWarnings={acknowledgedWarnings}
                setAcknowledgedWarnings={setAcknowledgedWarnings}
                quietRecoveryMode={quietRecoveryMode}
                setQuietRecoveryMode={setQuietRecoveryMode}
                ignoredCount={ignoredCount}
                setIgnoredCount={setIgnoredCount}
                closedCount={closedCount}
                setClosedCount={setClosedCount}
                completedCount={completedCount}
                setCompletedCount={setCompletedCount}
                budgetUsed={budgetUsed}
                setBudgetUsed={setBudgetUsed}
              />
            )}

            {activeTab === "planner" && (
              <PlannerTab 
                tasks={tasks}
                onUpdateTask={handleUpdateTask}
                onSetClockState={(mode) => setClockMode(mode)}
              />
            )}

            {activeTab === "focus" && (
              <FocusTab 
                onUpdateFocusProgress={(percent, leftStr) => {
                  setFocusPercent(percent);
                  setFocusTimeLeftStr(leftStr);
                }}
                onSetClockState={(mode) => setClockMode(mode)}
                isRescueMode={isRescueMode}
                attentionMuted={attentionMuted}
                setAttentionMuted={setAttentionMuted}
                muteDuration={muteDuration}
                setMuteDuration={setMuteDuration}
                muteSecondsLeft={muteSecondsLeft}
                setMuteSecondsLeft={setMuteSecondsLeft}
                personalityMode={personalityMode}
                setPersonalityMode={handleSetPersonalityMode}
                smartSilenceEnabled={smartSilenceEnabled}
                setSmartSilenceEnabled={setSmartSilenceEnabled}
                detectedSession={detectedSession}
                setDetectedSession={setDetectedSession}
                dndCalendarSync={dndCalendarSync}
                setDndCalendarSync={setDndCalendarSync}
                budgetUsed={budgetUsed}
                setBudgetUsed={setBudgetUsed}
                reengagementSummary={reengagementSummary}
                setReengagementSummary={setReengagementSummary}
                triggerCriticalOverride={triggerCriticalOverride}
                voiceMuted={voiceMuted}
                setVoiceMuted={setVoiceMuted}
                voiceMuteDuration={voiceMuteDuration}
                setVoiceMuteDuration={setVoiceMuteDuration}
                voiceMuteSecondsLeft={voiceMuteSecondsLeft}
                setVoiceMuteSecondsLeft={setVoiceMuteSecondsLeft}
                quietRecoveryMode={quietRecoveryMode}
                setQuietRecoveryMode={setQuietRecoveryMode}
              />
            )}

            {activeTab === "scanner" && (
              <ScannerTab 
                onAddScannedTask={handleAddScannedDoc}
                onSetClockState={(mode) => setClockMode(mode)}
              />
            )}

            {activeTab === "event_capture" && (
              <EventCaptureTab 
                tasks={tasks}
                onAddTask={handleAddTask}
                onSetClockState={(mode) => setClockMode(mode)}
                autoStartCamera={autoStartCamera}
                onResetAutoStartCamera={() => setAutoStartCamera(false)}
              />
            )}

            {activeTab === "voice" && (
              <VoiceTab 
                lastActiveTab={lastActiveTab}
                onSetClockState={(mode) => setClockMode(mode)}
                onSetVoiceIntensity={(intensity) => setVoiceIntensity(intensity)}
                tasks={tasks}
                scannedDocs={scannedDocs}
                onAddScannedDoc={handleAddScannedDoc}
                onAddTask={handleAddTask}
                initialQuery={voiceQueryParam}
                onClearInitialQuery={() => setVoiceQueryParam(undefined)}
              />
            )}

            {activeTab === "habits" && (
              <HabitsTab 
                onUpdateGoalProgress={handleUpdateGoalProgress}
                onSetClockState={(mode) => setClockMode(mode)}
              />
            )}

            {activeTab === "guidance" && (
              <GuidanceTab 
                onNavigateToTab={(tab, initialQuery) => {
                  setActiveTab(tab);
                  if (tab === "voice" && initialQuery) {
                    setVoiceQueryParam(initialQuery);
                  }
                }}
              />
            )}

            {activeTab === "success_planner" && (
              <SuccessPlannerTab />
            )}

            {activeTab === "medicine" && (
              <MedicineTab />
            )}

            {activeTab === "smart_map" && (
              <SmartMapPage 
                tasks={tasks}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
              />
            )}

            {activeTab === "settings" && (
              <SettingsTab 
                personalityMode={personalityMode}
                onSetPersonalityMode={handleSetPersonalityMode}
                smartSilenceEnabled={smartSilenceEnabled}
                setSmartSilenceEnabled={setSmartSilenceEnabled}
                dndCalendarSync={dndCalendarSync}
                setDndCalendarSync={setDndCalendarSync}
                budgetUsed={budgetUsed}
                setBudgetUsed={setBudgetUsed}
                quietRecoveryMode={quietRecoveryMode}
                setQuietRecoveryMode={setQuietRecoveryMode}
              />
            )}
          </main>

          {/* COLUMN C has been removed, clock is now a persistent global floating widget */}

        </div>
      </div>

      {/* 3. MOBILE SLIDE-OUT NAVIGATION DRAWER */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden font-sans">
            {/* Dark blur overlay behind drawer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-xs cursor-pointer"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="absolute top-0 left-0 h-full w-[80%] max-w-[320px] bg-white/95 backdrop-blur-md shadow-2xl rounded-r-3xl flex flex-col justify-between border-r border-gray-100 overflow-hidden"
            >
              <div className="flex-1 flex flex-col min-h-0">
                {/* Drawer Header */}
                <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-white/40">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-6 h-6 rounded-full bg-black flex items-center justify-center text-white">
                      <div className="w-1.5 h-3 bg-white rounded-full rotate-45" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-bold tracking-widest text-gray-400 block leading-none">THE COCKPIT</span>
                      <span className="text-xs font-display font-bold text-black tracking-tight mt-0.5 block leading-none">SAVER</span>
                    </div>
                  </div>
                  
                  {/* Close button */}
                  <button
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Drawer Scrollable Navigation Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  {[
                    {
                      title: "Workspace",
                      items: [
                        { id: "dashboard" as const, label: "Dashboard", icon: Home, badge: null },
                        { id: "productivity_cockpit" as const, label: t("nav.cockpit") || "Productivity Cockpit", icon: Compass, badge: isRescueMode ? "RESCUE" : null },
                        { id: "planner" as const, label: t("nav.planner") || "Milestone Planner", icon: CheckSquare, badge: null },
                        { id: "focus" as const, label: t("nav.focus") || "Focus & Calendar", icon: Calendar, badge: null },
                        { id: "smart_map" as const, label: "Smart Map Planner", icon: MapIcon, badge: "GPS" },
                      ]
                    },
                    {
                      title: "AI Tools",
                      items: [
                        { id: "voice" as const, label: t("nav.voice") || "Voice Chief of Staff", icon: Mic, badge: "SPEECH" },
                        { id: "scanner" as const, label: t("nav.scanner") || "Document Scanner", icon: FileText, badge: "OCR" },
                        { id: "event_capture" as const, label: "AI Event Capture", icon: Camera, badge: "VISION" },
                      ]
                    },
                    {
                      title: "Personal",
                      items: [
                        { id: "habits" as const, label: t("nav.habits") || "Habits & Goals", icon: Flame, badge: "STREAK" },
                        { id: "success_planner" as const, label: "AI Success Planner", icon: Target, badge: "ROADMAP" },
                        { id: "medicine" as const, label: "Medicine & Health", icon: Heart, badge: "CLINICAL" },
                      ]
                    },
                    {
                      title: "Guidance",
                      items: [
                        { id: "guidance" as const, label: "Guidance", icon: BookOpen, badge: "INFO" }
                       ]
                    },
                    {
                      title: "Settings",
                      items: [
                        { id: "settings" as const, label: "Settings", icon: SettingsIcon, badge: null }
                      ]
                    }
                  ].map((group) => (
                    <div key={group.title} className="space-y-1.5">
                      <span className="text-[9px] font-mono tracking-widest text-gray-400 uppercase font-bold px-3 block">
                        {group.title}
                      </span>
                      
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const IconComp = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setActiveTab(item.id);
                                setIsMobileDrawerOpen(false);
                              }}
                              className={`w-full text-left px-3 py-3 text-xs rounded-xl transition-all flex items-center justify-between font-mono font-semibold uppercase tracking-wider h-12 cursor-pointer ${
                                isActive 
                                  ? "bg-black text-white border-l-4 border-indigo-500 shadow-sm" 
                                  : "text-gray-500 hover:text-black hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <IconComp size={16} />
                                <span>{item.label}</span>
                              </div>
                              {item.badge && (
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${isActive ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"}`}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drawer Footer with user node */}
              <div className="p-4 border-t border-gray-150 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  {localAvatar ? (
                    <img src={localAvatar} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-mono font-bold uppercase">
                      {(localProfileName || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase block leading-none">ACTIVE SESSION</span>
                    <span className="text-xs font-bold text-gray-800 block truncate mt-1 leading-none">{localProfileName}</span>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MOBILE BOTTOM NAVIGATION BAR */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-150 shadow-lg flex items-center justify-around px-4 md:hidden z-30 font-sans"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          height: "calc(64px + env(safe-area-inset-bottom))"
        }}
      >
        {/* Home */}
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === "dashboard" ? "text-indigo-600 scale-105 font-bold" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Home size={18} />
          <span className="text-[9px] mt-1 font-semibold">Home</span>
        </button>

        {/* Tasks */}
        <button
          onClick={() => setActiveTab("productivity_cockpit")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === "productivity_cockpit" ? "text-indigo-600 scale-105 font-bold" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Compass size={18} />
          <span className="text-[9px] mt-1 font-semibold">Tasks</span>
        </button>

        {/* Quick Add Plus Button */}
        <div className="flex justify-center flex-1 relative -top-3">
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95 cursor-pointer border-2 border-white"
            aria-label="Quick Add Task"
          >
            <Plus size={22} />
          </button>
        </div>

        {/* Focus Calendar */}
        <button
          onClick={() => setActiveTab("focus")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === "focus" ? "text-indigo-600 scale-105 font-bold" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Calendar size={18} />
          <span className="text-[9px] mt-1 font-semibold">Calendar</span>
        </button>

        {/* Profile Settings */}
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === "settings" ? "text-indigo-600 scale-105 font-bold" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <User size={18} />
          <span className="text-[9px] mt-1 font-semibold">Profile</span>
        </button>
      </nav>

      {/* 5. QUICK ADD TASK OVERLAY MODAL */}
      <AnimatePresence>
        {isQuickAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuickAddOpen(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Plus className="text-indigo-500" size={16} />
                  <span>Quick Add Milestone</span>
                </h3>
                <button
                  onClick={() => setIsQuickAddOpen(false)}
                  className="p-1 text-gray-400 hover:text-black rounded-lg transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold block">Milestone Name</label>
                  <input
                    type="text"
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    placeholder="e.g. Research draft sections"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-150 focus:border-black focus:bg-white rounded-xl outline-none transition-all"
                  />
                </div>

                {/* Deadline */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold block">Deadline Date</label>
                  <input
                    type="date"
                    value={quickTaskDeadline}
                    onChange={(e) => setQuickTaskDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-150 focus:border-black focus:bg-white rounded-xl outline-none transition-all"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold block">Brief Description / Notes</label>
                  <textarea
                    value={quickTaskNotes}
                    onChange={(e) => setQuickTaskNotes(e.target.value)}
                    placeholder="Add primary requirements or syllabus expectations..."
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-150 focus:border-black focus:bg-white rounded-xl outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (!quickTaskTitle.trim()) return;
                  const newTask: Task = {
                    id: Math.random().toString(36).substring(2, 9),
                    title: quickTaskTitle,
                    category: "Do Now",
                    deadline: quickTaskDeadline || new Date().toISOString().split("T")[0],
                    riskScore: 25,
                    notes: quickTaskNotes || "Created from mobile quick launcher",
                    suggestedAction: "Pacing Buffer: 4 Hours",
                    subtasks: [
                      { id: "s-1", title: "Core Section Draft", durationStr: "2 hours", milestoneIndex: 1, riskLevel: "medium", completed: false },
                      { id: "s-2", title: "Review Assessment criteria", durationStr: "1 hour", milestoneIndex: 2, riskLevel: "low", completed: false }
                    ]
                  };
                  handleAddTask(newTask);
                  // Reset states
                  setQuickTaskTitle("");
                  setQuickTaskDeadline("");
                  setQuickTaskNotes("");
                  setIsQuickAddOpen(false);
                }}
                disabled={!quickTaskTitle.trim()}
                className="w-full py-2.5 bg-black hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-mono font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Add Pacing Milestone</span>
              </button>
            </motion.div>
          </div>
        )}

        {/* Travel Mode Location Detection Prompt */}
        {travelNotification && travelNotification.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/45 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4"
            >
              <div className="flex items-start gap-3 pb-2 border-b border-gray-100">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <Globe size={20} className="animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <span>🌍 New Location Detected</span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Timezone differences have been detected.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-150 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-mono text-[9px] uppercase font-bold">You appear to be in:</span>
                  <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg text-[11px]">
                    📍 {travelNotification.detectedCity}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Would you like to temporarily adapt your workspace time, working hours, and local holidays to this region, or permanently shift?
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleTravelDecision("temporary")}
                  className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  ✈️ Switch Temporarily
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleTravelDecision("permanent")}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    🏠 Switch Permanently
                  </button>
                  <button
                    onClick={() => handleTravelDecision("keep")}
                    className="w-full py-2 bg-white hover:bg-gray-50 text-gray-500 border border-gray-200 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Keep Current Settings
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Voice Assistant Floating Companion overlay (Milo V2) */}
      <MiloShell />

      {/* PERSISTENT GLOBAL AI CLOCK COMPANION */}
      <GlobalAIClock 
        activeTab={activeTab}
        riskScore={riskScore}
        focusPercent={focusPercent}
        timeLeftStr={focusTimeLeftStr}
        voiceIntensity={voiceIntensity}
        goalProgresses={goalProgresses}
        activeTaskCount={tasks.length}
        isRescueMode={isRescueMode}
        attentionMuted={attentionMuted}
        clockRotationTrigger={clockRotationTrigger}
        onToggleRescueMode={handleToggleRescueMode}
        onToggleMuteAttention={() => setAttentionMuted(!attentionMuted)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        tasks={tasks}
      />

      {/* TOAST DYNAMIC SYSTEM ALERTS */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
            onClick={() => setToast(null)}
            className="fixed right-6 sm:bottom-6 sm:right-6 z-55 max-w-xs bg-black text-white p-4 rounded-2xl border border-neutral-800 shadow-2xl flex gap-3 cursor-pointer"
            style={{
              bottom: typeof window !== "undefined" && window.innerWidth < 768 
                ? "calc(80px + env(safe-area-inset-bottom))" 
                : "1.5rem"
            }}
          >
            <div className="p-1.5 bg-red-600 text-white rounded-lg shrink-0 h-8 w-8 flex items-center justify-center">
              <ShieldAlert size={16} className="animate-pulse" />
            </div>
            <div className="text-left space-y-0.5">
              <h4 className="text-xs font-bold font-sans">{toast.title}</h4>
              <p className="text-[10px] text-gray-400 font-sans leading-snug">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HIGH-FIDELITY FIRST INGESTION CELEBRATION ALERT */}
      <AnimatePresence>
        {showCelebration && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-55 p-4 select-none">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-white border-2 border-indigo-200 rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-6 relative overflow-hidden"
            >
              {/* Confetti Emoji Rain effect */}
              <div className="absolute inset-0 pointer-events-none opacity-25">
                {[...Array(12)].map((_, idx) => (
                  <div 
                    key={idx} 
                    className="absolute text-xl animate-bounce"
                    style={{
                      left: `${idx * 8}%`,
                      top: `${(idx % 3) * 15}%`,
                      animationDelay: `${idx * 0.15}s`
                    }}
                  >
                    🎉
                  </div>
                ))}
              </div>

              {/* Sparkles / Icon */}
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                <Sparkles size={28} />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono tracking-widest text-indigo-600 uppercase font-bold bg-indigo-50 px-3 py-1 rounded-full inline-block">
                  Achievement Unlocked
                </span>
                <h3 className="text-xl font-display font-black text-gray-900 tracking-tight">
                  First Successful Ingestion!
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed font-sans px-2">
                  Excellent! Your AI Chief of Staff has successfully ingested your document, extracting <strong>4 high-priority milestones</strong> and <strong>12 scheduled study subtasks</strong> from the syllabus outline.
                </p>
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl text-left text-xs font-mono text-indigo-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle size={14} className="text-indigo-600" />
                  <span>Next Recommended Action:</span>
                </div>
                <p className="font-sans text-[11px] text-gray-600 leading-snug">
                  Now head to your **Dynamic Cockpit** or **Planner** to review your custom-allocated safety corridors, study pacing windows, and kick off your very first session!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={() => {
                    setShowCelebration(false);
                    setOnboardingComplete(true);
                    localStorage.setItem("saver_onboarding_complete", "true");
                    setActiveTab("planner");
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>View Structured Schedule</span>
                  <ArrowRight size={13} />
                </button>
                <button
                  onClick={() => {
                    setShowCelebration(false);
                    setOnboardingComplete(true);
                    localStorage.setItem("saver_onboarding_complete", "true");
                  }}
                  className="w-full sm:w-auto px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-black rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NOTIFICATION CENTER SPLIT PANEL DRAWER */}
      <NotificationCenter 
        isOpen={showNotificationPanel}
        onClose={() => setShowNotificationPanel(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkUnread={handleMarkUnread}
        onMarkAllRead={handleMarkAllRead}
        onClearAllRead={handleClearAllRead}
        onDelete={handleDeleteNotification}
        onArchive={handleArchiveNotification}
        onTogglePin={handleTogglePinNotification}
        onMuteSimilar={handleMuteSimilarNotifications}
        onCreateTask={handleCreateTaskFromNotification}
      />

      </MiloProvider>
    </div>
  );
}
