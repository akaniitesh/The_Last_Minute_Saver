import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Upload, 
  FileText, 
  Clock, 
  Zap, 
  Check, 
  Plus, 
  Layers, 
  Activity, 
  Wifi, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  BrainCircuit,
  Settings,
  X,
  PlusCircle,
  TrendingUp,
  Flame,
  User,
  Info,
  Calendar,
  Sparkles,
  File
} from "lucide-react";
import { useMilo, MiloChat } from "../milo-v2";
import { Task, ScannedDoc } from "../types";

interface VoiceTabProps {
  onSetClockState: (mode: "scanner" | "timeline" | "gauge" | "event" | "timer" | "progress" | "pulse") => void;
  onSetVoiceIntensity: (intensity: number) => void;
  tasks: Task[];
  scannedDocs: ScannedDoc[];
  onAddScannedDoc: (doc: ScannedDoc) => void;
  onAddTask?: (task: Task) => void;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
  miloStatus?: "Ready" | "Listening" | "Thinking" | "Planning" | "Executing" | "Idle";
  onSetMiloStatus?: (status: "Ready" | "Listening" | "Thinking" | "Planning" | "Executing" | "Idle") => void;
  lastActiveTab?: string;
}

export default function VoiceTab({
  onSetClockState,
  onSetVoiceIntensity,
  tasks: propTasks,
  scannedDocs,
  onAddScannedDoc,
  onAddTask,
  initialQuery,
  onClearInitialQuery,
  miloStatus,
  onSetMiloStatus,
  lastActiveTab
}: VoiceTabProps) {
  const { state, dispatch, sendMessage, startVoiceSession, stopVoiceSession } = useMilo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Responsive mobile sub-tabs navigation
  const [mobileTab, setMobileTab] = useState<"chat" | "voice" | "docs" | "planner">("chat");
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState(false);

  // Derive dynamic assistant status
  const isListening = state.assistant.status === "listening";
  const isThinking = state.assistant.status === "thinking";
  const isSpeaking = state.assistant.status === "speaking";

  // Trigger initial query from Guidance tab if passed
  useEffect(() => {
    if (initialQuery) {
      sendMessage(initialQuery);
      if (onClearInitialQuery) {
        onClearInitialQuery();
      }
    }
  }, [initialQuery, sendMessage, onClearInitialQuery]);

  // Synchronize dynamic status back to App
  useEffect(() => {
    if (!onSetMiloStatus) return;
    if (isListening) {
      onSetMiloStatus("Listening");
    } else if (isThinking) {
      onSetMiloStatus("Thinking");
    } else if (isSpeaking) {
      onSetMiloStatus("Executing");
    } else {
      onSetMiloStatus("Ready");
    }
  }, [isListening, isThinking, isSpeaking, onSetMiloStatus]);

  // Document file upload handler (PDF/txt brief ingestion)
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileText = (event.target?.result as string) || "Extracted content for " + file.name;

      try {
        const response = await fetch("/api/ai/analyze-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileText: fileText.slice(0, 12000) // Keep within token limit
          })
        });

        if (response.ok) {
          const docData = await response.json();
          const doc: ScannedDoc = {
            id: `doc-${Date.now()}`,
            fileName: file.name,
            title: docData.title || file.name,
            deadlines: docData.deadlines || [],
            keyRequirements: docData.keyRequirements || [],
            risks: docData.risks || [],
            estimatedHours: docData.estimatedHours || 6,
            studyPlan: docData.studyPlan || [],
            rawText: fileText
          };

          onAddScannedDoc(doc);
          onSetClockState("scanner");

          // Directly push into the active conversation so Milo can respond in-context immediately!
          dispatch({
            type: "ADD_MESSAGE",
            payload: {
              conversationId: state.chat.activeConversationId || "default",
              message: {
                id: `sys-doc-${Date.now()}`,
                role: "assistant",
                content: `### 📄 Document Ingested & Indexed: **${file.name}**\n\nI have successfully uploaded and parsed this document for your workspace:\n\n* **Title**: ${doc.title}\n* **Identified Deadlines**: ${doc.deadlines?.join(", ") || "No explicit deadlines found"}\n* **Workload Estimate**: ~${doc.estimatedHours} study hours\n\n**Strategic Action Plan Recommended**:\n${doc.studyPlan?.map(p => `* **${p.week}**: ${p.focus}`).join("\n") || "No custom plan generated yet"}\n\n*Milestones have been chronologically structured inside your central database cockpit.*`,
                timestamp: new Date()
              }
            }
          });
        } else {
          throw new Error("Failed to parse document brief");
        }
      } catch (err) {
        console.error("Document upload error:", err);
        setUploadError("Could not parse file. Please verify it is a readable text file.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  // Quick Action triggers
  const triggerQuickAction = async (cmd: string) => {
    await sendMessage(cmd);
    setMobileTab("chat");
  };

  // Sound cancellation
  const stopSynthesis = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Audio wave intensity indicators (simulation)
  const [voiceIntensity, setLocalVoiceIntensity] = useState(0);
  useEffect(() => {
    let interval: any = null;
    if (isListening || isSpeaking) {
      interval = setInterval(() => {
        const rand = Math.floor(Math.random() * 50) + (isListening ? 35 : 20);
        setLocalVoiceIntensity(rand);
        onSetVoiceIntensity(rand);
      }, 100);
    } else {
      setLocalVoiceIntensity(0);
      onSetVoiceIntensity(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening, isSpeaking, onSetVoiceIntensity]);

  // Extract relevant planner state
  const activeTasks = state.planner.tasks || propTasks || [];
  const incompleteTasks = activeTasks.filter(t => !t.isCompleted);
  const urgentTasksCount = activeTasks.filter(t => t.priority === "high" && !t.isCompleted).length;

  // REUSABLE SUB-RENDER MODULES
  const renderHeader = (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono tracking-[0.2em] text-gray-400 uppercase font-semibold">Voice Chief of Staff</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <h2 className="text-xl md:text-2xl font-display font-bold text-gray-950 tracking-tight">AI Executive Workspace</h2>
        <p className="text-xs text-gray-500 mt-0.5">Vocal Execution Cockpit & Strategic Productivity Control</p>
      </div>

      {/* Global connection/audio configuration */}
      <div className="flex items-center justify-between md:justify-end gap-2.5">
        <div className="px-3 py-1.5 bg-gray-50 border border-gray-150 rounded-xl flex items-center gap-2 text-[10px] font-mono font-bold text-gray-600">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>SECURE STREAM</span>
        </div>

        <button
          onClick={stopSynthesis}
          className="p-2.5 bg-white border border-gray-200 text-gray-400 hover:text-rose-600 hover:border-rose-100 rounded-xl transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px]"
          title="Interrupt AI Audio Synthesis"
        >
          <VolumeX size={15} />
        </button>
      </div>
    </div>
  );

  const renderChat = (
    <div className="flex flex-col h-[520px] md:h-[640px] border border-gray-100 bg-white rounded-2xl shadow-xs overflow-hidden">
      <MiloChat />
    </div>
  );

  const renderVoiceCard = (
    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-2xs flex flex-col items-center justify-center relative overflow-hidden group w-full">
      <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">
          <Activity size={12} className="text-emerald-500 animate-pulse" />
          <span>Voice Companion Deck</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-mono text-gray-400">
          <Wifi size={10} className="text-emerald-500" />
          <span>Online (Low-latency)</span>
        </div>
      </div>

      {/* Pulsing microphone orb */}
      <button
        onClick={() => {
          if (isListening) {
            stopVoiceSession();
          } else {
            startVoiceSession();
          }
        }}
        className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-500 relative cursor-pointer min-h-[44px] min-w-[44px] ${
          isListening
            ? "bg-rose-500 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)] scale-105"
            : isSpeaking
            ? "bg-amber-500 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-102 animate-pulse"
            : "bg-gray-50 hover:bg-gray-100 border-gray-200 shadow-2xs hover:scale-102"
        }`}
      >
        {isListening ? (
          <Mic size={26} className="text-white animate-bounce" />
        ) : isSpeaking ? (
          <Volume2 size={26} className="text-white animate-pulse" />
        ) : (
          <Mic size={26} className="text-gray-400 hover:text-gray-700" />
        )}

        {/* Glowing concentric decorative rings */}
        {isListening && (
          <>
            <div className="absolute inset-0 rounded-full border border-dashed border-white/40 animate-spin [animation-duration:12s]" />
            <div className="absolute -inset-2.5 rounded-full border border-rose-500/25 animate-ping" />
          </>
        )}
      </button>

      {/* Voice waveform placeholder */}
      <div className="flex items-end justify-center gap-1 h-9 mt-4 w-full max-w-[130px] px-1">
        {[...Array(7)].map((_, i) => {
          const baseHeights = [8, 18, 32, 24, 28, 14, 6];
          const isActive = isListening || isSpeaking;
          return (
            <div
              key={i}
              className="w-1 rounded-full transition-all duration-350"
              style={{
                height: isActive ? `${Math.max(4, baseHeights[i] * (voiceIntensity / 40))}px` : "4px",
                backgroundColor: isListening ? "#F43F5E" : isSpeaking ? "#F59E0B" : "rgba(0,0,0,0.06)"
              }}
            />
          );
        })}
      </div>

      {/* Voice status metrics */}
      <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-50 text-[10px] font-mono text-gray-500">
        <div className="bg-gray-50 p-2 rounded-xl text-center space-y-0.5 border border-gray-100/40">
          <span className="block text-gray-400 uppercase font-bold text-[8px]">Wake Word</span>
          <span className="font-bold text-gray-700 text-[9px] uppercase tracking-wider">"Hey Milo"</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-xl text-center space-y-0.5 border border-gray-100/40">
          <span className="block text-gray-400 uppercase font-bold text-[8px]">Audio Input</span>
          <span className="font-bold text-gray-700 text-[9px] uppercase tracking-wider">en-US (Eng)</span>
        </div>
      </div>

      {/* Interactive speech controls */}
      <div className="w-full flex gap-2 mt-3">
        <button
          onClick={() => {
            if (isListening) stopVoiceSession();
            else startVoiceSession();
          }}
          className={`flex-1 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider text-center transition-all cursor-pointer border min-h-[44px] ${
            isListening
              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
              : "bg-gray-950 text-white border-transparent hover:bg-gray-900 shadow-2xs"
          }`}
        >
          {isListening ? "Release / Send" : "Push To Talk"}
        </button>
        
        <button
          onClick={stopSynthesis}
          className="px-3.5 py-2.5 rounded-xl border border-gray-200 hover:border-gray-350 text-gray-500 hover:text-gray-800 text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center cursor-pointer bg-white min-h-[44px]"
        >
          Interrupt
        </button>
      </div>
    </div>
  );

  const renderDocsCard = (
    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-2xs flex flex-col w-full">
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-50">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">
          <FileText size={12} className="text-indigo-500" />
          <span>Document Context</span>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 font-bold uppercase">
          {scannedDocs.length} INDEXED
        </span>
      </div>

      {/* Ingestion status banner */}
      <div className="space-y-2 mb-3">
        <div className="text-[10px] text-gray-500 font-mono flex items-center justify-between">
          <span>Subject Space:</span>
          <span className="font-bold text-gray-700">Curriculum & Tasks</span>
        </div>
        <div className="text-[10px] text-gray-500 font-mono flex items-center justify-between">
          <span>Planner Horizon:</span>
          <span className="font-bold text-gray-700">Next 7 Days</span>
        </div>
      </div>

      {/* File List */}
      {scannedDocs.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center space-y-2 bg-gray-50/50 mb-3">
          <Upload size={18} className="text-gray-300 mx-auto" />
          <p className="text-[10px] text-gray-400 font-sans max-w-[200px] mx-auto">
            Drag & drop or upload academic syllabi, briefs, or calendars to ingest.
          </p>
        </div>
      ) : (
        <div className="max-h-[110px] overflow-y-auto space-y-1.5 mb-3 pr-1">
          {scannedDocs.map((doc) => (
            <div key={doc.id} className="p-2 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck size={13} className="text-indigo-500 shrink-0" />
                <span className="truncate text-gray-700 font-medium font-sans">{doc.title || doc.fileName}</span>
              </div>
              <span className="text-[8px] font-mono bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                {doc.deadlines?.length || 0} MIL
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Hidden Input File */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf,.txt,.doc,.docx"
      />

      {/* Action Upload button */}
      <button
        onClick={handleFileUploadClick}
        disabled={isUploading}
        className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 text-indigo-700 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
      >
        {isUploading ? (
          <>
            <Activity size={12} className="animate-spin" />
            <span>ANALYZING SYLLABUS...</span>
          </>
        ) : (
          <>
            <Upload size={12} />
            <span>UPLOAD DOCUMENT BRIEF</span>
          </>
        )}
      </button>

      {uploadError && (
        <p className="text-[9px] text-rose-600 font-mono mt-2 text-center">{uploadError}</p>
      )}
    </div>
  );

  const renderPlannerCard = (
    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-2xs flex flex-col flex-1 w-full">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-gray-50">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">
          <Calendar size={12} className="text-amber-500" />
          <span>Planner Analytics Summary</span>
        </div>
      </div>

      {/* Key stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
          <div className="flex items-center justify-between text-[8px] font-mono text-gray-400 uppercase font-bold">
            <span>Incomplete Tasks</span>
            <CheckCircle2 size={9} className="text-gray-400" />
          </div>
          <p className="text-lg font-display font-bold text-gray-950 mt-1">{incompleteTasks.length}</p>
        </div>

        <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
          <div className="flex items-center justify-between text-[8px] font-mono text-gray-400 uppercase font-bold">
            <span>Urgent Action</span>
            <AlertCircle size={9} className="text-rose-500" />
          </div>
          <p className="text-lg font-display font-bold text-rose-600 mt-1">{urgentTasksCount}</p>
        </div>
      </div>

      {/* List top 3 immediate tasks */}
      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[160px] pr-1 mb-4">
        <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block mb-1">Critical Tasks Checklist</span>
        {incompleteTasks.length === 0 ? (
          <div className="text-[10px] text-gray-400 italic font-sans p-2 text-center bg-gray-50/50 rounded-xl">
            No active tasks. Tap input to plan something!
          </div>
        ) : (
          incompleteTasks.slice(0, 3).map((t) => (
            <div key={t.id} className="p-2 bg-gray-50/50 border border-gray-100 rounded-xl flex items-start gap-2 text-[10px] font-sans">
              <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                t.priority === "high" ? "bg-rose-500" : t.priority === "medium" ? "bg-amber-500" : "bg-gray-400"
              }`} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-700 truncate">{t.title}</p>
                <span className="text-[8px] font-mono text-gray-400">{t.deadline}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Suggested Task */}
      <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex gap-2 text-[10px] items-start mt-auto">
        <Sparkles size={13} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-800 uppercase text-[8px] font-mono block">Milo Suggested Next Priority</span>
          <p className="text-gray-700 font-medium leading-normal mt-0.5 font-sans">
            {incompleteTasks.length > 0 
              ? `Focus on "${incompleteTasks[0].title}" to maintain schedule alignment.`
              : "Excellent, your queue is cleared. Upload your syllabus to auto-schedule checkpoints!"}
          </p>
        </div>
      </div>
    </div>
  );

  const renderQuickActions = (
    <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-2xs w-full">
      <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block mb-2.5">Quick Action Presets</span>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => triggerQuickAction("Plan my day")}
          className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl text-[9px] font-mono font-bold text-gray-600 text-left transition-all cursor-pointer truncate min-h-[44px]"
        >
          📅 PLAN MY DAY
        </button>
        <button
          onClick={() => triggerQuickAction("What should I do next?")}
          className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl text-[9px] font-mono font-bold text-gray-600 text-left transition-all cursor-pointer truncate min-h-[44px]"
        >
          🎯 NEXT TASK
        </button>
        <button
          onClick={() => triggerQuickAction("Create a placement prep syllabus")}
          className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl text-[9px] font-mono font-bold text-gray-600 text-left transition-all cursor-pointer truncate min-h-[44px]"
        >
          💼 PLACEMENT PREP
        </button>
        <button
          onClick={() => triggerQuickAction("Show upcoming deadlines")}
          className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl text-[9px] font-mono font-bold text-gray-600 text-left transition-all cursor-pointer truncate min-h-[44px]"
        >
          ⏰ CHECK DEADLINES
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans w-full max-w-full overflow-x-hidden">
      
      {/* Header bar */}
      {renderHeader}

      {/* MOBILE TAB CONTROLLER (Visible only on screens below lg breakpoint) */}
      <div className="lg:hidden flex items-center bg-gray-100/80 p-1 rounded-2xl gap-1 border border-gray-200/50">
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all min-h-[44px] cursor-pointer ${
            mobileTab === "chat"
              ? "bg-white text-gray-950 shadow-xs border border-gray-200/30 font-bold"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <FileText size={13} />
          <span className="hidden sm:inline">Chat</span>
        </button>
        <button
          onClick={() => setMobileTab("voice")}
          className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all min-h-[44px] cursor-pointer ${
            mobileTab === "voice"
              ? "bg-white text-gray-950 shadow-xs border border-gray-200/30 font-bold"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Mic size={13} />
          <span className="hidden sm:inline">Voice</span>
        </button>
        <button
          onClick={() => setMobileTab("docs")}
          className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all min-h-[44px] cursor-pointer ${
            mobileTab === "docs"
              ? "bg-white text-gray-950 shadow-xs border border-gray-200/30 font-bold"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Layers size={13} />
          <span className="hidden sm:inline">Docs</span>
        </button>
        <button
          onClick={() => setMobileTab("planner")}
          className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all min-h-[44px] cursor-pointer ${
            mobileTab === "planner"
              ? "bg-white text-gray-950 shadow-xs border border-gray-200/30 font-bold"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Calendar size={13} />
          <span className="hidden sm:inline">Planner</span>
        </button>
      </div>

      {/* DESKTOP WORKSPACE LAYOUT (Visible on lg and up - Pixel-Perfect) */}
      <div className="hidden lg:grid grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: Milo Chat Window Integration (70%) */}
        <div className="lg:col-span-8 flex flex-col h-[640px] border border-gray-100 bg-white rounded-2xl shadow-xs overflow-hidden">
          <MiloChat />
        </div>

        {/* RIGHT COLUMN: Productivity Controls and Voice Companion Card (30%) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-start">
          {renderVoiceCard}
          {renderDocsCard}
          {renderPlannerCard}
          {renderQuickActions}
        </div>
      </div>

      {/* MOBILE/TABLET DYNAMIC CONTAINER (Visible on screens below lg breakpoint) */}
      <div className="block lg:hidden w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={mobileTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full flex flex-col gap-4"
          >
            {mobileTab === "chat" && renderChat}
            {mobileTab === "voice" && renderVoiceCard}
            {mobileTab === "docs" && renderDocsCard}
            {mobileTab === "planner" && (
              <div className="space-y-4 w-full">
                {renderPlannerCard}
                {renderQuickActions}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* MOBILE PULSING FLOATING MICRO ACTION BUTTON (FAB) & BOTTOM SHEET */}
      {mobileTab === "chat" && (
        <button
          onClick={() => setIsVoiceSheetOpen(true)}
          className={`lg:hidden fixed right-6 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer min-h-[44px] min-w-[44px] ${
            isListening ? "bg-rose-500 animate-pulse" : isSpeaking ? "bg-amber-500 animate-pulse" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
          style={{ bottom: "calc(80px + env(safe-area-inset-bottom))" }}
          title="Open Voice Companion Panel"
        >
          {isListening ? (
            <Mic size={22} className="animate-bounce" />
          ) : isSpeaking ? (
            <Volume2 size={22} className="animate-pulse" />
          ) : (
            <Mic size={22} />
          )}
        </button>
      )}

      {/* ELEGANT MOBILE BOTTOM SHEET DRAWER */}
      <AnimatePresence>
        {isVoiceSheetOpen && (
          <>
            {/* Dark Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVoiceSheetOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 lg:hidden"
            />
            {/* Drawer Sliding container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl border-t border-gray-200 shadow-2xl p-6 z-50 max-h-[85vh] overflow-y-auto lg:hidden pb-10"
            >
              {/* Top Drag/Slide indicator handle */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />
              
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <span className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity size={12} className="text-emerald-500 animate-pulse" />
                  <span>Interactive Voice Assistant</span>
                </span>
                <button
                  onClick={() => setIsVoiceSheetOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              {renderVoiceCard}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
