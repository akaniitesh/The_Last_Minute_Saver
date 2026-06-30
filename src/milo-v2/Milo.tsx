import { useState, useEffect } from "react";
import { useMilo } from "./context/useMilo";
import ChatTab from "./components/ChatTab";
import PlannerTab from "./components/PlannerTab";
import MemoryTab from "./components/MemoryTab";
import SettingsTab from "./components/SettingsTab";
import { motion, AnimatePresence } from "motion/react";
import { Bot, X, MessageSquare, Calendar, BrainCircuit, Settings, VolumeX, Volume2 } from "lucide-react";

export function MiloShell() {
  const { state, dispatch, startVoiceSession, stopVoiceSession } = useMilo();
  const [pulsing, setPulsing] = useState(false);

  const { isOpen, view, status, config } = state.assistant;

  // Let the orb pulsate gently when thinking or listening to provide feedback
  useEffect(() => {
    if (status === "thinking" || status === "listening" || status === "speaking") {
      setPulsing(true);
    } else {
      setPulsing(false);
    }
  }, [status]);

  const handleToggleOpen = () => {
    dispatch({ type: "TOGGLE_ASSISTANT" });
    if (isOpen) {
      // Clean up speaking and listening if closed
      stopVoiceSession();
    }
  };

  const toggleSoundMute = () => {
    dispatch({
      type: "UPDATE_CONFIG",
      payload: { isMuted: !config.isMuted }
    });
  };

  const handleTabChange = (targetView: "chat" | "planner" | "memory" | "settings") => {
    dispatch({ type: "SET_ASSISTANT_VIEW", payload: targetView });
  };

  const getStatusColor = () => {
    switch (status) {
      case "listening":
        return "bg-red-500 border-red-400";
      case "speaking":
        return "bg-emerald-500 border-emerald-400";
      case "thinking":
        return "bg-indigo-500 border-indigo-400";
      case "error":
        return "bg-rose-500 border-rose-400";
      default:
        return "bg-gray-400 border-gray-350";
    }
  };

  return (
    <>
      {/* 1. FLOATING COMPANION ORB (BOTTOM RIGHT) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            id="milo-floating-orb"
            initial={{ scale: 0, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 30 }}
            onClick={handleToggleOpen}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-black hover:bg-neutral-800 text-white flex items-center justify-center border-2 border-white/20 shadow-lg cursor-pointer transition-all"
            title="Invoke Milo Co-Pilot"
          >
            {/* Pulsing ring */}
            <AnimatePresence>
              {pulsing && (
                <motion.span
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ scale: 1, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut" }}
                  className={`absolute inset-0 rounded-full border-2 ${
                    status === "listening"
                      ? "border-red-500"
                      : status === "speaking"
                      ? "border-emerald-500"
                      : "border-indigo-500"
                  }`}
                />
              )}
            </AnimatePresence>

            <Bot size={22} className={pulsing ? "animate-pulse" : ""} />

            {/* Minor state indicator dot on the orb */}
            <span className={`absolute top-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-black ${getStatusColor()}`} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. OVERLAY COMPANION PANEL (SLIDING DRAWER) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="milo-assistant-panel"
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed top-6 bottom-6 right-6 z-50 w-full max-w-[400px] bg-gray-50/95 backdrop-blur-md rounded-3xl border border-gray-150 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* COMPANION HEADER CONTROL RAIL */}
            <div className="p-4 flex items-center justify-between border-b border-gray-150 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border border-black text-white relative shadow-xs">
                  <Bot size={16} />
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${getStatusColor()}`} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xs font-bold text-gray-950 uppercase tracking-widest leading-none font-sans">Milo Co-Pilot</h2>
                    <span className="text-[8px] font-mono bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded-md font-bold uppercase tracking-wider leading-none">V2.0</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 mt-1 block font-semibold">
                    {status === "listening"
                      ? "Listening to voice..."
                      : status === "speaking"
                      ? "Speaking..."
                      : status === "thinking"
                      ? "Analyzing inputs..."
                      : "Ready to assist"}
                  </span>
                </div>
              </div>

              {/* Utility Header Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleSoundMute}
                  className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                    config.isMuted
                      ? "bg-red-50 text-red-600 border-red-100"
                      : "bg-white text-gray-400 hover:text-black hover:bg-gray-50 border-gray-200"
                  }`}
                  title={config.isMuted ? "Unmute vocal responses" : "Mute vocal responses"}
                >
                  {config.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>

                <button
                  onClick={handleToggleOpen}
                  className="p-1.5 bg-white text-gray-400 hover:text-black border border-gray-200 rounded-lg cursor-pointer transition-colors"
                  title="Close Drawer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* TAB SELECTOR CONTROL DOCK */}
            <div className="p-2.5 px-4 bg-white border-b border-gray-100 flex items-center justify-between gap-1.5">
              <button
                onClick={() => handleTabChange("chat")}
                className={`flex-1 py-2 rounded-xl text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  view === "chat"
                    ? "bg-gray-100 text-black border border-gray-200/50 shadow-3xs"
                    : "text-gray-400 hover:text-black"
                }`}
              >
                <MessageSquare size={13} />
                <span className="hidden xs:inline">Chat</span>
              </button>

              <button
                onClick={() => handleTabChange("planner")}
                className={`flex-1 py-2 rounded-xl text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  view === "planner"
                    ? "bg-gray-100 text-black border border-gray-200/50 shadow-3xs"
                    : "text-gray-400 hover:text-black"
                }`}
              >
                <Calendar size={13} />
                <span className="hidden xs:inline">Planner</span>
              </button>

              <button
                onClick={() => handleTabChange("memory")}
                className={`flex-1 py-2 rounded-xl text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  view === "memory"
                    ? "bg-gray-100 text-black border border-gray-200/50 shadow-3xs"
                    : "text-gray-400 hover:text-black"
                }`}
              >
                <BrainCircuit size={13} />
                <span className="hidden xs:inline">Memory</span>
              </button>

              <button
                onClick={() => handleTabChange("settings")}
                className={`flex-1 py-2 rounded-xl text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  view === "settings"
                    ? "bg-gray-100 text-black border border-gray-200/50 shadow-3xs"
                    : "text-gray-400 hover:text-black"
                }`}
              >
                <Settings size={13} />
                <span className="hidden xs:inline">System</span>
              </button>
            </div>

            {/* ACTIVE CONTAINER TAB ROUTER */}
            <div className="flex-1 min-h-0 p-3">
              {view === "chat" && <ChatTab />}
              {view === "planner" && <PlannerTab />}
              {view === "memory" && <MemoryTab />}
              {view === "settings" && <SettingsTab />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
