import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Clock, ShieldAlert, Sparkles, Mic, Calendar, Flame, Bell, Users, 
  CheckSquare, X, ChevronLeft, ChevronRight, Pin, Settings, Zap, 
  VolumeX, Volume2, Move, Menu, Maximize2, Minimize2, RefreshCw, AlertCircle
} from "lucide-react";
import InteractiveClock from "./InteractiveClock";
import { Task } from "../types";

interface GlobalAIClockProps {
  activeTab: string;
  riskScore: number;
  focusPercent: number;
  timeLeftStr: string;
  voiceIntensity: number;
  goalProgresses: number[];
  activeTaskCount: number;
  isRescueMode: boolean;
  attentionMuted: boolean;
  clockRotationTrigger: number;
  onToggleRescueMode: () => void;
  onToggleMuteAttention: () => void;
  onNavigateTab: (tab: "dashboard" | "productivity_cockpit" | "planner" | "focus" | "voice" | "scanner" | "habits" | "collaboration" | "languages" | "settings") => void;
  tasks: Task[];
}

export default function GlobalAIClock({
  activeTab,
  riskScore,
  focusPercent,
  timeLeftStr,
  voiceIntensity,
  goalProgresses,
  activeTaskCount,
  isRescueMode,
  attentionMuted,
  clockRotationTrigger,
  onToggleRescueMode,
  onToggleMuteAttention,
  onNavigateTab,
  tasks
}: GlobalAIClockProps) {
  // Widget open/collapsed/hidden states
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to compact/collapsed as requested
  const [corner, setCorner] = useState<"top-right" | "bottom-right" | "top-left" | "bottom-left">("bottom-right");
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  
  // Right click custom context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  
  // Manual override clock mode for double-click switching
  const [manualMode, setManualMode] = useState<string | null>(null);

  // Drag constraints & reference
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDraggingVisual, setIsDraggingVisual] = useState(false);
  const isDraggingVisualRef = useRef(false);
  isDraggingVisualRef.current = isDraggingVisual;

  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<any>(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // Persistent position state
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem("saver_clock_position");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          return parsed;
        }
      } catch (e) {}
    }
    const w = typeof window !== "undefined" ? window.innerWidth : 1024;
    const h = typeof window !== "undefined" ? window.innerHeight : 768;
    return { x: w - 180, y: h - 300 };
  });

  useEffect(() => {
    localStorage.setItem("saver_clock_position", JSON.stringify(position));
  }, [position]);

  // Adjust on window resize and keep on screen
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const widgetWidth = isCollapsed ? 150 : 200;
        const widgetHeight = isCollapsed ? 48 : 210;
        const newX = Math.max(16, Math.min(w - widgetWidth - 16, prev.x));
        const newY = Math.max(16, Math.min(h - widgetHeight - 80, prev.y));
        return { x: newX, y: newY };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isCollapsed]);

  // Time ticking for the compact pill
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll tracking to update clock state
  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress(window.scrollY / totalScroll);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smart expansion trigger: automatically expand on high risk, rescue mode, active voice, or focus mode
  useEffect(() => {
    if (riskScore > 75 || isRescueMode || activeTab === "voice" || activeTab === "focus") {
      setIsCollapsed(false);
    }
  }, [riskScore, isRescueMode, activeTab]);

  // Context aware mapping of activeTab to clock visual mode
  const getContextMode = () => {
    if (manualMode) return manualMode; // Allow double-click to override visualization
    
    switch (activeTab) {
      case "dashboard":
        return "default";
      case "productivity_cockpit":
        return "gauge"; // Risk analysis
      case "planner":
        return "timeline"; // Chronological wheel
      case "focus":
        return focusPercent > 0 ? "timer" : "event"; // Pomodoro or Schedule wheel
      case "voice":
        return voiceIntensity > 0 ? "listening" : "pulse"; // Voice assistant orb
      case "scanner":
        return "scanner"; // Scanning ring
      case "habits":
        return "progress"; // Concentric goals
      case "collaboration":
        return "progress"; // Multi-user collaboration representation
      case "languages":
        return "default"; // Dual timezone clock
      default:
        return "default";
    }
  };

  const currentMode = getContextMode() as any;

  // Double click cycles visualization
  const handleDoubleClick = () => {
    const modes = ["default", "gauge", "timeline", "event", "timer", "progress", "scanner", "listening"];
    const currentIdx = modes.indexOf(currentMode);
    const nextIdx = (currentIdx + 1) % modes.length;
    setManualMode(modes[nextIdx]);
  };

  // Reset manual visualization mode when tab changes to stay context aware
  useEffect(() => {
    setManualMode(null);
  }, [activeTab]);

  // Snapping logic on Drag End
  const handleDragStart = () => {
    hasDraggedRef.current = true;
    setIsDraggingVisual(true);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDraggingVisual(false);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    
    const w = window.innerWidth;
    const h = window.innerHeight;
    const widgetWidth = isCollapsed ? 150 : 200;
    const widgetHeight = isCollapsed ? 48 : 210;
    
    let finalX = position.x + info.offset.x;
    let finalY = position.y + info.offset.y;
    
    // Snap horizontally to nearest edge
    if (finalX + widgetWidth / 2 < w / 2) {
      finalX = 16;
    } else {
      finalX = w - widgetWidth - 16;
    }
    
    // Keep vertically in bounds
    finalY = Math.max(16, Math.min(h - widgetHeight - 80, finalY));
    
    // Collision avoidance with Milo
    try {
      const miloSaved = localStorage.getItem("voice_assistant_position_v2");
      if (miloSaved) {
        const miloPos = JSON.parse(miloSaved);
        const sameSide = Math.abs(finalX - miloPos.x) < 150;
        const verticalOverlap = Math.abs(finalY - miloPos.y) < 120;
        if (sameSide && verticalOverlap) {
          if (miloPos.y > finalY) {
            finalY = Math.max(16, miloPos.y - widgetHeight - 20);
          } else {
            finalY = Math.min(h - widgetHeight - 80, miloPos.y + 70 + 20);
          }
        }
      }
    } catch (e) {
      console.warn("Collision avoidance check failed:", e);
    }
    
    setPosition({ x: finalX, y: finalY });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // If clicking target is a control button, do not handle drag/tap logic
    const target = e.target as HTMLElement;
    if (target.closest("button") && target.closest("button")?.id !== "restore-ai-clock") {
      return;
    }
    
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (!hasDraggedRef.current && !isDraggingVisualRef.current) {
        setShowQuickMenu(true);
        if (navigator.vibrate) {
          try { navigator.vibrate(50); } catch (_) {}
        }
      }
    }, 600);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    
    if (hasDraggedRef.current || isDraggingVisualRef.current) {
      return;
    }
    
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    
    if (timeDiff < 300) {
      // DOUBLE TAP / DOUBLE CLICK -> Trigger expansion
      if (isCollapsed) {
        setIsCollapsed(false);
      } else {
        setIsCommandCenterOpen(true);
      }
    } else {
      // SINGLE TAP / SINGLE CLICK -> Subtle focus effect, do not expand
      if (containerRef.current) {
        containerRef.current.focus();
      }
    }
    lastTapRef.current = now;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isCollapsed) {
        setIsCollapsed(false);
      } else {
        setIsCommandCenterOpen(true);
      }
    }
  };

  // Prevent default context menu and open custom context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Close context menu on click anywhere
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const getPositionClasses = () => "";

  // Determine scaling & sizes based on adaptive detail levels
  // Desktop: 180-220px, Tablet: 150-180px, Mobile: 60-80px orb
  const scaleValue = isCollapsed 
    ? 0.45 // Compact
    : 0.68; // Expanded size (renders around 190px of full 280px dial)

  if (isHidden) {
    // Hidden state: render a tiny subtle restore dot on the edge of the screen
    return (
      <button 
        id="restore-ai-clock"
        onClick={() => setIsHidden(false)}
        className="fixed bottom-6 right-0 bg-black/90 text-white p-2 rounded-l-full shadow-lg hover:bg-indigo-600 transition-all duration-300 z-50 flex items-center gap-1 font-mono text-[10px] uppercase font-bold"
        title="Restore AI Companion Clock"
      >
        <Sparkles size={11} className="animate-pulse" />
        <span>Restore Clock</span>
      </button>
    );
  }

  return (
    <>
      {/* 1. PERSISTENT FLOATING CONTAINER */}
      <motion.div
        id="global-ai-clock-container"
        ref={containerRef}
        drag={!isPinned}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className="fixed z-40 select-none cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/50 rounded-full"
        onContextMenu={handleContextMenu}
        animate={{
          left: position.x,
          top: position.y,
          scale: isDraggingVisual ? 1.05 : 1,
          opacity: isDraggingVisual ? 0.75 : 1,
          boxShadow: isDraggingVisual 
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.4)" 
            : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
        style={{ touchAction: "none" }}
      >
        {/* Glow overlay based on scroll progress and risk */}
        <div 
          className="absolute inset-0 rounded-full blur-xl opacity-20 pointer-events-none scale-125 transition-all duration-1000"
          style={{
            background: isRescueMode 
              ? "radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)"
              : `radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)`,
            transform: `scale(${1 + scrollProgress * 0.3})`
          }}
        />

        <AnimatePresence mode="wait">
          {/* A. MOBILE OR COLLAPSED COMPACT PILL */}
          {isCollapsed ? (
            <motion.div
              key="collapsed"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white/80 hover:bg-white backdrop-blur-md border border-gray-150/60 rounded-full p-2.5 px-4 shadow-lg hover:shadow-xl cursor-pointer flex items-center gap-3 transition-all duration-300 group hover:scale-105 min-w-[130px] md:min-w-[150px] max-w-[220px]"
            >
              {/* Circular Mini-Progress ring representing risk */}
              <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="14" cy="14" r="11" fill="none" stroke="#f3f4f6" strokeWidth="2.5" />
                  <motion.circle 
                    cx="14" 
                    cy="14" 
                    r="11" 
                    fill="none" 
                    stroke={riskScore > 75 ? "#EF4444" : riskScore > 40 ? "#D97706" : "#10B981"} 
                    strokeWidth="3"
                    strokeDasharray="70"
                    strokeDashoffset={70 - (70 * (riskScore / 100))}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                {riskScore > 75 ? (
                  <AlertCircle size={10} className="absolute text-red-500 animate-pulse" />
                ) : (
                  <Clock size={10} className="absolute text-gray-500" />
                )}
              </div>

              {/* Stats and Tiny Time */}
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-mono font-bold text-gray-800 leading-none flex items-center gap-1">
                  {riskScore > 75 && <span className="text-red-500 animate-ping">●</span>}
                  {riskScore}% <span className="text-gray-400 font-normal">Risk</span>
                </span>
                <span className="text-[9px] font-mono text-gray-400 mt-1 truncate">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ) : (
            /* B. EXPANDED PORTABLE GLASS CLOCK WIDGET */
            <motion.div
              key="expanded"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/40 hover:bg-white/70 backdrop-blur-md border border-gray-150/50 p-3.5 rounded-3xl shadow-xl flex flex-col items-center justify-center transition-all duration-300 cursor-grab active:cursor-grabbing w-[180px] h-[190px] md:w-[200px] md:h-[210px]"
              whileHover={{ scale: 1.03 }}
            >
              {/* Floating Toolbar inside expanded widget */}
              <div className="flex items-center justify-between w-full mb-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity px-1">
                <span className="text-[8px] font-mono text-gray-400 font-bold tracking-wider uppercase truncate max-w-[80px]">
                  {currentMode.toUpperCase()}
                </span>
                <div 
                  className="flex items-center gap-1 shrink-0" 
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsPinned(!isPinned); }} 
                    className={`p-1 rounded hover:bg-gray-150/40 transition-colors ${isPinned ? "text-indigo-600" : "text-gray-400"}`}
                    title={isPinned ? "Unpin Clock" : "Pin Clock Position"}
                  >
                    <Pin size={10} className={isPinned ? "rotate-45" : ""} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsCollapsed(true); }} 
                    className="p-1 rounded hover:bg-gray-150/40 text-gray-400 hover:text-black transition-colors"
                    title="Minimize"
                  >
                    <Minimize2 size={10} />
                  </button>
                </div>
              </div>

              {/* Vector Dial - wrapped in scaling factor for perfect vector consistency */}
              <div 
                className="relative overflow-hidden flex items-center justify-center transition-all duration-300 pointer-events-none"
                style={{ 
                  width: `${scaleValue * 280}px`, 
                  height: `${scaleValue * 280}px` 
                }}
              >
                <div 
                  className="origin-center"
                  style={{ transform: `scale(${scaleValue})` }}
                >
                  <InteractiveClock
                    mode={currentMode}
                    riskScore={riskScore}
                    focusPercent={focusPercent}
                    timeLeftStr={timeLeftStr}
                    voiceIntensity={voiceIntensity}
                    goalProgresses={goalProgresses}
                    activeTaskCount={activeTaskCount}
                    isRescueMode={isRescueMode}
                    attentionMuted={attentionMuted}
                    clockRotationTrigger={clockRotationTrigger + scrollProgress * 0.5} // Scrolling spins rings beautifully!
                  />
                </div>
              </div>

              {/* Bottom Details */}
              <div className="mt-2 text-center w-full truncate">
                <p className="text-[10px] font-mono font-bold text-gray-800 leading-none">
                  {isRescueMode ? "🚨 DEPLOYED" : attentionMuted ? "🔕 MUTED" : "🤖 CHIEF SECURE"}
                </p>
                <p className="text-[8px] font-mono text-gray-400 mt-1 truncate">
                  Double-click to open Command Center
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Quick Actions Menu (Triggered via Long-Press) */}
        {showQuickMenu && (
          <div className="absolute bottom-full mb-2 right-0 bg-white/95 dark:bg-[#1C212E] border border-gray-200 dark:border-[#2D3548] p-2.5 rounded-2xl shadow-2xl flex flex-col gap-1 min-w-[170px] z-50">
            <div className="px-2 py-1 border-b border-gray-100 dark:border-[#2D3548] mb-1">
              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Clock Quick Actions</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
                setShowQuickMenu(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252C3D] rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles size={13} className="text-indigo-500" />
              <span>{isCollapsed ? "Expand Clock" : "Minimize Clock"}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMuteAttention();
                setShowQuickMenu(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252C3D] rounded-lg transition-colors cursor-pointer"
            >
              {attentionMuted ? <Volume2 size={13} className="text-emerald-500" /> : <VolumeX size={13} className="text-indigo-500" />}
              <span>{attentionMuted ? "Unmute Attention" : "Mute Attention"}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleRescueMode();
                setShowQuickMenu(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252C3D] rounded-lg transition-colors cursor-pointer font-bold"
            >
              <Zap size={13} className={isRescueMode ? "text-red-500 animate-pulse" : "text-gray-500"} />
              <span className={isRescueMode ? "text-red-600" : ""}>{isRescueMode ? "Stop Rescue" : "Start Rescue"}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Reset position
                const w = window.innerWidth;
                const h = window.innerHeight;
                setPosition({ x: w - 180, y: h - 300 });
                setShowQuickMenu(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252C3D] rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className="text-amber-500" />
              <span>Reset Position</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickMenu(false);
              }}
              className="flex items-center justify-center gap-1.5 mt-1 px-2 py-1 text-center text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-[#171B25] rounded-md transition-colors cursor-pointer"
            >
              <X size={10} />
              <span>Close Menu</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* 2. CUSTOM CONTEXT MENU ON RIGHT CLICK */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bg-white/95 backdrop-blur-md border border-gray-150/80 shadow-xl rounded-2xl p-2 z-50 min-w-[180px] font-mono text-[10px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <div className="px-2.5 py-1.5 border-b border-gray-100 text-[8px] text-gray-400 font-bold uppercase tracking-wider">
              AI CLOCK ACTIONS
            </div>
            <button
              onClick={() => {
                onToggleMuteAttention();
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 cursor-pointer text-gray-700"
            >
              {attentionMuted ? <Volume2 size={12} className="text-emerald-500" /> : <VolumeX size={12} className="text-indigo-500" />}
              <span>{attentionMuted ? "Unmute AI Assistance" : "Mute AI Attention"}</span>
            </button>
            <button
              onClick={() => {
                onNavigateTab("focus");
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 cursor-pointer text-gray-700"
            >
              <Clock size={12} className="text-amber-500" />
              <span>Start Focus Mode</span>
            </button>
            <button
              onClick={() => {
                onToggleRescueMode();
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 cursor-pointer text-gray-700 font-bold"
            >
              <Zap size={12} className={isRescueMode ? "text-red-500 animate-pulse" : "text-gray-500"} />
              <span className={isRescueMode ? "text-red-600" : ""}>{isRescueMode ? "Deactivate Rescue" : "Deploy Rescue Mode"}</span>
            </button>
            <button
              onClick={() => {
                onNavigateTab("voice");
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 cursor-pointer text-gray-700"
            >
              <Mic size={12} className="text-blue-500" />
              <span>Voice Chief of Staff</span>
            </button>
            <button
              onClick={() => {
                setIsCollapsed(!isCollapsed);
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 cursor-pointer text-gray-700"
            >
              {isCollapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
              <span>{isCollapsed ? "Expand" : "Minimize"}</span>
            </button>
            <button
              onClick={() => {
                setIsHidden(true);
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-2 hover:bg-red-50 text-red-600 rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <X size={12} />
              <span>Hide This Session</span>
            </button>
            <button
              onClick={() => {
                // Simplified "Hide Until Tomorrow": just set a flag in localStorage
                localStorage.setItem("saver_clock_hidden_until", new Date(Date.now() + 24 * 60 * 60 * 1000).toString());
                setIsHidden(true);
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-2 hover:bg-amber-50 text-amber-600 rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <Clock size={12} />
              <span>Hide Until Tomorrow</span>
            </button>
            <button
              onClick={() => {
                setPosition({ x: 0, y: 0 });
                setCorner("bottom-right");
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Reset Position</span>
            </button>
            
            <div className="px-2.5 py-1.5 border-t border-gray-100 text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-1">
              ALIGN CORNER
            </div>
            <div className="grid grid-cols-2 gap-1 p-1">
              {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCorner(c);
                    setContextMenu(null);
                  }}
                  className={`px-1.5 py-1 rounded text-center text-[8px] uppercase border transition-all ${
                    corner === c 
                      ? "bg-black text-white border-black" 
                      : "bg-gray-50 border-gray-150 text-gray-500 hover:text-black"
                  }`}
                >
                  {c.replace("-", " ")}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. FLOATING AI COMMAND CENTER (SIDE PANEL) */}
      <AnimatePresence>
        {isCommandCenterOpen && (
          <div className="fixed inset-0 z-50 flex justify-end font-sans">
            {/* Ambient glass blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCommandCenterOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-xs cursor-pointer"
            />

            {/* Slide-out Sheet Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute top-0 right-0 h-full w-full max-w-[420px] bg-white/95 backdrop-blur-md shadow-2xl border-l border-gray-150/60 flex flex-col justify-between overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white shadow-md">
                    <Sparkles size={16} className="text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 leading-none">AI Control Center</h3>
                    <p className="text-[10px] font-mono text-gray-400 mt-1 uppercase tracking-wider">Chief-of-Staff Core v1.4</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCommandCenterOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* A. Risk Score Gauge Module */}
                <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Risk Level Diagnosis</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      riskScore > 75 ? "bg-red-100 text-red-600" : riskScore > 40 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                    }`}>
                      {riskScore > 75 ? "CRITICAL OUTLIER" : riskScore > 40 ? "ELEVATED DELAY" : "OPTIMIZED FLOW"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 shrink-0 flex items-center justify-center bg-white rounded-full border border-gray-150 shadow-xs">
                      <svg className="w-16 h-16 -rotate-90">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                        <motion.circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke={riskScore > 75 ? "#EF4444" : riskScore > 40 ? "#D97706" : "#10B981"}
                          strokeWidth="5"
                          strokeDasharray="163"
                          strokeDashoffset={163 - (163 * (riskScore / 100))}
                          transition={{ duration: 1 }}
                        />
                      </svg>
                      <span className="absolute text-base font-mono font-bold" style={{ color: riskScore > 75 ? "#EF4444" : riskScore > 40 ? "#D97706" : "#10B981" }}>
                        {riskScore}%
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-800">Priority Risk Evaluation</p>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        Urgency indicators and milestone bottlenecks have been synthesized. 
                        {riskScore > 75 ? " Deploy Rescue Mode immediately to stabilize timelines." : " Workspace parameters remain completely balanced."}
                      </p>
                    </div>
                  </div>

                  {/* EMERGENCY RECOVERY PLAN BOX */}
                  {(isRescueMode || riskScore > 75) && (
                    <div className="mt-4 p-3 bg-red-50/70 border border-red-150 rounded-xl space-y-1.5 animate-fade-in text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 text-red-700 font-bold">
                        <ShieldAlert size={12} className="animate-pulse" />
                        <span>🚨 LIVE RECOVERY ACTIONS AVAILABLE:</span>
                      </div>
                      <p className="text-red-600 leading-relaxed">
                        - Compress review steps to reclaim <strong>~3.0 hours</strong>.<br />
                        - Delegate test sequence block to <strong>Alex Chen</strong>.<br />
                        - Defer styling & footnotes to reclaim <strong>~2.5 hours</strong>.
                      </p>
                      <button
                        onClick={onToggleRescueMode}
                        className="w-full mt-2 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-bold uppercase text-[9px] tracking-wider transition-colors cursor-pointer"
                      >
                        {isRescueMode ? "Mute Active Rescue" : "Engage Rescue Sequences"}
                      </button>
                    </div>
                  )}
                </div>

                {/* B. Upcoming Deadlines Module */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Critical Deadlines</span>
                    <span className="text-[9px] font-mono text-gray-400 font-bold">
                      {tasks.filter(t => t.subtasks && t.subtasks.some(s => !s.completed)).length} pending
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {tasks.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl">No pending tasks or deadlines found.</p>
                    ) : (
                      tasks.slice(0, 4).map((task) => {
                        const isCompleted = task.subtasks && task.subtasks.length > 0 ? task.subtasks.every(s => s.completed) : false;
                        return (
                          <div key={task.id} className="p-3 bg-white border border-gray-150 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${isCompleted ? "bg-emerald-500" : task.priority === "high" ? "bg-red-500 animate-pulse" : "bg-gray-300"}`} />
                              <div className="min-w-0">
                                <p className={`text-xs font-medium truncate ${isCompleted ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</p>
                                <p className="text-[9px] font-mono text-gray-400 mt-0.5">Due: {task.deadline || "Today"}</p>
                              </div>
                            </div>
                            <span className={`text-[8px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                              task.priority === "high" ? "bg-red-50 text-red-600 border border-red-100" : "bg-gray-100 text-gray-500"
                            }`}>
                              {task.priority || "standard"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* C. Focus Timer Pomodoro Module */}
                <div className="bg-indigo-50/50 border border-indigo-100/80 p-4 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-wider">Deep Focus Controller</span>
                    <span className="text-[9px] font-mono text-indigo-400 font-bold">POMODORO ACTIVE</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xl font-mono font-bold text-indigo-950 tracking-tight">{timeLeftStr || "25:00"}</p>
                      <p className="text-[10px] text-indigo-600">Cognitive load shielding activated.</p>
                    </div>

                    <button
                      onClick={() => onNavigateTab("focus")}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-mono font-bold uppercase transition-colors"
                    >
                      Configure Timer
                    </button>
                  </div>
                </div>

                {/* D. AI Suggestions & Intelligence Brief */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">AI Insights & Briefing</span>
                  <div className="p-3.5 bg-white border border-gray-150 rounded-xl space-y-2">
                    <div className="flex gap-2.5">
                      <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        Detected <strong>3 calendar slots with conflict overlaps</strong>. AI recommended auto-adjusting the milestone sequence for optimal submission safety.
                      </p>
                    </div>
                    <div className="flex gap-2.5 pt-2 border-t border-gray-100">
                      <Mic size={14} className="text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        Speech patterns indicate accelerated tempo. AI attention muted thresholds have been auto-buffered to support deep cognitive flows.
                      </p>
                    </div>
                  </div>
                </div>

                {/* E. Active Calendar Overlaps */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Active Calendar Alignment</span>
                  <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="font-mono text-gray-600">4.5 Hours Safe Open Workspace</span>
                    </div>
                    <button
                      onClick={() => onNavigateTab("focus")}
                      className="text-[9px] font-mono text-indigo-600 hover:underline font-bold"
                    >
                      Resolve Overlaps
                    </button>
                  </div>
                </div>

              </div>

              {/* Footer Panel Controls */}
              <div className="p-5 border-t border-gray-150 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onToggleMuteAttention();
                    }}
                    className={`p-2 rounded-xl border transition-all ${
                      attentionMuted 
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                        : "bg-white border-gray-200 text-gray-500 hover:text-black"
                    }`}
                    title={attentionMuted ? "Unmute AI" : "Mute AI"}
                  >
                    {attentionMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                  <button
                    onClick={() => {
                      onToggleRescueMode();
                    }}
                    className={`p-2 rounded-xl border transition-all ${
                      isRescueMode 
                        ? "bg-red-50 border-red-200 text-red-600" 
                        : "bg-white border-gray-200 text-gray-500 hover:text-black"
                    }`}
                    title="Toggle Rescue"
                  >
                    <Zap size={15} className={isRescueMode ? "animate-pulse" : ""} />
                  </button>
                </div>

                <div className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-widest text-right">
                  System Guard Active
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
