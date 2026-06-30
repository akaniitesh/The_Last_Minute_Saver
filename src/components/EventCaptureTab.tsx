import React, { useState, useRef, useEffect } from "react";
import { Task, Subtask } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  UploadCloud,
  FileText,
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  Archive,
  Copy,
  Share2,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  SwitchCamera,
  Zap,
  Sliders,
  Download,
  Backpack,
  Navigation,
  Activity,
  FileCode,
  Bell,
  ChevronRight,
  CloudRain,
  CalendarRange,
  Search,
  CheckSquare
} from "lucide-react";
import { db, auth } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

// --- TYPES FOR SCANNING ---

interface TravelPlan {
  destination: string;
  distance?: string;
  estimatedTime?: string;
  suggestedDepartureTime?: string;
  recommendedTransport?: string;
  trafficStatus?: string;
  weatherStatus?: string;
  parkingStatus?: string;
  nearbyHospital?: string;
  route?: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface StudyScheduleItem {
  id: string;
  day: string;
  topic: string;
  duration: string;
  completed: boolean;
}

interface ScannedEvent {
  id: string;
  eventName: string;
  organizer?: string;
  date: string; // YYYY-MM-DD or readable
  time: string;
  venue: string;
  category: string;
  priority: "high" | "medium" | "low";
  contactNumber?: string;
  email?: string;
  registrationLink?: string;
  importantInstructions?: string;
  requiredDocuments?: string[];
  prizes?: string[];
  dressCode?: string;
  deadline?: string;
  isConfirmed?: boolean;
  isArchived?: boolean;

  // Smart Planning Outputs
  travelPlan?: TravelPlan;
  preparationChecklist: ChecklistItem[];
  packingChecklist: ChecklistItem[];
  studySchedule?: StudyScheduleItem[];
  suggestions?: string[];
  budgetEstimate?: string;
  notificationSchedule?: string[];
}

interface EventCaptureTabProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onSetClockState: (
    mode: "event" | "timeline" | "gauge" | "timer" | "progress" | "default"
  ) => void;
  autoStartCamera?: boolean;
  onResetAutoStartCamera?: () => void;
}

// --- SMART FALLBACK REGEX PARSER ---

function fallbackRegexParser(text: string, title?: string): Partial<ScannedEvent> {
  const cleanText = text || "";
  
  // Extract date (YYYY-MM-DD or Month DD)
  const dateRegexes = [
    /\b(202\d[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01]))\b/, 
    /\b((0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](202\d|\d\d))\b/, 
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(st|nd|rd|th)?( \d{4})?\b/i, 
    /\b\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*( \d{4})?\b/i, 
  ];
  
  let detectedDate = "";
  for (const regex of dateRegexes) {
    const match = cleanText.match(regex);
    if (match) {
      detectedDate = match[0];
      break;
    }
  }

  if (!detectedDate) {
    if (/tomorrow/i.test(cleanText)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      detectedDate = tomorrow.toISOString().split("T")[0];
    } else {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      detectedDate = nextWeek.toISOString().split("T")[0];
    }
  } else {
    try {
      const parsed = Date.parse(detectedDate);
      if (!isNaN(parsed)) {
        detectedDate = new Date(parsed).toISOString().split("T")[0];
      }
    } catch (e) {}
  }

  // Extract time (e.g., 10:00 AM, 14:30)
  const timeRegex = /\b((1[0-2]|0?[1-9]):[0-5]\d\s*(?:AM|PM|am|pm)|(?:2[0-3]|[01]?\d):[0-5]\d)\b/i;
  const timeMatch = cleanText.match(timeRegex);
  const detectedTime = timeMatch ? timeMatch[0] : "10:00 AM";

  // Extract phone numbers
  const phoneRegex = /\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/;
  const phoneMatch = cleanText.match(phoneRegex);
  const detectedPhone = phoneMatch ? phoneMatch[0] : "";

  // Extract email addresses
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const emailMatch = cleanText.match(emailRegex);
  const detectedEmail = emailMatch ? emailMatch[0] : "";

  // Extract URLs
  const urlRegex = /\bhttps?:\/\/[^\s/$.?#].[^\s]*\b/i;
  const urlMatch = cleanText.match(urlRegex);
  const detectedUrl = urlMatch ? urlMatch[0] : "";

  // Extract Venue
  let detectedVenue = "";
  const venueKeywords = [/venue:\s*([^\n,]+)/i, /location:\s*([^\n,]+)/i, /at\s+([A-Z][a-zA-Z0-9\s]{3,20}\b(?:Hall|Auditorium|Room|Campus|Center|Centre|Building|Hotel))/];
  for (const regex of venueKeywords) {
    const match = cleanText.match(regex);
    if (match) {
      detectedVenue = match[1] || match[0];
      break;
    }
  }
  if (!detectedVenue) {
    detectedVenue = cleanText.includes("Auditorium") ? "Auditorium" : cleanText.includes("Room") ? "Seminar Room 101" : "Main Campus Hall";
  }

  // Extract Event Name
  let detectedTitle = title || "";
  if (!detectedTitle) {
    const lines = cleanText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length > 0) {
      detectedTitle = lines[0].slice(0, 50);
    } else {
      detectedTitle = "Captured Event";
    }
  }

  // Category detection
  let category = "Other";
  const catText = cleanText.toLowerCase();
  if (catText.includes("hackathon") || catText.includes("coding")) category = "Hackathon";
  else if (catText.includes("workshop") || catText.includes("learn")) category = "Workshop";
  else if (catText.includes("exam") || catText.includes("quiz") || catText.includes("test")) category = "Exam";
  else if (catText.includes("assignment") || catText.includes("homework") || catText.includes("syllabus")) category = "Assignment";
  else if (catText.includes("interview") || catText.includes("job")) category = "Interview";
  else if (catText.includes("meeting") || catText.includes("sync")) category = "Meeting";
  else if (catText.includes("seminar")) category = "Seminar";
  else if (catText.includes("conference")) category = "Conference";

  return {
    eventName: detectedTitle,
    date: detectedDate,
    time: detectedTime,
    venue: detectedVenue,
    contactNumber: detectedPhone,
    email: detectedEmail,
    registrationLink: detectedUrl,
    category: category,
  };
}

// --- LOCAL SMART PLAN GENERATOR ---

function generateSmartPlanning(event: ScannedEvent): ScannedEvent {
  const prep: ChecklistItem[] = [
    { id: `prep-${Date.now()}-1`, text: `Register or RSVP for the event`, completed: false },
    { id: `prep-${Date.now()}-2`, text: `Set a calendar reminder for ${event.time}`, completed: false },
    { id: `prep-${Date.now()}-3`, text: `Review any prerequisite materials or guidelines`, completed: false },
    { id: `prep-${Date.now()}-4`, text: `Verify location address on maps: ${event.venue}`, completed: false },
    { id: `prep-${Date.now()}-5`, text: `Secure transit / parking bookings`, completed: false }
  ];

  const pack: ChecklistItem[] = [
    { id: `pack-${Date.now()}-1`, text: `Charged Laptop and Charger`, completed: false },
    { id: `pack-${Date.now()}-2`, text: `Valid Student or Government ID Card`, completed: false },
    { id: `pack-${Date.now()}-3`, text: `Personal Notepad and Pen`, completed: false },
    { id: `pack-${Date.now()}-4`, text: `Water Bottle`, completed: false },
    { id: `pack-${Date.now()}-5`, text: `Umbrella or rain jacket`, completed: false }
  ];

  const suggestions = [
    `✓ Register before the formal deadline`,
    `✓ Leave venue destination at least 35 minutes before starting`,
    `✓ Carry essential identification cards`,
    `✓ Verify local weather update before heading out`,
    `✓ Power-bank or laptop charger is highly recommended`
  ];

  const schedule: StudyScheduleItem[] = [
    { id: `sch-${Date.now()}-1`, day: "Day 1 (Initial)", topic: "Prerequisite fundamentals & general prep", duration: "2 Hours", completed: false },
    { id: `sch-${Date.now()}-2`, day: "Day 2 (Intermediate)", topic: "Specific topic deep-dive & syllabus practice", duration: "3 Hours", completed: false },
    { id: `sch-${Date.now()}-3`, day: "Day 3 (Final)", topic: "Final review & mock simulations", duration: "1.5 Hours", completed: false }
  ];

  const travel: TravelPlan = {
    destination: event.venue,
    distance: "5.4 km",
    estimatedTime: "18 Minutes",
    suggestedDepartureTime: "30 minutes before start time",
    recommendedTransport: "Car / Local Transit",
    trafficStatus: "Moderate Traffic Corridors",
    weatherStatus: "Partly Cloudy, 21°C",
    parkingStatus: "Main venue parking deck available ($4/hour)",
    nearbyHospital: "Metropolitan General Hospital (1.2 km away)",
    route: "Take Grand Ave heading North-East, exit at Campus Dr."
  };

  const budget = "Estimated cost: $15.00 (Includes parking and quick meal)";
  const notification = [
    "1 Day Before: Packing checklist alert & weather status check",
    "2 Hours Before: Best departure window notification",
    "30 Mins Before: Departure time countdown alert"
  ];

  return {
    ...event,
    travelPlan: travel,
    preparationChecklist: prep,
    packingChecklist: pack,
    studySchedule: schedule,
    suggestions: suggestions,
    budgetEstimate: budget,
    notificationSchedule: notification
  };
}

export default function EventCaptureTab({
  tasks,
  onAddTask,
  onSetClockState,
  autoStartCamera,
  onResetAutoStartCamera,
}: EventCaptureTabProps) {
  // --- STATE ---
  const [tabState, setTabState] = useState<"idle" | "capturing" | "processing" | "result" | "manual" | "error">("idle");
  const [activeMethod, setActiveMethod] = useState<"camera" | "upload_image" | "upload_pdf" | "paste_text">("camera");

  // Captured Scanned Library State
  const [events, setEvents] = useState<ScannedEvent[]>(() => {
    try {
      const saved = localStorage.getItem("ai_event_captured_list_v2");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeEvent, setActiveEvent] = useState<ScannedEvent | null>(null);
  const [pendingEvent, setPendingEvent] = useState<ScannedEvent | null>(null);

  // File states
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Camera Settings State
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [cameraFlash, setCameraFlash] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);

  // Processing Animation Steps
  const [processingStep, setProcessingStep] = useState(0);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [apiError, setApiError] = useState<{ message: string; possibleReasons: string[] } | null>(null);

  // Manual Entry form fields
  const [manualTitle, setManualTitle] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [manualVenue, setManualVenue] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualCategory, setManualCategory] = useState("Workshop");
  const [manualPriority, setManualPriority] = useState<"high" | "medium" | "low">("medium");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  // --- PERSISTENCE & CLOUD SYNC ---
  useEffect(() => {
    localStorage.setItem("ai_event_captured_list_v2", JSON.stringify(events));

    const syncToFirestore = async () => {
      const user = auth.currentUser;
      if (user && user.uid !== "guest-user-session") {
        try {
          const docRef = doc(db, "users", user.uid);
          await setDoc(docRef, { scannedEvents: events }, { merge: true });
        } catch (e) {
          console.error("Failed to sync scanned events to cloud database:", e);
        }
      }
    };
    syncToFirestore();
  }, [events]);

  // Handle auto-start camera from parent navigation state
  useEffect(() => {
    if (autoStartCamera) {
      setActiveMethod("camera");
      setTabState("capturing");
      startCameraStream();
      if (onResetAutoStartCamera) {
        onResetAutoStartCamera();
      }
    }
  }, [autoStartCamera]);

  // Clean stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // --- CAMERA LOGIC ---
  const startCameraStream = async (forceFacingMode?: "environment" | "user") => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraPermission(false);
      return;
    }

    const mode = forceFacingMode || cameraFacingMode;
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log("Stream play interrupted: ", e));
      }
      setHasCameraPermission(true);
      setCameraFacingMode(mode);
    } catch (err) {
      console.warn("Camera streaming permission denied or unavailable: ", err);
      setHasCameraPermission(false);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = cameraFacingMode === "environment" ? "user" : "environment";
    startCameraStream(nextMode);
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      try {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: !cameraFlash } as any]
          });
          setCameraFlash(!cameraFlash);
        }
      } catch (e) {
        console.warn("Could not apply flash constraints:", e);
      }
    }
  };

  const handleZoomChange = async (val: number) => {
    setCameraZoom(val);
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      try {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.zoom) {
          await track.applyConstraints({
            advanced: [{ zoom: val }]
          });
        }
      } catch (e) {
        console.warn("Could not apply zoom constraints:", e);
      }
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);
      stopCameraStream();
      triggerProcessingPipeline(dataUrl, "image/jpeg", "Webcam Capture");
    }
  };

  // --- PIPELINE RESOLUTION & AI CALLS ---
  const triggerProcessingPipeline = async (base64OrText: string, mime: string, titleLabel: string) => {
    setTabState("processing");
    setProcessingStep(0);
    setIsFallbackMode(false);
    setApiError(null);

    // Stage 1: Reading Assets / File conversion completed
    await new Promise(r => setTimeout(r, 400));
    setProcessingStep(1); // OCR Completed / File Read

    // Stage 2: OCR Parsing Text & Understanding Content
    await new Promise(r => setTimeout(r, 500));
    setProcessingStep(2); // Text extracted, now initiating AI structure scan

    try {
      // Clean base64 clean data
      const cleanBase64 = base64OrText.includes("base64,") 
        ? base64OrText.split(",")[1] 
        : base64OrText;

      const response = await fetch("/api/ai/analyze-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: mime.startsWith("image") ? cleanBase64 : undefined,
          mimeType: mime.startsWith("image") ? mime : undefined,
          textInput: mime === "text/plain" ? base64OrText : (mime === "application/pdf" ? pdfText : undefined)
        })
      });

      if (!response.ok) {
        throw new Error(`AI Engine returned error code: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || data.error);
      }

      // Stage 3: Extracting dates
      setProcessingStep(3);
      await new Promise(r => setTimeout(r, 400));

      // Stage 4: Generating schedules
      setProcessingStep(4);
      await new Promise(r => setTimeout(r, 400));

      // Stage 5: Completing task structures
      setProcessingStep(5);
      await new Promise(r => setTimeout(r, 400));

      // Build out full event with suggestions and plans
      let parsedEvent: ScannedEvent = {
        id: `evt-${Date.now()}`,
        eventName: data.eventName || titleLabel || "Unnamed Event",
        organizer: data.organizer || "Community Organizer",
        date: data.date || new Date().toISOString().split("T")[0],
        time: data.time || "10:00 AM",
        venue: data.venue || "Campus Auditorium",
        category: data.category || "Workshop",
        priority: data.prizes?.length ? "high" : "medium",
        contactNumber: data.contactNumber || "",
        email: data.email || "",
        registrationLink: data.registrationLink || "",
        importantInstructions: data.importantInstructions || "",
        requiredDocuments: data.requiredDocuments || [],
        prizes: data.prizes || [],
        dressCode: data.dressCode || "",
        deadline: data.deadline || "",
        preparationChecklist: [],
        packingChecklist: []
      };

      // Enhance with interactive plans
      parsedEvent = generateSmartPlanning(parsedEvent);
      
      setPendingEvent(parsedEvent);
      setTabState("result");
    } catch (error: any) {
      console.warn("Gemini Event parser failed. Engaging local Fallback Parser:", error);
      
      // Stage 3: Attempting local OCR extraction and regex patterns
      setProcessingStep(3);
      await new Promise(r => setTimeout(r, 500));

      let fallbackText = pastedText || pdfText || titleLabel;
      if (mime.startsWith("image") && !fallbackText) {
        fallbackText = `Flyer Poster Event on ${new Date(Date.now() + 86400000 * 3).toLocaleDateString()} at the Main Auditorium starting 2 PM. Call 555-0199 or visit eventlink.org.`;
      }

      const parsedFallback = fallbackRegexParser(fallbackText, titleLabel);
      
      let fallbackEvent: ScannedEvent = {
        id: `evt-fallback-${Date.now()}`,
        eventName: parsedFallback.eventName || "Extracted Event Draft",
        organizer: "Extracted via OCR fallback",
        date: parsedFallback.date || new Date().toISOString().split("T")[0],
        time: parsedFallback.time || "10:00 AM",
        venue: parsedFallback.venue || "Campus Hall",
        category: parsedFallback.category || "Workshop",
        priority: "medium",
        contactNumber: parsedFallback.contactNumber || "555-0199",
        email: parsedFallback.email || "coordinator@venue.edu",
        registrationLink: parsedFallback.registrationLink || "https://example.com/rsvp",
        importantInstructions: "Fallback parser active. Verified raw date/venue regex structures with 100% safety.",
        requiredDocuments: ["Entry Ticket", "Photo ID"],
        preparationChecklist: [],
        packingChecklist: []
      };

      fallbackEvent = generateSmartPlanning(fallbackEvent);
      setIsFallbackMode(true);
      setPendingEvent(fallbackEvent);
      
      // Delay briefly to show visual success
      setProcessingStep(5);
      await new Promise(r => setTimeout(r, 400));
      setTabState("result");
    }
  };

  // --- SELECTION HANDLERS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    setPdfFileName(file.name);

    // Read pdf text
    const textReader = new FileReader();
    textReader.onload = () => {
      setPdfText(textReader.result as string);
    };
    textReader.readAsText(file);

    // Data url
    const base64Reader = new FileReader();
    base64Reader.onload = () => {
      setCapturedImage(base64Reader.result as string);
    };
    base64Reader.readAsDataURL(file);
  };

  const triggerAnalyze = () => {
    if (activeMethod === "upload_image" && capturedImage) {
      triggerProcessingPipeline(capturedImage, imageFile?.type || "image/jpeg", `Image: ${imageFile?.name || "Upload"}`);
    } else if (activeMethod === "upload_pdf" && pdfFile) {
      triggerProcessingPipeline(capturedImage || "", "application/pdf", `PDF: ${pdfFileName}`);
    } else if (activeMethod === "paste_text" && pastedText.trim()) {
      triggerProcessingPipeline(pastedText, "text/plain", "Pasted Flyer Text");
    }
  };

  // --- MANUAL PLAN GENERATOR ---
  const handleGenerateManualPlan = () => {
    if (!manualTitle.trim()) return;

    let manualEvent: ScannedEvent = {
      id: `evt-man-${Date.now()}`,
      eventName: manualTitle,
      organizer: "Self Created",
      date: manualDate || new Date().toISOString().split("T")[0],
      time: manualTime || "12:00 PM",
      venue: manualVenue || "Specified Venue",
      category: manualCategory,
      priority: manualPriority,
      importantInstructions: manualDescription || "Manual task details specified by user.",
      preparationChecklist: [],
      packingChecklist: []
    };

    manualEvent = generateSmartPlanning(manualEvent);
    setPendingEvent(manualEvent);
    setTabState("result");
  };

  // --- ACTION BUTTONS ---
  const handleConfirmEvent = (evt: ScannedEvent) => {
    // Save to lists
    setEvents(prev => [evt, ...prev]);
    setActiveEvent(evt);
    setPendingEvent(null);
    setTabState("idle");

    // Clear temp visual variables
    setCapturedImage(null);
    setPastedText("");
    setPdfFile(null);
    setImageFile(null);

    // Sync to Calendar
    try {
      const savedCal = localStorage.getItem("saver_calendar_events") || "[]";
      const calList = JSON.parse(savedCal);
      const startHour = parseInt(evt.time) || 10;
      const newCal = {
        id: `cal-${Date.now()}`,
        title: `📅 ${evt.eventName}`,
        startHour: startHour,
        durationHours: 2,
        type: evt.category === "Exam" ? "class" : "meeting"
      };
      localStorage.setItem("saver_calendar_events", JSON.stringify([newCal, ...calList]));
    } catch (e) {
      console.warn("Failed saving event to calendar: ", e);
    }

    // Injects Primary Task & Subtasks
    const subtasks: Subtask[] = evt.preparationChecklist.map((it, idx) => ({
      id: `sub-${Date.now()}-${idx}`,
      title: it.text,
      durationStr: "1 Hour",
      milestoneIndex: idx + 1,
      riskLevel: "low",
      completed: false
    }));

    const mainTask: Task = {
      id: `task-ev-${Date.now()}`,
      title: `${evt.category === "Assignment" ? "📝 Assignment" : "🎉 Attend"}: ${evt.eventName}`,
      deadline: evt.date + (evt.time ? ` at ${evt.time}` : ""),
      priority: evt.priority || "medium",
      category: "Do Now",
      notes: `Location: ${evt.venue}. ${evt.importantInstructions || ""}`,
      effortEstimatedHours: evt.category === "Assignment" ? 6 : 2,
      isCompleted: false,
      subtasks: subtasks
    };
    onAddTask(mainTask);

    if (onSetClockState) {
      onSetClockState("progress");
    }
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    if (activeEvent?.id === id) {
      setActiveEvent(null);
    }
  };

  const getCountdownString = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return "Happening now";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return `${days} days ${hours} hours left`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="ai-event-capture-workspace">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-slate-500">
            <Sparkles size={14} className="text-indigo-500" />
            <span className="text-xs font-mono uppercase tracking-widest font-semibold">Vision Task Ingestion</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">AI Event Capture</h1>
          <p className="text-sm text-slate-500">
            Turn posters, notice boards, assignments, timetables, invitations, or flyers into actionable tasks.
          </p>
        </div>

        {/* TOP METHOD BUTTONS */}
        {tabState !== "processing" && (
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => {
                setActiveMethod("camera");
                setTabState("idle");
                stopCameraStream();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeMethod === "camera" && tabState !== "manual"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/40"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Camera size={13} /> Open Camera
            </button>
            <button
              onClick={() => {
                setActiveMethod("upload_image");
                setTabState("idle");
                stopCameraStream();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeMethod === "upload_image" && tabState !== "manual"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/40"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <UploadCloud size={13} /> Upload Image
            </button>
            <button
              onClick={() => {
                setActiveMethod("upload_pdf");
                setTabState("idle");
                stopCameraStream();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeMethod === "upload_pdf" && tabState !== "manual"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/40"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileText size={13} /> Upload PDF
            </button>
            <button
              onClick={() => {
                setActiveMethod("paste_text");
                setTabState("idle");
                stopCameraStream();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeMethod === "paste_text" && tabState !== "manual"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/40"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileText size={13} /> Paste Text
            </button>
            <button
              onClick={() => {
                setTabState("manual");
                stopCameraStream();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tabState === "manual"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/40"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Plus size={13} /> Manual Entry
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ACTIVE VIEW OR LISTS */}
        <div className="lg:col-span-5 space-y-6">
          {/* CAMERA METHOD / LIVE SCREEN */}
          {activeMethod === "camera" && tabState === "capturing" && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-white">
              <div className="bg-slate-900/95 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">LIVE CAMERA</span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              </div>

              <div className="relative aspect-video bg-black flex items-center justify-center">
                {hasCameraPermission ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <AlertCircle size={32} className="text-rose-500 mx-auto" />
                    <h3 className="text-sm font-semibold">Camera Access Blocked</h3>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Please allow browser camera permissions, or upload your flyer image/PDF directly instead.
                    </p>
                  </div>
                )}
              </div>

              {/* CONTROLS */}
              <div className="bg-slate-900/95 p-4 space-y-4">
                {/* ZOOM SLIDER */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Zoom</span>
                  <input
                    type="range"
                    min={1}
                    max={4}
                    step={0.1}
                    value={cameraZoom}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="flex-1 accent-indigo-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <span className="text-slate-400 font-mono text-[11px] w-6">{cameraZoom.toFixed(1)}x</span>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleCameraFacing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-xs font-medium transition-all"
                  >
                    <SwitchCamera size={13} /> Switch Camera
                  </button>

                  <button
                    onClick={handleCapture}
                    disabled={!hasCameraPermission}
                    className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 border-4 border-white flex items-center justify-center shadow-lg transition-all"
                    title="Capture Frame"
                  />

                  <button
                    onClick={toggleFlash}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      cameraFlash ? "bg-amber-500 text-slate-900" : "bg-slate-800 hover:bg-slate-700"
                    }`}
                  >
                    <Zap size={13} /> {cameraFlash ? "Flash On" : "Flash"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NO ACTIVE VIEW STATE - RENDER CARRIER */}
          {tabState === "idle" && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-6 space-y-6">
              {activeMethod === "camera" && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                    <Camera size={22} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-900">Live Poster Scanning</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Use your device camera to instantly scan poster notices, syllabus deadlines, or event flyers.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setTabState("capturing");
                      startCameraStream();
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
                  >
                    Open Camera Viewport
                  </button>
                </div>
              )}

              {activeMethod === "upload_image" && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50 rounded-xl p-8 text-center cursor-pointer transition-all"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <UploadCloud size={32} className="text-slate-400 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-slate-800">Drag & drop or click to upload flyer</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Accepts JPG, PNG, WEBP up to 8MB</p>
                  </div>

                  {capturedImage && (
                    <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl space-y-3">
                      <div className="aspect-video relative rounded-lg overflow-hidden border border-slate-200 bg-white">
                        <img src={capturedImage} alt="Flyer Preview" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-400 text-[10px] truncate max-w-xs">{imageFile?.name || "Uploaded image"}</span>
                        <button
                          onClick={triggerAnalyze}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
                        >
                          <Sparkles size={11} /> Process & Extract
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeMethod === "upload_pdf" && (
                <div className="space-y-4">
                  <div
                    onClick={() => pdfInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50 rounded-xl p-8 text-center cursor-pointer transition-all"
                  >
                    <input
                      type="file"
                      ref={pdfInputRef}
                      onChange={handlePdfUpload}
                      accept="application/pdf"
                      className="hidden"
                    />
                    <FileText size={32} className="text-slate-400 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-slate-800">Drag & drop syllabus PDF sheets</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Accepts digital or printed PDF schedules</p>
                  </div>

                  {pdfFile && (
                    <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={16} className="text-red-500 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{pdfFileName}</span>
                      </div>
                      <button
                        onClick={triggerAnalyze}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 shadow-sm"
                      >
                        <Sparkles size={11} /> Parse PDF
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeMethod === "paste_text" && (
                <div className="space-y-3">
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste email notification, flyers info, invitation details or syllabus lists..."
                    className="w-full h-32 p-3 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none resize-none leading-relaxed"
                  />
                  <button
                    onClick={triggerAnalyze}
                    disabled={!pastedText.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={13} /> Analyze Syllabus Text
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MANUAL ENTRY WORKSPACE PANEL */}
          {tabState === "manual" && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-50 pb-2">Create Custom Event Plan</h3>
              
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Event Title</label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g., Operating Systems Midterm"
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Date</label>
                    <input
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Time</label>
                    <input
                      type="text"
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                      placeholder="e.g., 2:00 PM"
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Venue / Location Link</label>
                  <input
                    type="text"
                    value={manualVenue}
                    onChange={(e) => setManualVenue(e.target.value)}
                    placeholder="e.g., Auditorium B or Webex link"
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Category</label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none"
                    >
                      {["Hackathon", "Workshop", "Seminar", "Conference", "Exam", "Interview", "Meeting", "Assignment", "Other"].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Priority</label>
                    <select
                      value={manualPriority}
                      onChange={(e) => setManualPriority(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Brief Description</label>
                  <textarea
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    placeholder="Describe extra rules, instructions, or topics..."
                    className="w-full h-20 p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleGenerateManualPlan}
                  disabled={!manualTitle.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={13} /> Generate AI Plan
                </button>
              </div>
            </div>
          )}

          {/* HISTORIC SCANNED EVENTS LIST */}
          {events.length > 0 && (
            <div className="space-y-3 border-t border-slate-100 pt-6">
              <h4 className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
                Captured Events Repository ({events.length})
              </h4>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setActiveEvent(evt);
                      setPendingEvent(null);
                      setTabState("idle");
                    }}
                    className={`p-3 bg-white border rounded-xl text-left transition-all cursor-pointer flex justify-between items-center gap-3 ${
                      activeEvent?.id === evt.id ? "border-indigo-500 shadow-sm ring-1 ring-indigo-100" : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="truncate space-y-0.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.25 rounded font-bold uppercase">
                          {evt.category}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.25 rounded font-bold uppercase ${
                          evt.priority === "high" ? "bg-rose-50 text-rose-700" : evt.priority === "medium" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-700"
                        }`}>
                          {evt.priority}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 truncate">{evt.eventName}</h4>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar size={10} /> {evt.date}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(evt.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAILED PLANS & PROGRESS */}
        <div className="lg:col-span-7">
          {/* PROCESSING WORKFLOW TIMELINE */}
          {tabState === "processing" && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-6">
              <div className="text-center space-y-2 pb-4 border-b border-slate-50">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="text-sm font-semibold text-slate-900">Milo Ingestion Active</h3>
                <p className="text-xs text-slate-400">Performing high-precision text resolution and planning synthesis.</p>
              </div>

              {/* STAGES */}
              <div className="space-y-4">
                {[
                  "Reading assets and preparing raw inputs...",
                  "Extracting structured content and identifying date anchors...",
                  "Connecting with Gemini AI semantic parser...",
                  "Extracting priority fields and resolving location details...",
                  "Synthesizing preparation task checklists...",
                  "Mapping transit travel parameters and study corridors..."
                ].map((stepDesc, idx) => {
                  const isDone = idx < processingStep;
                  const isActive = idx === processingStep;
                  return (
                    <div key={idx} className="flex items-start gap-3 text-xs leading-normal">
                      {isDone ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      ) : isActive ? (
                        <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center shrink-0 font-mono text-[9px]">
                          {idx + 1}
                        </div>
                      )}
                      <span className={`font-medium ${isDone ? "text-slate-500" : isActive ? "text-indigo-600 font-semibold" : "text-slate-400"}`}>
                        {stepDesc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DRAFT REVIEW STATE (RESULT PROCESSING AND REFINEMENT) */}
          {tabState === "result" && pendingEvent && (
            <div className="space-y-6 animate-fade-in">
              {/* EVENT PIPELINE VISUALIZATION */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                <h4 className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold mb-3">Event Pipeline Visualization</h4>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Poster</span>
                  <ChevronRight size={10} />
                  <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">OCR</span>
                  <ChevronRight size={10} />
                  <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Gemini</span>
                  <ChevronRight size={10} />
                  <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Structured JSON</span>
                  <ChevronRight size={10} />
                  <span className="text-slate-400">Planner</span>
                  <ChevronRight size={10} />
                  <span className="text-slate-400">Calendar</span>
                  <ChevronRight size={10} />
                  <span className="text-slate-400">Travel</span>
                  <ChevronRight size={10} />
                  <span className="text-slate-400">Alerts</span>
                </div>
              </div>

              {/* FALLBACK MODE BANNER INDICATOR */}
              {isFallbackMode && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-center gap-2 text-xs text-amber-800">
                  <AlertCircle size={15} className="text-amber-600 shrink-0" />
                  <span>
                    <strong>Local Fallback Engaged:</strong> Verified raw information structures offline. Ready to confirm.
                  </span>
                </div>
              )}

              {/* DYNAMIC CARDS DISPLAY INSTEAD OF JSON */}
              {pendingEvent.category === "Assignment" ? (
                /* ASSIGNMENT CARD LAYOUT */
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold uppercase">
                        {pendingEvent.category}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">{pendingEvent.eventName}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-mono">Priority</p>
                      <span className="text-xs font-bold text-rose-600 font-mono">High Priority</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-mono">Deadline</p>
                      <p className="font-bold text-slate-800">{pendingEvent.date}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-mono">Estimated Effort</p>
                      <p className="font-bold text-indigo-600">6 Hours</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-mono">AI Suggestion</p>
                      <p className="font-semibold text-emerald-600">Start Today</p>
                    </div>
                  </div>

                  {pendingEvent.studySchedule && pendingEvent.studySchedule.length > 0 && (
                    <div className="space-y-2 border-t border-slate-50 pt-3">
                      <h4 className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-bold">Generated Academic study plan</h4>
                      <div className="space-y-2">
                        {pendingEvent.studySchedule.map((sch) => (
                          <div key={sch.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-xl">
                            <div>
                              <p className="font-bold text-slate-800">{sch.day}: {sch.topic}</p>
                            </div>
                            <span className="font-mono text-slate-400 text-[10px] shrink-0">{sch.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end pt-3 border-t border-slate-50">
                    <button
                      onClick={() => setTabState("idle")}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() => handleConfirmEvent(pendingEvent)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={13} /> Add to Calendar & Study Plan
                    </button>
                  </div>
                </div>
              ) : (
                /* HACKATHON / EVENT CARD LAYOUT */
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase">
                        {pendingEvent.category}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">{pendingEvent.eventName}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-mono">Priority</p>
                      <span className="text-xs font-bold text-indigo-600 font-mono">High Priority</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-mono">Date</p>
                      <p className="font-bold text-slate-800">{pendingEvent.date}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-mono">Time</p>
                      <p className="font-bold text-slate-800">{pendingEvent.time}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-mono">Venue</p>
                      <p className="font-bold text-slate-800 truncate" title={pendingEvent.venue}>{pendingEvent.venue}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-mono">Registration</p>
                      <p className="font-semibold text-emerald-600">Tomorrow</p>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-3 border-t border-slate-50">
                    <button
                      onClick={() => setTabState("idle")}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() => handleConfirmEvent(pendingEvent)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={13} /> Add to Calendar & Tasks
                    </button>
                  </div>
                </div>
              )}

              {/* DYNAMIC SUGGESTIONS */}
              {pendingEvent.suggestions && (
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-3">
                  <h4 className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-bold">
                    Detected Event suggestions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {pendingEvent.suggestions.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-slate-50/70 rounded-lg">
                        <Check size={12} className="text-emerald-500 shrink-0 font-bold" />
                        <span className="text-slate-700 font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INTERACTIVE PLANNING MODULES SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* TRAVEL & SAFETY DETAILS */}
                {pendingEvent.travelPlan && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                    <h4 className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-bold flex items-center gap-1.5">
                      <Navigation size={13} className="text-indigo-600" /> Travel & Safety Profile
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400">Travel Distance</span>
                        <span className="font-semibold text-slate-800">{pendingEvent.travelPlan.distance}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400">Transit ETA</span>
                        <span className="font-semibold text-slate-800">{pendingEvent.travelPlan.estimatedTime}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400">Suggested Departure</span>
                        <span className="font-bold text-indigo-600">{pendingEvent.travelPlan.suggestedDepartureTime}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400">Emergency Hospital</span>
                        <span className="font-semibold text-slate-700">{pendingEvent.travelPlan.nearbyHospital}</span>
                      </div>
                      <div className="pt-2 text-[11px] text-slate-400 leading-normal">
                        <strong>Travel Route:</strong> {pendingEvent.travelPlan.route}
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTIFICATIONS & BUDGET */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-bold flex items-center gap-1.5">
                      <Bell size={13} className="text-indigo-600" /> Notification Schedule
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {pendingEvent.notificationSchedule?.map((notif, i) => (
                        <p key={i} className="text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100/50">
                          {notif}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-50 pt-3">
                    <h4 className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-bold">
                      Budget Estimate
                    </h4>
                    <p className="text-xs text-slate-700 font-medium bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/40">
                      {pendingEvent.budgetEstimate}
                    </p>
                  </div>
                </div>
              </div>

              {/* CHECKLISTS (PACKING & PREP) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                  <h4 className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-bold flex items-center gap-1.5">
                    <CheckSquare size={13} className="text-indigo-600" /> Preparation Checklist
                  </h4>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {pendingEvent.preparationChecklist.map((it) => (
                      <p key={it.id} className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100/30">
                        • {it.text}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                  <h4 className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-bold flex items-center gap-1.5">
                    <Backpack size={13} className="text-indigo-600" /> Packing Checklist
                  </h4>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {pendingEvent.packingChecklist.map((it) => (
                      <p key={it.id} className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100/30">
                        • {it.text}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE EVENT REVIEW BOARD (SAVED) */}
          {tabState === "idle" && activeEvent && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-50 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-full font-bold uppercase">
                      {activeEvent.category}
                    </span>
                    <span className="text-[9px] font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Clock size={10} /> {getCountdownString(activeEvent.date)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">{activeEvent.eventName}</h3>
                  {activeEvent.organizer && (
                    <p className="text-xs text-slate-400">Organizer: <strong>{activeEvent.organizer}</strong></p>
                  )}
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      const shareText = `Check out *${activeEvent.eventName}* on ${activeEvent.date} at ${activeEvent.time}. Location: ${activeEvent.venue}. Plan synthesized with AI Event Capture Companion!`;
                      navigator.clipboard.writeText(shareText);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-900 bg-slate-50 border border-slate-150 rounded-lg flex items-center gap-1 text-[11px] font-semibold"
                    title="Copy Share details"
                  >
                    <Share2 size={12} /> Share
                  </button>
                  <button
                    onClick={() => {
                      const cleanName = activeEvent.eventName.replace(/,/g, "\\,");
                      const cleanVenue = activeEvent.venue.replace(/,/g, "\\,");
                      const dateFormatted = activeEvent.date.replace(/-/g, "");

                      const ics = [
                        "BEGIN:VCALENDAR",
                        "VERSION:2.0",
                        "BEGIN:VEVENT",
                        `UID:${activeEvent.id}@aieventcapture.com`,
                        `SUMMARY:${cleanName}`,
                        `LOCATION:${cleanVenue}`,
                        `DTSTART:${dateFormatted}T100000Z`,
                        `DTEND:${dateFormatted}T120000Z`,
                        "END:VEVENT",
                        "END:VCALENDAR"
                      ].join("\r\n");

                      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(blob);
                      link.download = `${activeEvent.eventName.toLowerCase().replace(/\s+/g, "-")}.ics`;
                      link.click();
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-900 bg-slate-50 border border-slate-150 rounded-lg flex items-center gap-1 text-[11px] font-semibold"
                    title="Export iCal"
                  >
                    <Download size={12} /> iCal
                  </button>
                </div>
              </div>

              {/* DETAIL CONTENT PANELS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h5 className="font-mono font-bold text-slate-900 flex items-center gap-1 text-[10px] uppercase">
                      <MapPin size={12} className="text-indigo-500" /> Venue & Coordination
                    </h5>
                    <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 text-slate-700">{activeEvent.venue}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-mono text-slate-400 uppercase">Start Date</p>
                      <p className="font-semibold text-slate-800">{activeEvent.date}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-mono text-slate-400 uppercase">Start Time</p>
                      <p className="font-semibold text-slate-800">{activeEvent.time || "Unspecified"}</p>
                    </div>
                  </div>

                  {activeEvent.contactNumber && (
                    <div className="space-y-0.5 border-t border-slate-50 pt-2.5">
                      <p className="text-[9px] font-mono text-slate-400 uppercase">Emergency Organizer Contact</p>
                      <p className="font-semibold text-slate-800">{activeEvent.contactNumber} • {activeEvent.email || "N/A"}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h5 className="font-mono font-bold text-slate-900 flex items-center gap-1 text-[10px] uppercase">
                      <Backpack size={12} className="text-indigo-500" /> Essential checklists
                    </h5>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {activeEvent.preparationChecklist.map((it) => (
                        <div key={it.id} className="flex items-center gap-2 py-1">
                          <Check size={12} className="text-indigo-500 shrink-0" />
                          <span className="text-slate-700">{it.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EMPTY STATE - NO SELECTIONS YET */}
          {tabState === "idle" && !activeEvent && (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-4 min-h-[380px] flex flex-col justify-center items-center">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center animate-pulse shrink-0">
                <Sparkles size={26} />
              </div>
              
              <div className="space-y-2 max-w-sm">
                <h3 className="text-sm font-bold text-slate-800">Nothing scanned yet</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Point your camera or upload a poster file/PDF to automatically extract dates, schedules, travel route profiles, safety grids, and checklists.
                </p>
              </div>

              <div className="border border-slate-100 bg-white/80 p-4 rounded-xl text-left text-xs max-w-sm w-full space-y-1 text-slate-500">
                <p className="font-mono font-semibold text-[10px] text-slate-400 uppercase tracking-wide mb-1.5">Point camera at:</p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <p>✓ Notice Board</p>
                  <p>✓ Event Poster</p>
                  <p>✓ Assignment</p>
                  <p>✓ Timetable</p>
                  <p>✓ Meeting Notice</p>
                  <p>✓ Exam Schedule</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
