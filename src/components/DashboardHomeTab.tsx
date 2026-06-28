import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Task, ScannedDoc } from "../types";
import { fetchWeather, WeatherData } from "../lib/weather";
import { 
  Zap, 
  Sparkles, 
  ShieldAlert, 
  Compass, 
  CheckCircle2, 
  Activity, 
  Clock, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  FileText,
  Volume2,
  Trash2,
  Copy,
  Eye,
  X,
  Play,
  Calendar,
  Plus,
  Info,
  CheckCircle,
  Sparkle,
  CloudSun,
  Camera,
  Mic,
  MapPin,
  Pill
} from "lucide-react";
import { useLocalization } from "../context/LocalizationContext";
import { useAuth } from "../context/AuthContext";
import AIDailyTimeline from "./AIDailyTimeline";

interface DashboardHomeTabProps {
  tasks: Task[];
  scannedDocs: ScannedDoc[];
  isRescueMode: boolean;
  onNavigate: (tab: "dashboard" | "productivity_cockpit" | "planner" | "focus" | "scanner" | "voice" | "habits" | "collaboration" | "languages" | "settings" | "smart_map" | "medicine" | "guidance" | "event_capture") => void;
  onQuickScanEvent?: () => void;
  onToggleRescueMode: () => void;
  riskScore: number;
  goalProgresses: number[];
  onDeleteTask: (id: string) => void;
  onDuplicateTask: (task: Task) => void;
  onboardingComplete: boolean;
  onSkipOnboarding: () => void;
  onStartTour: () => void;
  activeTourStep: number;
  setActiveTourStep: (step: number) => void;
  visibleWidgets: Record<string, boolean>;
  spacingTheme: "compact" | "comfortable" | "expanded";
}

export default function DashboardHomeTab({
  tasks,
  scannedDocs,
  isRescueMode,
  onNavigate,
  onQuickScanEvent,
  onToggleRescueMode,
  riskScore,
  goalProgresses,
  onDeleteTask,
  onDuplicateTask,
  onboardingComplete,
  onSkipOnboarding,
  onStartTour,
  activeTourStep,
  setActiveTourStep,
  visibleWidgets = {
    risk: true,
    calendar: true,
    stats: true,
    goals: true,
    habits: true,
    voice: true,
    notifications: true,
    clock: true,
    weather: true
  },
  spacingTheme = "comfortable"
}: DashboardHomeTabProps) {
  const { t, formatDate, country, city } = useLocalization();
  const { user } = useAuth();

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    const loadWeather = async () => {
      if (!city) return;
      try {
        const data = await fetchWeather({ city, country });
        setWeatherData(data);
        setWeatherError(null);
      } catch (err) {
        setWeatherError("Weather unavailable");
        console.warn("API Error:", err);
      }
    };
    loadWeather();
  }, [country, city]);

  // Local state for interactive calendar syncing demonstration
  const [calendarSyncState, setCalendarSyncState] = useState<"idle" | "syncing" | "synced">("idle");
  // Local state for opening the Analysis detail of the demo assignment
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hoveredMetricIndex, setHoveredMetricIndex] = useState<number | null>(null);

  // Helper for displaying transient UI feedback
  const triggerLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Get current local greeting
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Separate real tasks from demo tasks
  const realTasks = tasks.filter(t => t.id !== "demo-assignment");
  const demoTask = tasks.find(t => t.id === "demo-assignment");

  // Filter tasks based on status
  const activeTasks = tasks.filter(t => t.category !== "Delegate" && t.subtasks?.some(s => !s.completed));
  const urgentTasks = [...tasks]
    .filter(t => t.category === "Do Now" || (t.riskScore && t.riskScore > 60))
    .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

  const completedCount = tasks.reduce((acc, t) => acc + (t.subtasks?.filter(s => s.completed).length || 0), 0);
  const totalSubtasks = tasks.reduce((acc, t) => acc + (t.subtasks?.length || 0), 0);
  const progressPercent = totalSubtasks > 0 ? Math.round((completedCount / totalSubtasks) * 100) : 0;

  const getRiskBadgeColor = (score: number) => {
    if (score > 80) return "bg-red-500/10 text-red-500 border border-red-500/20";
    if (score > 50) return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
    return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
  };

  // Adaptive spacing theme multipliers
  const spacingClass = {
    compact: "space-y-4 gap-4",
    comfortable: "space-y-6 gap-6",
    expanded: "space-y-8 gap-8"
  }[spacingTheme];

  const handleCalendarSync = () => {
    setCalendarSyncState("syncing");
    setTimeout(() => {
      setCalendarSyncState("synced");
      triggerLocalToast("Calendar synchronizing is disabled without OAuth.");
    }, 1500);
  };

  return (
    <div className={`${spacingClass} font-sans pb-12`}>
      {/* Toast Notice */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white text-xs font-mono px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-neutral-800"
          >
            <Sparkles size={12} className="text-amber-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* QUICK ACTIONS ROW */}
      {/* ========================================================= */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => {
            if (onQuickScanEvent) {
              onQuickScanEvent();
            } else {
              onNavigate("event_capture");
            }
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Camera size={14} /> Scan Event
        </button>
        <button
          onClick={() => onNavigate("voice")}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Mic size={14} /> Talk to Milo
        </button>
        <button
          onClick={() => onNavigate("productivity_cockpit")}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Plus size={14} /> Quick Task
        </button>
        <button
          onClick={() => onNavigate("scanner")}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <FileText size={14} /> Upload Document
        </button>
        <button
          onClick={() => onNavigate("planner")}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Calendar size={14} /> Add Calendar Event
        </button>
        <button
          onClick={() => onNavigate("smart_map")}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <MapPin size={14} /> Navigate
        </button>
        <button
          onClick={() => onNavigate("medicine")}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Pill size={14} /> Add Medicine
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. ONBOARDING WELCOME AREA (Shown only if onboarding is not complete) */}
      {/* ========================================================= */}
      {!onboardingComplete && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/20 border border-indigo-100/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm relative overflow-hidden"
        >
          {/* Decorative Sparkle shapes */}
          <div className="absolute top-4 right-4 text-indigo-200 pointer-events-none">
            <Sparkle size={32} className="animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono tracking-widest text-indigo-600 uppercase font-bold bg-indigo-100/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles size={10} /> First Launch Experience
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            </div>
            
            <h1 id="onboarding-welcome-title" className="text-xl md:text-2xl font-display font-black text-gray-900 tracking-tight">
              👋 Welcome to Your AI Chief of Staff
            </h1>
            <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
              An offline-first, telemetry-driven pacing cockpit designed to analyze coursework, syllabus PDF files, and custom deadlines to create fatigue-free calendar corridors.
            </p>
          </div>

          {/* Core onboarding guide panel */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <button
              onClick={() => onNavigate("scanner")}
              className="p-4 bg-white hover:bg-neutral-50 border border-gray-150 rounded-2xl text-left hover:border-indigo-300 transition-all cursor-pointer space-y-1.5 shadow-3xs hover:shadow-xs group"
            >
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg w-max group-hover:scale-110 transition-transform">
                <FileText size={15} />
              </div>
              <h4 className="text-xs font-bold text-gray-900">📄 1. Ingest Syllabus</h4>
              <p className="text-[10px] text-gray-400 font-sans leading-snug">
                Upload any assignment outline, syllabus document, or course brief.
              </p>
            </button>

            <button
              onClick={() => onNavigate("productivity_cockpit")}
              className="p-4 bg-white hover:bg-neutral-50 border border-gray-150 rounded-2xl text-left hover:border-emerald-300 transition-all cursor-pointer space-y-1.5 shadow-3xs hover:shadow-xs group"
            >
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg w-max group-hover:scale-110 transition-transform">
                <Plus size={15} />
              </div>
              <h4 className="text-xs font-bold text-gray-900">➕ 2. Create Task</h4>
              <p className="text-[10px] text-gray-400 font-sans leading-snug">
                Log a single deadline and let the pacing engine build subtask vectors.
              </p>
            </button>

            <button
              onClick={() => onNavigate("voice")}
              className="p-4 bg-white hover:bg-neutral-50 border border-gray-150 rounded-2xl text-left hover:border-purple-300 transition-all cursor-pointer space-y-1.5 shadow-3xs hover:shadow-xs group"
            >
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg w-max group-hover:scale-110 transition-transform">
                <Volume2 size={15} />
              </div>
              <h4 className="text-xs font-bold text-gray-900">🎤 3. Speak to AI</h4>
              <p className="text-[10px] text-gray-400 font-sans leading-snug">
                Ask your companion to review schedules, audio-triaging workloads.
              </p>
            </button>

            <div className="p-4 bg-white border border-gray-150 rounded-2xl text-left transition-all space-y-1.5 shadow-3xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-lg w-max transition-transform ${calendarSyncState === "synced" ? "bg-emerald-50 text-emerald-600" : "bg-pink-50 text-pink-600"}`}>
                  <Calendar size={15} />
                </div>
                {calendarSyncState === "synced" && (
                  <span className="text-[8px] font-mono text-emerald-600 font-bold uppercase bg-emerald-50 px-1.5 py-0.5 rounded">Synced</span>
                )}
              </div>
              <h4 className="text-xs font-bold text-gray-900">📅 4. Sync Calendar</h4>
              {calendarSyncState === "idle" && (
                <button
                  onClick={handleCalendarSync}
                  className="px-2.5 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-[9px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
                >
                  Activate Sync
                </button>
              )}
              {calendarSyncState === "syncing" && (
                <span className="text-[9px] font-mono text-gray-400 animate-pulse">Establishing tunnel...</span>
              )}
              {calendarSyncState === "synced" && (
                <p className="text-[10px] text-amber-700 font-sans leading-snug">
                  Disabled without OAuth.
                </p>
              )}
              {calendarSyncState === "idle" && (
                <p className="text-[10px] text-gray-400 font-sans leading-snug">
                  Establish a secure connection with school / Google calendars.
                </p>
              )}
            </div>
          </div>

          {/* Product Tour Controller */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-indigo-100/50 pt-5 gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {activeTourStep === 0 ? (
                <button
                  onClick={() => setActiveTourStep(1)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Play size={12} fill="white" />
                  <span>Start Guided Product Tour</span>
                </button>
              ) : (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs w-full sm:max-w-md relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono font-bold text-indigo-700 uppercase tracking-widest">PRODUCT TOUR: STEP {activeTourStep}/4</span>
                    <button onClick={() => setActiveTourStep(0)} className="text-gray-400 hover:text-black">
                      <X size={12} />
                    </button>
                  </div>
                  {activeTourStep === 1 && (
                    <p className="text-gray-600 leading-snug">
                      <strong>Ingest Syllabi:</strong> Feed raw course document outlines or syllabi to the AI. The system runs an automated extraction engine mapping weights and task dates.
                    </p>
                  )}
                  {activeTourStep === 2 && (
                    <p className="text-gray-600 leading-snug">
                      <strong>Extraction Telemetry:</strong> AI measures required effort, and evaluates cognitive stress limits, calculating an accurate Risk Velocity Score out of 100%.
                    </p>
                  )}
                  {activeTourStep === 3 && (
                    <p className="text-gray-600 leading-snug">
                      <strong>Secure Time Corridors:</strong> The cockpit automatically schedules custom daily study slots, focus sessions, and buffer windows on your personal calendar.
                    </p>
                  )}
                  {activeTourStep === 4 && (
                    <p className="text-gray-600 leading-snug">
                      <strong>Submission Confidence:</strong> Track your real-time subtask pacing confidence. Avoid fatigue, secure perfect submissions, and stay ahead of academic stress.
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <span key={step} className={`w-1.5 h-1.5 rounded-full ${activeTourStep === step ? "bg-indigo-600" : "bg-indigo-200"}`} />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {activeTourStep > 1 && (
                        <button
                          onClick={() => setActiveTourStep(activeTourStep - 1)}
                          className="px-2 py-0.5 bg-white border border-gray-200 text-gray-500 rounded text-[9px] font-mono uppercase font-bold"
                        >
                          Back
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (activeTourStep === 4) {
                            onSkipOnboarding();
                            setActiveTourStep(0);
                            triggerLocalToast("Setup complete! Welcome to your clean workspace.");
                          } else {
                            setActiveTourStep(activeTourStep + 1);
                          }
                        }}
                        className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[9px] font-mono uppercase font-bold"
                      >
                        {activeTourStep === 4 ? "Complete" : "Next"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onSkipOnboarding}
              className="text-[11px] font-mono font-bold text-gray-400 hover:text-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Skip Setup & Explore Empty State ➔
            </button>
          </div>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* 2. MAIN COCKPIT OVERVIEW BANNER (Shown if onboarded) */}
      {/* ========================================================= */}
      {onboardingComplete && (
        <div className="relative bg-white border border-gray-150 rounded-3xl p-6 md:p-8 overflow-hidden shadow-xs">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-slate-50 to-transparent -mr-20 -mt-20 opacity-40 pointer-events-none rounded-full" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-indigo-500 uppercase font-bold bg-indigo-50 px-2.5 py-1 rounded-full">
                  Active Control Desk
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              
              <h1 className="text-xl md:text-2xl font-display font-black text-gray-900 tracking-tight">
                {getGreeting()}, {user?.displayName || "Commander"}
              </h1>
              
              <p className="text-xs text-gray-500 leading-relaxed">
                {realTasks.length === 0 ? (
                  <span>Your workspace is fully cleared and ready. Upload raw materials or deadlines to organize focus corridors.</span>
                ) : (
                  <span>Your autonomous cognitive-pacing cockpit is synchronized. We have detected <strong className="text-gray-900 font-semibold">{urgentTasks.length} high-stress bottlenecks</strong> on your flight-path today. Let's execute.</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigate("focus")}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Clock size={13} />
                <span>Initiate Focus block</span>
              </button>
              <button
                onClick={onToggleRescueMode}
                className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isRescueMode 
                    ? "bg-red-600 border-red-600 hover:bg-red-500 text-white shadow-md animate-pulse" 
                    : "bg-white border-gray-200 text-gray-600 hover:text-black hover:bg-gray-50"
                }`}
              >
                <Zap size={13} />
                <span>{isRescueMode ? "Engaged" : "Deploy Rescue"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. COCKPIT WIDGET TELEMETRY GRID */}
      {/* ========================================================= */}
      {visibleWidgets.stats !== false && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card A: Active Tracks */}
          <div className="bg-white border border-gray-150/70 p-4 rounded-2xl flex flex-col justify-between h-30 shadow-3xs hover:border-gray-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">Pacing Tracks</span>
              <div className="p-1.5 bg-gray-50 border border-gray-100 rounded-lg text-gray-600">
                <Compass size={13} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-gray-900">{tasks.length}</div>
              <p className="text-[10px] text-gray-500 mt-0.5">{activeTasks.length} active milestones</p>
            </div>
          </div>

          {/* Card B: Success Velocity */}
          <div className="bg-white border border-gray-150/70 p-4 rounded-2xl flex flex-col justify-between h-30 shadow-3xs hover:border-gray-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">Subtask Velocity</span>
              <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                <CheckCircle2 size={13} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-gray-900">{progressPercent}%</div>
              <div className="w-full bg-gray-100 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Card C: Highest Risk */}
          <div className="bg-white border border-gray-150/70 p-4 rounded-2xl flex flex-col justify-between h-30 shadow-3xs hover:border-gray-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">Max Risk Rating</span>
              <div className="p-1.5 bg-red-50 rounded-lg text-red-500">
                <ShieldAlert size={13} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-gray-900">{riskScore}%</div>
              <span className={`text-[8px] font-mono px-1 py-0.5 rounded uppercase font-extrabold inline-block mt-1 ${getRiskBadgeColor(riskScore)}`}>
                {riskScore > 75 ? "Severe Delay Risk" : riskScore > 45 ? "Elevated Warning" : "Optimal Corridor"}
              </span>
            </div>
          </div>

          {/* Card D: Document Feeds */}
          <div className="bg-white border border-gray-150/70 p-4 rounded-2xl flex flex-col justify-between h-30 shadow-3xs hover:border-gray-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">Document Feeds</span>
              <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-500">
                <FileText size={13} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-gray-900">{scannedDocs.length}</div>
              <p className="text-[10px] text-gray-500 mt-0.5">Syllabus documents ingested</p>
            </div>
          </div>

          {/* Weather Widget */}
          {visibleWidgets.weather !== false && (
            <div className="bg-white border border-gray-150/70 p-4 rounded-2xl flex flex-col justify-between h-30 shadow-3xs hover:border-gray-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">Local Weather</span>
                <div className="p-1.5 bg-sky-50 rounded-lg text-sky-600">
                  <CloudSun size={13} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight text-gray-900">
                  {weatherError ? "???" : weatherData ? `${weatherData.temperature}°C` : "..."}
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">{weatherError || (weatherData ? "Current conditions" : "Fetching...")}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. WORKSPACE BODY: TOUR / DEMO WORKSPACE / VISUALIZATION */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Visualization or Empty State */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Today's Performance Overview */}
          {visibleWidgets.stats !== false && (() => {
            const completedTasksCount = realTasks.filter(t => t.isCompleted).length;
            const pendingTasksCount = realTasks.filter(t => !t.isCompleted).length;
            const overdueTasksCount = realTasks.filter(t => !t.isCompleted && t.deadline && new Date(t.deadline) < new Date()).length;
            const focusSessionsCount = Math.max(1, realTasks.filter(t => !t.isCompleted && (t.category === "Do Now" || t.category === "Do Today")).length);
            const totalStudyHours = realTasks.reduce((sum, t) => sum + (t.effortEstimatedHours || 0), 0) || 4;
            const estimatedBreakTime = Math.round(totalStudyHours * 15); // 15 mins break per hour
            const calculatedProductivityScore = realTasks.length > 0 
              ? Math.round((completedTasksCount / realTasks.length) * 100) 
              : 85;

            const performanceMetrics = [
              { 
                label: "Completed Tasks", 
                value: `${completedTasksCount} Tasks`, 
                percentage: realTasks.length > 0 ? (completedTasksCount / realTasks.length) * 100 : 60, 
                color: "bg-emerald-500", 
                text: "text-emerald-500", 
                bg: "bg-emerald-500/10", 
                border: "border-emerald-100",
                desc: `${completedTasksCount} out of ${realTasks.length || 5} tasks completed successfully.`,
                icon: CheckCircle2 
              },
              { 
                label: "Pending Tasks", 
                value: `${pendingTasksCount} Active`, 
                percentage: realTasks.length > 0 ? (pendingTasksCount / realTasks.length) * 100 : 40, 
                color: "bg-blue-500", 
                text: "text-blue-500", 
                bg: "bg-blue-500/10", 
                border: "border-blue-100",
                desc: `${pendingTasksCount} tasks currently in progress.`,
                icon: Activity 
              },
              { 
                label: "Overdue Tasks", 
                value: `${overdueTasksCount} Tasks`, 
                percentage: overdueTasksCount > 0 ? Math.min(100, (overdueTasksCount / (realTasks.length || 5)) * 100) : 0, 
                color: "bg-red-500", 
                text: "text-red-500", 
                bg: "bg-red-500/10", 
                border: "border-red-100",
                desc: `${overdueTasksCount} tasks past their deadline buffer limits.`,
                icon: ShieldAlert 
              },
              { 
                label: "Focus Sessions", 
                value: `${focusSessionsCount} Sessions`, 
                percentage: Math.min(100, (focusSessionsCount / 6) * 100), 
                color: "bg-orange-500", 
                text: "text-orange-500", 
                bg: "bg-orange-500/10", 
                border: "border-orange-100",
                desc: `${focusSessionsCount} custom high-pacing focus blocks today.`,
                icon: Sparkle 
              },
              { 
                label: "Study Hours", 
                value: `${totalStudyHours} Hours`, 
                percentage: Math.min(100, (totalStudyHours / 12) * 100), 
                color: "bg-violet-500", 
                text: "text-violet-500", 
                bg: "bg-violet-500/10", 
                border: "border-violet-100",
                desc: `A calculated target of ${totalStudyHours} hours of dedicated academic focus.`,
                icon: Clock 
              },
              { 
                label: "Break Time", 
                value: `${estimatedBreakTime} Mins`, 
                percentage: Math.min(100, (estimatedBreakTime / 180) * 100), 
                color: "bg-purple-500", 
                text: "text-purple-500", 
                bg: "bg-purple-500/10", 
                border: "border-purple-100",
                desc: `${estimatedBreakTime} minutes of recommended cognitive recovery cycles.`,
                icon: Compass 
              },
              { 
                label: "Productivity Score", 
                value: `${calculatedProductivityScore}%`, 
                percentage: calculatedProductivityScore, 
                color: "bg-indigo-500", 
                text: "text-indigo-500", 
                bg: "bg-indigo-500/10", 
                border: "border-indigo-100",
                desc: `Aggregate execution efficiency score: ${calculatedProductivityScore}%.`,
                icon: TrendingUp 
              }
            ];

            return (
              <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-3xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-gray-400 font-bold block">Telemetry Visualization</span>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <Activity size={13} className="text-indigo-500" />
                      Today's Performance Overview
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block animate-pulse" />
                    <span>Real-time Insights</span>
                  </div>
                </div>

                {/* Grid of colorful, animated bars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {performanceMetrics.map((item, idx) => {
                    const MetricIcon = item.icon;
                    const isHovered = hoveredMetricIndex === idx;
                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredMetricIndex(idx)}
                        onMouseLeave={() => setHoveredMetricIndex(null)}
                        className="relative p-4 rounded-2xl border border-gray-150 bg-gray-50/20 hover:bg-gray-50/50 transition-all duration-300 shadow-2xs cursor-pointer flex flex-col justify-between overflow-visible"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold truncate">{item.label}</span>
                          <div className={`p-1.5 rounded-lg ${item.bg}`}>
                            <MetricIcon size={12} className={item.text} />
                          </div>
                        </div>

                        <div className="mt-3">
                          <span className="text-lg font-bold font-display text-gray-950 tracking-tight">{item.value}</span>
                          
                          {/* Smoothly animated horizontal progress bar */}
                          <div className="w-full bg-gray-100 dark:bg-gray-800/80 h-1.5 rounded-full overflow-hidden mt-2">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percentage}%` }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              className={`h-full ${item.color} rounded-full`}
                            />
                          </div>
                        </div>

                        {/* Exact values details overlay visible on hover */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.div 
                              initial={{ opacity: 0, y: 4, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 p-3 bg-black text-white text-[10px] rounded-xl shadow-xl z-50 pointer-events-none font-sans leading-relaxed text-center"
                            >
                              <span className="font-bold block text-indigo-300 mb-1">{item.label}</span>
                              {item.desc}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ACTIVE WORKSPACE OR CLEAN EMPTY STATE */}
          <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-3xs space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                <Compass size={13} className="text-indigo-500" />
                Active Execution Workspace
              </h3>
            </div>

            {realTasks.length === 0 ? (
              /* AESTHETIC EMPTY STATE LAYOUT */
              <div className="text-center py-10 px-6 bg-gray-50/40 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-indigo-50/60 flex items-center justify-center text-indigo-500 animate-pulse">
                  <Sparkles size={28} />
                </div>
                <div className="space-y-1 max-w-md">
                  <h4 className="text-sm font-bold text-gray-900 font-mono uppercase">Your Workspace is Ready</h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-sans">
                    Upload your first syllabus, project brief, meeting notes, or create a custom task. The AI Chief of Staff will begin calculating optimal flight-paths.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate("scanner")}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText size={12} />
                  <span>Ingest First Syllabus</span>
                </button>
              </div>
            ) : (
              /* ACTIVE USER TASKS VIEW */
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {realTasks.map(task => (
                  <div key={task.id} className="p-3.5 border border-gray-150/70 hover:border-gray-300 rounded-xl flex items-center justify-between gap-4 transition-all hover:bg-neutral-50/50">
                    <div className="space-y-1 max-w-[70%]">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{task.title}</h4>
                      <p className="text-[10px] text-gray-400 font-mono">Due: {formatDate(task.deadline)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] px-2 py-0.5 rounded font-mono font-bold ${getRiskBadgeColor(task.riskScore || 30)}`}>
                        Risk: {task.riskScore || 30}%
                      </span>
                      <button
                        onClick={() => onNavigate("productivity_cockpit")}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black transition-all"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Guides, Onboarding checklists */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* HELPFUL GUIDE PANEL ("How It Works") */}
          <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-3xs space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5 pb-2 border-b border-gray-100">
              <Info size={13} className="text-indigo-500" />
              How It Works
            </h3>
            <ul className="space-y-3 text-xs leading-relaxed text-gray-500">
              <li className="flex gap-2 items-start">
                <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 font-mono font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>Upload academic coursework, sylabi briefs or deadlines.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 font-mono font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>AI extracts subtasks, milestone timelines and effort ratings.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 font-mono font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>The system schedules optimized focus windows dynamically.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 font-mono font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                <span>Complete subtasks daily to keep risk velocities green.</span>
              </li>
            </ul>
            <button
              onClick={() => setActiveTourStep(1)}
              className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-mono font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer"
            >
              Restart Guide Tutorial
            </button>
          </div>

          {/* PROGRESSIVE AI EVOLUTION LEVEL PANEL */}
          <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-3xs space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5 pb-2 border-b border-gray-100">
              <Sparkles size={13} className="text-purple-500" />
              AI Cognitive Progression
            </h3>
            <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
              Your Chief of Staff grows dynamically alongside your academic workload.
            </p>

            <div className="space-y-2 text-[11px] font-mono">
              <div className="p-2 bg-indigo-50/50 border border-indigo-100/60 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-800">Day 1: Observe</span>
                  <span className="text-[8px] bg-indigo-600 text-white px-1.5 rounded font-extrabold uppercase">ACTIVE</span>
                </div>
                <p className="text-[10px] text-gray-500 font-sans">Learns your work cadence silently. Acts only upon explicit commands.</p>
              </div>

              <div className="p-2 border border-gray-100 rounded-xl opacity-60">
                <span className="font-bold text-gray-700">Week 1: Suggest</span>
                <p className="text-[10px] text-gray-500 font-sans">Begins suggesting optimal micro-sprints and priority triage options.</p>
              </div>

              <div className="p-2 border border-gray-100 rounded-xl opacity-60">
                <span className="font-bold text-gray-700">Week 2: Calibrate</span>
                <p className="text-[10px] text-gray-500 font-sans">Learns user fatigue habits and schedules focus corridors around high-stamina periods.</p>
              </div>
            </div>
            
            <div className="text-[9px] font-mono text-gray-400 font-bold bg-gray-50 p-2 rounded text-center">
              * Progresses naturally as coursework is submitted *
            </div>
          </div>

          {/* Priority Bottlenecks Widget (Rendered only if stats is visible) */}
          {visibleWidgets.risk !== false && (
            <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-3xs space-y-4">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-red-500" />
                  Immediate Bottlenecks
                </h3>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {urgentTasks.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 font-mono text-[10px]">
                    No active bottlenecks. Your schedule looks completely green!
                  </div>
                ) : (
                  urgentTasks.slice(0, 3).map(task => (
                    <div key={task.id} className="p-2.5 border border-gray-100 bg-gray-50/20 rounded-xl space-y-1 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-gray-900 truncate max-w-[70%]">{task.title}</h4>
                        <span className={`text-[8px] px-1 py-0.25 rounded font-mono font-bold shrink-0 ${getRiskBadgeColor(task.riskScore || 50)}`}>
                          {task.riskScore}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. MODULAR COCKPIT INTEGRATION CARDS (BENTO ROW) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Voice Chief of Staff */}
        {visibleWidgets.voice !== false && (
          <div className="bg-white border border-gray-150 rounded-3xl p-5 hover:border-indigo-200 hover:shadow-xs transition-all space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <Volume2 size={15} />
              </div>
              <h4 className="text-xs font-bold text-gray-900">Voice Chief of Staff</h4>
              <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                Synthesize priorities offline, formulate voice schedules, and receive instant acoustic feedback on tasks.
              </p>
            </div>
            <button
              onClick={() => onNavigate("voice")}
              className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 group pt-2 cursor-pointer"
            >
              <span>Activate Voice Companion</span>
              <ArrowRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Document Scanner */}
        <div className="bg-white border border-gray-150 rounded-3xl p-5 hover:border-emerald-200 hover:shadow-xs transition-all space-y-3.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <FileText size={15} />
            </div>
            <h4 className="text-xs font-bold text-gray-900">Document Intelligence</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
              Ingest academic briefs, rubrics, and calendars. Auto-parse criteria into scheduled pacing blocks instantly.
            </p>
          </div>
          <button
            onClick={() => onNavigate("scanner")}
            className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-800 transition-colors flex items-center gap-1 group pt-2 cursor-pointer"
          >
            <span>Ingest Document</span>
            <ArrowRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Goals & Habits */}
        {visibleWidgets.habits !== false && (
          <div className="bg-white border border-gray-150 rounded-3xl p-5 hover:border-amber-200 hover:shadow-xs transition-all space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Zap size={15} />
              </div>
              <h4 className="text-xs font-bold text-gray-900">Conditioning Vector</h4>
              <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                Maintain daily micro-sprints and study habits. Calibrate cognitive consistency margins before stress cycles peak.
              </p>
            </div>
            <button
              onClick={() => onNavigate("habits")}
              className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 hover:text-amber-800 transition-colors flex items-center gap-1 group pt-2 cursor-pointer"
            >
              <span>Audit Habits</span>
              <ArrowRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 6. INTERACTIVE ANALYSIS DETAIL MODAL (FOR THE DEMO TASK) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showAnalysisModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-indigo-150 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl text-left"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Sparkles size={14} /></span>
                  <h3 className="font-mono font-bold text-sm text-gray-900 uppercase">AI Assignment Telemetry</h3>
                </div>
                <button
                  onClick={() => setShowAnalysisModal(false)}
                  className="p-1.5 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer text-gray-400 hover:text-black"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3 font-mono text-[11px] text-gray-600">
                <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/40 space-y-2">
                  <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-indigo-500" />
                    <span>PDF Extraction Succeeded (98% Telemetry)</span>
                  </div>
                  <p className="font-sans text-[10px] text-gray-500 leading-relaxed">
                    The syllabus analysis engine successfully scanned the uploaded syllabus outline, extracting 1 milestone and auto-constructing the target subtask timelines.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                  <div className="border border-gray-100 p-3 rounded-xl bg-gray-50/50">
                    <span className="text-[9px] font-mono text-gray-400 block font-bold uppercase">Estimated Labor</span>
                    <p className="font-bold text-gray-800 mt-0.5">4 Hours Effort</p>
                  </div>
                  <div className="border border-gray-100 p-3 rounded-xl bg-gray-50/50">
                    <span className="text-[9px] font-mono text-gray-400 block font-bold uppercase">Safety Buffer</span>
                    <p className="font-bold text-indigo-600 mt-0.5">3 Days Buffer</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] text-gray-400 font-bold uppercase block">Structured Milestone Action Plan</span>
                  <div className="border border-gray-150 rounded-xl p-3 bg-neutral-950 text-neutral-200 space-y-1.5 font-mono text-[10px]">
                    <div>&gt; [Phase 1]: Ingest syllabi components (Done)</div>
                    <div>&gt; [Phase 2]: Analyze grading rubric structure (0.5 hours)</div>
                    <div>&gt; [Phase 3]: Final presentation outline drafts (3.5 hours)</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={() => setShowAnalysisModal(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-gray-700 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Dismiss Analysis
                </button>
                <button
                  onClick={() => {
                    setShowAnalysisModal(false);
                    triggerLocalToast("Milestone action plan scheduled in workspace calendar!");
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  Schedule in Workspace
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
