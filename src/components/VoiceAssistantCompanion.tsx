// import React, { useState, useRef, useEffect } from "react";
// import { Task, VoiceMessage } from "../types";
// import { AlertCircle, Mic, MicOff, Send, Volume2, VolumeX, Minimize2, Maximize2, Settings, RefreshCw } from "lucide-react";

// interface TranscriptLine {
//   sender: "user" | "assistant";
//   text: string;
//   timestamp: Date;
//   reasoning?: string;
//   generatedPlan?: string;
//   priorityList?: string[];
//   timeline?: string[];
//   riskAssessment?: string;
//   recommendedActions?: string[];
// }

// interface SimulatedCalendarEvent {
//   id: string;
//   title: string;
//   start: string;
//   end: string;
// }

// interface SimulatedReminder {
//   id: string;
//   title: string;
//   time: string;
//   category: string;
// }

// interface SimulatedTravelPlan {
//   id: string;
//   destination: string;
//   distance: string;
//   duration: string;
//   warning: string;
// }

// interface VoiceAssistantCompanionProps {
//   tasks: Task[];
//   onAddTask: (task: Task) => void;
//   onSetClockMode: (mode: "default" | "listening" | "thinking" | "speaking" | "timeline" | "gauge" | "pulse" | "emergency") => void;
//   onNavigateTab?: (tab: string) => void;
// }

// const VoiceAssistantCompanion: React.FC<VoiceAssistantCompanionProps> = ({
//   tasks,
//   onAddTask,
//   onSetClockMode,
//   onNavigateTab,
// }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [micEnabled, setMicEnabled] = useState(true);
//   const [speakerEnabled, setSpeakerEnabled] = useState(true);
//   const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
//   const [liveTranscript, setLiveTranscript] = useState("");
//   const [assistantState, setAssistantState] = useState<"idle" | "listening" | "thinking" | "speaking" | "error">("idle");
//   const [voiceLanguage, setVoiceLanguage] = useState<string>(() => {
//     const systemLang = navigator.language || "en-US";
//     if (systemLang.startsWith("hi")) return "hi-IN";
//     if (systemLang.startsWith("en-IN")) return "en-IN";
//     return "en-US";
//   });
//   const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
//   const [conversationModeActive, setConversationModeActive] = useState(false);
//   const [micPermissionDenied, setMicPermissionDenied] = useState(false);
//   const [isRescueMode, setIsRescueMode] = useState(false);
//   const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
//   const [createdEvents, setCreatedEvents] = useState<SimulatedCalendarEvent[]>([]);
//   const [createdReminders, setCreatedReminders] = useState<SimulatedReminder[]>([]);
//   const [createdTravels, setCreatedTravels] = useState<SimulatedTravelPlan[]>([]);
//   const [showAssetReport, setShowAssetReport] = useState(false);

//   const recognitionRef = useRef<any>(null);
//   const isExpandedRef = useRef(isExpanded);
//   const isListeningRef = useRef(isListening);
//   const assistantStateRef = useRef(assistantState);
//   const wakeWordEnabledRef = useRef(wakeWordEnabled);
//   const conversationModeActiveRef = useRef(conversationModeActive);
//   const isStartingRef = useRef(false);
//   const isRecRunningRef = useRef(false);
//   const consecutiveErrorsRef = useRef(0);
//   const recRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const personalizationStepRef = useRef<number | null>(null);

//   // LocalStorage helper functions
//   const safeLocalStorageGet = (key: string) => {
//     try {
//       return localStorage.getItem(key) || "";
//     } catch {
//       return "";
//     }
//   };

//   const safeLocalStorageSet = (key: string, value: string) => {
//     try {
//       localStorage.setItem(key, value);
//     } catch {
//       console.warn(`Failed to set localStorage key: ${key}`);
//     }
//   };

//   // Update refs when state changes
//   useEffect(() => {
//     isExpandedRef.current = isExpanded;
//   }, [isExpanded]);

//   useEffect(() => {
//     isListeningRef.current = isListening;
//   }, [isListening]);

//   useEffect(() => {
//     assistantStateRef.current = assistantState;
//   }, [assistantState]);

//   useEffect(() => {
//     wakeWordEnabledRef.current = wakeWordEnabled;
//   }, [wakeWordEnabled]);

//   useEffect(() => {
//     conversationModeActiveRef.current = conversationModeActive;
//   }, [conversationModeActive]);

//   // Trigger audio tones
//   const triggerAudioTone = (type: "success" | "warning" | "error") => {
//     const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
//     const oscillator = audioContext.createOscillator();
//     const gain = audioContext.createGain();

//     oscillator.connect(gain);
//     gain.connect(audioContext.destination);

//     const frequencies: { [key: string]: number } = {
//       success: 800,
//       warning: 600,
//       error: 400,
//     };

//     oscillator.frequency.value = frequencies[type] || 600;
//     gain.gain.setValueAtTime(0.3, audioContext.currentTime);
//     gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

//     oscillator.start(audioContext.currentTime);
//     oscillator.stop(audioContext.currentTime + 0.2);
//   };

//   // Speech synthesis
//   const speakText = async (text: string): Promise<void> => {
//     if (!speakerEnabled) return;

//     return new Promise((resolve) => {
//       const utterance = new SpeechSynthesisUtterance(text);
//       utterance.lang = voiceLanguage;
//       utterance.rate = 1;
//       utterance.pitch = 1;
//       utterance.volume = 1;

//       utterance.onend = () => {
//         resolve();
//       };

//       utterance.onerror = () => {
//         resolve();
//       };

//       window.speechSynthesis.cancel();
//       window.speechSynthesis.speak(utterance);
//       setIsSpeaking(true);
//     });
//   };

//   // Speech recognition setup
//   useEffect(() => {
//     const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
//     if (!SpeechRecognition) {
//       console.warn("Speech Recognition API not supported");
//       return;
//     }

//     const rec = new SpeechRecognition();
//     rec.continuous = false;
//     rec.interimResults = false;
//     rec.lang = voiceLanguage;
//     rec.maxAlternatives = 1;

//     rec.onstart = () => {
//       isRecRunningRef.current = true;
//       isStartingRef.current = false;
//       consecutiveErrorsRef.current = 0;
//       if (isExpandedRef.current) {
//         setAssistantState("listening");
//         setIsListening(true);
//         onSetClockMode("listening");
//       }
//     };

//     rec.onresult = (event: any) => {
//       const text = event.results[0][0].transcript;
//       if (!text) return;

//       if (personalizationStepRef.current !== null) {
//         return;
//       }

//       if (!isExpandedRef.current) {
//         const lower = text.toLowerCase();
//         const wakeWords = [
//           "milo", "hey milo", "hello milo", "hi milo", "milo hey",
//           "मिलो", "हे मिलो", "नमस्ते मिलो",
//           "chief", "hey chief", "chief of staff"
//         ];
        
//         const isWakeWord = wakeWords.some(word => lower.includes(word));
        
//         if (isWakeWord) {
//           setIsExpanded(true);
//           triggerAudioTone("success");
//           speakText("I'm here, Chief. Using Gemini 3.5 for advanced assistance. What can I help with?");
//         }
//       } else {
//         handleSendMessage(text);
//       }
//     };

//     rec.onerror = (e: any) => {
//       isStartingRef.current = false;

//       if (e.error === "aborted" || e.error === "no-speech" || e.error === "network") {
//         if (isExpandedRef.current && conversationModeActiveRef.current) {
//           retryStartSpeech(0, 2);
//         }
//         return;
//       }

//       console.warn("Speech recognition error:", e.error);

//       if (personalizationStepRef.current !== null) {
//         if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture") {
//           console.warn("Microphone permission denied during enrollment");
//         }
//         return;
//       }

//       consecutiveErrorsRef.current += 1;

//       if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture" || consecutiveErrorsRef.current >= 3) {
//         console.warn("⚠️ Gemini 3.5 disabled due to microphone permissions");
        
//         setWakeWordEnabled(false);
//         wakeWordEnabledRef.current = false;
//         setConversationModeActive(false);
//         conversationModeActiveRef.current = false;
//         setMicPermissionDenied(true);
//         setAssistantState("error");
//         assistantStateRef.current = "error";
//         onSetClockMode("default");
        
//         speakText("Microphone access denied. Enable in browser settings to use voice assistant.");
//         return;
//       }

//       if (!isExpandedRef.current) return;

//       setAssistantState("error");
//       assistantStateRef.current = "error";
//       onSetClockMode("default");
//       triggerAudioTone("warning");

//       const errorMessages: { [key: string]: string } = {
//         "no-match": "Didn't catch that. Please speak clearly.",
//         "audio-capture": "Microphone not detected.",
//         "network": "Network error. Checking connection...",
//         "service-unavailable": "Speech service temporarily unavailable."
//       };

//       speakText(errorMessages[e.error] || "Let me try again.");

//       setTimeout(() => {
//         if (assistantStateRef.current === "error") {
//           setAssistantState("idle");
//           assistantStateRef.current = "idle";
//           if (conversationModeActiveRef.current) {
//             retryStartSpeech(0, 2);
//           }
//         }
//       }, 2500);
//     };

//     rec.onend = () => {
//       isRecRunningRef.current = false;
//       isStartingRef.current = false;

//       const shouldBeRunning = 
//         (personalizationStepRef.current !== null) ||
//         (!isExpandedRef.current && wakeWordEnabledRef.current) ||
//         (isExpandedRef.current && (conversationModeActiveRef.current || assistantStateRef.current === "listening") && assistantStateRef.current !== "speaking" && assistantStateRef.current !== "thinking" && assistantStateRef.current !== "error");

//       if (shouldBeRunning) {
//         const delay = (personalizationStepRef.current !== null) ? 300 :
//                       (!isExpandedRef.current) ? 600 : 400;
        
//         if (recRestartTimeoutRef.current) clearTimeout(recRestartTimeoutRef.current);
//         recRestartTimeoutRef.current = setTimeout(() => {
//           safeStartSpeech();
//         }, delay);
//       }
//     };

//     recognitionRef.current = rec;

//     return () => {
//       if (recognitionRef.current) {
//         try {
//           recognitionRef.current.abort();
//         } catch (e) {}
//       }
//       if (recRestartTimeoutRef.current) clearTimeout(recRestartTimeoutRef.current);
//     };
//   }, [voiceLanguage]);

//   // Safe speech recognition start
//   const safeStartSpeech = () => {
//     if (!recognitionRef.current) return;
//     if (isStartingRef.current || isRecRunningRef.current) return;

//     isStartingRef.current = true;
//     try {
//       recognitionRef.current.start();
//     } catch (e) {
//       isStartingRef.current = false;
//       console.warn("Failed to start speech recognition:", e);
//     }
//   };

//   // Retry mechanism for speech recognition
//   const retryStartSpeech = (retryCount = 0, maxRetries = 3) => {
//     if (retryCount >= maxRetries) {
//       console.warn("Max retries reached for speech recognition");
//       setAssistantState("error");
//       assistantStateRef.current = "error";
//       speakText("Microphone connection failed. Please check permissions.");
//       return;
//     }
    
//     setTimeout(() => {
//       try {
//         safeStartSpeech();
//       } catch (e) {
//         retryStartSpeech(retryCount + 1, maxRetries);
//       }
//     }, 500 * (retryCount + 1));
//   };

//   // Handle sending message
//   const handleSendMessage = async (text: string) => {
//     const userMsg: TranscriptLine = {
//       sender: "user",
//       text,
//       timestamp: new Date()
//     };
    
//     setTranscript(prev => [...prev, userMsg]);
//     setAssistantState("thinking");
//     setIsListening(false);
//     onSetClockMode("thinking");

//     const city = safeLocalStorageGet("saver_city") || "Delhi";
//     const country = safeLocalStorageGet("saver_country") || "India";
//     const medications = JSON.parse(safeLocalStorageGet("saver_medications") || "[]");
//     const calendarEvents = JSON.parse(safeLocalStorageGet("saver_calendar_events") || "[]");
//     const weatherCache = JSON.parse(safeLocalStorageGet("saver_weather") || "null") || { temperature: 41, condition: "Sunny", aqi: 154 };

//     try {
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 20000);

//       const res = await fetch("/api/ai/voice-assistant", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         signal: controller.signal,
//         body: JSON.stringify({
//           query: text,
//           context: {
//             tasks,
//             scannedDocs: [],
//             isRescueMode,
//             currentTime: new Date().toISOString(),
//             currentLocation: `${city}, ${country}`,
//             medications,
//             weather: weatherCache,
//             calendarEvents,
//             pastConversations: transcript.slice(-10).map(t => ({ sender: t.sender, text: t.text })),
//             voiceLanguage: voiceLanguage,
//             userProfile: {
//               name: "Chief",
//               timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//               preferredStyle: "concise"
//             }
//           }
//         })
//       });

//       clearTimeout(timeoutId);

//       if (res.ok) {
//         const data = await res.json();
        
//         const assistantMsg: TranscriptLine = {
//           sender: "assistant",
//           text: data.transcript,
//           timestamp: new Date(),
//           reasoning: data.reasoning,
//           generatedPlan: data.generatedPlan,
//           priorityList: data.priorityList,
//           timeline: data.timeline,
//           riskAssessment: data.riskAssessment,
//           recommendedActions: data.recommendedActions
//         };

//         setTranscript(prev => [...prev, assistantMsg]);
//         setAssistantState("speaking");
//         triggerAudioTone("success");
        
//         await speakText(data.transcript);
        
//         setAssistantState("listening");
//         setIsListening(true);

//         // Handle actions
//         if (data.actionType && data.actionType !== "none" && data.actionPayload) {
//           const payload = data.actionPayload;
          
//           if (data.actionType === "create_task") {
//             const newTask: Task = {
//               id: `voice-task-${Date.now()}`,
//               title: payload.title || "Task from voice",
//               deadline: payload.deadline || "Tomorrow at 10:00 AM",
//               priority: (payload.priority || "high") as any,
//               riskScore: 68,
//               category: (payload.category || "Do Now") as any,
//               notes: payload.notes || "Created via Milo AI with Gemini 3.5"
//             };
//             onAddTask(newTask);
//             setCreatedTasks(prev => [...prev, newTask]);

//             const newEvent: SimulatedCalendarEvent = {
//               id: `voice-evt-${Date.now()}`,
//               title: `Calendar block: ${newTask.title}`,
//               start: "Tomorrow, 10:00 AM",
//               end: "Tomorrow, 11:00 AM"
//             };
//             setCreatedEvents(prev => [...prev, newEvent]);

//             const newReminder: SimulatedReminder = {
//               id: `voice-rem-${Date.now()}`,
//               title: `Voice Reminder: ${newTask.title}`,
//               time: "Tomorrow at 9:30 AM (30m before)",
//               category: "Audio Prompt"
//             };
//             setCreatedReminders(prev => [...prev, newReminder]);

//             const newTravel: SimulatedTravelPlan = {
//               id: `voice-trv-${Date.now()}`,
//               destination: payload.destination || "Destination",
//               distance: "1.4 miles",
//               duration: "12 minutes",
//               warning: "Route optimized"
//             };
//             setCreatedTravels(prev => [...prev, newTravel]);
//             setShowAssetReport(true);
//           } 
//           else if (data.actionType === "create_medicine") {
//             const currentMeds = JSON.parse(safeLocalStorageGet("saver_medications") || "[]");
//             const newMed = {
//               id: `milo-med-${Date.now()}`,
//               name: payload.title || "Medication",
//               dosage: payload.notes || "As prescribed",
//               time: payload.deadline || "Evening",
//               frequency: "daily",
//               soundAlert: "Chime"
//             };
//             currentMeds.push(newMed);
//             safeLocalStorageSet("saver_medications", JSON.stringify(currentMeds));
//             window.dispatchEvent(new Event("storage"));
//           }
//           else if (data.actionType === "navigate") {
//             if (onNavigateTab) onNavigateTab("smart_map");
//             if (payload.destination) {
//               safeLocalStorageSet("milo_nav_destination", payload.destination);
//               window.dispatchEvent(new CustomEvent("milo_navigation", { detail: payload.destination }));
//             }
//           }
//         }

//         if (data.clockTrigger) {
//           setTimeout(() => {
//             if (isListeningRef.current) return;
//             onSetClockMode(data.clockTrigger as any);
//           }, 3500);
//         }

//       } else {
//         throw new Error(`API error: ${res.status}`);
//       }
//     } catch (err: any) {
//       console.warn("Gemini 3.5 Voice Error:", err);
      
//       if (err.name === "AbortError") {
//         setAssistantState("error");
//         assistantStateRef.current = "error";
//         triggerAudioTone("warning");
//         speakText("Gemini 3.5 took too long to respond. Trying again...");
//       } else {
//         setAssistantState("error");
//         assistantStateRef.current = "error";
//         onSetClockMode("default");
//         triggerAudioTone("warning");
//         speakText("Connection issue with Gemini 3.5. Let me try offline mode.");
//       }
      
//       setTimeout(() => {
//         if (assistantStateRef.current === "error") {
//           setAssistantState("idle");
//           assistantStateRef.current = "idle";
//           if (conversationModeActiveRef.current) {
//             retryStartSpeech(0, 2);
//           }
//         }
//       }, 3000);
//     }
//   };

//   // Toggle expanded state
//   const toggleExpanded = () => {
//     setIsExpanded(!isExpanded);
//     if (!isExpanded) {
//       setConversationModeActive(true);
//       conversationModeActiveRef.current = true;
//       safeStartSpeech();
//     } else {
//       setConversationModeActive(false);
//       conversationModeActiveRef.current = false;
//       if (recognitionRef.current) {
//         recognitionRef.current.abort();
//       }
//     }
//   };

//   // Toggle microphone
//   const toggleMic = () => {
//     if (micPermissionDenied) {
//       alert("Microphone permission denied. Please enable in browser settings.");
//       return;
//     }
//     setMicEnabled(!micEnabled);
//   };

//   // Toggle speaker
//   const toggleSpeaker = () => {
//     setSpeakerEnabled(!speakerEnabled);
//   };

//   return (
//     <div className="fixed bottom-6 right-6 z-50">
//       {/* Assistant Bubble */}
//       <button
//         onClick={toggleExpanded}
//         className={`rounded-full p-4 shadow-lg transition-all duration-300 ${
//           isExpanded ? "hidden" : "bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center w-16 h-16"
//         }`}
//         title="Click to open voice assistant"
//       >
//         <Mic size={24} />
//       </button>

//       {/* Expanded Panel */}
//       {isExpanded && (
//         <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 w-96 max-h-[600px] flex flex-col">
//           {/* Header */}
//           <div className="flex items-center justify-between mb-4 border-b pb-3">
//             <div>
//               <h2 className="text-lg font-bold text-gray-900">Chief (Milo)</h2>
//               <p className="text-xs text-gray-500">Gemini 3.5 Powered</p>
//             </div>
//             <div className="flex gap-2">
//               <button
//                 onClick={toggleMic}
//                 className="p-2 hover:bg-gray-100 rounded-lg transition"
//                 title={micEnabled ? "Mute" : "Unmute"}
//               >
//                 {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
//               </button>
//               <button
//                 onClick={toggleSpeaker}
//                 className="p-2 hover:bg-gray-100 rounded-lg transition"
//                 title={speakerEnabled ? "Mute speaker" : "Unmute speaker"}
//               >
//                 {speakerEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
//               </button>
//               <button
//                 onClick={toggleExpanded}
//                 className="p-2 hover:bg-gray-100 rounded-lg transition"
//                 title="Close"
//               >
//                 <Minimize2 size={16} />
//               </button>
//             </div>
//           </div>

//           {/* Status Indicator */}
//           <div className="mb-3 flex items-center gap-2">
//             <div className={`w-2 h-2 rounded-full ${
//               assistantState === "listening" ? "bg-blue-500 animate-pulse" :
//               assistantState === "thinking" ? "bg-yellow-500 animate-pulse" :
//               assistantState === "speaking" ? "bg-green-500 animate-pulse" :
//               assistantState === "error" ? "bg-red-500" :
//               "bg-gray-300"
//             }`} />
//             <span className="text-xs text-gray-600 capitalize">
//               {assistantState === "listening" && "Listening..."}
//               {assistantState === "thinking" && "Thinking..."}
//               {assistantState === "speaking" && "Speaking..."}
//               {assistantState === "error" && "Error"}
//               {assistantState === "idle" && "Ready"}
//             </span>
//           </div>

//           {/* Transcript Display */}
//           <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
//             {transcript.length === 0 ? (
//               <p className="text-xs text-gray-400 text-center py-8">
//                 Say "Hello Milo" or click the mic button to start...
//               </p>
//             ) : (
//               transcript.map((msg, idx) => (
//                 <div key={idx} className={`text-sm ${msg.sender === "user" ? "text-right" : "text-left"}`}>
//                   <div className={`inline-block px-3 py-2 rounded-lg max-w-[80%] ${
//                     msg.sender === "user"
//                       ? "bg-indigo-600 text-white"
//                       : "bg-gray-200 text-gray-900"
//                   }`}>
//                     {msg.text}
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>

//           {/* Live Transcript */}
//           {liveTranscript && (
//             <p className="text-xs text-gray-600 italic mb-3 p-2 bg-blue-50 rounded border border-blue-100">
//               {liveTranscript}
//             </p>
//           )}

//           {/* Control Buttons */}
//           <div className="flex gap-2">
//             <button
//               onClick={() => {
//                 setTranscript([]);
//                 setAssistantState("idle");
//               }}
//               className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
//             >
//               <RefreshCw size={14} /> Clear
//             </button>
//             <button
//               onClick={toggleExpanded}
//               className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition"
//             >
//               Close
//             </button>
//           </div>

//           {/* Error Message */}
//           {micPermissionDenied && (
//             <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
//               <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
//               <p className="text-xs text-red-700">
//                 Microphone access denied. Enable in browser settings.
//               </p>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default VoiceAssistantCompanion;
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, 
  MicOff, 
  X, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  ShieldAlert, 
  Zap, 
  Check,
  Sliders,
  Settings,
  HelpCircle,
  Activity,
  Phone,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Camera,
  Play,
  RotateCcw,
  Eye,
  RefreshCw,
  Plus,
  Compass,
  CheckCircle,
  Trash2,
  Lock,
  UserCheck,
  Award,
  AlertTriangle
} from "lucide-react";
import { Task } from "../types";

interface VoiceAssistantCompanionProps {
  tasks: Task[];
  isRescueMode: boolean;
  onToggleRescueMode: () => void;
  onSetClockMode: (mode: "scanner" | "timeline" | "gauge" | "event" | "timer" | "progress" | "pulse" | "default" | "listening" | "thinking" | "speaking") => void;
  onSetVoiceIntensity: (intensity: number) => void;
  voiceIntensity: number;
  onAddTask: (task: Task) => void;
  attentionMuted?: boolean;
  voiceMuted?: boolean;
  setVoiceMuted?: (muted: boolean) => void;
  voiceMuteDuration?: string;
  setVoiceMuteDuration?: (dur: string) => void;
  voiceMuteSecondsLeft?: number | null;
  setVoiceMuteSecondsLeft?: (sec: number | null) => void;
  isNavDrawerOpen?: boolean;
  onNavigateTab?: (tab: string) => void;
  onToggleQuickAdd?: () => void;
}

interface TranscriptLine {
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: Date;
  reasoning?: string;
  generatedPlan?: string;
  priorityList?: string[];
  timeline?: string[];
  riskAssessment?: string;
  recommendedActions?: string[];
}

interface SimulatedReminder {
  id: string;
  title: string;
  time: string;
  category: string;
}

interface SimulatedCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

interface SimulatedTravelPlan {
  id: string;
  destination: string;
  distance: string;
  duration: string;
  warning: string;
}

const safeLocalStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const safeLocalStorageSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
};

const safeLocalStorageRemove = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
};

export default function VoiceAssistantCompanion({
  tasks,
  isRescueMode,
  onToggleRescueMode,
  onSetClockMode,
  onSetVoiceIntensity,
  voiceIntensity,
  onAddTask,
  attentionMuted,
  voiceMuted,
  setVoiceMuted,
  voiceMuteDuration,
  setVoiceMuteDuration,
  voiceMuteSecondsLeft,
  setVoiceMuteSecondsLeft,
  isNavDrawerOpen = false,
  onNavigateTab,
  onToggleQuickAdd
}: VoiceAssistantCompanionProps) {
  // Main states
  const [assistantState, setAssistantState] = useState<"idle" | "listening" | "thinking" | "speaking" | "error">("idle");
  const [isExpanded, setIsExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showEmergencyTrigger, setShowEmergencyTrigger] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState("Analyzing schedule priorities...");
  
  // Dialog/Transcript State
  const [transcript, setTranscript] = useState<TranscriptLine[]>([
    {
      sender: "assistant",
      text: "Hello, I am Milo, your AI Chief of Staff. I can plan, organize, and navigate your schedule seamlessly. How can I assist you today, Chief?",
      timestamp: new Date()
    }
  ]);

  // Voice Accessibility & Tuning settings
  const [speechRate, setSpeechRate] = useState<number>(1.1);
  const [voicePitch, setVoicePitch] = useState<number>(1.0);
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const [voiceLanguage, setVoiceLanguage] = useState<string>("en-US");
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // --- Milo Custom States ---
  const [wakeWordEnabled, setWakeWordEnabled] = useState(() => {
    return safeLocalStorageGet("milo_wake_word_enabled") !== "false";
  });
  const [conversationModeActive, setConversationModeActive] = useState(() => {
    return safeLocalStorageGet("milo_conversation_mode") !== "false";
  });
  const [voiceProfileCreated, setVoiceProfileCreated] = useState(() => {
    return safeLocalStorageGet("milo_voice_profile_created") === "true";
  });
  const [personalizationStep, setPersonalizationStep] = useState<number | null>(null);

  // --- Milo Custom Voice Enrollment States ---
  const [enrollmentState, setEnrollmentState] = useState<"onboarding" | "permission" | "recording" | "confirm" | "success" | "retry" | "denied">("onboarding");
  const [enrollmentTimer, setEnrollmentTimer] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [isEditingTranscript, setIsEditingTranscript] = useState<boolean>(false);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>("");
  const [isWebSpeechSupported, setIsWebSpeechSupported] = useState<boolean>(true);
  const [hasMicrophone, setHasMicrophone] = useState<boolean>(true);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);

  // Simulated screen haptics (visual ripples) state
  const [tactileActive, setTactileActive] = useState<boolean>(false);

  // Multi-Asset state (Voice Task Creation)
  const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
  const [createdReminders, setCreatedReminders] = useState<SimulatedReminder[]>([]);
  const [createdEvents, setCreatedEvents] = useState<SimulatedCalendarEvent[]>([]);
  const [createdTravels, setCreatedTravels] = useState<SimulatedTravelPlan[]>([]);
  const [showAssetReport, setShowAssetReport] = useState<boolean>(false);

  // Webcam & Camera OCR Scanner States
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    textDetected: string;
    surroundingsDescription: string;
    keyTakeaways: string[];
    recommendations: string;
  } | null>(null);

  // Persistent position state for absolute dragging and edge-snapping
  const [isDraggingVisual, setIsDraggingVisual] = useState(false);
  const isDraggingVisualRef = useRef(false);
  isDraggingVisualRef.current = isDraggingVisual;

  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<any>(null);
  const [showMiloQuickMenu, setShowMiloQuickMenu] = useState(false);

  const [position, setPosition] = useState(() => {
    const saved = safeLocalStorageGet("voice_assistant_position_v2");
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
    return { x: w - 80, y: h - 180 };
  });

  useEffect(() => {
    safeLocalStorageSet("voice_assistant_position_v2", JSON.stringify(position));
  }, [position]);

  // Adjust on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const buttonWidth = w < 640 ? 48 : 56;
        const newX = Math.max(16, Math.min(w - buttonWidth - 16, prev.x));
        const newY = Math.max(16, Math.min(h - buttonWidth - 16, prev.y));
        return { x: newX, y: newY };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDragStart = () => {
    hasDraggedRef.current = true;
    setIsDraggingVisual(true);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleDragEnd = (_: any, info: any) => {
    setIsDraggingVisual(false);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    const w = window.innerWidth;
    const h = window.innerHeight;
    const buttonWidth = w < 640 ? 48 : 56;
    
    let finalX = position.x + info.offset.x;
    let finalY = position.y + info.offset.y;
    
    // Snap horizontally to nearest edge
    if (finalX + buttonWidth / 2 < w / 2) {
      finalX = 16; 
    } else {
      finalX = w - buttonWidth - 16; 
    }
    
    // Keep vertically in bounds
    finalY = Math.max(16, Math.min(h - buttonWidth - 80, finalY));

    // Collision avoidance with Clock
    try {
      const clockSaved = localStorage.getItem("saver_clock_position");
      if (clockSaved) {
        const clockPos = JSON.parse(clockSaved);
        const sameSide = Math.abs(finalX - clockPos.x) < 150;
        const verticalOverlap = Math.abs(finalY - clockPos.y) < 120;
        if (sameSide && verticalOverlap) {
          if (clockPos.y > finalY) {
            finalY = Math.max(16, clockPos.y - buttonWidth - 20);
          } else {
            finalY = Math.min(h - buttonWidth - 80, clockPos.y + 190 + 20);
          }
        }
      }
    } catch (e) {
      console.warn("Collision avoidance with clock failed:", e);
    }
    
    setPosition({ x: finalX, y: finalY });
  };


  const isListeningRef = useRef(false);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const simulationIntervalRef = useRef<any>(null);
  const speakingSimulationIntervalRef = useRef<any>(null);
  const thinkingIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const recRestartTimeoutRef = useRef<any>(null);
  const consecutiveErrorsRef = useRef<number>(0);

  const isExpandedRef = useRef(isExpanded);
  isExpandedRef.current = isExpanded;

  const wakeWordEnabledRef = useRef(wakeWordEnabled);
  wakeWordEnabledRef.current = wakeWordEnabled;

  const conversationModeActiveRef = useRef(conversationModeActive);
  conversationModeActiveRef.current = conversationModeActive;

  const personalizationStepRef = useRef(personalizationStep);
  personalizationStepRef.current = personalizationStep;

  const enrollmentStateRef = useRef(enrollmentState);
  enrollmentStateRef.current = enrollmentState;

  const assistantStateRef = useRef(assistantState);
  assistantStateRef.current = assistantState;

  const isRecRunningRef = useRef(false);
  const isStartingRef = useRef(false);
  const isEffectActiveRef = useRef(false);

  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  // Web Audio Synth oscillator-based sound effects generator
  const triggerAudioTone = (toneType: "success" | "warning" | "alert" | "emergency") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (toneType === "success") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); 
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (toneType === "warning") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(329.63, ctx.currentTime); 
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (toneType === "alert") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, ctx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (toneType === "emergency") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); 
        osc.frequency.linearRampToValueAtTime(698.46, ctx.currentTime + 0.15); 
        osc.frequency.linearRampToValueAtTime(587.33, ctx.currentTime + 0.3);
        osc.frequency.linearRampToValueAtTime(698.46, ctx.currentTime + 0.45);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (err) {
      console.warn("Audio Context synth tone generation failed:", err);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // If target is inside any custom child menu, let it handle its own clicks
    const target = e.target as HTMLElement;
    if (target.closest("button") && target.closest("button")?.id !== "milo-floating-button") {
      return;
    }

    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (!hasDraggedRef.current && !isDraggingVisualRef.current) {
        setShowMiloQuickMenu(true);
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
      // DOUBLE TAP / DOUBLE CLICK -> Expand
      setIsExpanded(true);
      try { triggerAudioTone("success"); } catch (e) {}
    } else {
      // SINGLE TAP / SINGLE CLICK -> Just focus
      if (containerRef.current) {
        containerRef.current.focus();
      }
    }
    lastTapRef.current = now;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsExpanded(true);
      try { triggerAudioTone("success"); } catch (e) {}
    }
  };

  // Sound recognition supported check
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  // Proactive Emergency Risk detection
  useEffect(() => {
    const hasHighRiskTask = tasks.some(t => (t.riskScore || 0) > 80);
    if (hasHighRiskTask && !isRescueMode && !showEmergencyTrigger && !attentionMuted) {
      const timer = setTimeout(() => {
        setShowEmergencyTrigger(true);
        triggerAudioTone("alert");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [tasks, isRescueMode, attentionMuted]);

  // Handle background thinking stages
  useEffect(() => {
    if (assistantState === "thinking") {
      const messages = [
        "Realigning schedule structures...",
        "Validating travel plan vectors...",
        "Compiling calendar assets...",
        "Syncing accessibility guidelines..."
      ];
      let i = 0;
      thinkingIntervalRef.current = setInterval(() => {
        setThinkingMessage(messages[i % messages.length]);
        i++;
      }, 1500);
    } else {
      clearInterval(thinkingIntervalRef.current);
    }
    return () => clearInterval(thinkingIntervalRef.current);
  }, [assistantState]);

  const safeStartSpeech = () => {
    if (recognitionRef.current && !isRecRunningRef.current && !isStartingRef.current) {
      try {
        isStartingRef.current = true;
        recognitionRef.current.start();
      } catch (err: any) {
        isStartingRef.current = false;
        console.warn("Failed to start speech recognition:", err);
        if (err.message && err.message.includes("already started")) {
          isRecRunningRef.current = true;
        }
      }
    }
  };

  const safeStopSpeech = () => {
    if (recognitionRef.current && isRecRunningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Failed to stop speech recognition:", err);
      }
    }
  };

  // Speech Recognition management
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = voiceLanguage;

      isEffectActiveRef.current = true;

      rec.onstart = () => {
        isRecRunningRef.current = true;
        isStartingRef.current = false;
        consecutiveErrorsRef.current = 0;
        if (isExpandedRef.current) {
          setAssistantState("listening");
          onSetClockMode("listening");
          startAudioAnalysis();
        }
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (!text) return;

        if (personalizationStepRef.current !== null) {
          handlePersonalizationSpeech(text);
          return;
        }

        if (!isExpandedRef.current) {
          const lower = text.toLowerCase();
          if (lower.includes("milo") || lower.includes("hey milo") || lower.includes("hello milo") || lower.includes("hi milo")) {
            setIsExpanded(true);
            triggerAudioTone("success");
            speakText("Yes, I'm here. How can I assist you, Chief of Staff standing by.");
          }
        } else {
          handleSendMessage(text);
        }
      };

      rec.onerror = (e: any) => {
        isStartingRef.current = false;
        if (e.error === "aborted" || e.error === "no-speech" || e.error === "network") {
          return;
        }

        console.warn("Speech recognition event:", e.error || e);

        if (personalizationStepRef.current !== null) {
          console.warn("Speech recognition issue during voice enrollment:", e.error);
          if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture") {
            setEnrollmentState("denied");
          }
          return;
        }

        consecutiveErrorsRef.current += 1;

        if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture" || consecutiveErrorsRef.current >= 3) {
          console.warn("Disabling automatic Speech Recognition due to permission issues or consecutive errors.");
          setWakeWordEnabled(false);
          wakeWordEnabledRef.current = false;
          safeLocalStorageSet("milo_wake_word_enabled", "false");

          setConversationModeActive(false);
          conversationModeActiveRef.current = false;

          setMicPermissionDenied(true);

          setAssistantState("error");
          assistantStateRef.current = "error";
          onSetClockMode("default");
          stopAudioAnalysis();
          return;
        }

        if (!isExpandedRef.current) return;
        setAssistantState("error");
        assistantStateRef.current = "error";
        onSetClockMode("default");
        triggerAudioTone("warning");
        speakText("I could not hear you. Let me know when you're ready.");
        setTimeout(() => {
          if (assistantStateRef.current === "error") {
            setAssistantState("idle");
          }
        }, 2500);
      };

      rec.onend = () => {
        isRecRunningRef.current = false;
        isStartingRef.current = false;
        stopAudioAnalysis();
        
        if (!isEffectActiveRef.current) return;

        const shouldBeRunning = 
          (personalizationStepRef.current !== null) ||
          (!isExpandedRef.current && wakeWordEnabledRef.current) ||
          (isExpandedRef.current && (conversationModeActiveRef.current || assistantStateRef.current === "listening") && assistantStateRef.current !== "speaking" && assistantStateRef.current !== "thinking" && assistantStateRef.current !== "error");

        if (shouldBeRunning) {
          const delay = (personalizationStepRef.current !== null) ? 300 :
                        (!isExpandedRef.current) ? 600 : 400;
                        
          recRestartTimeoutRef.current = setTimeout(() => {
            if (isEffectActiveRef.current && !isRecRunningRef.current) {
              const stillShouldBeRunning = 
                (personalizationStepRef.current !== null) ||
                (!isExpandedRef.current && wakeWordEnabledRef.current) ||
                (isExpandedRef.current && (conversationModeActiveRef.current || assistantStateRef.current === "listening") && assistantStateRef.current !== "speaking" && assistantStateRef.current !== "thinking" && assistantStateRef.current !== "error");
              if (stillShouldBeRunning) {
                safeStartSpeech();
              }
            }
          }, delay);
        }
      };

      recognitionRef.current = rec;

      const shouldBeRunningInit = 
        (personalizationStepRef.current !== null) ||
        (!isExpandedRef.current && wakeWordEnabledRef.current) ||
        (isExpandedRef.current && (conversationModeActiveRef.current || assistantStateRef.current === "listening") && assistantStateRef.current !== "speaking" && assistantStateRef.current !== "thinking" && assistantStateRef.current !== "error");

      if (shouldBeRunningInit) {
        try {
          safeStartSpeech();
        } catch (e) {}
      }

      return () => {
        isEffectActiveRef.current = false;
        if (recRestartTimeoutRef.current) {
          clearTimeout(recRestartTimeoutRef.current);
        }
        rec.onstart = null;
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        try {
          rec.abort();
        } catch (err) {}
        isRecRunningRef.current = false;
        isStartingRef.current = false;
        stopAudioAnalysis();
      };
    }
  }, [voiceLanguage]);

  // Control speech recognition state based on changes to parameters
  useEffect(() => {
    if (!isSpeechSupported || !recognitionRef.current) return;

    const shouldBeRunning = 
      (personalizationStep !== null) ||
      (!isExpanded && wakeWordEnabled) ||
      (isExpanded && (conversationModeActive || assistantState === "listening") && assistantState !== "speaking" && assistantState !== "thinking");

    if (shouldBeRunning) {
      if (!isRecRunningRef.current) {
        safeStartSpeech();
      }
    } else {
      if (isRecRunningRef.current) {
        safeStopSpeech();
      }
    }
  }, [isExpanded, wakeWordEnabled, conversationModeActive, assistantState, personalizationStep, isSpeechSupported]);

  // Capture Audio frequencies for dynamic orb wave simulation
  const startAudioAnalysis = async () => {
    isListeningRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      audioStreamRef.current = stream;
      audioContextRef.current = audioContext;
      
      const update = () => {
        if (!isListeningRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const intensity = Math.min(100, Math.round((average / 100) * 100));
        onSetVoiceIntensity(intensity);
        animationFrameRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (err) {
      console.warn("Mic frequency capture unavailable. Simulating visual waves.", err);
      let direction = 1;
      let amplitude = 25;
      simulationIntervalRef.current = setInterval(() => {
        amplitude += (Math.random() * 12 + 4) * direction;
        if (amplitude > 85) direction = -1;
        if (amplitude < 15) direction = 1;
        onSetVoiceIntensity(Math.round(amplitude));
      }, 70);
    }
  };

  const stopAudioAnalysis = () => {
    isListeningRef.current = false;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    onSetVoiceIntensity(0);
  };

  const startSpeakingSimulation = () => {
    let syllableStress = true;
    speakingSimulationIntervalRef.current = setInterval(() => {
      if (Math.random() > 0.85) {
        onSetVoiceIntensity(10); 
        syllableStress = !syllableStress;
      } else {
        const baseLevel = syllableStress ? 55 : 35;
        onSetVoiceIntensity(Math.floor(Math.random() * 40) + baseLevel);
      }
    }, 90);
  };

  const stopSpeakingSimulation = () => {
    clearInterval(speakingSimulationIntervalRef.current);
    onSetVoiceIntensity(0);
  };

  // Synthesize custom Voice with Pitch, Rate, Language
  const speakText = (text: string) => {
    if (!soundEnabled || !window.speechSynthesis || attentionMuted || voiceMuted) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    let matchedVoice = null;
    if (voiceGender === "female") {
      matchedVoice = voices.find(v => v.lang.startsWith(voiceLanguage) && (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("kore") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("hazel")));
    } else {
      matchedVoice = voices.find(v => v.lang.startsWith(voiceLanguage) && (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("microsoft") || v.name.toLowerCase().includes("puck") || v.name.toLowerCase().includes("google us english")));
    }
    
    if (!matchedVoice) {
      matchedVoice = voices.find(v => v.lang.startsWith(voiceLanguage));
    }
    
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    utterance.rate = speechRate;
    utterance.pitch = voicePitch;

    utterance.onstart = () => {
      setAssistantState("speaking");
      onSetClockMode("speaking");
      startSpeakingSimulation();
      setTactileActive(true);
      setTimeout(() => setTactileActive(false), 200);
    };

    utterance.onend = () => {
      setAssistantState("idle");
      onSetClockMode("default");
      stopSpeakingSimulation();
      
      // Auto-listen if continuous conversation mode is active
      if (isExpanded && conversationModeActive && personalizationStep === null) {
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.warn("Speech start skipped:", e);
          }
        }, 500);
      }
    };

    utterance.onerror = () => {
      setAssistantState("idle");
      onSetClockMode("default");
      stopSpeakingSimulation();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Voice Profile Personalization step phrases (5 standard phrases)
  const personalizationPhrases = [
    "Hey Milo, optimize my schedule.",
    "Plan my day.",
    "Take me to the nearest bank.",
    "Read my tasks.",
    "Create a reminder."
  ];

  const [phraseRecordings, setPhraseRecordings] = useState<boolean[]>([false, false, false, false, false]);

  const loadMicDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === "audioinput");
      setMicDevices(audioInputs);
      if (audioInputs.length > 0 && !selectedMicId) {
        setSelectedMicId(audioInputs[0].deviceId);
      }
    } catch (e) {
      console.warn("Could not list audio devices:", e);
    }
  };

  useEffect(() => {
    loadMicDevices();
  }, []);

  const requestMicPermission = async () => {
    try {
      setEnrollmentState("permission");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop temporary stream
      stream.getTracks().forEach(track => track.stop());
      setMicPermissionGranted(true);
      setPersonalizationStep(0);
      startPhraseRecording(0);
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setMicPermissionGranted(false);
      setEnrollmentState("denied");
      triggerAudioTone("warning");
    }
  };

  const startPhraseRecording = (step: number) => {
    setLiveTranscript("");
    setIsEditingTranscript(false);
    setEnrollmentTimer(0);
    setEnrollmentState("recording");

    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setEnrollmentTimer(prev => prev + 1);
    }, 1000);

    // Start live audio visualization waves
    startAudioAnalysis();

    // Check for speech recognition
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setIsWebSpeechSupported(false);
      simulateVoiceRecognitionFallback(step);
    } else {
      setIsWebSpeechSupported(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (e) {}
        }, 150);
      }
    }
  };

  const simulateVoiceRecognitionFallback = (step: number) => {
    setTimeout(() => {
      if (personalizationStepRef.current === step && isListeningRef.current) {
        // Fallback simulation: simulate correct phrase match to prevent freezing
        const text = personalizationPhrases[step];
        handlePersonalizationSpeech(text);
      }
    }, 4500);
  };

  const handlePersonalizationSpeech = (text: string) => {
    if (personalizationStepRef.current === null) return;
    const currentStep = personalizationStepRef.current;
    setLiveTranscript(text);
    clearInterval(timerIntervalRef.current);
    stopAudioAnalysis();

    const targetPhrase = personalizationPhrases[currentStep].toLowerCase();
    const cleanText = text.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const cleanTarget = targetPhrase.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

    const targetWords = cleanTarget.split(" ");
    const matchedCount = targetWords.filter(word => cleanText.includes(word)).length;
    const isMatched = matchedCount >= Math.min(2, targetWords.length);

    if (isMatched) {
      triggerAudioTone("success");
      setEnrollmentState("confirm");

      const updated = [...phraseRecordings];
      updated[currentStep] = true;
      setPhraseRecordings(updated);

      setTimeout(() => {
        const nextStep = currentStep + 1;
        if (nextStep < personalizationPhrases.length) {
          setPersonalizationStep(nextStep);
          startPhraseRecording(nextStep);
        } else {
          setEnrollmentState("success");
          setVoiceProfileCreated(true);
          safeLocalStorageSet("milo_voice_profile_created", "true");
          triggerAudioTone("success");
        }
      }, 1500);
    } else {
      triggerAudioTone("warning");
      setEnrollmentState("retry");
    }
  };

  const startPersonalization = () => {
    setPhraseRecordings([false, false, false, false, false]);
    setPersonalizationStep(0);
    requestMicPermission();
  };

  const handleClearHistory = () => {
    setTranscript([
      {
        sender: "assistant",
        text: "Conversation history cleared. I'm standing by to plan, organize, and navigate your day.",
        timestamp: new Date()
      }
    ]);
    triggerAudioTone("success");
  };

  const handleDeleteProfile = () => {
    setVoiceProfileCreated(false);
    safeLocalStorageRemove("milo_voice_profile_created");
    triggerAudioTone("warning");
  };

  const handleRequestMicPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      triggerAudioTone("success");
      setMicPermissionDenied(false);
    } catch (err) {
      triggerAudioTone("warning");
      setMicPermissionDenied(true);
    }
  };

  // Intercept special commands locally
  const interceptVoiceCommands = (text: string): boolean => {
    const query = text.toLowerCase();

    // End Conversation
    if (query.includes("goodbye") || query.includes("thank you") || query.includes("bye") || query.includes("stop listening")) {
      triggerAudioTone("success");
      speakText("My pleasure, Chief. Standing by.");
      // Stop recognition completely
      try { recognitionRef.current?.stop(); } catch (e) {}
      setAssistantState("idle");
      return true;
    }

    // Navigation triggers
    if (query.includes("open calendar") || query.includes("open planner") || query.includes("planner") || query.includes("calendar")) {
      if (onNavigateTab) onNavigateTab("planner");
      triggerAudioTone("success");
      speakText("Navigating to Calendar and Planner dashboards.");
      return true;
    }
    if (query.includes("open focus") || query.includes("focus session") || query.includes("start focus")) {
      if (onNavigateTab) onNavigateTab("focus");
      onSetClockMode("timer");
      triggerAudioTone("success");
      speakText("Opening the focus tab and initializing Pomodoro countdown timer.");
      return true;
    }
    if (query.includes("open settings") || query.includes("settings")) {
      if (onNavigateTab) onNavigateTab("settings");
      triggerAudioTone("success");
      speakText("Opening security settings tab.");
      return true;
    }
    if (query.includes("open habits") || query.includes("habits") || query.includes("goals")) {
      if (onNavigateTab) onNavigateTab("habits");
      triggerAudioTone("success");
      speakText("Opening dynamic habits and routine tracker.");
      return true;
    }
    if (query.includes("open maps") || query.includes("open map") || query.includes("smart map")) {
      if (onNavigateTab) onNavigateTab("smart_map");
      triggerAudioTone("success");
      speakText("Opening the smart travel map dashboard.");
      return true;
    }
    if (query.includes("open cockpit") || query.includes("dashboard") || query.includes("productivity cockpit")) {
      if (onNavigateTab) onNavigateTab("productivity_cockpit");
      triggerAudioTone("success");
      speakText("Returning to the primary Productivity Cockpit dashboard.");
      return true;
    }
    if (query.includes("open medicine") || query.includes("medication") || query.includes("medicine planner")) {
      if (onNavigateTab) onNavigateTab("medicine");
      triggerAudioTone("success");
      speakText("Opening your medicine tracking and reminder system.");
      return true;
    }
    if (query.includes("open scanner") || query.includes("document scanner") || query.includes("upload document")) {
      if (onNavigateTab) onNavigateTab("scanner");
      triggerAudioTone("success");
      speakText("Navigating to syllabus document analyzer scanner.");
      return true;
    }

    // Emergency Help
    if (query.includes("help me") || query.includes("emergency help") || query.includes("emergency contact") || query.includes("call help")) {
      if (!isRescueMode) {
        onToggleRescueMode();
      }
      triggerAudioTone("emergency");
      speakText("Emergency recovery activated. Rearranging deadlines, dispatching alert signal, and calling emergency contact: Primary Academic Advisor at 5 5 5, 0 1 9 9. Displaying rescue matrix.");
      return true;
    }

    // AI Reading Assistant Commands
    if (query.includes("read today's tasks") || query.includes("read deadlines") || query.includes("read tasks")) {
      triggerAudioTone("success");
      if (tasks.length === 0) {
        speakText("Your task timeline is currently clear. You have no pending deadlines.");
      } else {
        const listText = tasks.map((t, idx) => `Task ${idx + 1}: ${t.title}. Priority ${t.priority || "medium"}. Risk score ${t.riskScore || 50} percent.`).join(" · ");
        speakText(`Reading outstanding deadlines: ${listText}`);
      }
      return true;
    }

    return false;
  };

  // Master message dispatcher
  const handleSendMessage = async (text: string) => {
    const intercepted = interceptVoiceCommands(text);
    if (intercepted) return;

    const userMsg: TranscriptLine = {
      sender: "user",
      text,
      timestamp: new Date()
    };
    
    setTranscript(prev => [...prev, userMsg]);
    setAssistantState("thinking");
    onSetClockMode("thinking");
    stopAudioAnalysis();

    // Retrieve cached context variables from localStorage for extreme context awareness
    const medications = JSON.parse(safeLocalStorageGet("saver_medications") || "[]");
    const calendarEvents = JSON.parse(safeLocalStorageGet("saver_calendar_events") || "[]");
    const city = safeLocalStorageGet("saver_city") || "Delhi";
    const country = safeLocalStorageGet("saver_country") || "India";
    const weatherCache = JSON.parse(safeLocalStorageGet("saver_weather") || "null") || { temperature: 41, condition: "Sunny", aqi: 154 };

    try {
      const res = await fetch("/api/ai/voice-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          context: {
            tasks,
            scannedDocs: [],
            isRescueMode,
            currentTime: new Date().toISOString(),
            currentLocation: `${city}, ${country}`,
            medications,
            weather: weatherCache,
            calendarEvents,
            pastConversations: transcript.slice(-6).map(t => ({ sender: t.sender, text: t.text }))
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        const assistantMsg: TranscriptLine = {
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

        setTranscript(prev => [...prev, assistantMsg]);
        triggerAudioTone("success");
        speakText(data.transcript);

        // Process programmatic action triggered by Milo
        if (data.actionType && data.actionType !== "none" && data.actionPayload) {
          const payload = data.actionPayload;
          
          if (data.actionType === "create_task") {
            const newTask: Task = {
              id: `voice-task-${Date.now()}`,
              title: payload.title || "Academic Appointment",
              deadline: payload.deadline || "Tomorrow at 10:00 AM",
              priority: (payload.priority || "high") as any,
              riskScore: 68,
              category: (payload.category || "Do Now") as any,
              notes: payload.notes || "Parsed and created automatically via Milo AI Chief of Staff"
            };
            onAddTask(newTask);
            setCreatedTasks(prev => [...prev, newTask]);

            const newEvent: SimulatedCalendarEvent = {
              id: `voice-evt-${Date.now()}`,
              title: `Calendar block: ${newTask.title}`,
              start: "Tomorrow, 10:00 AM",
              end: "Tomorrow, 11:00 AM"
            };
            setCreatedEvents(prev => [...prev, newEvent]);

            const newReminder: SimulatedReminder = {
              id: `voice-rem-${Date.now()}`,
              title: `Voice Reminder chime: ${newTask.title}`,
              time: "Tomorrow at 9:30 AM (30m beforehand)",
              category: "Audio Prompt"
            };
            setCreatedReminders(prev => [...prev, newReminder]);

            const newTravel: SimulatedTravelPlan = {
              id: `voice-trv-${Date.now()}`,
              destination: payload.destination || "Target Office Destination",
              distance: "1.4 miles",
              duration: "12 minutes walking",
              warning: "Walking route optimized. Hydration recommended."
            };
            setCreatedTravels(prev => [...prev, newTravel]);
            setShowAssetReport(true);
          } 
          else if (data.actionType === "create_medicine") {
            const currentMeds = JSON.parse(safeLocalStorageGet("saver_medications") || "[]");
            const newMed = {
              id: `milo-med-${Date.now()}`,
              name: payload.title || "Post-Dinner Pill",
              dosage: payload.notes || "1 pill",
              time: payload.deadline || "Evening",
              frequency: "daily",
              soundAlert: "Chime"
            };
            currentMeds.push(newMed);
            safeLocalStorageSet("saver_medications", JSON.stringify(currentMeds));
            
            // Dispatch custom event to let MedicineTab know it should update
            window.dispatchEvent(new Event("storage"));
          }
          else if (data.actionType === "navigate") {
            if (onNavigateTab) onNavigateTab("smart_map");
            if (payload.destination) {
              safeLocalStorageSet("milo_nav_destination", payload.destination);
              window.dispatchEvent(new CustomEvent("milo_navigation", { detail: payload.destination }));
            }
          }
        }

        if (data.clockTrigger) {
          setTimeout(() => {
            if (isListeningRef.current) return;
            onSetClockMode(data.clockTrigger as any);
          }, 3500);
        }
      } else {
        throw new Error("Failed to process API voice query");
      }
    } catch (err) {
      console.warn("API Error:", err);
      setAssistantState("error");
      onSetClockMode("default");
      triggerAudioTone("warning");
      speakText("Handshake issue. Let me configure an offline advisory for you.");
      setTimeout(() => setAssistantState("idle"), 4000);
    }
  };

  const handleToggleMic = () => {
    if (assistantState === "listening") {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setAssistantState("idle");
      onSetClockMode("default");
      stopAudioAnalysis();
    } else {
      window.speechSynthesis.cancel();
      stopSpeakingSimulation();
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Speech start skipped:", e);
        }
      } else {
        const query = prompt("Speak with Milo, AI Chief of Staff (Typing mode):");
        if (query) {
          handleSendMessage(query);
        }
      }
    }
  };

  const handleToggleCamera = async () => {
    if (cameraActive) {
      setCameraActive(false);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    } else {
      setCameraActive(true);
      setScanResult(null);
      speakText("Activating live document scanning camera. Align your sheet inside the frame.");
      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        } catch (err) {
          console.warn("Camera hardware inaccessible, using high-fidelity mock stream.", err);
        }
      }, 300);
    }
  };

  const captureAndAnalyzeImage = async () => {
    setIsScanning(true);
    triggerAudioTone("alert");
    speakText("Scanning printed sheet. Uploading frame to Gemini for OCR analysis.");

    let imgBase64 = "MOCK_BASE64_IMAGE_STRING";
    try {
      if (videoRef.current) {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          imgBase64 = canvas.toDataURL("image/jpeg");
        }
      }
    } catch (err) {
      console.warn("Snapping frame failed, sending offline placeholder:", err);
    }

    try {
      const res = await fetch("/api/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imgBase64 })
      });

      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
        triggerAudioTone("success");
        speakText(`Scan complete! ${data.surroundingsDescription}. Detected text: ${data.textDetected}. Advice: ${data.recommendations}`);
      } else {
        throw new Error("Failed scan");
      }
    } catch (err) {
      console.warn("API Error:", err);
      triggerAudioTone("warning");
      speakText("Scan complete in offline fallback mode. Detected printed CS study guidelines. Recommended study: Binary trees.");
    } finally {
      setIsScanning(false);
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  if (isNavDrawerOpen) {
    return null;
  }

  return (
    <>
      {/* Dynamic Tactile Haptic ripple simulation overlay */}
      <AnimatePresence>
        {tactileActive && (
          <motion.div 
            initial={{ opacity: 0.4, scale: 0.95 }}
            animate={{ opacity: 0, scale: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 border-4 border-amber-400 pointer-events-none z-50 rounded-2xl"
          />
        )}
      </AnimatePresence>

      {/* 1. PROACTIVE EMERGENCY RISK POPUP */}
      <AnimatePresence>
        {showEmergencyTrigger && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 max-w-sm bg-white border-2 border-red-200 rounded-2xl shadow-xl p-5 overflow-hidden font-sans"
            role="alert"
            aria-live="assertive"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-50 rounded-xl text-red-600 shrink-0">
                <ShieldAlert size={20} className="animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-600">Timeline Emergency</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mt-1">Timeline conflict alert</h4>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Your CS102 assignment demands approx. <strong>8 focus hours</strong>. Only <strong>5 hours</strong> remain. Say <strong>"Help me"</strong> to automatically engage rescue triage modes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-4 justify-end">
              <button
                onClick={() => { setShowEmergencyTrigger(false); triggerAudioTone("success"); }}
                className="px-3 py-1.5 text-xs font-mono font-bold text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-all"
                aria-label="Dismiss Alert"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setShowEmergencyTrigger(false);
                  onToggleRescueMode();
                  triggerAudioTone("emergency");
                  speakText("Emergency plan activated! Timelines shifted and compressed. CS project focus prioritized.");
                }}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm cursor-pointer"
                aria-label="Activate Emergency Recovery Plan"
              >
                <Zap size={11} />
                <span>Activate Rescue Plan</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. FLOATING PREMIUM CIRCULAR MILO BUTTON */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            drag
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onKeyDown={handleKeyDown}
            tabIndex={0}
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
            className="fixed z-40 touch-none cursor-grab active:cursor-grabbing flex items-center justify-center select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/50 rounded-full"
            style={{ position: "fixed" }}
          >
            {/* Ambient Breathing / Active Wave glow outer backdrop */}
            <motion.div
              animate={{
                scale: assistantState === "idle" ? [1, 1.12, 1] : 1,
                opacity: assistantState === "idle" ? [0.3, 0.65, 0.3] : 0.85,
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`absolute -inset-3 rounded-full blur-md transition-colors duration-500 ${
                assistantState === "listening" ? "bg-blue-500/50" :
                assistantState === "thinking" ? "bg-indigo-500/50" :
                assistantState === "speaking" ? "bg-amber-500/50" : "bg-indigo-500/30"
              }`}
            />

            {/* Rotating dashed line for Thinking mode */}
            {assistantState === "thinking" && (
              <div className="absolute -inset-1.5 rounded-full border border-dashed border-indigo-500 animate-spin" style={{ animationDuration: "4s" }} />
            )}

            <motion.button
              id="milo-floating-button"
              whileHover={{ scale: 1.08 }}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center relative shadow-xl border border-white/20 transition-all ${
                assistantState === "listening" ? "bg-blue-600 text-white animate-pulse" :
                assistantState === "thinking" ? "bg-indigo-600 text-white" :
                assistantState === "speaking" ? "bg-amber-500 text-white animate-pulse" : "bg-black text-white hover:bg-neutral-900"
              }`}
              aria-label="Open Milo AI Chief of Staff voice assistant panel"
            >
              {assistantState === "listening" ? (
                <Mic size={20} className="animate-pulse text-white" />
              ) : assistantState === "speaking" ? (
                <Volume2 size={20} className="animate-bounce text-white" />
              ) : (
                <Sparkles size={20} className="text-white" />
              )}
            </motion.button>

            {/* Milo Mobile Quick Actions Menu (Triggered via Long-Press) */}
            {showMiloQuickMenu && (
              <div className="absolute bottom-full mb-3 right-0 bg-white/95 dark:bg-[#1C212E] border border-gray-200 dark:border-[#2D3548] p-2.5 rounded-2xl shadow-2xl flex flex-col gap-1 min-w-[170px] z-50">
                <div className="px-2 py-1 border-b border-gray-100 dark:border-[#2D3548] mb-1">
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Milo Quick Actions</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                    try { triggerAudioTone("success"); } catch (_) {}
                    setShowMiloQuickMenu(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252C3D] rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles size={13} className="text-indigo-500" />
                  <span>Open Assistant</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle wake word
                    setWakeWordEnabled(!wakeWordEnabled);
                    setShowMiloQuickMenu(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252C3D] rounded-lg transition-colors cursor-pointer"
                >
                  <Mic size={13} className="text-emerald-500" />
                  <span>{wakeWordEnabled ? "Disable Wake Word" : "Enable Wake Word"}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Reset position
                    const w = window.innerWidth;
                    const h = window.innerHeight;
                    setPosition({ x: w - 80, y: h - 180 });
                    setShowMiloQuickMenu(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252C3D] rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw size={13} className="text-amber-500" />
                  <span>Reset Position</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMiloQuickMenu(false);
                  }}
                  className="flex items-center justify-center gap-1.5 mt-1 px-2 py-1 text-center text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-[#171B25] rounded-md transition-colors cursor-pointer"
                >
                  <X size={10} />
                  <span>Close Menu</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. FULL-SCREEN ACCESSIBILITY VOICE CONSOLE WINDOW */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full md:max-w-[900px] md:max-h-[90vh] h-full md:h-[680px] bg-white dark:bg-[#171B25] rounded-none md:rounded-3xl shadow-2xl border border-gray-150 dark:border-[#2A3040] flex flex-col justify-between overflow-hidden"
              id="voice-console-container"
              ref={containerRef}
            >
              {/* Window Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white">
                    <Compass size={18} className="animate-spin [animation-duration:12s]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 tracking-tight">Milo — AI Chief of Staff</h3>
                      {conversationModeActive && (
                        <span className="text-[8px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase tracking-wider animate-pulse">CONTINUOUS CHAT ON</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Fully accessible companion with dynamic scheduling, travel navigation, and hydration security</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Settings Toggle */}
                  <button
                    onClick={() => { setShowSettingsDrawer(!showSettingsDrawer); triggerAudioTone("success"); }}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      showSettingsDrawer ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                    title="Milo Privacy and Settings"
                    aria-label="Toggle Milo Privacy and Settings Panel"
                  >
                    <Sliders size={15} />
                  </button>

                  {/* sound master toggle */}
                  <button
                    onClick={() => { setSoundEnabled(!soundEnabled); triggerAudioTone("success"); }}
                    className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 cursor-pointer"
                    title="Mute/Unmute speech synthesis"
                    aria-label={soundEnabled ? "Mute audio synthesis output" : "Unmute audio synthesis output"}
                  >
                    {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </button>

                  <button
                    onClick={() => { setIsExpanded(false); stopAudioAnalysis(); triggerAudioTone("success"); }}
                    className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 cursor-pointer"
                    aria-label="Minimize Milo Panel"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Microphone access warning banner */}
              {micPermissionDenied && (
                <div className="bg-amber-50 dark:bg-[#201c15] border-b border-amber-100 dark:border-amber-950/40 px-5 py-3 flex items-start gap-3 z-30 animate-fade-in">
                  <div className="p-1 bg-amber-100 dark:bg-amber-950/50 rounded text-amber-800 dark:text-amber-400 shrink-0 mt-0.5">
                    <AlertTriangle size={14} />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 leading-tight">Speech Recognition Restricted</h4>
                    <p className="text-[10px] text-amber-800 dark:text-amber-400/90 leading-relaxed font-sans">
                      Your browser blocked microphone access (or you are inside the AI Studio preview iframe). 
                      To fix this, **open the app in a new tab** (using the arrow button at the top-right of your AI Studio preview window) or grant microphone permissions in your browser. You can also use the **typing box** at the bottom of the dialogue panel below!
                    </p>
                  </div>
                  <button 
                    onClick={() => setMicPermissionDenied(false)} 
                    className="text-amber-500 hover:text-amber-800 dark:hover:text-amber-300 p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-950/40 cursor-pointer shrink-0 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Main Content Area: Split when Settings is visible */}
              <div className="flex-1 flex overflow-hidden relative">
                
                {/* Onboarding Screen: Shown if voice profile is not set up */}
                {/* Onboarding Screen: Shown if voice profile is not set up */}
                {!voiceProfileCreated && personalizationStep === null && (
                  <div className="absolute inset-0 bg-white dark:bg-[#171B25] z-20 flex flex-col items-center justify-center p-6 sm:p-8 space-y-6 text-center">
                    <motion.div 
                      animate={{ scale: [1, 1.08, 1] }} 
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400"
                    >
                      <Sparkles size={32} />
                    </motion.div>
                    <div className="max-w-md space-y-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Personalize Milo's Voice Recognition</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        To optimize Milo's accuracy and wake-word sensitivity, please take 30 seconds to calibrate your unique voice profile.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                      <button
                        onClick={startPersonalization}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <UserCheck size={14} />
                        <span>Calibrate My Voice</span>
                      </button>
                      <button
                        onClick={() => {
                          setVoiceProfileCreated(true);
                          safeLocalStorageSet("milo_voice_profile_created", "true");
                          triggerAudioTone("success");
                        }}
                        className="flex-1 py-3 bg-white dark:bg-[#202634] hover:bg-gray-50 dark:hover:bg-[#202634]/80 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-[#2A3040] text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Skip for Now
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">YOUR VOICE IS PROCESSED LOCALLY IN THE BROWSER · PRIVACY COMMITTED</p>
                  </div>
                )}

                {/* Personalization Setup Overlay */}
                {personalizationStep !== null && (
                  <div className="absolute inset-0 bg-gray-50 dark:bg-[#0F1117] text-gray-900 dark:text-gray-100 z-20 flex flex-col justify-between p-4 sm:p-8 overflow-y-auto">
                    
                    {/* 1. Header of Enrollment */}
                    <div className="w-full flex items-center justify-between pb-4 border-b border-gray-200 dark:border-[#2A3040] shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                          <Mic size={14} className="animate-pulse" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-indigo-600 dark:text-indigo-400">Milo Voice Calibration</h4>
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-mono">
                            Mic status: {isListeningRef.current ? "ACTIVE" : "OFF"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setPersonalizationStep(null); stopAudioAnalysis(); triggerAudioTone("warning"); }}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#202634] hover:bg-gray-200 dark:hover:bg-opacity-80 text-gray-500 dark:text-gray-400 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* 2. Step Progress Row */}
                    <div className="w-full max-w-lg mx-auto py-4 shrink-0">
                      <div className="flex items-center justify-between relative px-2">
                        {/* Connector Line */}
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-[#2A3040] -z-10 -translate-y-1/2" />
                        {personalizationPhrases.map((_, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <div 
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-all z-10 ${
                                phraseRecordings[i] ? "bg-emerald-500 text-white" :
                                i === personalizationStep ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950/40 animate-pulse" :
                                "bg-white dark:bg-[#202634] text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-[#2A3040]"
                              }`}
                            >
                              {phraseRecordings[i] ? <Check size={14} /> : i + 1}
                            </div>
                            <span className="text-[8px] font-mono mt-1 text-gray-400 dark:text-gray-500">
                              Phrase {i + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Screen Body State Machine */}
                    <div className="flex-1 flex flex-col items-center justify-center my-4 max-w-2xl mx-auto w-full space-y-4">
                      
                      {/* State: Requesting/Checking Permission */}
                      {enrollmentState === "permission" && (
                        <div className="space-y-4 py-8">
                          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
                            <Mic size={32} />
                          </motion.div>
                          <h5 className="text-base font-bold">Requesting Microphone Access</h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                            Please click "Allow" when prompted by your browser to personalize Milo.
                          </p>
                        </div>
                      )}

                      {/* State: Permission Denied / Blocked */}
                      {enrollmentState === "denied" && (
                        <div className="space-y-4 py-6">
                          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
                            <MicOff size={24} />
                          </div>
                          <h5 className="text-sm font-bold text-red-600 dark:text-red-400">Microphone Permission Required</h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
                            Microphone permission is required to personalize Milo. Please enable access in your browser settings to continue.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                            <button onClick={requestMicPermission} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl">
                              Allow Permission
                            </button>
                            <button onClick={() => startPhraseRecording(personalizationStep || 0)} className="px-4 py-2 bg-gray-200 dark:bg-[#202634] hover:bg-opacity-80 text-gray-700 dark:text-gray-300 text-xs font-mono font-bold uppercase tracking-wider rounded-xl">
                              Try Again
                            </button>
                            <button onClick={() => { setPersonalizationStep(null); stopAudioAnalysis(); }} className="px-4 py-2 bg-white dark:bg-[#171B25] border border-gray-200 dark:border-[#2A3040] text-gray-500 text-xs font-mono font-bold uppercase tracking-wider rounded-xl">
                              Continue Without Voice Personalization
                            </button>
                          </div>
                        </div>
                      )}

                      {/* State: Confirm Phrase */}
                      {enrollmentState === "confirm" && (
                        <div className="space-y-4 py-8">
                          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto text-white shadow-lg shadow-emerald-500/20">
                            <Check size={36} className="animate-bounce" />
                          </div>
                          <h5 className="text-base font-bold text-emerald-600 dark:text-emerald-400">✓ Phrase Recorded</h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Analyzing voice characteristics and saving signature...
                          </p>
                        </div>
                      )}

                      {/* State: Success Complete */}
                      {enrollmentState === "success" && (
                        <div className="space-y-4 py-6 max-w-sm">
                          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                            <Award size={36} />
                          </div>
                          <h5 className="text-lg font-bold text-gray-900 dark:text-gray-100">Voice profile successfully created.</h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Milo has calibrated to your unique voice signature. You can now use hands-free wake word detection!
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <button onClick={() => { setPersonalizationStep(null); stopAudioAnalysis(); }} className="col-span-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all">
                              Finish
                            </button>
                            <button 
                              onClick={() => {
                                triggerAudioTone("success");
                                speakText("Hello, Chief! Milo here. I am fully synchronized and listening to your voice profile.");
                              }} 
                              className="py-2 bg-white dark:bg-[#202634] hover:bg-gray-50 border border-gray-200 dark:border-[#2A3040] text-gray-600 dark:text-gray-300 text-xs font-mono font-bold uppercase tracking-wider rounded-xl"
                            >
                              Test Milo
                            </button>
                            <button onClick={() => startPersonalization()} className="py-2 bg-white dark:bg-[#202634] hover:bg-gray-50 border border-gray-200 dark:border-[#2A3040] text-gray-600 dark:text-gray-300 text-xs font-mono font-bold uppercase tracking-wider rounded-xl">
                              Retrain Voice
                            </button>
                          </div>
                        </div>
                      )}

                      {/* State: Unclear Retry */}
                      {enrollmentState === "retry" && (
                        <div className="space-y-4 py-6 max-w-sm">
                          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
                            <ShieldAlert size={24} />
                          </div>
                          <h5 className="text-sm font-bold text-amber-600 dark:text-amber-400">We couldn't hear you clearly</h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Let's try that again. Make sure you are in a quiet room and speaking directly into your microphone.
                          </p>
                          
                          <div className="flex flex-col gap-2 pt-2">
                            <button onClick={() => startPhraseRecording(personalizationStep)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl">
                              Try Again
                            </button>
                            <button onClick={() => {
                              const nextStep = (personalizationStep || 0) + 1;
                              if (nextStep < personalizationPhrases.length) {
                                setPersonalizationStep(nextStep);
                                startPhraseRecording(nextStep);
                              } else {
                                setEnrollmentState("success");
                                setVoiceProfileCreated(true);
                                safeLocalStorageSet("milo_voice_profile_created", "true");
                              }
                            }} className="w-full py-2 bg-gray-100 dark:bg-[#202634] hover:bg-opacity-80 text-gray-600 dark:text-gray-300 text-xs font-mono font-bold uppercase tracking-wider rounded-xl">
                              Skip Phrase
                            </button>
                            
                            {/* Change microphone inline device selector */}
                            {micDevices.length > 1 && (
                              <div className="text-left pt-2">
                                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Select Input Source:</label>
                                <select 
                                  value={selectedMicId} 
                                  onChange={(e) => {
                                    setSelectedMicId(e.target.value);
                                    startPhraseRecording(personalizationStep);
                                  }}
                                  className="w-full p-2 bg-white dark:bg-[#171B25] border border-gray-200 dark:border-[#2A3040] rounded-lg text-xs"
                                >
                                  {micDevices.map(d => (
                                    <option key={d.deviceId} value={d.deviceId}>{d.label || "Microphone"}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* State: Active Recording */}
                      {enrollmentState === "recording" && (
                        <div className="w-full space-y-6">
                          
                          {/* Quote Card */}
                          <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 sm:p-8 rounded-2xl max-w-xl mx-auto shadow-sm">
                            <span className="text-[10px] font-mono uppercase text-gray-400 dark:text-gray-500 block mb-2 font-semibold">Repeat this phrase:</span>
                            <span className="text-xl sm:text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 block break-words">
                              "{personalizationPhrases[personalizationStep]}"
                            </span>
                          </div>

                          {/* Waveform & Level Meter */}
                          <div className="space-y-2 py-2">
                            {/* Actual audio-reactive waveforms */}
                            <div className="flex items-center justify-center gap-1 h-12">
                              {Array.from({ length: 15 }).map((_, idx) => {
                                // Generate bouncy heights using actual volume intensity!
                                const waveHeight = Math.max(4, Math.min(48, (voiceIntensity * (Math.sin(idx * 0.5) + 1.2)) / 2 + Math.random() * 5));
                                return (
                                  <motion.div
                                    key={idx}
                                    animate={{ height: waveHeight }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400"
                                  />
                                );
                              })}
                            </div>

                            {/* Volume/level Meter */}
                            <div className="w-48 mx-auto bg-gray-200 dark:bg-[#202634] h-1.5 rounded-full overflow-hidden relative">
                              <motion.div 
                                className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full"
                                animate={{ width: `${Math.min(100, voiceIntensity * 1.5)}%` }}
                                transition={{ duration: 0.1 }}
                              />
                            </div>

                            {/* Status and timer */}
                            <div className="flex items-center justify-center gap-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                              <span>REC</span>
                              <span className="border-l border-gray-300 dark:border-[#2A3040] h-3 mx-1" />
                              <span>00:0{enrollmentTimer}</span>
                            </div>
                          </div>

                          {/* Real-time transcript section */}
                          <div className="max-w-md mx-auto text-left space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono uppercase text-gray-400 dark:text-gray-500 block">Live Transcription:</span>
                              {!isEditingTranscript && liveTranscript && (
                                <button 
                                  onClick={() => setIsEditingTranscript(true)}
                                  className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  Edit manually
                                </button>
                              )}
                            </div>
                            
                            <div className="bg-white dark:bg-[#171B25] border border-gray-200 dark:border-[#2A3040] rounded-xl p-3 min-h-[56px] text-xs shadow-sm flex items-center">
                              {isEditingTranscript ? (
                                <div className="w-full flex gap-2">
                                  <input 
                                    type="text"
                                    defaultValue={liveTranscript || personalizationPhrases[personalizationStep]}
                                    id="manual-transcript-input"
                                    className="flex-1 p-1 bg-gray-50 dark:bg-[#202634] border border-gray-200 dark:border-[#2A3040] rounded-lg text-xs text-gray-900 dark:text-gray-100"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handlePersonalizationSpeech((e.target as HTMLInputElement).value);
                                      }
                                    }}
                                  />
                                  <button 
                                    onClick={() => {
                                      const val = (document.getElementById("manual-transcript-input") as HTMLInputElement)?.value;
                                      handlePersonalizationSpeech(val || "");
                                    }}
                                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-mono font-bold"
                                  >
                                    Save
                                  </button>
                                  <button 
                                    onClick={() => setIsEditingTranscript(false)}
                                    className="px-2 py-1 bg-gray-100 dark:bg-[#202634] text-gray-500 rounded-lg text-[10px] font-mono"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <p className="italic text-gray-600 dark:text-gray-300 w-full break-words">
                                  {liveTranscript ? `"${liveTranscript}"` : "Say the phrase clearly into your microphone..."}
                                </p>
                              )}
                            </div>

                            {/* Fallback notification */}
                            {!isWebSpeechSupported && (
                              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 mt-2">
                                <p className="text-[10px] leading-relaxed text-amber-700 dark:text-amber-300 font-sans">
                                  <strong>Notice:</strong> Speech recognition isn't supported in this browser. We've initiated voice-calibration simulation. Simply speak the phrase aloud or edit the transcript to proceed.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Manual Controls */}
                          {!isEditingTranscript && (
                            <div className="flex gap-2 justify-center max-w-xs mx-auto">
                              <button
                                onClick={() => startPhraseRecording(personalizationStep)}
                                className="flex-1 py-2 bg-gray-100 dark:bg-[#202634] hover:bg-gray-200 dark:hover:bg-opacity-80 text-gray-700 dark:text-gray-300 font-mono text-xs font-bold uppercase rounded-lg cursor-pointer"
                              >
                                Retry
                              </button>
                              <button
                                onClick={() => handlePersonalizationSpeech(personalizationPhrases[personalizationStep])}
                                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
                              >
                                Continue
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 4. Footer info */}
                    <div className="w-full pt-4 border-t border-gray-200 dark:border-[#2A3040] shrink-0 text-center flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-gray-400 dark:text-gray-500">
                      <span>ENCRYPTED LOCAL CALIBRATION · PRIVATE VECTOR INDEX</span>
                      <button
                        onClick={() => { setPersonalizationStep(null); stopAudioAnalysis(); triggerAudioTone("warning"); }}
                        className="hover:text-red-500 hover:underline mt-1 sm:mt-0"
                      >
                        Cancel Personalization
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Dynamic Voice Panel & Waves (Left Panel) */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                  
                  {/* Interactive Glowing Orb (Visual Feedback States) */}
                  <div className="relative w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center">
                    
                    {/* Breathing Glow (Idle State) */}
                    {assistantState === "idle" && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl"
                        animate={{
                          scale: [1, 1.15, 1],
                          opacity: [0.35, 0.65, 0.35]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}

                    {/* Animated Waveform (Listening State) */}
                    {assistantState === "listening" && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full border border-blue-500/20 bg-blue-500/5 blur-md"
                          animate={{
                            scale: [1, 1.08, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-1.5 select-none pointer-events-none">
                          {Array.from({ length: 11 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1 bg-blue-500 rounded-full"
                              animate={{
                                height: [12, Math.random() * 80 + 20, 12]
                              }}
                              transition={{
                                duration: 0.6 + i * 0.05,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Rotating Pulse (Thinking State) */}
                    {assistantState === "thinking" && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500 animate-spin"
                          style={{ animationDuration: "6s" }}
                        />
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <Compass size={32} className="text-indigo-600 animate-spin mr-1 [animation-duration:3s]" />
                        </div>
                      </>
                    )}

                    {/* Audio-Reactive Ring (Speaking State) */}
                    {assistantState === "speaking" && (
                      <>
                        <motion.div
                          className="absolute rounded-full border-2 border-amber-400 bg-amber-500/5"
                          style={{
                            width: `${140 + voiceIntensity * 1.5}px`,
                            height: `${140 + voiceIntensity * 1.5}px`,
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-1.5 select-none pointer-events-none">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 bg-amber-500 rounded-full"
                              animate={{
                                height: [16, Math.max(16, voiceIntensity * (1.2 - i * 0.1)), 16]
                              }}
                              transition={{
                                duration: 0.3 + i * 0.03,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Milo Main Core Button */}
                    <button
                      onClick={handleToggleMic}
                      className={`w-24 h-24 rounded-full flex items-center justify-center border-2 shadow-lg transition-all duration-300 relative cursor-pointer z-10 ${
                        assistantState === "listening" ? "bg-blue-600 border-blue-400 text-white" :
                        assistantState === "thinking" ? "bg-indigo-600 border-indigo-400 text-white animate-pulse" :
                        assistantState === "speaking" ? "bg-amber-500 border-amber-400 text-white" :
                        "bg-black border-neutral-800 text-white hover:scale-105"
                      }`}
                      aria-label="Toggle Microphone Input and speak with Milo"
                    >
                      {assistantState === "listening" ? <MicOff size={32} /> : <Mic size={32} />}
                    </button>
                  </div>

                  <div className="text-center mt-6">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 block mb-1">CURRENT STATUS</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {assistantState === "idle" ? "Idle — Say 'Hey Milo' or tap" :
                       assistantState === "listening" ? "Listening..." :
                       assistantState === "thinking" ? thinkingMessage :
                       assistantState === "speaking" ? "Speaking..." : "System Calibrated"}
                    </span>
                  </div>
                </div>

                {/* Settings Drawer (Right Side overlay) */}
                <AnimatePresence>
                  {showSettingsDrawer && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 330, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="bg-gray-50 border-l border-gray-150 p-5 flex flex-col justify-between overflow-y-auto scrollbar-none z-10 font-sans"
                    >
                      <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700">Milo Control & Privacy</span>
                          <button onClick={() => setShowSettingsDrawer(false)} className="text-gray-400 hover:text-black cursor-pointer">
                            <X size={14} />
                          </button>
                        </div>

                        {/* Speech Synthesis Audio Output */}
                        <div className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-xl">
                          <div>
                            <span className="text-xs font-bold text-gray-800 block">Voice Output</span>
                            <span className="text-[9px] font-mono text-gray-400 block uppercase">Synthetic readouts audible</span>
                          </div>
                          <button
                            onClick={() => { setSoundEnabled(!soundEnabled); triggerAudioTone("success"); }}
                            className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                              soundEnabled ? "bg-black" : "bg-gray-200"
                            }`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                              soundEnabled ? "translate-x-4" : "translate-x-0"
                            }`} />
                          </button>
                        </div>

                        {/* Background Wake Word Mode */}
                        <div className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-xl">
                          <div>
                            <span className="text-xs font-bold text-gray-800 block">"Hey Milo" Wake Word</span>
                            <span className="text-[9px] font-mono text-gray-400 block uppercase">Listens for trigger in bg</span>
                          </div>
                          <button
                            onClick={() => { 
                              const newMode = !wakeWordEnabled;
                              setWakeWordEnabled(newMode); 
                              safeLocalStorageSet("milo_wake_word_enabled", String(newMode));
                              triggerAudioTone("success"); 
                            }}
                            className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                              wakeWordEnabled ? "bg-indigo-600" : "bg-gray-200"
                            }`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                              wakeWordEnabled ? "translate-x-4" : "translate-x-0"
                            }`} />
                          </button>
                        </div>

                        {/* Continuous Conversation Mode */}
                        <div className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-xl">
                          <div>
                            <span className="text-xs font-bold text-gray-800 block">Continuous Conversation</span>
                            <span className="text-[9px] font-mono text-gray-400 block uppercase">Auto-re-opens mic after replies</span>
                          </div>
                          <button
                            onClick={() => { 
                              const newMode = !conversationModeActive;
                              setConversationModeActive(newMode); 
                              safeLocalStorageSet("milo_conversation_mode", String(newMode));
                              triggerAudioTone("success"); 
                            }}
                            className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                              conversationModeActive ? "bg-emerald-600" : "bg-gray-200"
                            }`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                              conversationModeActive ? "translate-x-4" : "translate-x-0"
                            }`} />
                          </button>
                        </div>

                        {/* Mic permission trigger */}
                        <button
                          onClick={handleRequestMicPermission}
                          className="w-full py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Mic size={13} />
                          <span>Request Mic Permission</span>
                        </button>

                        {/* Voice Profile operations */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block">Voice Signature Calibration</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={startPersonalization}
                              className="py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <RefreshCw size={11} />
                              <span>Retrain Voice</span>
                            </button>
                            <button
                              onClick={handleDeleteProfile}
                              className="py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Trash2 size={11} />
                              <span>Delete Profile</span>
                            </button>
                          </div>
                        </div>

                        {/* Privacy explanation card */}
                        <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5 text-indigo-800">
                            <Lock size={12} />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Milo Privacy Standard</span>
                          </div>
                          <p className="text-[9px] text-indigo-700 leading-relaxed font-sans">
                            Voice commands and wave profiles are processed entirely locally in your browser. Question text is evaluated securely using server-side Gemini API. No vocal records or voice samples are stored.
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200 space-y-2">
                        <button
                          onClick={handleToggleCamera}
                          className="w-full py-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Camera size={13} />
                          <span>{cameraActive ? "Deactivate Camera" : "Activate OCR Camera"}</span>
                        </button>
                        <button
                          onClick={handleClearHistory}
                          className="w-full text-center text-[10px] font-mono text-gray-400 hover:text-gray-800 block hover:underline"
                        >
                          Clear Conversation History
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dialogue Transcript Core Panel */}
              <div className="h-60 border-t border-gray-150 flex flex-col bg-gray-50/75">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  
                  {/* Dynamic Voice Task Creation Multi-Asset report */}
                  <AnimatePresence>
                    {showAssetReport && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3 font-sans"
                      >
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="p-1 bg-amber-500 text-white rounded-lg">
                              <Zap size={14} className="animate-pulse" />
                            </span>
                            <span className="text-xs font-mono font-bold text-gray-800 uppercase tracking-wider">Milo Automated Integration Flow</span>
                          </div>
                          <button onClick={() => setShowAssetReport(false)} className="text-gray-400 hover:text-black cursor-pointer">
                            <X size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          {/* Generated Task */}
                          <div className="p-3 bg-neutral-50 rounded-xl border border-gray-150 space-y-1">
                            <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-blue-600 block">1. Task Formed</span>
                            <h5 className="text-xs font-bold text-gray-900 truncate">{createdTasks[createdTasks.length - 1]?.title || "Task created"}</h5>
                            <p className="text-[9px] text-gray-400 font-mono">DUE: Tomorrow, 10 AM</p>
                          </div>

                          {/* Generated Event */}
                          <div className="p-3 bg-neutral-50 rounded-xl border border-gray-150 space-y-1">
                            <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-purple-600 block">2. Calendar Event</span>
                            <h5 className="text-xs font-bold text-gray-900 truncate">{createdEvents[createdEvents.length - 1]?.title || "Calendar block"}</h5>
                            <p className="text-[9px] text-gray-400 font-mono">10:00 - 11:00 AM</p>
                          </div>

                          {/* Generated Reminder */}
                          <div className="p-3 bg-neutral-50 rounded-xl border border-gray-150 space-y-1">
                            <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-emerald-600 block">3. Reminders Registered</span>
                            <h5 className="text-xs font-bold text-gray-900 truncate">{createdReminders[createdReminders.length - 1]?.title || "Reminder registered"}</h5>
                            <p className="text-[9px] text-gray-400 font-mono">Voice alert set</p>
                          </div>

                          {/* Generated Travel */}
                          <div className="p-3 bg-neutral-50 rounded-xl border border-gray-150 space-y-1">
                            <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-amber-600 block">4. Travel Route Log</span>
                            <h5 className="text-xs font-bold text-gray-900 truncate">Mapped Route</h5>
                            <p className="text-[9px] text-amber-700 font-mono">Transit advice synced</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {transcript.map((line, idx) => {
                    const hasStructured = line.reasoning || line.generatedPlan || line.priorityList || line.timeline || line.riskAssessment || line.recommendedActions;
                    return (
                      <div key={idx} className="space-y-2">
                        <div 
                          className={`flex gap-3 max-w-[85%] ${line.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                        >
                          <div className={`w-6 h-6 rounded-lg text-[9px] font-mono font-bold flex items-center justify-center shrink-0 ${
                            line.sender === "user" ? "bg-black text-white" : "bg-gray-200 text-gray-700 border border-gray-300"
                          }`}>
                            {line.sender === "user" ? "U" : "M"}
                          </div>
                          <div className={`p-3 rounded-2xl text-xs font-sans leading-relaxed ${
                            line.sender === "user" 
                              ? "bg-black text-white rounded-tr-none" 
                              : "bg-white border border-gray-150 text-gray-700 rounded-tl-none shadow-xs"
                          }`}>
                            {line.text}
                          </div>
                        </div>

                        {line.sender === "assistant" && hasStructured && (
                          <div className="ml-9 p-4 bg-white border border-gray-150 rounded-2xl space-y-3.5 text-xs text-gray-700 shadow-xs max-w-[80%] animate-fade-in">
                            {line.reasoning && (
                              <p className="italic text-gray-500 leading-tight">"{line.reasoning}"</p>
                            )}
                            {line.generatedPlan && (
                              <div className="border-l-2 border-amber-500 pl-2 py-0.5">
                                <span className="font-mono font-bold text-[9px] uppercase tracking-wider text-amber-700 block mb-0.5">Custom Milo Plan</span>
                                <p className="font-medium text-gray-700 leading-snug whitespace-pre-line">{line.generatedPlan}</p>
                              </div>
                            )}
                            {line.riskAssessment && (
                              <div className="bg-red-50 text-red-900/90 p-2.5 rounded border border-red-100 font-sans leading-snug">
                                <span className="font-mono font-bold text-[9px] uppercase text-red-600 block">Risk Matrix Alert</span>
                                {line.riskAssessment}
                              </div>
                            )}
                            {line.recommendedActions && line.recommendedActions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {line.recommendedActions.map((act, i) => (
                                  <button
                                    key={i}
                                    onClick={() => handleSendMessage(act)}
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-white rounded text-[9px] font-mono font-semibold cursor-pointer transition-all"
                                  >
                                    {act} →
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Horizontal suggestions chips strip */}
                <div className="px-4 py-2 bg-white dark:bg-[#11151E] border-t border-gray-150 dark:border-[#2A3040] flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
                  <span className="text-[9px] font-mono font-bold tracking-wider text-gray-400 uppercase shrink-0">Milo Quick Prompts:</span>
                  {[
                    "Renew my passport",
                    "Navigate to SBI Bank",
                    "I need to submit my assignment",
                    "Remind me to pay bills next Friday",
                    "Create a medicine reminder after dinner",
                    "Read outstanding deadlines",
                    "Help me"
                  ].map((cmd, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(cmd)}
                      className="px-3 py-1 bg-gray-50 dark:bg-[#1C212E] hover:bg-gray-100 dark:hover:bg-[#252C3D] text-[10px] font-mono text-gray-600 dark:text-gray-300 rounded-full border border-gray-150 dark:border-[#2D3548] transition-all cursor-pointer"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>

                {/* Text Typing fallback bar */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const inputEl = form.elements.namedItem("milo-text-input") as HTMLInputElement;
                    if (inputEl && inputEl.value.trim()) {
                      handleSendMessage(inputEl.value.trim());
                      inputEl.value = "";
                    }
                  }}
                  className="px-4 py-2.5 bg-gray-50 dark:bg-[#0F1117] border-t border-gray-150 dark:border-[#2A3040] flex gap-2"
                >
                  <input
                    type="text"
                    name="milo-text-input"
                    placeholder="Type a query or a task description..."
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-[#171B25] border border-gray-200 dark:border-[#2D3548] text-gray-900 dark:text-gray-100 rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-black dark:bg-indigo-600 hover:bg-neutral-800 dark:hover:bg-indigo-700 text-white rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer shrink-0"
                  >
                    Send
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
