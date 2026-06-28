import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CalendarEvent } from "../types";
import { useLocalization } from "../context/LocalizationContext";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Shield, 
  Sparkles, 
  AlertCircle, 
  VolumeX, 
  Volume2, 
  Sliders, 
  ShieldAlert, 
  Activity, 
  TrendingUp, 
  EyeOff, 
  Moon, 
  Flame
} from "lucide-react";

interface FocusTabProps {
  onUpdateFocusProgress: (percent: number, timeLeft: string) => void;
  onSetClockState: (mode: "timer" | "event" | "default" | "gauge") => void;
  isRescueMode: boolean;
  // AI Attention Control System States passed down from App.tsx
  attentionMuted: boolean;
  setAttentionMuted: (muted: boolean) => void;
  muteDuration: string;
  setMuteDuration: (duration: string) => void;
  muteSecondsLeft: number | null;
  setMuteSecondsLeft: (sec: number | null) => void;
  personalityMode: "silent" | "balanced" | "coach" | "rescue";
  setPersonalityMode: (mode: "silent" | "balanced" | "coach" | "rescue") => void;
  smartSilenceEnabled: boolean;
  setSmartSilenceEnabled: (enabled: boolean) => void;
  detectedSession: string;
  setDetectedSession: (session: string) => void;
  dndCalendarSync: boolean;
  setDndCalendarSync: (enabled: boolean) => void;
  budgetUsed: number;
  setBudgetUsed: (used: number) => void;
  reengagementSummary: {
    deadlinesAnalyzed: number;
    scheduleAdjustments: number;
    criticalRisksDetected: boolean;
  } | null;
  setReengagementSummary: (summary: any) => void;
  triggerCriticalOverride: () => void;
  voiceMuted: boolean;
  setVoiceMuted: (muted: boolean) => void;
  voiceMuteDuration: string;
  setVoiceMuteDuration: (duration: string) => void;
  voiceMuteSecondsLeft: number | null;
  setVoiceMuteSecondsLeft: (sec: number | null) => void;
  quietRecoveryMode: boolean;
  setQuietRecoveryMode: (enabled: boolean) => void;
}

export default function FocusTab({
  onUpdateFocusProgress,
  onSetClockState,
  isRescueMode,
  attentionMuted,
  setAttentionMuted,
  muteDuration,
  setMuteDuration,
  muteSecondsLeft,
  setMuteSecondsLeft,
  personalityMode,
  setPersonalityMode,
  smartSilenceEnabled,
  setSmartSilenceEnabled,
  detectedSession,
  setDetectedSession,
  dndCalendarSync,
  setDndCalendarSync,
  budgetUsed,
  setBudgetUsed,
  reengagementSummary,
  setReengagementSummary,
  triggerCriticalOverride,
  voiceMuted,
  setVoiceMuted,
  voiceMuteDuration,
  setVoiceMuteDuration,
  voiceMuteSecondsLeft,
  setVoiceMuteSecondsLeft,
  quietRecoveryMode,
  setQuietRecoveryMode,
}: FocusTabProps) {
  const { calendarSynced, setCalendarSynced, accessibility, pronounceText } = useLocalization();

  // Pomodoro timer states
  const [timerDuration, setTimerDuration] = useState(25 * 60); // 25 minutes default
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [distractionShield, setDistractionShield] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  // Custom Mute State
  const [customMins, setCustomMins] = useState(45);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Mock calendar events
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: "e1", title: "CS102 Lecture on Algorithms", startHour: 10, durationHours: 1.5, type: "class" },
    { id: "e2", title: "Team sync & Code review", startHour: 13, durationHours: 1, type: "meeting" },
    { id: "e3", title: "Study Group Prep", startHour: 18, durationHours: 1.5, type: "personal" }
  ]);

  const [focusBlocks, setFocusBlocks] = useState<CalendarEvent[]>([]);

  // Ticking countdown timer
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const nextVal = prev - 1;
          const pct = ((timerDuration - nextVal) / timerDuration) * 100;
          
          // Format minutes and seconds
          const m = Math.floor(nextVal / 60);
          const s = nextVal % 60;
          const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          
          onUpdateFocusProgress(pct, timeStr);
          return nextVal;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, timerDuration]);

  // Handle Play/Pause
  const handleToggleTimer = () => {
    if (!timerActive) {
      onSetClockState("timer");
    }
    setTimerActive(!timerActive);
  };

  // Handle Reset
  const handleResetTimer = () => {
    setTimerActive(false);
    const defaultSecs = isRescueMode ? 15 * 60 : 25 * 60; // 15 mins for Rescue vs 25
    setTimerDuration(defaultSecs);
    setTimeLeft(defaultSecs);
    onUpdateFocusProgress(0, isRescueMode ? "15:00" : "25:00");
  };

  // Adjust duration
  const setDurationMinutes = (mins: number) => {
    setTimerActive(false);
    setTimerDuration(mins * 60);
    setTimeLeft(mins * 60);
    const timeStr = `${mins.toString().padStart(2, '0')}:00`;
    onUpdateFocusProgress(0, timeStr);
    onSetClockState("timer");
  };

  // Connect calendar simulation
  const handleConnectCalendar = () => {
    setCalendarConnected(true);
    onSetClockState("event");
    
    // AI finds and maps empty slots automatically
    setTimeout(() => {
      setFocusBlocks([
        { id: "fb1", title: "AI SCHEDULED: Deep Work Block", startHour: 14, durationHours: 3, type: "focus" },
        { id: "fb2", title: "AI SCHEDULED: Quality Review", startHour: 16, durationHours: 1, type: "focus" }
      ]);
    }, 600);
  };

  // Apply Mute Duration selection
  const handleApplyMute = (duration: string) => {
    setMuteDuration(duration);
    setAttentionMuted(true);
    
    if (duration === "15 Min") {
      setMuteSecondsLeft(15 * 60);
      setShowCustomPicker(false);
    } else if (duration === "30 Min") {
      setMuteSecondsLeft(30 * 60);
      setShowCustomPicker(false);
    } else if (duration === "1 Hour") {
      setMuteSecondsLeft(60 * 60);
      setShowCustomPicker(false);
    } else if (duration === "Until Task Complete") {
      setMuteSecondsLeft(null); // Infinite / custom reset
      setShowCustomPicker(false);
    } else if (duration === "Until Tomorrow") {
      setMuteSecondsLeft(12 * 60 * 60); // 12 hours
      setShowCustomPicker(false);
    } else if (duration === "Custom") {
      setShowCustomPicker(true);
    }
  };

  const handleApplyCustomMute = () => {
    setMuteDuration(`Custom (${customMins}m)`);
    setAttentionMuted(true);
    setMuteSecondsLeft(customMins * 60);
  };

  // Simulate Smart Silence Context Change
  const handleSimulateSilenceContext = (session: string) => {
    setDetectedSession(session);
    if (session !== "none" && smartSilenceEnabled) {
      setAttentionMuted(true);
      // Automatically default to an indefinite or custom mute for the context
      setMuteSecondsLeft(45 * 60); // 45 mins mute for the event
      setMuteDuration(`Event (${session.replace("_", " ")})`);
    } else if (session === "none") {
      setAttentionMuted(false);
      setMuteSecondsLeft(null);
      setReengagementSummary({
        deadlinesAnalyzed: 2,
        scheduleAdjustments: 1,
        criticalRisksDetected: false
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tab Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono tracking-[0.2em] text-gray-400 uppercase">Attention & Flow</span>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-display font-medium text-gray-900 tracking-tight">AI Attention Controls</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Deep Focus Timer Control Panel */}
        <div className="lg:col-span-6 bg-white border border-gray-100 p-6 rounded-2xl relative shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h3 className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400" /> Deep Focus Session
            </h3>
            {timerActive && (
              <span className="text-[9px] font-mono bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-md animate-pulse">Focus Active</span>
            )}
          </div>

          {/* Time Picker presets */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => setDurationMinutes(mins)}
                className={`py-2 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                  timerDuration === mins * 60 
                    ? "bg-black text-white border-black font-bold" 
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-black"
                }`}
              >
                {mins} Min
              </button>
            ))}
          </div>

          {/* Large Clock Display */}
          <div className="flex flex-col items-center justify-center py-6 bg-gray-50 border border-gray-100 rounded-xl mb-6">
            <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase mb-1">Time Remaining</span>
            <span className="text-4xl font-mono font-bold text-gray-900 tracking-tight">
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
            <span className="text-[10px] font-mono text-gray-500 mt-1">
              {timerActive ? "Eliminate distracting cues" : "Calibrated sprint sequence"}
            </span>
          </div>

          {/* Timer Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleToggleTimer}
              className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                timerActive 
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-800" 
                  : "bg-black text-white hover:opacity-90"
              }`}
            >
              {timerActive ? (
                <>
                  <Pause size={14} /> Pause Session
                </>
              ) : (
                <>
                  <Play size={14} /> Initiate Sprint
                </>
              )}
            </button>
            
            <button
              onClick={handleResetTimer}
              className="px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-500 hover:text-black transition-all flex items-center justify-center cursor-pointer"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Distraction Shield */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield size={16} className={distractionShield ? "text-amber-500 animate-pulse" : "text-gray-400"} />
              <div className="text-left">
                <h4 className="text-xs font-mono font-bold text-gray-800">Distraction Block Shield</h4>
                <p className="text-[10px] text-gray-400 font-sans mt-0.5">Auto-silence non-essential alerts</p>
              </div>
            </div>
            <button
              onClick={() => setDistractionShield(!distractionShield)}
              className={`w-10 h-6 rounded-full p-1 transition-all cursor-pointer ${
                distractionShield ? "bg-black" : "bg-gray-200"
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-all ${
                distractionShield ? "translate-x-4" : "translate-x-0"
              }`} />
            </button>
          </div>
        </div>

        {/* Calendar Integration & Block Finder (Right Panel) */}
        <div className="lg:col-span-6 bg-white border border-gray-100 p-6 rounded-2xl flex flex-col justify-between relative shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" /> Calendar Alignment
              </h3>
              <span className="text-[10px] font-mono text-gray-400">Auto conflict resolution</span>
            </div>

            {!calendarConnected ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-150 flex items-center justify-center mx-auto text-gray-400">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-gray-700 uppercase">Load Calendar Schedules</h4>
                  <p className="text-[11px] text-gray-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    Sync your Google, Outlook, or Apple calendar. The AI will scan appointments, auto-resolve scheduling block conflicts, and construct focused sprint sessions.
                  </p>
                </div>
                <button
                  onClick={handleConnectCalendar}
                  className="bg-black text-white hover:opacity-90 px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase cursor-pointer shadow-sm"
                >
                  Sync Google & Apple Calendars
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {/* Visual Calendar list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Today's Scheduled Blocks</span>
                    <span className="text-[9px] font-mono text-emerald-600 flex items-center gap-1">
                      <Sparkles size={10} /> Calibrated with AI
                    </span>
                  </div>
                  
                  {/* Calendar blocks */}
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {events.map((e) => (
                      <div key={e.id} className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-450" />
                          <span className="text-gray-700 truncate max-w-[150px]">{e.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">
                          {e.startHour}:00 - {e.startHour + e.durationHours}:00
                        </span>
                      </div>
                    ))}

                    {/* AI Scheduled focus blocks */}
                    {focusBlocks.map((fb) => (
                      <div key={fb.id} className="p-2.5 bg-amber-50/25 border border-amber-150 rounded-lg flex items-center justify-between text-xs animate-fade-in">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-amber-700 font-medium truncate max-w-[150px]">{fb.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-mono bg-amber-100 text-amber-600 border border-amber-150 px-1 rounded uppercase font-bold">FOCUS</span>
                          <span className="text-[10px] font-mono text-amber-600 font-bold">
                            {fb.startHour}:00 - {fb.startHour + fb.durationHours}:00
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optimisation status box */}
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-start gap-2">
                  <AlertCircle size={14} className="text-gray-400 mt-0.5" />
                  <p className="text-[10px] text-gray-600 leading-relaxed font-sans text-left">
                    "AI has carved out a 3-hour uninterrupted block between 2:00 PM and 5:00 PM. No appointment conflicts. Focus sessions scheduled to lock down the critical draft."
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono text-gray-400 mt-4">
            <span>Schedules Synchronized</span>
            <span>Focus Ratio: 100% Locked</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: AI ATTENTION CONTROL SYSTEM DASHBOARD PANEL (FULL-WIDTH) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-12 bg-white border border-gray-150 p-6 rounded-3xl shadow-sm space-y-8">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
            <div className="text-left">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sliders className="text-indigo-600" size={18} />
                <span>AI Attention Command Center</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Configure when your AI Chief-of-Staff is authorized to proactively contact you.</p>
            </div>
            
            {/* Connection Sync Badge */}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${attentionMuted ? "bg-indigo-500 animate-pulse" : "bg-emerald-500"}`} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-600">
                {attentionMuted ? "Focus Mode: Suggestions Muted" : "Suggestions Live"}
              </span>
            </div>
          </div>

          {/* Grid Layout inside attention center */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* SUB-SECTION A: FOCUS MODE MUTE CONTROL (Col Span 5) */}
            <div className="md:col-span-5 space-y-4 border-r border-gray-100/70 pr-0 md:pr-8 text-left">
              <div className="flex items-center gap-2 text-indigo-900 font-mono font-bold text-xs uppercase tracking-wide">
                <VolumeX size={15} className="text-indigo-500" />
                <span>Temporarily Silence AI</span>
              </div>
              
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Choose a duration to pause all proactive recommendations, voice pings, and notification sliders. Perfect for zero-interruption execution blocks.
              </p>

              {/* Preset buttons */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "15 Min", value: "15 Min" },
                  { label: "30 Min", value: "30 Min" },
                  { label: "1 Hour", value: "1 Hour" },
                  { label: "Until Task Complete", value: "Until Task Complete" },
                  { label: "Until Tomorrow", value: "Until Tomorrow" },
                  { label: "Custom Duration...", value: "Custom" }
                ].map((opt) => {
                  const isCurrent = attentionMuted && muteDuration.startsWith(opt.value === "Custom" ? "Custom" : opt.value);
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleApplyMute(opt.value)}
                      className={`px-3 py-2 text-xs font-mono rounded-xl border transition-all cursor-pointer text-left ${
                        isCurrent 
                          ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs" 
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:text-black"
                      }`}
                    >
                      <span className="block truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Minutes Slider */}
              {showCustomPicker && (
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-indigo-900">
                    <span>Mute Duration:</span>
                    <span>{customMins} Minutes</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="180" 
                    step="5"
                    value={customMins} 
                    onChange={(e) => setCustomMins(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <button
                    onClick={handleApplyCustomMute}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider"
                  >
                    Engage {customMins}m Silence
                  </button>
                </div>
              )}

              {/* Active Status Box */}
              {attentionMuted ? (
                <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl flex items-start gap-2 animate-fade-in">
                  <VolumeX size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono font-bold uppercase text-indigo-700 tracking-wider block">🔕 Focus Shield Engaged</span>
                    <p className="text-[10px] text-indigo-900 mt-0.5 leading-relaxed font-sans">
                      Proactive suggestions are paused. {muteSecondsLeft !== null ? `Mute ends in ${Math.floor(muteSecondsLeft / 60)}m ${muteSecondsLeft % 60}s.` : "Silence persists until manually resumed."}
                    </p>
                    <button 
                      onClick={() => {
                        setAttentionMuted(false);
                        setMuteSecondsLeft(null);
                        setReengagementSummary({
                          deadlinesAnalyzed: 2,
                          scheduleAdjustments: 1,
                          criticalRisksDetected: false
                        });
                      }}
                      className="text-[9px] font-mono font-bold text-indigo-700 underline hover:text-indigo-900 mt-1.5"
                    >
                      Disable Mute Early
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex items-start gap-2">
                  <Volume2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase text-emerald-700 tracking-wider block">Suggestions Live</span>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-sans leading-relaxed">
                      Your AI Coach will monitor compressed timelines and safely prompt you on critical priority overlaps.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SUB-SECTION B: PERSONALITY MODE & SMART SILENCE DETECTION (Col Span 7) */}
            <div className="md:col-span-7 space-y-6 text-left">
              
              {/* Part 1: AI Personality Modes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700 font-mono font-bold text-xs uppercase tracking-wide">
                  <Sliders size={15} className="text-gray-500" />
                  <span>AI Assistant Personality Modes</span>
                </div>
                
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Tailor your assistant's vocal frequency, nudge rate, and overall behavioral urgency level.
                </p>

                {/* 4 Personality presets in a nice layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: "silent",
                      name: "Silent Mode",
                      desc: "Zero proactive prompts, text-only, answers purely on-demand.",
                      icon: EyeOff,
                      color: "border-slate-300 text-slate-800 bg-slate-50/40",
                      activeColor: "ring-2 ring-slate-800 bg-slate-50 border-slate-800"
                    },
                    {
                      id: "balanced",
                      name: "Balanced Mode",
                      desc: "Gentle nudge pacing, full respect for Focus blocks.",
                      icon: Moon,
                      color: "border-gray-200 text-gray-800 bg-gray-50/40",
                      activeColor: "ring-2 ring-black bg-white border-black"
                    },
                    {
                      id: "coach",
                      name: "Coach Mode",
                      desc: "Encouraging, hourly status checks, streak-building motivation.",
                      icon: Flame,
                      color: "border-amber-200 text-amber-800 bg-amber-50/20",
                      activeColor: "ring-2 ring-amber-500 bg-amber-50/50 border-amber-500"
                    },
                    {
                      id: "rescue",
                      name: "Rescue Mode",
                      desc: "High-intensity emergency triage, forces micro-sprints.",
                      icon: ShieldAlert,
                      color: "border-red-200 text-red-800 bg-red-50/20",
                      activeColor: "ring-2 ring-red-600 bg-red-50 border-red-600"
                    }
                  ].map((preset) => {
                    const isActive = personalityMode === preset.id;
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => setPersonalityMode(preset.id as any)}
                        className={`p-3 border rounded-xl transition-all cursor-pointer text-left block space-y-1.5 ${
                          isActive ? preset.activeColor : preset.color + " hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon size={14} className={isActive ? "text-current" : "text-gray-400"} />
                          <span className="text-xs font-bold font-mono uppercase tracking-wide">{preset.name}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed font-sans">{preset.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Part 2: Smart Silence & Mock Workplace Event Simulators */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700 font-mono font-bold text-xs uppercase tracking-wide">
                    <Activity size={15} className="text-indigo-500" />
                    <span>Smart Silence Detection</span>
                  </div>
                  
                  {/* Toggle */}
                  <button
                    onClick={() => setSmartSilenceEnabled(!smartSilenceEnabled)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${
                      smartSilenceEnabled ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-all ${
                      smartSilenceEnabled ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Quiet Recovery Mode Toggle */}
                <div className="flex items-center justify-between border-t border-gray-50 pt-2.5">
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-2 text-gray-700 font-mono font-bold text-xs uppercase tracking-wide">
                      <EyeOff size={15} className="text-purple-500" />
                      <span>Quiet Recovery Mode</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-sans mt-0.5">Suggestions are queued silently without interrupting.</span>
                  </div>
                  
                  {/* Toggle */}
                  <button
                    onClick={() => setQuietRecoveryMode(!quietRecoveryMode)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${
                      quietRecoveryMode ? "bg-purple-600" : "bg-gray-200"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-all ${
                      quietRecoveryMode ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Automated sensors mute suggestions when deep work blocks, calendar meetings, screen shares, or presentations are actively detected.
                </p>

                {/* Simulated events row */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-gray-400 uppercase font-bold block">Simulate Activity State:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "none", label: "No Active Context (Live)" },
                      { id: "presentation", label: "Presenting Slides" },
                      { id: "screen_sharing", label: "Screen Sharing Active" },
                      { id: "meeting", label: "In Active Meeting" },
                      { id: "study", label: "Study Group Session" }
                    ].map((ctx) => {
                      const isActive = detectedSession === ctx.id;
                      return (
                        <button
                          key={ctx.id}
                          onClick={() => handleSimulateSilenceContext(ctx.id)}
                          className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono transition-all cursor-pointer ${
                            isActive 
                              ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold" 
                              : "bg-gray-50 border-gray-150 text-gray-500 hover:text-black hover:border-gray-300"
                          }`}
                        >
                          {isActive ? "● " : ""}{ctx.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {detectedSession !== "none" && smartSilenceEnabled && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[10px] font-sans flex items-center gap-2 animate-fade-in">
                    <AlertCircle size={14} className="text-amber-600 shrink-0" />
                    <span>
                      Smart silence detected an active <strong>{detectedSession.replace("_", " ")}</strong> session. AI suggestions have been automatically paused.
                    </span>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* SECTION 3: OTHER SYSTEM INTEGRATIONS (DND Calendar, Attention Budget, Voice Mute, Override Test) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-gray-100 pt-6">
            
            {/* University Timetable Sync Card */}
            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-left space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-700 uppercase">
                    <Calendar size={14} className="text-gray-400" />
                    <span>University Timetable Sync</span>
                  </div>
                  <span className={`px-1.5 py-0.5 text-[8px] font-mono rounded-md font-bold uppercase tracking-wider ${
                    calendarSynced ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-gray-200 text-gray-500"
                  }`}>
                    {calendarSynced ? "CONNECTED" : "OFFLINE"}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed font-sans mt-1">
                  Connect your student portal to automatically align project milestones with exam timetables, semester terms, and dual academic calendars.
                </p>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-gray-150/50 mt-1">
                <span className="text-[9px] font-mono text-gray-400">
                  {calendarSynced ? "🔄 TIMETABLE SYNC ACTIVE" : "⚠️ UNLINKED"}
                </span>
                <button
                  onClick={() => {
                    const next = !calendarSynced;
                    setCalendarSynced(next);
                    if (next && accessibility?.textToSpeech) {
                      pronounceText("Calendar integrated successfully. Timetables are synced.");
                    }
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[9px] font-mono font-bold cursor-pointer transition-all ${
                    calendarSynced 
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                      : "bg-black hover:bg-neutral-800 text-white"
                  }`}
                >
                  {calendarSynced ? "Disconnect" : "Connect"}
                </button>
              </div>
            </div>

            {/* AI Attention Budget Tracker */}
            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-left space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-700 uppercase">
                  <TrendingUp size={14} className="text-indigo-500" />
                  <span>Attention Budget</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed font-sans mt-1">
                  Limits proactive AI prompts to 5 per 24 hours to prevent fatigue.
                </p>
              </div>
              
              {/* Budget indicators */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, idx) => (
                    <span 
                      key={idx} 
                      className={`w-2.5 h-2.5 rounded-full ${
                        idx < (5 - budgetUsed) 
                          ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.2)]" 
                          : "bg-gray-200"
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-gray-600 font-bold">{5 - budgetUsed} / 5 Daily Left</span>
              </div>
            </div>

            {/* Voice Assistant Silence Card */}
            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-left space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-700 uppercase">
                  {voiceMuted ? <VolumeX size={14} className="text-indigo-500" /> : <Volume2 size={14} className="text-gray-400" />}
                  <span>Voice Assistant Mute</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed font-sans mt-1">
                  Mutes verbal output from your assistant. Responses will be text-only.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {/* Duration options select */}
                <select
                  value={voiceMuteDuration}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVoiceMuteDuration(val);
                    if (val === "None") {
                      setVoiceMuted(false);
                      setVoiceMuteSecondsLeft(null);
                    } else {
                      setVoiceMuted(true);
                      if (val === "15 Min") setVoiceMuteSecondsLeft(15 * 60);
                      else if (val === "1 Hour") setVoiceMuteSecondsLeft(60 * 60);
                      else if (val === "Today") setVoiceMuteSecondsLeft(12 * 60 * 60);
                      else if (val === "Until Focus Session Ends") setVoiceMuteSecondsLeft(timeLeft);
                    }
                  }}
                  className="w-full text-xs font-mono bg-white border border-gray-200 hover:border-indigo-500 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none transition-all cursor-pointer font-bold"
                >
                  <option value="None">Voice Active (Unmuted)</option>
                  <option value="15 Min">Mute for 15 Minutes</option>
                  <option value="1 Hour">Mute for 1 Hour</option>
                  <option value="Today">Mute for Today (12h)</option>
                  <option value="Until Focus Session Ends">Until Focus Session Ends</option>
                </select>

                {voiceMuted && (
                  <div className="text-[9px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded">
                    🔕 Mute Ends in: {voiceMuteSecondsLeft !== null ? `${Math.floor(voiceMuteSecondsLeft / 60)}m ${voiceMuteSecondsLeft % 60}s` : "End of session"}
                  </div>
                )}
              </div>
            </div>

            {/* Critical Override Test Interface */}
            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-left space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-700 uppercase">
                  <ShieldAlert size={14} className="text-red-500 animate-pulse" />
                  <span>Critical Override</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed font-sans mt-1">
                  Allows urgent alarms (imminent submission window, calendar conflict start) to break the focus mute state.
                </p>
              </div>
              <button
                onClick={triggerCriticalOverride}
                className="w-full mt-2 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border border-red-200 cursor-pointer text-center"
              >
                Simulate Critical Override
              </button>
            </div>

          </div>

          {/* SMART RE-ENGAGEMENT REPORT POPUP BRIEFING */}
          {reengagementSummary && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-gradient-to-br from-indigo-50 to-white border border-indigo-150 rounded-2xl text-left space-y-3.5 mt-4"
            >
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-600 shrink-0" />
                  <span className="text-xs font-mono font-bold text-indigo-950 uppercase tracking-wide">
                    Smart Re-engagement Briefing
                  </span>
                </div>
                <span className="text-[9px] font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase font-bold">
                  FLOW COMPLETE
                </span>
              </div>
              
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                Welcome back! Your Chief-of-Staff enforced absolute silence while you were in deep work. While suggestions were muted, the execution engine assessed your deadlines in the background:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white/70 border border-indigo-100 rounded-xl text-xs space-y-1">
                  <span className="text-[9px] font-mono text-gray-400 uppercase font-bold block">Assignments Analyzed</span>
                  <span className="text-lg font-bold text-indigo-950 font-mono">
                    {reengagementSummary.deadlinesAnalyzed} Deadlines
                  </span>
                </div>
                <div className="p-3 bg-white/70 border border-indigo-100 rounded-xl text-xs space-y-1">
                  <span className="text-[9px] font-mono text-gray-400 uppercase font-bold block">Timeline Slices Adjusted</span>
                  <span className="text-lg font-bold text-indigo-950 font-mono">
                    {reengagementSummary.scheduleAdjustments} Sprints
                  </span>
                </div>
                <div className="p-3 bg-white/70 border border-indigo-100 rounded-xl text-xs space-y-1">
                  <span className="text-[9px] font-mono text-gray-400 uppercase font-bold block">Overdue/Failure Threats</span>
                  <span className="text-lg font-bold text-emerald-600 font-mono">
                    None Detected
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-gray-400 italic">"Flow protects concentration, re-engagement catches you up safely."</span>
                <button
                  onClick={() => setReengagementSummary(null)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold uppercase shadow-sm cursor-pointer"
                >
                  Acknowledge Briefing
                </button>
              </div>
            </motion.div>
          )}

        </div>

      </div>
    </div>
  );
}
