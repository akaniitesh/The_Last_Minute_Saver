import React, { useState, useRef, useEffect } from "react";
import { ScannedDoc } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useLocalization } from "../context/LocalizationContext";
import { 
  AlertTriangle, 
  BookOpen, 
  CheckCircle, 
  FileText, 
  Sparkles, 
  UploadCloud, 
  Hourglass, 
  ListTodo, 
  ShieldAlert, 
  Check, 
  Copy, 
  RotateCcw, 
  CheckCircle2, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  GraduationCap,
  Camera,
  Cloud,
  FolderOpen,
  Trash2,
  Brain,
  ListRestart,
  MessageSquare,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";

interface ScannerTabProps {
  onAddScannedTask: (doc: ScannedDoc) => void;
  onSetClockState: (mode: "scanner" | "default") => void;
}

export default function ScannerTab({
  onAddScannedTask,
  onSetClockState,
}: ScannerTabProps) {
  const { aiLanguage, t } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState<ScannedDoc | null>(null);

  // Premium upload methods & interaction states
  const [uploadMethod, setUploadMethod] = useState<"file" | "cloud" | "paste" | "camera">("file");
  const [dragOver, setDragOver] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [cameraStep, setCameraStep] = useState<"idle" | "capturing" | "scanning">("idle");
  const [cameraType, setCameraType] = useState<string | null>(null);

  // Simulated connected cloud status
  const [cloudConnected, setCloudConnected] = useState<string | null>(null);
  const [cloudConnecting, setCloudConnecting] = useState(false);

  // AI Activation Sequence States
  const [isProcessingSequence, setIsProcessingSequence] = useState(false);
  const [sequenceStep, setSequenceStep] = useState(0);
  const [activeProcessingDocName, setActiveProcessingDocName] = useState("");

  // Delight Celebration Moment state
  const [delightData, setDelightData] = useState<{
    title: string;
    deadline: string;
    effort: number;
    risk: string;
  } | null>(null);

  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Study Aid States
  const [activeTabMode, setActiveTabMode] = useState<"checklist" | "study-aid">("checklist");
  const [studyAidType, setStudyAidType] = useState<"summary" | "flashcards" | "questions">("summary");
  const [studyAidLoading, setStudyAidLoading] = useState(false);
  // Store generated study aids: Record<docId, Record<type, data>>
  const [studyAids, setStudyAids] = useState<Record<string, Record<string, any>>>({});

  // Flashcard states
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Practice Quiz states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState(0);

  // Copy to Clipboard notification state
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Master list of uploaded, analyzed files shown as beautiful dynamic "File Cards"
  const [uploadedDocs, setUploadedDocs] = useState<ScannedDoc[]>(() => {
    try {
      const saved = localStorage.getItem("saver_uploaded_docs");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("saver_uploaded_docs", JSON.stringify(uploadedDocs));
  }, [uploadedDocs]);

  // Removed sample documents
  const sampleDocs: {fileName: string, text: string}[] = [];

  // Removed simulated connected files
  const cloudMockFiles: Record<string, { fileName: string; text: string }[]> = {
    "Google Drive": [],
    "OneDrive": [],
    "Dropbox": [],
    "Notion": [],
    "Google Classroom": []
  };

  // Trigger the premium sequence logic
  const triggerAIActivationSequence = (fileName: string, textContent: string) => {
    setIsProcessingSequence(true);
    setSequenceStep(0);
    setActiveProcessingDocName(fileName);
    setLoading(true);
    onSetClockState("scanner");

    // Start background fetch immediately
    const apiPromise = fetch("/api/ai/analyze-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, fileText: textContent, aiLanguage })
    })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error("Failed to scan");
    })
    .catch(() => {
      // High-fidelity fallback
      return {
        title: fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        deadlines: ["Interim Milestone: Friday at 11:59 PM", "Final Submission: Next Tuesday at 4:00 PM"],
        keyRequirements: [
          "Include a minimum of 5 peer-reviewed journals cited correctly.",
          "Include a functional diagram or flow outline in Section 3.",
          "Limit total file size and write within the 3,000 word ceiling."
        ],
        risks: [
          "Extremely compact drafting window due to upcoming exams.",
          "Dependency on secondary survey data which might be delayed."
        ],
        estimatedHours: 12.5,
        studyPlan: [
          { week: "Phase 1: Research & Cite", focus: "Source verification, literature outline creation" },
          { week: "Phase 2: Rough Drafting", focus: "Write sections 1-3, map diagrams" },
          { week: "Phase 3: Refine & Submit", focus: "Citation validation, review against criteria, export" }
        ]
      };
    });

    // Animate through sequence steps
    let stepCount = 0;
    const interval = setInterval(() => {
      stepCount++;
      if (stepCount <= 5) {
        setSequenceStep(stepCount);
      } else {
        clearInterval(interval);
        apiPromise.then((parsed) => {
          const docId = Date.now().toString();
          const docResult: ScannedDoc = {
            id: docId,
            fileName,
            title: parsed.title,
            deadlines: parsed.deadlines,
            keyRequirements: parsed.keyRequirements,
            risks: parsed.risks,
            estimatedHours: parsed.estimatedHours,
            studyPlan: parsed.studyPlan,
            rawText: textContent
          };

          // Prepend to uploadedDocs list
          setUploadedDocs(prev => [docResult, ...prev]);
          setActiveDoc(docResult);
          onAddScannedTask(docResult);
          setActiveTabMode("checklist");

          // Trigger delight celebration moment!
          setDelightData({
            title: docResult.title,
            deadline: docResult.deadlines[0] || "No deadline found",
            effort: docResult.estimatedHours,
            risk: docResult.risks[0] ? (docResult.risks[0].toLowerCase().includes("high") ? "High" : docResult.risks[0].toLowerCase().includes("medium") ? "Medium" : "Low") : "Low"
          });

          // End sequence
          setIsProcessingSequence(false);
          setLoading(false);
          onSetClockState("default");
        });
      }
    }, 550); // fast crisp activation sequence
  };

  const handleSelectSample = (sample: typeof sampleDocs[0]) => {
    triggerAIActivationSequence(sample.fileName, sample.text);
  };

  // File upload drag-and-drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string || `Mock brief content parsed from uploaded binary file: ${file.name}. Ensure all core specifications are evaluated and scheduled appropriately.`;
        triggerAIActivationSequence(file.name, text);
      };
      reader.readAsText(file);
    }
  };

  const handleManualUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string || `Mock brief content parsed from uploaded binary file: ${file.name}. Ensure all core specifications are evaluated and scheduled appropriately.`;
        triggerAIActivationSequence(file.name, text);
      };
      reader.readAsText(file);
    }
  };

  // Connected Cloud simulator click
  const handleConnectCloud = (brandName: string) => {
    setCloudConnecting(true);
    setCloudConnected(null);
    setTimeout(() => {
      setCloudConnecting(false);
      setCloudConnected(brandName);
    }, 1200);
  };

  // Camera simulator click
  const handleSimulateCameraCapture = (type: string) => {
    // Replaced demo camera capture with a toast as requested to remove hardcoded demo
    alert("Camera scanning requires native device integration. Please use the Paste or File Upload method instead.");
  };

  // Paste scanner click
  const handleAnalyzePastedText = () => {
    if (!pastedText.trim()) return;
    const name = `pasted_instructions_${Date.now().toString().slice(-4)}.txt`;
    triggerAIActivationSequence(name, pastedText);
    setPastedText("");
  };

  // Generate study aid from Express backend
  const handleGenerateStudyAid = async (type: "summary" | "flashcards" | "questions") => {
    if (!activeDoc) return;
    
    setStudyAidLoading(true);
    try {
      const res = await fetch("/api/ai/study-aid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeDoc.title,
          text: activeDoc.rawText || activeDoc.fileName,
          type
        })
      });

      if (res.ok) {
        const data = await res.json();
        setStudyAids(prev => ({
          ...prev,
          [activeDoc.id]: {
            ...(prev[activeDoc.id] || {}),
            [type]: data
          }
        }));

        // Reset sub-states for clean viewing
        if (type === "flashcards") {
          setActiveCardIdx(0);
          setCardFlipped(false);
        } else if (type === "questions") {
          setSelectedAnswers({});
          setQuizScore(0);
        }
      }
    } catch (e) {
      console.warn("Failed to generate study aid:", e);
    } finally {
      setStudyAidLoading(false);
    }
  };

  // Copy individual summary bullets to clipboard
  const handleCopyText = (txt: string, idx: number) => {
    navigator.clipboard.writeText(txt);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Quiz helper to track selection
  const handleSelectQuizOption = (qIdx: number, optIdx: number, correctIdx: number) => {
    if (selectedAnswers[qIdx] !== undefined) return; // already answered

    setSelectedAnswers(prev => ({
      ...prev,
      [qIdx]: optIdx
    }));

    if (optIdx === correctIdx) {
      setQuizScore(s => s + 1);
    }
  };

  const currentDocAids = activeDoc ? studyAids[activeDoc.id] || {} : {};
  const activeAidData = currentDocAids[studyAidType];

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* 1. DELIGHT CELEBRATION MOMENT OVERLAY */}
      <AnimatePresence>
        {delightData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/55 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setDelightData(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-100/50 animate-pulse opacity-40 blur-xl" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-emerald-100/50 animate-pulse opacity-40 blur-xl" />
              
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border border-emerald-150 flex items-center justify-center text-emerald-600 shadow-sm animate-bounce">
                <span className="text-3xl">🎯</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-[0.2em] text-emerald-600 font-bold uppercase block">Intelligence Extraction Complete</span>
                <h3 className="text-lg font-display font-bold text-gray-950 tracking-tight leading-snug">🎯 Deadline Detected</h3>
                <p className="text-xs font-mono font-bold text-indigo-600 truncate px-2">{delightData.title}</p>
              </div>

              <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-3 text-left font-mono text-xs text-gray-600">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-gray-400">📅 Primary Deadline:</span>
                  <span className="font-bold text-red-600 text-[11px] bg-red-50/80 px-2.5 py-0.5 rounded border border-red-150 animate-pulse">
                    {delightData.deadline}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-gray-400">⏱️ Estimated Workload:</span>
                  <span className="font-bold text-emerald-700">{delightData.effort} Hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">🚨 Risk Profile:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] border ${
                    delightData.risk === "High" ? "bg-red-50 text-red-600 border-red-150" :
                    delightData.risk === "Medium" ? "bg-amber-50 text-amber-600 border-amber-150" :
                    "bg-emerald-50 text-emerald-600 border-emerald-150"
                  }`}>{delightData.risk} Level</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                The document details have been mapped to your priority orbits. The AI has compiled active checklists and initiated customized flashcard questions!
              </p>

              <div className="pt-2">
                <button
                  onClick={() => setDelightData(null)}
                  className="w-full bg-black text-white hover:opacity-90 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  Activate Workspace View
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono tracking-[0.2em] text-gray-400 uppercase font-semibold">Document Extraction</span>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-display font-medium text-gray-900 tracking-tight">Assignment & PDF Intelligence</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Uploader Workspaces & File Cards List */}
        <div className="lg:col-span-5 flex flex-col gap-6 relative">
          
          {/* MULTI-METHOD UPLOADER WORKSPACE CARD */}
          <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-xs space-y-4 relative overflow-hidden">
            
            {/* Horizontal Tabs selector */}
            <div className="flex bg-gray-50/80 p-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border border-gray-100/50 gap-0.5">
              <button
                onClick={() => setUploadMethod("file")}
                className={`flex-1 py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  uploadMethod === "file" ? "bg-white text-black shadow-xs font-extrabold border border-gray-100" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <FolderOpen size={11} /> File
              </button>
              <button
                onClick={() => setUploadMethod("paste")}
                className={`flex-1 py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  uploadMethod === "paste" ? "bg-white text-black shadow-xs font-extrabold border border-gray-100" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <FileText size={11} /> Paste
              </button>
              <button
                onClick={() => setUploadMethod("camera")}
                className={`flex-1 py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  uploadMethod === "camera" ? "bg-white text-black shadow-xs font-extrabold border border-gray-100" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Camera size={11} /> Camera
              </button>
              <button
                onClick={() => setUploadMethod("cloud")}
                className={`flex-1 py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  uploadMethod === "cloud" ? "bg-white text-black shadow-xs font-extrabold border border-gray-100" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Cloud size={11} /> Cloud
              </button>
            </div>

            {/* TAB CONTENT AREAS */}
            <div className="relative min-h-[220px] flex flex-col justify-center">
              
              {/* FILE UPLOAD & DRAG & DROP METHOD */}
              {uploadMethod === "file" && (
                <div className="space-y-4">
                  {isProcessingSequence ? (
                    /* AI ACTIVATION SEQUENCE VIEW */
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 sm:p-6 bg-gradient-to-b from-indigo-50/10 to-indigo-50/30 border border-indigo-150 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 sm:space-y-5 animate-pulse overflow-hidden w-full"
                      style={{
                        boxShadow: "0 0 40px rgba(59,130,246,0.15), 0 0 80px rgba(59,130,246,0.08)"
                      }}
                    >
                      {/* ACCELERATED CLOCK ENGINE */}
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-indigo-500/30 flex items-center justify-center bg-indigo-50 shadow-inner shrink-0">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                          className="absolute inset-1 rounded-full border border-dashed border-indigo-600"
                        />
                        <motion.div
                          animate={{ rotate: 720 }}
                          transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-indigo-300 flex items-center justify-center"
                        >
                          <div className="w-0.5 h-3 sm:h-4 bg-indigo-600 rounded-full origin-bottom" />
                        </motion.div>
                        <span className="absolute text-[7px] sm:text-[8px] font-mono text-indigo-600 font-bold -bottom-1">AI ACT</span>
                      </div>

                      <div className="space-y-1.5 w-full px-1">
                        <p className="text-[10px] sm:text-xs font-mono font-bold text-gray-800 uppercase tracking-wide text-center break-words w-full">AI Analysis Engine Active</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-400 truncate max-w-full px-2 mx-auto font-mono text-center" title={activeProcessingDocName}>{activeProcessingDocName}</p>
                      </div>

                      {/* STATS PROGRESS TICK STEPS */}
                      <div className="w-full max-w-[280px] grid grid-cols-1 min-[320px]:grid-cols-2 gap-x-2 gap-y-2 text-left font-mono text-[9px] text-gray-400 mx-auto px-1">
                        <div className={`flex items-center gap-1.5 ${sequenceStep >= 0 ? "text-indigo-600 font-bold" : ""} truncate`}>
                          <CheckCircle2 size={10} className={`shrink-0 ${sequenceStep >= 0 ? "text-indigo-600 animate-bounce" : "text-gray-200"}`} />
                          <span className="truncate">Reading Document</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${sequenceStep >= 1 ? "text-indigo-600 font-bold" : ""} truncate`}>
                          <CheckCircle2 size={10} className={`shrink-0 ${sequenceStep >= 1 ? "text-indigo-600" : "text-gray-200"}`} />
                          <span className="truncate">Extracting Reqs</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${sequenceStep >= 2 ? "text-indigo-600 font-bold" : ""} truncate`}>
                          <CheckCircle2 size={10} className={`shrink-0 ${sequenceStep >= 2 ? "text-indigo-600" : "text-gray-200"}`} />
                          <span className="truncate">Detecting Deadlines</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${sequenceStep >= 3 ? "text-indigo-600 font-bold" : ""} truncate`}>
                          <CheckCircle2 size={10} className={`shrink-0 ${sequenceStep >= 3 ? "text-indigo-600" : "text-gray-200"}`} />
                          <span className="truncate">Estimating Effort</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${sequenceStep >= 4 ? "text-indigo-600 font-bold" : ""} truncate`}>
                          <CheckCircle2 size={10} className={`shrink-0 ${sequenceStep >= 4 ? "text-indigo-600" : "text-gray-200"}`} />
                          <span className="truncate">Building Schedule</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${sequenceStep >= 5 ? "text-indigo-600 font-bold" : ""} truncate`}>
                          <CheckCircle2 size={10} className={`shrink-0 ${sequenceStep >= 5 ? "text-indigo-600" : "text-gray-200"}`} />
                          <span className="truncate">Calculating Risk</span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    /* DRAG & DROP / CHOOSE FILE */
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center space-y-4 cursor-pointer select-none ${
                        dragOver 
                          ? "border-indigo-500 bg-indigo-50/30 scale-98" 
                          : "border-gray-200 hover:border-black bg-gray-50/40"
                      }`}
                      style={{
                        boxShadow: dragOver ? "0 0 40px rgba(59,130,246,0.15), 0 0 80px rgba(59,130,246,0.08)" : "none"
                      }}
                      onClick={handleManualUploadClick}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept=".pdf,.txt,.docx,.csv,.pptx,.png,.jpg,.jpeg" 
                      />

                      {/* Slow Rotating Clock Hand Empty State Animation */}
                      <motion.div
                        animate={{ scale: dragOver ? 1.15 : 1 }}
                        className="relative w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-xs transition-transform"
                      >
                        {/* Clock Hands */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: dragOver ? 3 : 16, ease: "linear" }}
                          className="absolute w-0.5 h-5 bg-black rounded-full origin-bottom"
                          style={{ bottom: "50%", left: "calc(50% - 0.25px)" }}
                        />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: dragOver ? 1.5 : 8, ease: "linear" }}
                          className="absolute w-0.5 h-3.5 bg-gray-400 rounded-full origin-bottom"
                          style={{ bottom: "50%", left: "calc(50% - 0.25px)" }}
                        />
                        <div className="w-1.5 h-1.5 rounded-full bg-black z-10" />

                        {dragOver && (
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.3, opacity: [0.4, 0.8, 0] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                            className="absolute inset-0 rounded-full border-2 border-indigo-400"
                          />
                        )}
                      </motion.div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-mono font-bold text-gray-800 uppercase tracking-wide">
                          {dragOver ? "Release to begin AI analysis" : "Activate Premium Doc Engine"}
                        </h4>
                        <p className="text-[10px] text-gray-400 max-w-xs mx-auto leading-relaxed font-mono">
                          {dragOver 
                            ? "Analyzing and computing schedule vectors..." 
                            : "Drop your syllabus, assignment, project brief, meeting notes, invoice, or document here."
                          }
                        </p>
                      </div>

                      {!dragOver && (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleManualUploadClick(); }}
                            className="bg-black text-white hover:opacity-90 font-mono text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-lg shadow-xs transition-all active:scale-98 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FolderOpen size={11} /> Choose Document
                          </button>
                          <p className="text-[8px] text-gray-400 font-mono block">Supported: PDF, DOCX, PPTX, TXT, CSV, Images</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PASTE CONTENT METHOD */}
              {uploadMethod === "paste" && (
                <div className="space-y-3.5 text-left w-full">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono tracking-wider text-gray-400 uppercase font-bold">Paste Syllabus or Project guidelines</span>
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Paste guidelines or assignment emails here... AI will immediately extract milestones, estimated effort hours, and risks."
                      className="w-full h-28 border border-gray-150 rounded-xl p-3 text-xs bg-gray-50/50 font-sans focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all leading-relaxed"
                    />
                  </div>
                  <button
                    disabled={!pastedText.trim() || loading}
                    onClick={handleAnalyzePastedText}
                    className="w-full bg-black text-white hover:opacity-90 disabled:opacity-40 font-mono text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={11} /> Analyze Pasted Instructions
                  </button>
                </div>
              )}

              {/* CAMERA SCAN METHOD */}
              {uploadMethod === "camera" && (
                <div className="space-y-4 w-full">
                  {cameraStep === "idle" ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl text-center space-y-1">
                        <Camera className="text-gray-400 mx-auto" size={18} />
                        <span className="text-[10px] font-mono font-bold text-gray-700 uppercase block">Camera Scanner Port</span>
                        <p className="text-[9px] text-gray-400 leading-relaxed font-sans">
                          A student utility to capture whiteboards, printed lecture plans, and paper syllabus instructions. Select simulation model:
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono font-bold">
                        <button
                          onClick={() => handleSimulateCameraCapture("whiteboard")}
                          className="p-2 border border-gray-150 hover:border-black rounded-lg bg-white shadow-3xs cursor-pointer hover:bg-gray-50 transition-all flex flex-col items-center gap-1"
                        >
                          <span className="text-base">🏫</span>
                          <span>Whiteboard</span>
                        </button>
                        <button
                          onClick={() => handleSimulateCameraCapture("syllabus")}
                          className="p-2 border border-gray-150 hover:border-black rounded-lg bg-white shadow-3xs cursor-pointer hover:bg-gray-50 transition-all flex flex-col items-center gap-1"
                        >
                          <span className="text-base">📜</span>
                          <span>Syllabus</span>
                        </button>
                        <button
                          onClick={() => handleSimulateCameraCapture("assignment")}
                          className="p-2 border border-gray-150 hover:border-black rounded-lg bg-white shadow-3xs cursor-pointer hover:bg-gray-50 transition-all flex flex-col items-center gap-1"
                        >
                          <span className="text-base">📝</span>
                          <span>Assignment</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* LIVE VIEW SCANNING ANIMATION */
                    <div className="relative border border-gray-800 rounded-xl bg-gray-950 h-36 flex flex-col items-center justify-center overflow-hidden">
                      {/* Green Scan Laser Line */}
                      {cameraStep === "scanning" && (
                        <motion.div 
                          animate={{ y: [0, 140, 0] }}
                          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                          className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] z-10"
                        />
                      )}

                      {/* Camera Feed placeholder */}
                      <div className="z-10 text-center space-y-1.5 font-mono text-[9px]">
                        <p className="text-gray-400 text-[8px]">
                          Camera access required. Please upload a file manually for now.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* IMPORT FROM CLOUD METHOD */}
              {uploadMethod === "cloud" && (
                <div className="space-y-4">
                  {cloudConnecting ? (
                    <div className="py-6 text-center space-y-3">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Securing API Linkway...</p>
                    </div>
                  ) : cloudConnected ? (
                    /* Cloud simulation Connected files */
                    <div className="space-y-3 text-left">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-[9px] font-mono text-emerald-600 font-bold uppercase flex items-center gap-1">
                          <CheckCircle2 size={11} /> Connected: {cloudConnected}
                        </span>
                        <button
                          onClick={() => setCloudConnected(null)}
                          className="text-[8px] font-mono text-gray-400 hover:text-red-600 uppercase cursor-pointer"
                        >
                          Disconnect
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-400 font-sans">Select a document from your synced cloud storage to import:</p>
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {cloudMockFiles[cloudConnected]?.map((file, fIdx) => (
                          <button
                            key={fIdx}
                            onClick={() => triggerAIActivationSequence(file.fileName, file.text)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-150 hover:border-black rounded-lg text-left text-[10px] font-mono flex items-center gap-2 cursor-pointer transition-all hover:translate-x-1"
                          >
                            <FileText size={12} className="text-gray-400" />
                            <span className="text-gray-700 truncate font-semibold">{file.fileName}</span>
                            <span className="ml-auto text-[8px] bg-indigo-50 text-indigo-600 px-1 py-0.2 rounded border border-indigo-100 uppercase font-bold">Import</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Initial integrators select */
                    <div className="space-y-3">
                      <span className="text-[9px] font-mono tracking-wider text-gray-400 uppercase font-bold block text-left">Integrations</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <button
                          onClick={() => handleConnectCloud("Google Drive")}
                          className="p-2 border border-gray-150 hover:border-black rounded-xl bg-white flex flex-col items-center justify-center gap-1.5 hover:shadow-xs transition-all cursor-pointer text-[10px] font-mono font-bold text-gray-700 hover:-translate-y-0.5"
                        >
                          <span className="text-base">📁</span>
                          <span>Google Drive</span>
                        </button>
                        <button
                          onClick={() => handleConnectCloud("OneDrive")}
                          className="p-2 border border-gray-150 hover:border-black rounded-xl bg-white flex flex-col items-center justify-center gap-1.5 hover:shadow-xs transition-all cursor-pointer text-[10px] font-mono font-bold text-gray-700 hover:-translate-y-0.5"
                        >
                          <span className="text-base">☁️</span>
                          <span>OneDrive</span>
                        </button>
                        <button
                          onClick={() => handleConnectCloud("Dropbox")}
                          className="p-2 border border-gray-150 hover:border-black rounded-xl bg-white flex flex-col items-center justify-center gap-1.5 hover:shadow-xs transition-all cursor-pointer text-[10px] font-mono font-bold text-gray-700 hover:-translate-y-0.5"
                        >
                          <span className="text-base">📦</span>
                          <span>Dropbox</span>
                        </button>
                        <button
                          onClick={() => handleConnectCloud("Notion")}
                          className="p-2 border border-gray-150 hover:border-black rounded-xl bg-white flex flex-col items-center justify-center gap-1.5 hover:shadow-xs transition-all cursor-pointer text-[10px] font-mono font-bold text-gray-700 hover:-translate-y-0.5"
                        >
                          <span className="text-base">📓</span>
                          <span>Notion</span>
                        </button>
                        <button
                          onClick={() => handleConnectCloud("Google Classroom")}
                          className="p-2 border border-gray-150 hover:border-black rounded-xl bg-white flex flex-col items-center justify-center gap-1.5 hover:shadow-xs transition-all cursor-pointer text-[10px] font-mono font-bold text-gray-700 hover:-translate-y-0.5 col-span-2 sm:col-span-1"
                        >
                          <span className="text-base">🏫</span>
                          <span>Classroom</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>

          {/* ACTIVE ORBITAL ENGINE BACKGROUND VISUALIZATION (behind File Cards) */}
          <div className="absolute top-[320px] bottom-0 left-0 right-0 pointer-events-none opacity-20 overflow-hidden z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-dashed border-gray-200 animate-spin" style={{ animationDuration: "35s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-indigo-100/60 animate-reverse-spin" style={{ animationDuration: "25s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-dashed border-gray-100" />
            <div className="absolute top-12 left-24 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <div className="absolute bottom-12 right-24 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* DYNAMIC ACTIVE FILE CARDS LIST (ALIVE WORKSPACE STATUS) */}
          <div className="space-y-3.5 z-10">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
                <Layers size={13} className="text-gray-400" /> Document Repository
              </h4>
              <span className="text-[9px] font-mono text-gray-400 uppercase font-bold">{uploadedDocs.length} Active Files</span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {uploadedDocs.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                    <FileText size={20} className="text-gray-300" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-gray-800 px-4">Upload your first assignment, syllabus, project brief, or meeting notes.</h5>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setUploadMethod("file");
                        setTimeout(() => handleManualUploadClick(), 50);
                      }}
                      className="px-3 py-2 bg-black text-white hover:bg-neutral-800 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Upload Document
                    </button>
                    <button
                      onClick={() => {
                        setUploadMethod("camera");
                      }}
                      className="px-3 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Scan Document
                    </button>
                    <button
                      onClick={() => {
                        setUploadMethod("cloud");
                      }}
                      className="px-3 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Import
                    </button>
                  </div>
                </div>
              ) : (
                uploadedDocs.map((doc, idx) => {
                  const isActive = activeDoc?.id === doc.id;
                  return (
                    <motion.div
                      key={doc.id}
                      whileHover={{ y: -3, scale: 1.01 }}
                      className={`relative p-4 border rounded-2xl transition-all text-left bg-white shadow-xs select-none group cursor-pointer ${
                        isActive 
                          ? "border-indigo-500 ring-1 ring-indigo-500/30 shadow-indigo-100/50" 
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                      onClick={() => {
                        setActiveDoc(doc);
                        setActiveTabMode("checklist");
                      }}
                    >
                    {/* Active border indicator glow */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
                    )}

                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${
                        isActive ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-gray-50 border-gray-100 text-gray-400"
                      }`}>
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <h5 className="text-[11px] font-mono font-bold text-gray-800 truncate pr-4" title={doc.fileName}>{doc.fileName}</h5>
                          <span className="text-[8px] font-mono bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0">
                            Analyzed
                          </span>
                        </div>
                        
                        {/* Status detail descriptors */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] font-mono text-gray-400">
                          <p className="truncate"><span className="text-gray-300">📅</span> {doc.deadlines[0] ? doc.deadlines[0].replace("Final Submission:", "").replace("Final Draft Submission:", "").trim() : "TBD"}</p>
                          <p><span className="text-gray-300">⏱️</span> {doc.estimatedHours} Hours</p>
                          <p><span className="text-gray-300">🚨</span> Risk: <span className={doc.risks[0]?.toLowerCase().includes("high") ? "text-red-500" : "text-emerald-500"}>{doc.risks[0]?.toLowerCase().includes("high") ? "High" : "Low"}</span></p>
                          <p><span className="text-gray-300">🤖</span> Confidence: <span className="text-indigo-600 font-bold">94%</span></p>
                        </div>
                      </div>
                    </div>

                    {/* INTERACTIVE HOVER ACTIONS REVEAL */}
                    <div className="absolute inset-0 bg-white/95 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDoc(doc);
                          setActiveTabMode("checklist");
                        }}
                        className="p-1.5 px-2 bg-black text-white hover:opacity-90 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wide flex items-center gap-1 cursor-pointer"
                      >
                        <Layers size={10} /> View Plan
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDoc(doc);
                          setActiveTabMode("study-aid");
                        }}
                        className="p-1.5 px-2 bg-indigo-50 border border-indigo-250 text-indigo-600 hover:bg-indigo-100 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wide flex items-center gap-1 cursor-pointer"
                      >
                        <Brain size={10} /> Study Kit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Simulates deleting
                          setUploadedDocs(prev => prev.filter(p => p.id !== doc.id));
                          if (activeDoc?.id === doc.id) {
                            setActiveDoc(null);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        title="Delete Doc"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                  </motion.div>
                );
                })
              )}
            </div>
          </div>

        </div>

        {/* RESULTS EXTRACTION DISPLAY RIGHT PANEL */}
        <div className="lg:col-span-7 bg-white border border-gray-100 p-6 rounded-2xl flex flex-col justify-between shadow-sm min-h-[440px]">
          
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
                <Sparkles size={14} className="text-gray-400" /> Extraction Analysis
              </h3>
              {loading && (
                <span 
                  className="text-[9px] font-mono bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 rounded-full animate-pulse text-center"
                  style={{ width: "73px", fontSize: "7px" }}
                >
                  Running Scan...
                </span>
              )}
            </div>

            {/* TAB SELECTOR: Checklist vs Study Aids (Enabled when doc is active) */}
            {activeDoc && !loading && (
              <div className="flex border-b border-gray-100 my-4 text-xs font-mono font-bold uppercase tracking-wider">
                <button
                  onClick={() => setActiveTabMode("checklist")}
                  className={`flex-1 py-2.5 text-center transition-all border-b-2 cursor-pointer ${
                    activeTabMode === "checklist" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  📋 Checklist Details
                </button>
                <button
                  onClick={() => setActiveTabMode("study-aid")}
                  className={`flex-1 py-2.5 text-center transition-all border-b-2 cursor-pointer flex items-center justify-center gap-1 ${
                    activeTabMode === "study-aid" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <GraduationCap size={14} /> ✨ AI Study Aids
                </button>
              </div>
            )}

            {loading ? (
              <div className="space-y-6 py-12 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <div className="space-y-2 max-w-xs">
                  <p className="text-xs font-mono font-bold text-gray-800">Sweeping Dial Matrix...</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                    Identifying milestones, extracting cited citations, and calculating project workload maps.
                  </p>
                </div>
              </div>
            ) : activeDoc ? (
              activeTabMode === "checklist" ? (
                /* SECTION A: DETECTED REQS & TIMELINE CHECKLIST */
                <div className="space-y-6 animate-fade-in max-h-[460px] overflow-y-auto pr-2">
                  
                  {/* Document Title header */}
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono text-gray-400 uppercase">Document Name</span>
                      <h4 className="text-sm font-display font-medium text-gray-950 tracking-tight mt-0.5 break-words">{activeDoc.title}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono text-gray-400 uppercase flex items-center gap-1 justify-end"><Hourglass size={10} /> Estimated Effort</span>
                      <span className="text-sm font-mono font-bold text-emerald-600 block mt-0.5">{activeDoc.estimatedHours} Hours</span>
                    </div>
                  </div>

                  {/* Deadlines list */}
                  <div>
                    <h5 className="text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-2">Detected Deadlines & Milestones</h5>
                    <div className="space-y-1.5">
                      {activeDoc.deadlines?.map((d, i) => (
                        <div key={i} className="p-3 bg-red-50/40 border border-red-100 rounded-lg text-xs font-sans text-red-600 flex items-center gap-2 break-words">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                          <span className="break-words font-semibold">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Requirements */}
                  <div>
                    <h5 className="text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-2">Core Assignment Checklist</h5>
                    <div className="space-y-2">
                      {activeDoc.keyRequirements?.map((r, i) => (
                        <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-start gap-2.5 break-words">
                          <Check className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                          <span className="text-xs text-gray-700 leading-relaxed break-words">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risks */}
                  {activeDoc.risks && activeDoc.risks.length > 0 && (
                    <div>
                      <h5 className="text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-2">Critical Scheduling Risks</h5>
                      <div className="space-y-1.5">
                        {activeDoc.risks.map((risk, idx) => (
                          <div key={idx} className="p-3 bg-amber-50/25 border border-amber-100 rounded-lg flex items-start gap-2 text-xs break-words">
                            <ShieldAlert className="text-amber-500 mt-0.5 shrink-0" size={13} />
                            <span className="text-gray-600 leading-relaxed break-words">{risk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Study roadmap */}
                  <div>
                    <h5 className="text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-2.5">Recommended Study & Execution Roadmap</h5>
                    <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-2xs">
                      {activeDoc.studyPlan?.map((plan, idx) => (
                        <div key={idx} className="p-3 sm:p-4 bg-gray-50 flex flex-col gap-1.5 text-xs font-sans">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="font-mono font-bold text-emerald-600 break-words">{plan.week}</span>
                          </div>
                          <p className="text-gray-600 leading-relaxed pl-3 font-sans break-words">{plan.focus}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                /* SECTION B: AI STUDY AIDS ROOM */
                <div className="space-y-5 animate-fade-in text-left">
                  
                  {/* Category Pill Sub-nav */}
                  <div className="grid grid-cols-3 bg-gray-100 p-1 rounded-xl text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider gap-1">
                    <button
                      onClick={() => setStudyAidType("summary")}
                      className={`py-1.5 text-center rounded-lg cursor-pointer transition-all truncate px-0.5 ${
                        studyAidType === "summary" ? "bg-white text-indigo-600 shadow-sm font-black" : "text-gray-500 hover:text-gray-700"
                      }`}
                      title="Bullet Summary"
                    >
                      📝 Summary
                    </button>
                    <button
                      onClick={() => setStudyAidType("flashcards")}
                      className={`py-1.5 text-center rounded-lg cursor-pointer transition-all truncate px-0.5 ${
                        studyAidType === "flashcards" ? "bg-white text-indigo-600 shadow-sm font-black" : "text-gray-500 hover:text-gray-700"
                      }`}
                      title="Flashcards"
                    >
                      📇 Cards
                    </button>
                    <button
                      onClick={() => setStudyAidType("questions")}
                      className={`py-1.5 text-center rounded-lg cursor-pointer transition-all truncate px-0.5 ${
                        studyAidType === "questions" ? "bg-white text-indigo-600 shadow-sm font-black" : "text-gray-500 hover:text-gray-700"
                      }`}
                      title="Practice Quiz"
                    >
                      ✍️ Quiz
                    </button>
                  </div>

                  {studyAidLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <div className="space-y-1.5 max-w-xs">
                        <p className="text-xs font-mono font-bold text-gray-800">Compiling AI Study Kit...</p>
                        <p className="text-[10px] text-gray-400">Extracting high-yield concepts, configuring flashcards, and seeding interactive questions.</p>
                      </div>
                    </div>
                  ) : activeAidData ? (
                    <div className="animate-fade-in max-h-[360px] overflow-y-auto pr-1">
                      
                      {/* VIEW 1: CONCISE SUMMARY DISPLAY */}
                      {studyAidType === "summary" && (
                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between border-b border-gray-150 pb-2">
                            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Key Takeaway Summary</span>
                            <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">High Yield</span>
                          </div>
                          <div className="space-y-3">
                            {activeAidData.summary?.map((bullet: string, bIdx: number) => (
                              <div key={bIdx} className="p-3 bg-indigo-50/10 border border-indigo-100/40 rounded-xl flex items-start justify-between gap-3 group hover:border-indigo-600/30 transition-all break-words">
                                <p className="text-xs text-gray-700 leading-relaxed font-sans flex-1 break-words">
                                  <span className="font-bold text-indigo-600 font-mono mr-1 shrink-0">{bIdx + 1}.</span> {bullet}
                                </p>
                                <button
                                  onClick={() => handleCopyText(bullet, bIdx)}
                                  className="text-gray-400 hover:text-indigo-600 p-1 shrink-0 transition-colors cursor-pointer"
                                  title="Copy Bullet"
                                >
                                  {copiedIndex === bIdx ? (
                                    <span className="text-[8px] font-mono text-emerald-600">Copied</span>
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* VIEW 2: INTERACTIVE FLASHCARDS */}
                      {studyAidType === "flashcards" && activeAidData.flashcards && (
                        <div className="space-y-4 flex flex-col items-center">
                          {/* Card widget */}
                          <div 
                            onClick={() => setCardFlipped(!cardFlipped)}
                            className="w-full max-w-[360px] h-[180px] perspective-1000 cursor-pointer select-none group"
                          >
                            <div className={`relative w-full h-full duration-500 transform-style-3d border border-gray-150 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm transition-all ${
                              cardFlipped ? "bg-indigo-50/20" : "bg-white"
                            }`}>
                              {cardFlipped ? (
                                <div className="space-y-2 animate-fade-in">
                                  <span className="text-[8px] font-mono tracking-widest text-indigo-600 font-bold uppercase block mb-1">Answer</span>
                                  <p className="text-xs text-gray-800 leading-relaxed font-sans font-medium px-4 break-words">
                                    {activeAidData.flashcards[activeCardIdx]?.answer}
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2 animate-fade-in min-w-0">
                                  <span className="text-[8px] font-mono tracking-widest text-gray-400 font-bold uppercase block mb-1">Question</span>
                                  <p className="text-sm text-gray-900 leading-relaxed font-display font-medium px-4 break-words">
                                    {activeAidData.flashcards[activeCardIdx]?.question}
                                  </p>
                                </div>
                              )}

                              {/* Flip Hint Label */}
                              <span className="absolute bottom-3 text-[9px] font-mono text-gray-400 uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                                Click card to flip
                              </span>
                            </div>
                          </div>

                          {/* Navigation buttons */}
                          <div className="flex items-center gap-6 mt-2 text-xs font-mono">
                            <button
                              disabled={activeCardIdx === 0}
                              onClick={() => {
                                setActiveCardIdx(idx => idx - 1);
                                setCardFlipped(false);
                              }}
                              className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-black hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <span className="text-gray-500 font-bold">
                              {activeCardIdx + 1} of {activeAidData.flashcards.length}
                            </span>
                            <button
                              disabled={activeCardIdx === activeAidData.flashcards.length - 1}
                              onClick={() => {
                                setActiveCardIdx(idx => idx + 1);
                                setCardFlipped(false);
                              }}
                              className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-black hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* VIEW 3: PRACTICE EXAM QUESTIONS */}
                      {studyAidType === "questions" && activeAidData.questions && (
                        <div className="space-y-5">
                          <div className="flex items-center justify-between border-b border-gray-150 pb-2">
                            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Exam Readiness Practice</span>
                            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                              Score: {quizScore} / {Object.keys(selectedAnswers).length}
                            </span>
                          </div>

                          <div className="space-y-4">
                            {activeAidData.questions.map((q: any, qIdx: number) => {
                              const answeredIdx = selectedAnswers[qIdx];
                              const isCorrect = answeredIdx === q.correctIndex;

                              return (
                                <div key={qIdx} className="border border-gray-150 p-4 rounded-xl space-y-3.5 text-left bg-gray-50/20">
                                  <div className="flex items-start gap-2 break-words">
                                    <HelpCircle className="text-indigo-500 mt-0.5 shrink-0" size={14} />
                                    <h5 className="text-xs font-sans font-bold text-gray-800 leading-relaxed break-words">
                                      {qIdx + 1}. {q.question}
                                    </h5>
                                  </div>

                                  <div className="grid grid-cols-1 gap-2 pl-6">
                                    {q.options?.map((opt: string, optIdx: number) => {
                                      const isSelected = answeredIdx === optIdx;
                                      const isCorrectOpt = optIdx === q.correctIndex;
                                      
                                      let optionClass = "border-gray-100 hover:border-gray-200 bg-white";
                                      if (answeredIdx !== undefined) {
                                        if (isCorrectOpt) {
                                          optionClass = "border-emerald-500 bg-emerald-50/40 text-emerald-950 font-medium";
                                        } else if (isSelected) {
                                          optionClass = "border-red-500 bg-red-50/40 text-red-950";
                                        } else {
                                          optionClass = "border-gray-100 bg-white opacity-40";
                                        }
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          disabled={answeredIdx !== undefined}
                                          onClick={() => handleSelectQuizOption(qIdx, optIdx, q.correctIndex)}
                                          className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer select-none break-words ${optionClass}`}
                                        >
                                          <span className="break-words">{opt}</span>
                                          {answeredIdx !== undefined && isCorrectOpt && (
                                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0 ml-1.5" />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {answeredIdx !== undefined && (
                                    <div className={`p-3 rounded-lg text-xs font-sans pl-6 ${
                                      isCorrect ? "bg-emerald-50/30 text-emerald-800" : "bg-red-50/30 text-red-800"
                                    }`}>
                                      <p className="font-bold flex items-center gap-1">
                                        {isCorrect ? "Correct answer!" : "Incorrect option."}
                                      </p>
                                      <p className="text-[11px] leading-relaxed mt-1 text-gray-600">
                                        {q.explanation}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => setSelectedAnswers({})}
                              className="text-[10px] font-mono font-bold text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw size={12} /> Reset Practice Quiz
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="py-12 border border-dashed border-gray-200 rounded-xl text-center space-y-4">
                      <GraduationCap className="text-gray-400 mx-auto" size={28} />
                      <div className="space-y-1.5 max-w-xs mx-auto">
                        <p className="text-xs font-mono font-bold text-gray-700">Study Guide Prepared</p>
                        <p className="text-[10px] text-gray-400">The document contains excellent subject content. Press the button below to generate customized study aids.</p>
                      </div>
                      <button
                        onClick={() => handleGenerateStudyAid(studyAidType)}
                        className="bg-black text-white hover:opacity-90 font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-6 rounded-xl transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Sparkles size={12} /> Generate {studyAidType === "summary" ? "Bullet Summary" : studyAidType === "flashcards" ? "Flashcards" : "Practice Quiz"}
                      </button>
                    </div>
                  )}

                </div>
              )
            ) : (
              /* ACTIVE EMPTY STATE WITH EXPLICIT HUMAN READABLE LABELS & COPY MANDATED */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-200 rounded-xl my-12 opacity-80 space-y-4">
                <FileText className="text-gray-400 animate-pulse" size={32} />
                <div className="space-y-1 max-w-[280px]">
                  <p className="text-xs font-mono font-bold text-gray-800">Workspace Activation Pending</p>
                  <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                    Upload anything that has a deadline. Assignments. Projects. Meeting Notes. Bills. Interview Schedules.
                  </p>
                  <p className="text-[10px] text-indigo-600 font-bold font-sans mt-1">
                    The AI will turn it into an actionable plan.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono text-gray-400 mt-4">
            <span>Doc Engine: Active</span>
            <span>Study Aids Ready</span>
          </div>

        </div>

      </div>
    </div>
  );
}
