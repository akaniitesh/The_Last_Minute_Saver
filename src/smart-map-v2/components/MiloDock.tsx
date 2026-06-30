import React, { useState, useContext, useEffect, useRef } from "react";
import { useMilo } from "../../milo-v2";
import { SmartMapContext } from "../context/SmartMapContext";
import { GeocodingService } from "../services/geocoding";
import { Send, Sparkles, Mic, MicOff, Volume2, ArrowRight } from "lucide-react";

export const MiloDock: React.FC = () => {
  const context = useContext(SmartMapContext);
  if (!context) return null;

  const { setSelectedPlace, createReminder, reminders, currentLocation } = context;
  const { state, sendMessage, startVoiceSession, stopVoiceSession } = useMilo();
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const presetChips = [
    { label: "Carry laptop reminder 💻", text: "Remind me to carry my laptop." },
    { label: "Class departure alert ⏱️", text: "Remind me 20 minutes before class." },
    { label: "Traffic monitoring 🚗", text: "Remind me if traffic increases." },
    { label: "Rain monitoring 🌧️", text: "Remind me if rain starts." },
  ];

  const handleSend = async (text: string) => {
    if (!text || text.trim().length === 0) return;
    setInputText("");

    const lowerText = text.toLowerCase();

    // Process Natural Language Reminders for Milo integration
    if (lowerText.includes("carry my laptop")) {
      createReminder("Carry Laptop 💻", "time", "custom", {
        description: "Milo AI Reminder: Carry your laptop before departing.",
        targetTime: new Date(Date.now() + 60 * 1000).toISOString(), // 1 minute from now
      });
    } else if (lowerText.includes("before class") || lowerText.includes("minutes before class")) {
      createReminder("Class departure alert ⏱️", "time", "class", {
        description: "Milo AI Departure reminder: Your class starts in 20 minutes.",
        targetTime: new Date(Date.now() + 120 * 1000).toISOString(), // 2 minutes from now
      });
    } else if (lowerText.includes("before my interview") || lowerText.includes("interview")) {
      createReminder("Interview Alert 💼", "time", "meeting", {
        description: "Milo AI Meeting reminder: Interview session starting soon.",
        targetTime: new Date(Date.now() + 300 * 1000).toISOString(), // 5 minutes from now
      });
    } else if (lowerText.includes("traffic increases") || lowerText.includes("traffic alert")) {
      createReminder("Traffic watch: Bottleneck check 🚗", "traffic", "custom", {
        description: "Milo AI Traffic watch: Active monitoring of route delays.",
        coords: currentLocation,
        trafficDelayMinutesThreshold: 10,
      });
    } else if (lowerText.includes("rain starts") || lowerText.includes("rain alert")) {
      createReminder("Weather watch: Rain probability 🌧️", "weather", "custom", {
        description: "Milo AI Weather watch: Active rain chance tracking.",
        coords: currentLocation,
        weatherRainProbabilityThreshold: 50,
      });
    } else if (lowerText.includes("when should i leave") || lowerText.includes("when to leave")) {
      const upcoming = reminders.find((r) => r.status === "upcoming" && r.tripDetails);
      if (upcoming && upcoming.tripDetails) {
        const leaveTimeStr = new Date(upcoming.tripDetails.recommendedDepartureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        // Trigger a custom notification with leaving details
        import("../services/notification").then(({ NotificationService }) => {
          NotificationService.triggerNotification(
            "Optimal Leaving Window",
            `Based on current traffic and weather at your destination, you should leave for '${upcoming.title}' at ${leaveTimeStr}.`,
            "custom"
          );
        });
      } else {
        import("../services/notification").then(({ NotificationService }) => {
          NotificationService.triggerNotification(
            "Departure Recommendation",
            "No active trips with departure times scheduled. Use the Trip Plan panel to calculate optimal departure windows.",
            "custom"
          );
        });
      }
    }

    try {
      await sendMessage(text);
    } catch (err) {
      console.error("Milo interaction error", err);
    }
  };

  const handleVoiceToggle = () => {
    if (state.assistant.status === "listening") {
      stopVoiceSession();
    } else {
      startVoiceSession();
    }
  };

  const activeConversation = state.chat.conversations.find(
    (c) => c.id === state.chat.activeConversationId
  );
  const activeMessages = activeConversation ? activeConversation.messages.slice(-4) : [];

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  return (
    <div className="flex flex-col bg-slate-900 text-neutral-100 rounded-2xl shadow-xl border border-slate-800 p-4 space-y-4">
      {/* Dock Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Milo Copilot
          </span>
        </div>

        {/* Status Indicator pill */}
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
          state.assistant.status === "thinking"
            ? "bg-amber-500/10 text-amber-400 animate-pulse"
            : state.assistant.status === "listening"
            ? "bg-emerald-500/10 text-emerald-400 animate-pulse"
            : "bg-indigo-500/10 text-indigo-400"
        }`}>
          {state.assistant.status}
        </span>
      </div>

      {/* Messages Feed (Compact) */}
      <div className="flex flex-col space-y-2 max-h-[160px] overflow-y-auto pr-1">
        {activeMessages.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-xs">
            "Ask me to navigate, plan your leaving reminders, or locate essentials."
          </div>
        ) : (
          activeMessages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id || idx}
                className={`flex flex-col max-w-[85%] rounded-xl p-2 text-xs leading-relaxed ${
                  isUser
                    ? "bg-indigo-600 text-white self-end rounded-br-none"
                    : "bg-slate-800 text-neutral-200 self-start rounded-bl-none"
                }`}
              >
                <p className="font-semibold text-[9px] text-slate-400/80 mb-0.5 uppercase">
                  {isUser ? "You" : "Milo"}
                </p>
                <p>{msg.content}</p>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Interactive Quick action Chips */}
      <div className="flex flex-wrap gap-1">
        {presetChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip.text)}
            className="px-2.5 py-1 text-[10px] font-medium bg-slate-800 hover:bg-slate-700 active:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-all border border-slate-700/50"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input box / Voice control console */}
      <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 focus-within:ring-1 focus-within:ring-indigo-500">
        <button
          onClick={handleVoiceToggle}
          title={state.assistant.status === "listening" ? "Stop Voice Mode" : "Start Voice Mode"}
          className={`p-2 rounded-lg transition-colors ${
            state.assistant.status === "listening"
              ? "bg-red-500/25 text-red-400"
              : "hover:bg-slate-800 text-slate-400 hover:text-indigo-400"
          }`}
        >
          {state.assistant.status === "listening" ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(inputText)}
          placeholder="Ask Milo..."
          className="w-full bg-transparent text-xs text-neutral-100 placeholder-slate-500 focus:outline-none px-2"
        />

        <button
          onClick={() => handleSend(inputText)}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
export default MiloDock;
