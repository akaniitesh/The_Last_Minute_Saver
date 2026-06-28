import React, { useState, useEffect, useRef, FormEvent } from "react";
import { VoiceMessage, Task, ScannedDoc } from "../types";
import { 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  Upload, 
  AlertCircle, 
  Copy,
  CheckCircle2, 
  FileText, 
  ShieldAlert, 
  Clock, 
  Zap, 
  Check, 
  Plus, 
  FileCheck,
  HelpCircle,
  Calendar,
  Layers
} from "lucide-react";

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
  tasks,
  scannedDocs,
  onAddScannedDoc,
  onAddTask,
  initialQuery,
  onClearInitialQuery,
  miloStatus = "Ready",
  onSetMiloStatus,
  lastActiveTab
}: VoiceTabProps) {
  // Execute initial query from Guidance Tab if available
  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery);
      if (onClearInitialQuery) {
        onClearInitialQuery();
      }
    }
  }, [initialQuery]);

  // Conversational Messages with natural name-greeting
  const [messages, setMessages] = useState<VoiceMessage[]>(() => {
    const userName = localStorage.getItem("set_acc_name") || "Nitesh";
    return [
      {
        id: "greeting",
        sender: "assistant",
        text: `Hello ${userName} 👋 What would you like me to help you with today? Ask me to plan your day, analyze your syllabus, check medicine reminders, or help with placement preparation.`,
        timestamp: new Date()
      }
    ];
  });

  // Dynamic Suggestion Chips
  const [dynamicChips, setDynamicChips] = useState<Array<{ label: string; cmd: string }>>([]);

  useEffect(() => {
    if (lastActiveTab === "scanner") {
      setDynamicChips([
        { label: "📖 Summarize Syllabus", cmd: "What is in my syllabus?" },
        { label: "📄 Extract Deadlines", cmd: "Extract deadlines from my syllabus" },
        { label: "📚 Explain a Topic", cmd: "Explain a topic" },
        { label: "🎯 What should I do next?", cmd: "What should I do next?" }
      ]);
    } else if (lastActiveTab === "success_planner") {
      setDynamicChips([
        { label: "💼 Placement Preparation", cmd: "Help me get placed" },
        { label: "📈 Semester Roadmap", cmd: "Plan my semester" },
        { label: "🎯 What should I do next?", cmd: "What should I do next?" },
        { label: "📅 Plan My Day", cmd: "Plan my day" }
      ]);
    } else if (lastActiveTab === "smart_map") {
      setDynamicChips([
        { label: "📍 Navigate Somewhere", cmd: "I need to go to the bank" },
        { label: "⏰ Best departure time", cmd: "What is the best departure time?" },
        { label: "📅 Plan My Day", cmd: "Plan my day" }
      ]);
    } else if (lastActiveTab === "medicine") {
      setDynamicChips([
        { label: "💊 Next medicine dose", cmd: "When is my next medicine?" },
        { label: "⏰ Create medical reminder", cmd: "Create a medicine reminder after dinner" },
        { label: "📅 Plan My Day", cmd: "Plan my day" }
      ]);
    } else {
      setDynamicChips([
        { label: "📅 Plan My Day", cmd: "Plan my day" },
        { label: "🎯 What should I do next?", cmd: "What should I do next?" },
        { label: "💊 Medicine Reminder", cmd: "When is my next medicine?" },
        { label: "📅 Upcoming Deadlines", cmd: "Show my upcoming deadlines" },
        { label: "🧠 Ask Anything", cmd: "Ask anything" }
      ]);
    }
  }, [lastActiveTab]);

  // Input States
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  // Milo's Embedded Concept Explainer States
  const [explainQuery, setExplainQuery] = useState("");
  const [explainLevel, setExplainLevel] = useState<"Beginner" | "Student" | "Professional" | "Expert">("Student");
  const [explainResult, setExplainResult] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);
  const [isExplainerSpeaking, setIsExplainerSpeaking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleExplainConcept = async () => {
    if (!explainQuery.trim()) return;
    setExplainLoading(true);
    setExplainResult("");
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: explainQuery, level: explainLevel }),
      });
      const data = await res.json();
      if (data.text) {
        setExplainResult(data.text);
      } else {
        setExplainResult("Could not generate explanation.");
      }
    } catch (e) {
      console.error("Explain error:", e);
      setExplainResult("Error connecting to server. Please try again.");
    } finally {
      setExplainLoading(false);
    }
  };

  const handleSpeakExplanation = () => {
    if (!explainResult) return;
    if (isExplainerSpeaking) {
      window.speechSynthesis.cancel();
      setIsExplainerSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(explainResult);
    utterance.onend = () => setIsExplainerSpeaking(false);
    utterance.onerror = () => setIsExplainerSpeaking(false);
    setIsExplainerSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyExplanation = () => {
    if (!explainResult) return;
    navigator.clipboard.writeText(explainResult);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Real-time Audio Stream References
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Real-time audio waveform level
  const [voiceIntensity, setVoiceIntensityLocal] = useState(0);

  // Live speech-to-text transcripts
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalSpeechTranscript, setFinalSpeechTranscript] = useState("");

  // Scroll target for chat stream
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages or listening state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isListening, interimTranscript]);

  // Handle speaking visual feedback
  useEffect(() => {
    let interval: any = null;
    if (isSpeaking) {
      interval = setInterval(() => {
        // Create natural-looking fluctuations for vocal waveforms
        const randIntensity = Math.floor(Math.random() * 55) + 30;
        setVoiceIntensityLocal(randIntensity);
        onSetVoiceIntensity(randIntensity);
      }, 85);
    } else if (!isListening) {
      setVoiceIntensityLocal(0);
      onSetVoiceIntensity(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpeaking, isListening]);

  // Handle stage transitions during loading states
  useEffect(() => {
    let interval: any = null;
    if (loading) {
      const stages = [
        "Understanding request...",
        "Analyzing uploaded documents...",
        "Extracting deadlines...",
        "Generating plan...",
        "Optimizing schedule...",
        "Finalizing response..."
      ];
      let idx = 0;
      setLoadingStage(stages[0]);
      interval = setInterval(() => {
        idx = (idx + 1) % stages.length;
        setLoadingStage(stages[idx]);
      }, 1100);
    } else {
      setLoadingStage("");
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  // Synchronize dynamic Milo status with parent state
  useEffect(() => {
    if (!onSetMiloStatus) return;
    if (isListening) {
      onSetMiloStatus("Listening");
    } else if (loading) {
      if (loadingStage.includes("Understanding") || loadingStage.includes("Analyzing")) {
        onSetMiloStatus("Thinking");
      } else if (loadingStage.includes("Generating") || loadingStage.includes("Optimizing") || loadingStage.includes("Finalizing")) {
        onSetMiloStatus("Planning");
      } else {
        onSetMiloStatus("Executing");
      }
    } else if (isSpeaking) {
      onSetMiloStatus("Executing");
    } else {
      onSetMiloStatus("Ready");
    }
  }, [isListening, loading, loadingStage, isSpeaking, onSetMiloStatus]);

  // Web Speech Synthesis
  const speakText = (text: string) => {
    if (!soundEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop any active speaker
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Premium") || v.name.includes("Natural"));
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }
    
    utterance.rate = 1.05; // Slightly rapid, professional speed
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      onSetClockState("pulse");
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      onSetClockState("pulse");
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Web Speech Recognition Initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setErrorText(null);
        onSetClockState("pulse");
        startAudioAnalysis();
      };

      rec.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          setFinalSpeechTranscript(prev => prev + " " + final);
          setInputText(prev => (prev ? prev + " " : "") + final);
        }
        setInterimTranscript(interim);
      };

      rec.onerror = (e: any) => {
        if (e.error === "aborted" || e.error === "no-speech" || e.error === "network") {
          return;
        }
        console.warn("Speech recognition event:", e.error || e);
        if (e.error === "not-allowed") {
          setErrorText("Microphone permission denied by browser settings. Please type your queries.");
        } else {
          setErrorText(`Audio capture failed: ${e.error}. Please try again.`);
        }
        setIsListening(false);
        stopAudioAnalysis();
      };

      rec.onend = () => {
        setIsListening(false);
        stopAudioAnalysis();
      };

      recognitionRef.current = rec;
    }

    return () => {
      stopAudioAnalysis();
    };
  }, []);

  // Real-time Microphone Capture Waveform Analysis
  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyser.fftSize = 64;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const update = () => {
        if (!audioStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Map 0-128 avg to 0-100% intensity
        const intensity = Math.min(100, Math.round((average / 100) * 100));
        setVoiceIntensityLocal(intensity);
        onSetVoiceIntensity(intensity);
        animationFrameRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (err) {
      console.warn("Real microphone access blocked or denied. Running simulation waveform.", err);
      // Beautiful simulation fallback
      let direction = 1;
      let amplitude = 20;
      const interval = setInterval(() => {
        amplitude += (Math.random() * 15 + 4) * direction;
        if (amplitude > 80) direction = -1;
        if (amplitude < 15) direction = 1;
        setVoiceIntensityLocal(Math.round(amplitude));
        onSetVoiceIntensity(Math.round(amplitude));
      }, 75);
      (window as any).tabWaveformInterval = interval;
    }
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if ((window as any).tabWaveformInterval) {
      clearInterval((window as any).tabWaveformInterval);
      (window as any).tabWaveformInterval = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setVoiceIntensityLocal(0);
    onSetVoiceIntensity(0);
  };

  const handleToggleVoiceInput = async () => {
    window.speechSynthesis.cancel(); // Stop AI speaking if user interrupts
    setIsSpeaking(false);

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      stopAudioAnalysis();

      // Submit final captured transcript automatically if non-empty
      const speechToSend = (finalSpeechTranscript + " " + interimTranscript).trim();
      if (speechToSend) {
        handleSendMessage(speechToSend);
        setInputText("");
      }
      setFinalSpeechTranscript("");
      setInterimTranscript("");
    } else {
      setErrorText(null);
      setFinalSpeechTranscript("");
      setInterimTranscript("");

      // Explicit browser permission prompt
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        if (recognitionRef.current) {
          recognitionRef.current.start();
        } else {
          // Absolute fallback if speech API is unavailable
          const fallbackQuery = prompt("Speech Recognition API is blocked or unsupported in this frame. Type your query:");
          if (fallbackQuery) {
            handleSendMessage(fallbackQuery);
          }
        }
      } catch (err: any) {
        console.warn("Microphone permission denied:", err);
        setErrorText("Permission Denied: Microphone access is required for voice interaction. Please use the text input below.");
      }
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleSendMessage(inputText);
    setInputText("");
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: VoiceMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setErrorText(null);

    try {
      const medications = JSON.parse(localStorage.getItem("saver_medications") || "[]");
      const calendarEvents = JSON.parse(localStorage.getItem("saver_calendar_events") || "[]");
      const successPlans = JSON.parse(localStorage.getItem("ai_success_plans") || "[]");
      const focusStats = JSON.parse(localStorage.getItem("planner_focus_stats") || "[]");
      const scannedEvents = JSON.parse(localStorage.getItem("ai_scanned_events_v2") || "[]");
      const goals = JSON.parse(localStorage.getItem("saver_goals") || "[]");
      const habits = JSON.parse(localStorage.getItem("saver_habits") || "[]");
      const notifications = JSON.parse(localStorage.getItem("saver_notifications") || "[]");

      const location = {
        city: localStorage.getItem("saver_city") || undefined,
        country: localStorage.getItem("saver_country") || undefined,
        state: localStorage.getItem("saver_state") || undefined,
        latitude: localStorage.getItem("saver_latitude") || undefined,
        longitude: localStorage.getItem("saver_longitude") || undefined,
        timezone: localStorage.getItem("saver_timezone") || undefined,
      };

      const travel = {
        modeType: localStorage.getItem("saver_travel_mode_type") || undefined,
        homeCountry: localStorage.getItem("saver_travel_home_country") || undefined,
        currentLocalCountry: localStorage.getItem("saver_travel_current_local_country") || undefined,
      };

      const userName = localStorage.getItem("set_acc_name") || "Nitesh";

      const response = await fetch("/api/ai/voice-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          context: {
            tasks,
            scannedDocs,
            isRescueMode: tasks.some(t => (t.riskScore || 0) > 80),
            activeWorkspace: lastActiveTab || "dashboard",
            currentTime: new Date().toLocaleString(),
            userName,
            medications,
            calendarEvents,
            successPlans,
            focusStats,
            scannedEvents,
            goals,
            habits,
            notifications,
            location,
            travel,
            pastConversations: messages.slice(-6).map(m => ({ sender: m.sender, text: m.text }))
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMsg: VoiceMessage = {
          id: `ai-${Date.now()}`,
          sender: "assistant",
          text: data.transcript,
          timestamp: new Date(),
          reasoning: data.reasoning,
          generatedPlan: data.generatedPlan,
          priorityList: data.priorityList,
          timeline: data.timeline,
          riskAssessment: data.riskAssessment,
          recommendedActions: data.recommendedActions
        };

        setMessages(prev => [...prev, assistantMsg]);
        
        // Execute task creation action if returned
        if (data.actionType === "create_task" && data.actionPayload && onAddTask) {
          const payload = data.actionPayload;
          const mappedPriority = (payload.priority?.toLowerCase() === "high" ? "high" : payload.priority?.toLowerCase() === "low" ? "low" : "medium") as "high" | "medium" | "low";
          const mappedCategory = (payload.category || "Do Today") as any;
          const newTask: Task = {
            id: `task-${Date.now()}`,
            title: payload.title || "New Verbal Task",
            deadline: payload.deadline || "Today",
            priority: mappedPriority,
            category: mappedCategory,
            notes: payload.notes || "Added verbally via Milo Voice Chief of Staff",
            isCompleted: false,
            isArchived: false
          };
          onAddTask(newTask);
        }

        // Handle dynamically returned suggested chips
        if (data.suggestedChips && data.suggestedChips.length > 0) {
          setDynamicChips(data.suggestedChips);
        }

        // Calibrate interactive visual clock mode
        if (data.clockTrigger) {
          onSetClockState(data.clockTrigger);
        }

        // Voice output
        speakText(data.transcript);
      } else {
        throw new Error("Critical engine communication failure");
      }
    } catch (err: any) {
      console.warn("API Error:", err);
      setErrorText("Execution Difficulties: Failed to communicate with Chief-of-Staff core. Retrying fallback routing...");
      
      // Highly supportive offline fallback response to guarantee interaction
      setTimeout(() => {
        let textDetected = text.toLowerCase();
        let actionMsg = "";
        
        if ((textDetected.includes("add") || textDetected.includes("create") || textDetected.includes("remind") || textDetected.includes("task") || textDetected.includes("todo")) && onAddTask) {
          let title = "Verbal Task Reminder";
          let category = "Do Today" as any;
          let priority = "medium" as any;
          let deadline = "Tomorrow";

          const match = text.match(/(?:add|create|remind me to)\s+(?:a\s+)?(?:task\s+to\s+)?([^,.]+)/i);
          if (match && match[1]) {
            title = match[1].trim();
            if (title.toLowerCase().includes("tomorrow")) {
              title = title.replace(/tomorrow/i, "").trim();
              deadline = "Tomorrow";
            } else if (title.toLowerCase().includes("friday")) {
              title = title.replace(/on friday|friday/i, "").trim();
              deadline = "Friday";
            } else if (title.toLowerCase().includes("today")) {
              title = title.replace(/today/i, "").trim();
              deadline = "Today";
            }
            title = title.charAt(0).toUpperCase() + title.slice(1);
          }

          if (textDetected.includes("now") || textDetected.includes("urgent") || textDetected.includes("immediate")) {
            category = "Do Now";
            priority = "high";
          } else if (textDetected.includes("later") || textDetected.includes("wait")) {
            category = "Can Wait";
            priority = "low";
          }

          const newTask: Task = {
            id: `task-${Date.now()}`,
            title,
            deadline,
            priority,
            category,
            notes: "Parsed locally via client-side fallback voice processing",
            isCompleted: false,
            isArchived: false
          };
          onAddTask(newTask);
          actionMsg = ` I have structured and added the task: "${title}" to your schedule.`;
        }

        const fallbackMsg: VoiceMessage = {
          id: `ai-fail-${Date.now()}`,
          sender: "assistant",
          text: `I have activated local failsafe routing to address: "${text}".${actionMsg} I will protect your critical path. Let's start with a Pomodoro focused sprint.`,
          timestamp: new Date(),
          reasoning: "Local intelligence has bypassed the offline API core to prevent execution delays.",
          generatedPlan: "1. Lock Focus Space (45m)\n2. Run 5m breathing reset\n3. Complete CS102 final milestone (90m)",
          priorityList: ["Focus block - CS102 deliverables", "Timeline defragmentation review", "Weekly calendar alignment"],
          timeline: ["Now: 45m Pomodoro sprint", "11:30 AM: Review assignment draft", "04:00 PM: Project checkpoint submission"],
          riskAssessment: "High density scheduling risk. Commit to immediate tasks to mitigate timeline decay.",
          recommendedActions: ["Start focus timer now", "View active deadlines", "Triage low priority tasks"]
        };
        setMessages(prev => [...prev, fallbackMsg]);
        speakText(`Local fallback activated.${actionMsg} Let's protect your critical path immediately.`);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  // Direct Interactive Command Actions
  const handleQuickCommand = (cmd: string) => {
    handleSendMessage(cmd);
  };

  // Real File Upload Handler (PDFs, briefs, or syllabus documents)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setLoadingStage("Reading brief document...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileText = event.target?.result as string || "Extracted content for " + file.name;
      setLoadingStage("Analyzing document parameters...");

      try {
        const response = await fetch("/api/ai/analyze-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileText: fileText.slice(0, 12000) // Keep within token safety margins
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

          const importMsg: VoiceMessage = {
            id: `sys-${Date.now()}`,
            sender: "assistant",
            text: `Import Complete! I have analyzed and indexed "${file.name}". I identified critical deadlines: ${doc.deadlines?.join(", ") || "N/A"}. Added automatic checkpoints in your scheduler cockpit.`,
            timestamp: new Date(),
            reasoning: "Extracted key requirements and chronologically structured them on your timeline.",
            generatedPlan: doc.studyPlan?.map(p => `${p.week}: ${p.focus}`).join("\n") || "Focus writing & revisions",
            priorityList: doc.keyRequirements?.map((r, i) => `${i+1}. ${r}`) || ["Review syllabus parameters"],
            riskAssessment: `Identified Risks: ${doc.risks?.join(". ") || "Time compression"}`,
            recommendedActions: ["Review generated milestones", "Trigger first study block", "Analyze deadline conflicts"]
          };
          setMessages(prev => [...prev, importMsg]);
          speakText(`Import Complete. I have analyzed "${file.name}" and loaded your custom study milestones.`);
        } else {
          throw new Error("Failed to parse brief content");
        }
      } catch (err) {
        console.warn("API Error:", err);
        setErrorText("Import Error: Failed to analyze brief criteria. Please type key details manually.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Tab Header & Dashboard Title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-[0.2em] text-gray-400 uppercase font-semibold">AI Chief of Staff</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight">Vocal Execution Cockpit</h2>
        </div>

        {/* Audio Output Synthesis Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold ${
            soundEnabled 
              ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" 
              : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          }`}
          title={soundEnabled ? "Mute Speech Synthesis" : "Unmute Speech Synthesis"}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          <span>{soundEnabled ? "SPEECH ON" : "SPEECH OFF"}</span>
        </button>
      </div>

      {/* Main Double Column Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Conversational Stream & Report Display (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-white border border-gray-100 rounded-2xl shadow-sm h-[520px] overflow-hidden">
          
          {/* Scrollable Chat Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((m) => {
              const hasStructured = m.reasoning || m.generatedPlan || m.priorityList || m.timeline || m.riskAssessment || m.recommendedActions;
              return (
                <div key={m.id} className="space-y-3">
                  {/* Basic Speech Bubble */}
                  <div className={`flex gap-3 max-w-[85%] ${m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                    <div className={`w-6 h-6 rounded-lg text-[9px] font-mono font-bold flex items-center justify-center shrink-0 ${
                      m.sender === "user" ? "bg-black text-white" : "bg-gray-100 text-gray-500 border border-gray-200"
                    }`}>
                      {m.sender === "user" ? "U" : "CS"}
                    </div>
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.sender === "user" 
                        ? "bg-gray-50 border border-gray-250 text-gray-800 rounded-tr-none" 
                        : "bg-white border border-gray-100 text-gray-700 rounded-tl-none shadow-xs"
                    }`}>
                      {m.text}
                    </div>
                  </div>

                  {/* Rich AI Structured Report Card */}
                  {m.sender === "assistant" && hasStructured && (
                    <div className="ml-9 mr-4 bg-gray-50/50 border border-gray-150/75 rounded-2xl p-5 space-y-4 animate-fade-in shadow-2xs max-w-[90%]">
                      
                      <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
                        <Sparkles size={14} className="text-amber-500" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-600">Chief-Of-Staff Analytics Report</span>
                      </div>

                      {/* 1. Reasoning Section */}
                      {m.reasoning && (
                        <div>
                          <h4 className="text-[10px] font-mono uppercase text-gray-400 font-bold tracking-wider">AI Strategic Reasoning</h4>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{m.reasoning}</p>
                        </div>
                      )}

                      {/* 2. Generated Plan */}
                      {m.generatedPlan && (
                        <div className="bg-white border border-gray-100 p-3.5 rounded-xl">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-amber-700 font-bold mb-1.5">
                            <Zap size={12} />
                            <span>Structured Execution Plan</span>
                          </div>
                          <p className="text-xs text-gray-700 font-medium whitespace-pre-line leading-relaxed">{m.generatedPlan}</p>
                          {/* Aesthetic Progress bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 uppercase">
                              <span>Path Completion Target</span>
                              <span>90% Probability</span>
                            </div>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1 overflow-hidden">
                              <div className="bg-amber-500 h-full w-[70%] animate-pulse" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. Priority List & Timeline Split Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        
                        {/* Priority List */}
                        {m.priorityList && m.priorityList.length > 0 && (
                          <div className="bg-white border border-gray-100 p-3.5 rounded-xl">
                            <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block mb-2">Priority Checklist</span>
                            <div className="space-y-2">
                              {m.priorityList.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-1.5">
                                  <div className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center shrink-0 mt-0.5 bg-gray-50">
                                    <Check size={10} className="text-gray-400" />
                                  </div>
                                  <span className="text-xs text-gray-600 leading-tight font-sans">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Chronological Timeline */}
                        {m.timeline && m.timeline.length > 0 && (
                          <div className="bg-white border border-gray-100 p-3.5 rounded-xl">
                            <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block mb-2">Project Action Timeline</span>
                            <div className="space-y-2 border-l border-gray-100 pl-3">
                              {m.timeline.map((item, idx) => (
                                <div key={idx} className="relative">
                                  {/* Milestone Node Dot */}
                                  <div className="absolute -left-[16.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 border border-white" />
                                  <span className="text-xs text-gray-600 leading-tight block font-sans">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>

                      {/* 4. Risk Assessment */}
                      {m.riskAssessment && (
                        <div className="bg-red-50/50 border border-red-100/75 p-3.5 rounded-xl flex items-start gap-3">
                          <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <span className="text-[9px] font-mono uppercase text-red-600 font-bold block">Predictive Risk Assessment</span>
                            <p className="text-xs text-red-950/80 mt-1 leading-relaxed font-sans font-medium">{m.riskAssessment}</p>
                          </div>
                        </div>
                      )}

                      {/* 5. Clickable Recommended Next Actions */}
                      {m.recommendedActions && m.recommendedActions.length > 0 && (
                        <div className="pt-2 border-t border-gray-100">
                          <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block mb-2">Recommended Next Actions (Click to Trigger)</span>
                          <div className="flex flex-wrap gap-2">
                            {m.recommendedActions.map((act, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleQuickCommand(act)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-[10px] font-mono font-semibold flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                              >
                                <span>{act}</span>
                                <ArrowRight size={10} />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}

            {/* Live Streaming Speech Transcription */}
            {isListening && (
              <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse animate-fade-in">
                <div className="w-6 h-6 rounded-full bg-black text-white shrink-0 flex items-center justify-center text-[10px] font-mono font-bold">U</div>
                <div className="p-3.5 bg-gray-50 border border-gray-150 text-gray-800 text-xs rounded-2xl rounded-tr-none shadow-2xs">
                  <div className="flex items-center gap-1 text-[9px] font-mono text-amber-600 font-bold mb-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                    <span>Real-time Transcribing...</span>
                  </div>
                  <p className="italic font-sans text-gray-700">
                    {finalSpeechTranscript || interimTranscript ? `${finalSpeechTranscript} ${interimTranscript}` : "Speak clearly now... Listening..."}
                  </p>
                </div>
              </div>
            )}

            {/* Animated Loading Stages */}
            {loading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 border border-gray-200 shrink-0 flex items-center justify-center text-[9px] font-mono font-bold">CS</div>
                <div className="p-4 bg-white border border-gray-100 text-gray-500 text-xs rounded-2xl rounded-tl-none flex flex-col gap-2 shadow-xs min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[10px] font-mono text-amber-600 font-bold uppercase tracking-wider animate-pulse">{loadingStage}</span>
                </div>
              </div>
            )}

            {/* Friendly Error Banner / Instruction alert */}
            {errorText && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                <div>
                  <h5 className="font-bold">System Alert</h5>
                  <p className="mt-0.5 text-red-700/90 leading-relaxed font-sans">{errorText}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Typing Console Input bar */}
          <form onSubmit={handleFormSubmit} className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
            <input
              type="text"
              required
              placeholder="Type or click command chips. E.g., 'What should I do next?'"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-white border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none transition-all font-sans shadow-2xs"
            />
            <button
              type="submit"
              className="p-3 bg-black hover:opacity-90 text-white rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center"
            >
              <Send size={14} />
            </button>
          </form>

        </div>

        {/* Right Column: Microphone Deck & Brief Dropzone (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* 1. Microphone & Waveform Deck */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl flex flex-col items-center justify-center shadow-sm h-[320px] relative">
            
            <div className="text-center mb-6">
              <h3 className="text-xs font-mono font-bold tracking-widest text-gray-500 uppercase">Mic Interface</h3>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">HTML5 Captured Speech Stream</p>
            </div>

            {/* Glowing Sound Orb Circle Button */}
            <button
              onClick={handleToggleVoiceInput}
              className={`w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-500 relative cursor-pointer ${
                isListening
                  ? "bg-red-500 border-red-400 shadow-[0_0_25px_rgba(239,68,68,0.5)] scale-105"
                  : isSpeaking
                  ? "bg-amber-500 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-pulse"
                  : "bg-gray-50 hover:bg-gray-100 border-gray-200 shadow-sm hover:scale-102"
              }`}
            >
              {isListening ? (
                <Mic size={32} className="text-white animate-bounce" />
              ) : isSpeaking ? (
                <Volume2 size={32} className="text-white animate-pulse" />
              ) : (
                <Mic size={32} className="text-gray-400 hover:text-gray-700" />
              )}

              {/* Glowing, Concentric Outer Spinning Rings */}
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full border border-dashed border-white/60 animate-spin [animation-duration:15s]" />
                  <div className="absolute -inset-2.5 rounded-full border-2 border-dashed border-red-500/25 animate-spin [animation-duration:8s] [animation-direction:reverse]" />
                </>
              )}
              {isSpeaking && (
                <div className="absolute -inset-2 rounded-full border border-amber-500/35 animate-ping" />
              )}
            </button>

            {/* Glowing Waveform Bars */}
            <div className="flex items-end justify-center gap-1 h-12 mt-6 w-full max-w-[150px] px-2">
              {[...Array(9)].map((_, i) => {
                const baseHeights = [12, 28, 44, 52, 20, 48, 36, 16, 8];
                const isAnimating = isListening || isSpeaking;

                return (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-gray-200 transition-all duration-300"
                    style={{
                      height: isAnimating ? `${Math.max(6, baseHeights[i] * (voiceIntensity / 50))}px` : "6px",
                      backgroundColor: isListening ? "#EF4444" : isSpeaking ? "#F59E0B" : "rgba(0,0,0,0.06)"
                    }}
                  />
                );
              })}
            </div>

            {/* Microphone State Subtitles */}
            <div className="text-center mt-5">
              <span className="text-[9px] font-mono tracking-wider uppercase font-bold text-gray-500">
                {isListening ? "Listening closely... click to stop" : isSpeaking ? "Voice Feed Active" : "Microphone Standby"}
              </span>
              <p className="text-[9px] text-gray-400 font-sans max-w-[180px] mx-auto mt-0.5">
                {isListening ? "Auto transcribing..." : "Click node to speak study command"}
              </p>
            </div>

          </div>

          {/* 2. Document Dropzone & File List */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl flex-1 flex flex-col justify-between h-[176px] shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-1.5">
                <FileText size={14} className="text-gray-400" />
                <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Documents Context</span>
              </div>
              <span className="text-[9px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.25 rounded border border-gray-100">{scannedDocs.length} Loaded</span>
            </div>

            {/* Files List or Drag Area */}
            {scannedDocs.length > 0 ? (
              <div className="flex-1 overflow-y-auto mt-2.5 space-y-1.5 max-h-[70px] scrollbar-none">
                {scannedDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg border border-gray-100 text-left">
                    <FileCheck size={12} className="text-amber-600 shrink-0" />
                    <span className="text-[10px] font-mono text-gray-700 truncate flex-1">{doc.fileName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center mt-2.5 border border-dashed border-gray-150 rounded-lg bg-gray-50/50 p-3 text-center">
                <Upload size={16} className="text-gray-400" />
                <span className="text-[9px] font-mono text-gray-500 mt-1 uppercase">Drop briefing text / syllabus</span>
              </div>
            )}

            {/* Drag & Select Button */}
            <label className="w-full mt-2.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-black rounded-xl border border-gray-200 transition-all text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
              <Plus size={13} />
              <span>Upload Syllabus Brief</span>
              <input 
                type="file" 
                accept=".txt,.json,.md,.html" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
          </div>

          {/* 3. Embedded AI Concept Explainer */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl flex flex-col gap-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Milo's AI Concept Explainer</span>
              </div>
              <span className="text-[9px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.25 rounded border border-gray-100">Live Tutor</span>
            </div>

            {/* Explainer Form Inputs */}
            <div className="space-y-2.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter topic (e.g. Dynamic Programming)"
                  value={explainQuery}
                  onChange={(e) => setExplainQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleExplainConcept()}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-black rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none transition-all"
                />
              </div>

              {/* Level Selector buttons */}
              <div className="grid grid-cols-4 gap-1">
                {(["Beginner", "Student", "Professional", "Expert"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setExplainLevel(lvl)}
                    className={`py-1 text-[9px] font-mono font-bold rounded transition-all cursor-pointer ${
                      explainLevel === lvl
                        ? "bg-amber-500 text-white shadow-3xs"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-500"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={handleExplainConcept}
                disabled={explainLoading || !explainQuery.trim()}
                className="w-full py-2 bg-black hover:opacity-95 text-white disabled:opacity-40 rounded-xl font-mono font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                {explainLoading ? (
                  <>
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={11} />
                    <span>Explain Topic</span>
                  </>
                )}
              </button>
            </div>

            {/* Explanation Result Output */}
            {(explainResult || explainLoading) && (
              <div className="mt-1 bg-amber-50/30 border border-amber-100/70 p-3 rounded-xl flex flex-col gap-2.5 animate-fade-in">
                {explainLoading ? (
                  <div className="space-y-2 py-1">
                    <div className="h-2 bg-gray-200 rounded animate-pulse w-full" />
                    <div className="h-2 bg-gray-200 rounded animate-pulse w-5/6" />
                    <div className="h-2 bg-gray-200 rounded animate-pulse w-4/5" />
                  </div>
                ) : (
                  <>
                    <div className="text-[11px] font-sans text-gray-700 leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-wrap scrollbar-none">
                      {explainResult}
                    </div>

                    {/* Result actions */}
                    <div className="flex items-center justify-between border-t border-amber-100/50 pt-2 text-[10px]">
                      <div className="flex gap-2">
                        <button
                          onClick={handleSpeakExplanation}
                          className="flex items-center gap-1 text-gray-500 hover:text-black font-semibold transition-colors cursor-pointer"
                          title="Read Aloud"
                        >
                          {isExplainerSpeaking ? <VolumeX size={12} className="text-red-500 animate-pulse" /> : <Volume2 size={12} />}
                          <span>{isExplainerSpeaking ? "Stop" : "Listen"}</span>
                        </button>
                        <button
                          onClick={handleCopyExplanation}
                          className="flex items-center gap-1 text-gray-500 hover:text-black font-semibold transition-colors cursor-pointer"
                          title="Copy to Clipboard"
                        >
                          {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          <span>{isCopied ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <button
                        onClick={() => setExplainResult("")}
                        className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer font-semibold"
                      >
                        Clear
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Structured Strategy Action Buttons (Generate Plan, Create Schedule, Risk Analysis) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <button
          onClick={() => handleSendMessage("Generate a comprehensive study and execution plan based on my current tasks and uploaded documents.")}
          className="p-4 bg-white hover:bg-gray-50 border border-gray-150 rounded-xl text-left shadow-2xs cursor-pointer group transition-all flex items-start gap-3"
        >
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600 group-hover:scale-105 transition-transform shrink-0">
            <Zap size={18} />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 group-hover:text-amber-600 transition-colors">⚡ Generate Execution Plan</h4>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed font-sans">AI organizes modular study milestones from courses and briefs.</p>
          </div>
        </button>

        <button
          onClick={() => handleSendMessage("Create today's schedule.")}
          className="p-4 bg-white hover:bg-gray-50 border border-gray-150 rounded-xl text-left shadow-2xs cursor-pointer group transition-all flex items-start gap-3"
        >
          <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 group-hover:scale-105 transition-transform shrink-0">
            <Calendar size={18} />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 group-hover:text-blue-600 transition-colors">📅 Create Today's Schedule</h4>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed font-sans">Builds an optimized hour-by-hour focus session blueprint.</p>
          </div>
        </button>

        <button
          onClick={() => handleSendMessage("Perform an advanced predictive deadline risk analysis.")}
          className="p-4 bg-white hover:bg-gray-50 border border-gray-150 rounded-xl text-left shadow-2xs cursor-pointer group transition-all flex items-start gap-3"
        >
          <div className="p-2.5 bg-red-50 rounded-lg text-red-600 group-hover:scale-105 transition-transform shrink-0">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 group-hover:text-red-600 transition-colors">📊 Perform Risk Analysis</h4>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed font-sans">Identifies timeline overlaps, bottlenecks, and delay scores.</p>
          </div>
        </button>

      </div>

      {/* Smart Command Chips Panel */}
      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-2xs flex items-center gap-2.5 overflow-x-auto whitespace-nowrap scrollbar-none">
        <span className="text-[9px] font-mono font-bold tracking-wider text-gray-400 uppercase shrink-0">Command Chips:</span>
        {dynamicChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickCommand(chip.cmd)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-[10px] font-mono text-amber-800 rounded-full border border-amber-150 hover:text-amber-950 transition-all cursor-pointer font-semibold shadow-2xs"
          >
            {chip.label}
          </button>
        ))}
      </div>

    </div>
  );
}
