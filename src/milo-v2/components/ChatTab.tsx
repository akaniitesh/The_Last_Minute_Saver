import React, { useState, useRef, useEffect } from "react";
import { useMilo } from "../context/useMilo";
import { Mic, Send, Sparkles, AlertCircle, Bot, User, BrainCircuit, MicOff, Settings, BookOpen, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatTime } from "../utils/time";

// Native highly optimized regex Markdown and formatting parser
function formatMessageContent(content: string) {
  if (!content) return null;

  const lines = content.split("\n");
  return lines.map((line, idx) => {
    let trimmed = line.trim();

    // Headers
    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={idx} className="text-sm font-bold text-gray-900 mt-3 mb-1 font-sans">
          {trimmed.replace("### ", "")}
        </h4>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={idx} className="text-base font-extrabold text-gray-900 mt-4 mb-1.5 font-sans border-b border-gray-100 pb-0.5">
          {trimmed.replace("## ", "")}
        </h3>
      );
    }

    // Bullet points
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const bulletText = trimmed.substring(2);
      return (
        <li key={idx} className="ml-4 list-disc text-xs text-gray-700 leading-relaxed font-sans mb-1">
          {parseBoldText(bulletText)}
        </li>
      );
    }

    // Numbered lists
    const numMatch = trimmed.match(/^\d+\.\s+(.*)/);
    if (numMatch) {
      return (
        <li key={idx} className="ml-4 list-decimal text-xs text-gray-700 leading-relaxed font-sans mb-1">
          {parseBoldText(numMatch[1])}
        </li>
      );
    }

    // Standard paragraphs
    if (trimmed === "") {
      return <div key={idx} className="h-2" />;
    }

    return (
      <p key={idx} className="text-xs text-gray-700 leading-relaxed font-sans mb-1.5">
        {parseBoldText(trimmed)}
      </p>
    );
  });
}

function parseBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-gray-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function ChatTab() {
  const { state, dispatch, sendMessage, startVoiceSession, stopVoiceSession } = useMilo();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isListening = state.assistant.status === "listening";

  const activeConv = state.chat.conversations.find(
    (c) => c.id === state.chat.activeConversationId
  );

  const messages = activeConv?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, state.assistant.status]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(160, textareaRef.current.scrollHeight)}px`;
    }
  }, [inputText]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const query = inputText;
    setInputText("");
    await sendMessage(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopVoiceSession();
    } else {
      startVoiceSession();
    }
  };

  const handleSuggestionClick = async (cmd: string) => {
    await sendMessage(cmd);
  };

  const suggestions = [
    { label: "📅 Plan My Day", cmd: "Plan my day" },
    { label: "🎯 What to do next?", cmd: "What should I do next?" },
    { label: "🔍 Evaluate Deadline Risks", cmd: "Identify any high-risk deliverables" },
    { label: "📚 Break down workload", cmd: "Break down my workload" }
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
      
      {/* Scrollable Conversation Field */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-[#FCFCFC]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-2xs">
              <Bot size={22} className="text-gray-700 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Milo Executive Co-Pilot</h3>
              <p className="text-[11px] text-gray-400 max-w-[260px] mt-1">
                Say hello or click a quick command below to coordinate tasks, evaluate timelines, and organize study efforts.
              </p>
            </div>

            {/* Quick Action Chips */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-[340px] pt-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(s.cmd)}
                  className="p-2.5 bg-white border border-gray-150 hover:border-gray-300 rounded-xl text-[10px] font-mono font-medium text-gray-600 hover:text-gray-900 transition-all text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  {/* Avatar Icon */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                    isUser ? "bg-black text-white border-black" : "bg-gray-50 text-gray-700 border-gray-100"
                  }`}>
                    {isUser ? <User size={12} /> : <Bot size={12} />}
                  </div>

                  {/* Message Bubble Container */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                      isUser 
                        ? "bg-black text-white border-black rounded-tr-none shadow-sm" 
                        : "bg-white text-gray-800 border-gray-100 rounded-tl-none shadow-2xs"
                    }`}>
                      {/* Subheadings and formatting */}
                      {isUser ? (
                        <p className="font-sans whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <div>
                          {formatMessageContent(m.content)}
                          
                          {/* Inner Expandable Gemini Reasoning Block */}
                          {m.reasoning && (
                            <details className="mt-3 border-t border-gray-100 pt-2 group cursor-pointer select-none">
                              <summary className="text-[10px] font-mono text-indigo-500 font-bold uppercase tracking-wider flex items-center gap-1.5 list-none">
                                <BrainCircuit size={12} className="shrink-0" />
                                <span>Co-Pilot Reasoning Outline</span>
                                <span className="ml-auto transition-transform group-open:rotate-180">▼</span>
                              </summary>
                              <div className="mt-2 p-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] text-gray-500 font-mono whitespace-pre-wrap leading-relaxed">
                                {m.reasoning}
                              </div>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <span className={`text-[9px] font-mono text-gray-400 block ${isUser ? "text-right" : "text-left"}`}>
                      {formatTime(m.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic State Indicators */}
        {state.assistant.status === "thinking" && (
          <div className="flex gap-3 mr-auto max-w-[85%]">
            <div className="w-6 h-6 rounded-full bg-gray-50 text-gray-500 border border-gray-100 flex items-center justify-center">
              <Bot size={12} />
            </div>
            <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-2xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="text-[10px] font-mono text-indigo-500 font-semibold uppercase tracking-wider ml-1">Analyzing schedule...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* FOOTER BAR: Input & Mic Operations */}
      <div className="p-3 border-t border-gray-100 bg-white">
        
        {/* Error Alert Banner */}
        <AnimatePresence>
          {state.assistant.currentError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2.5 p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start justify-between gap-2 text-[10px] text-rose-700"
            >
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold uppercase tracking-wider block text-[9px] font-mono">Co-Pilot Audio Notice</span>
                  <p className="font-sans leading-normal">{state.assistant.currentError}</p>
                </div>
              </div>
              <button
                onClick={() => dispatch({ type: "SET_ASSISTANT_ERROR", payload: null })}
                className="p-1 hover:bg-rose-100 rounded-lg text-rose-500 cursor-pointer"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-time wave indicators when listening */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2.5 p-2 bg-red-50/50 border border-red-100 rounded-xl flex items-center justify-between gap-3 text-[10px] font-mono text-red-700"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 h-3">
                  <span className="w-0.5 h-full bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-0.5 h-2/3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "100ms" }} />
                  <span className="w-0.5 h-1/2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
                </div>
                <span>Milo is listening... Speak clearly</span>
              </div>
              <button
                onClick={stopVoiceSession}
                className="px-2 py-0.5 bg-red-600 text-white rounded-md text-[8px] uppercase tracking-wider font-bold cursor-pointer"
              >
                Cancel mic
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-150 rounded-2xl p-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
          <button
            onClick={handleMicToggle}
            className={`rounded-full border transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 ${
              isListening
                ? "bg-red-600 text-white border-red-500 shadow-md animate-pulse"
                : "bg-white text-gray-500 hover:text-black border-gray-200"
            }`}
            title={isListening ? "Mute Microphone" : "Speak to Milo"}
          >
            <Mic size={15} />
          </button>
          
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isListening ? "Listening to your voice..." : "Type instruction here..."}
            rows={1}
            className="flex-1 bg-transparent border-0 outline-hidden font-sans text-xs text-gray-850 px-2 min-w-0 resize-none max-h-[160px] py-2 [scrollbar-width:thin] focus:ring-0"
            disabled={isListening}
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`rounded-full transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 ${
              inputText.trim()
                ? "bg-black text-white hover:bg-neutral-800 shadow-xs"
                : "bg-transparent text-gray-300 border-transparent cursor-default"
            }`}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
