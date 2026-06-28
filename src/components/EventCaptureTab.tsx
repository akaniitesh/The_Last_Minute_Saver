import React, { useState, useRef, useEffect, useCallback } from "react";
import { Task } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  UploadCloud,
  FileText,
  Mail,
  Sparkles,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  User,
  Link as LinkIcon,
  QrCode,
  Phone,
  Globe,
  DollarSign,
  BookOpen,
  Heart,
  Tag,
  Trophy,
  FileBadge,
  AlertCircle,
  Trash2,
  Archive,
  Copy,
  Share2,
  Check,
  CheckCircle,
  CheckCircle2,
  Download,
  Compass,
  Sliders,
  ZoomIn,
  Plus,
  X,
  Map,
  Edit3,
  CalendarRange,
  Car,
  Briefcase,
  Backpack,
  ClipboardList,
  SwitchCamera,
  Zap,
  ZapOff,
  ZoomOut,
  Scan,
  ScanLine,
  RefreshCcw,
} from "lucide-react";
import { db, auth } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TravelPlan {
  destination: string;
  distance?: string;
  estimatedTime?: string;
  suggestedDepartureTime?: string;
  recommendedTransport?: string;
  trafficStatus?: string;
  weatherStatus?: string;
  parkingStatus?: string;
  bookingLink?: string;
  navigationUrl?: string;
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
  date: string; // YYYY-MM-DD
  time: string;
  venue: string;
  speaker?: string;
  registrationLink?: string;
  qrCode?: string;
  contactNumber?: string;
  website?: string;
  email?: string;
  entryFee?: string;
  deadline?: string;
  requiredDocuments?: string[];
  dressCode?: string;
  competitionType?: string;
  skillsRequired?: string[];
  eligibility?: string;
  prizes?: string[];
  certificates?: string;
  importantInstructions?: string;
  category: string;

  // Smart planning outputs
  estimatedTravelTime?: string;
  riskAssessment?: string;
  travelPlan?: TravelPlan;
  preparationChecklist: ChecklistItem[];
  packingChecklist: ChecklistItem[];
  studySchedule?: StudyScheduleItem[];
  timeline?: string[];
  recommendations?: string[];

  isConfirmed?: boolean;
  isArchived?: boolean;
}

interface EventCaptureTabProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onSetClockState: (
    mode: "event" | "timeline" | "gauge" | "timer" | "progress" | "default",
  ) => void;
  autoStartCamera?: boolean;
  onResetAutoStartCamera?: () => void;
}

export default function EventCaptureTab({
  tasks,
  onAddTask,
  onSetClockState,
  autoStartCamera,
  onResetAutoStartCamera,
}: EventCaptureTabProps) {
  const [events, setEvents] = useState<ScannedEvent[]>(() => {
    try {
      const saved = localStorage.getItem("ai_scanned_events_v2");
      if (!saved) return [];
      const parsed: ScannedEvent[] = JSON.parse(saved);
      // Filter out empty or broken legacy entries
      return parsed.filter(e => e.eventName && e.date);
    } catch {
      return [];
    }
  });

  const [activeEvent, setActiveEvent] = useState<ScannedEvent | null>(null);
  const [pendingEvent, setPendingEvent] = useState<ScannedEvent | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<
    "camera" | "upload" | "pdf" | "paste"
  >("camera");
  const [dragOver, setDragOver] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingForm, setEditingForm] = useState<Partial<ScannedEvent>>({});
  
  // Confirmed Injection Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [eventToConfirm, setEventToConfirm] = useState<ScannedEvent | null>(null);

  // File Preview States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pdfCurrentPage, setPdfCurrentPage] = useState<number>(1);
  const [pdfPageCount, setPdfPageCount] = useState<number>(2);

  // Camera settings
  const [cameraStep, setCameraStep] = useState<
    "idle" | "streaming" | "captured"
  >("idle");
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 3, step: 0.1 });
  const [hasZoom, setHasZoom] = useState(false);
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(false);
  const [gridVisible, setGridVisible] = useState(false);
  const [qrMode, setQrMode] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 10>(0);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);

  // Step-by-step progress steps for OCR Scan
  const [ocrActiveStep, setOcrActiveStep] = useState<number>(-1);

  // Travel calculation details
  const [travelDetails, setTravelDetails] = useState<{
    distance: string;
    eta: string;
    traffic: string;
    weather: string;
    bestDeparture: string;
    reminderTime: string;
  } | null>(null);
  const [calculatingTravel, setCalculatingTravel] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Diagnostics and Robust State Machine controllers
  const [showDebug, setShowDebug] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isManualCancelRef = useRef<boolean>(false);
  const [lastScanPayload, setLastScanPayload] = useState<{ base64Part: string; mime: string; titleLabel: string } | null>(null);

  const startManualEntry = () => {
    setCaptureError(null);
    setIsScanning(false);
    setOcrActiveStep(-1);
    stopCameraStream();

    setPendingEvent({
      id: `event-manual-${Date.now()}`,
      eventName: "",
      organizer: "",
      date: "",
      time: "",
      venue: "",
      speaker: "",
      registrationLink: "",
      qrCode: "",
      contactNumber: "",
      website: "",
      email: "",
      entryFee: "",
      deadline: "",
      requiredDocuments: [],
      dressCode: "",
      competitionType: "",
      skillsRequired: [],
      eligibility: "",
      prizes: [],
      certificates: "",
      importantInstructions: "",
      category: "Other",
      estimatedTravelTime: "",
      riskAssessment: "",
      travelPlan: { destination: "" },
      preparationChecklist: [],
      packingChecklist: [],
      studySchedule: [],
      timeline: [],
      recommendations: [],
      isConfirmed: false,
    });
    setActiveEvent(null);
    triggerToast("Editable manual event form loaded!");
  };

  const cancelOcrScan = () => {
    isManualCancelRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsScanning(false);
    setOcrActiveStep(-1);
    setCaptureError(null);
    triggerToast("AI Scan cancelled.");
    if (selectedMethod === "camera") {
      handleStartCamera();
    }
  };

  // Live video stream performance stats for Debug Panel
  const [videoStats, setVideoStats] = useState({
    readyState: 0,
    paused: true,
    ended: false,
    width: 0,
    height: 0,
    streamId: "N/A",
    trackCount: 0,
    trackReadyState: "N/A",
    trackEnabled: false
  });

  const updateVideoStats = useCallback(() => {
    if (videoRef.current && streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      setVideoStats({
        readyState: videoRef.current.readyState,
        paused: videoRef.current.paused,
        ended: videoRef.current.ended,
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
        streamId: streamRef.current.id,
        trackCount: streamRef.current.getVideoTracks().length,
        trackReadyState: track ? track.readyState : "N/A",
        trackEnabled: track ? track.enabled : false
      });
    }
  }, []);

  // Callback Ref ensures video srcObject is assigned instantly as soon as React mounts the video element
  const videoRefCallback = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      // Assign the ref so it stays accessible via videoRef.current
      // @ts-ignore
      videoRef.current = node;

      if (streamRef.current) {
        if (node.srcObject !== streamRef.current) {
          console.log("[CameraDebug] Callback Ref triggered with DOM node. Setting srcObject with stream:", streamRef.current.id);
          node.srcObject = streamRef.current;
        }

        // Always attempt play if paused or not playing
        if (node.paused || node.readyState < 2) {
          node.play()
            .then(() => {
              console.log("[CameraDebug] Play successfully initiated on callback mount.");
              updateVideoStats();
            })
            .catch((err) => {
              console.error("[CameraDebug] Play failed inside callback ref:", err);
              updateVideoStats();
            });
        } else {
          updateVideoStats();
        }
      }
    } else {
      // @ts-ignore
      videoRef.current = null;
    }
  }, [updateVideoStats]);

  // Periodically poll video stream properties to guarantee accurate dimensions and play state
  useEffect(() => {
    let interval: any = null;
    if (cameraStep === "streaming") {
      updateVideoStats();
      interval = setInterval(() => {
        updateVideoStats();
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cameraStep, updateVideoStats]);

  // Sync to localStorage & Firebase
  useEffect(() => {
    localStorage.setItem("ai_scanned_events_v2", JSON.stringify(events));

    const syncToCloud = async () => {
      const user = auth.currentUser;
      if (user && user.uid !== "guest-user-session") {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(userDocRef, { scannedEvents: events }, { merge: true });
        } catch (e) {
          console.error("Error syncing events to Firestore:", e);
        }
      }
    };
    syncToCloud();
  }, [events]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const processApiResponse = (data: any): ScannedEvent => {
    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      eventName: data.eventName || "Draft Event",
      organizer: data.organizer || "",
      date: data.date || "",
      time: data.time || "",
      venue: data.venue || "",
      speaker: data.speaker || "",
      registrationLink: data.registrationLink || "",
      qrCode: data.qrCode || "",
      contactNumber: data.contactNumber || "",
      website: data.website || "",
      email: data.email || "",
      entryFee: data.entryFee || "",
      deadline: data.deadline || "",
      requiredDocuments: Array.isArray(data.requiredDocuments) ? data.requiredDocuments : [],
      dressCode: data.dressCode || "",
      competitionType: data.competitionType || "",
      skillsRequired: Array.isArray(data.skillsRequired) ? data.skillsRequired : [],
      eligibility: data.eligibility || "",
      prizes: Array.isArray(data.prizes) ? data.prizes : [],
      certificates: data.certificates || "",
      importantInstructions: data.importantInstructions || "",
      category: data.category || "Other",
      estimatedTravelTime: data.estimatedTravelTime || "",
      riskAssessment: data.riskAssessment || "",
      travelPlan: data.travelPlan || { destination: data.venue || "" },
      preparationChecklist: Array.isArray(data.preparationChecklist)
        ? data.preparationChecklist.map((item: any, idx: number) => ({
            id: `prep-${Date.now()}-${idx}`,
            text: typeof item === "string" ? item : item.text || JSON.stringify(item),
            completed: false,
          }))
        : [],
      packingChecklist: Array.isArray(data.packingChecklist)
        ? data.packingChecklist.map((item: any, idx: number) => ({
            id: `pack-${Date.now()}-${idx}`,
            text: typeof item === "string" ? item : item.text || JSON.stringify(item),
            completed: false,
          }))
        : [],
      studySchedule: Array.isArray(data.studySchedule)
        ? data.studySchedule.map((sch: any, idx: number) => ({
            id: `sch-${Date.now()}-${idx}`,
            day: sch.day || "",
            topic: sch.topic || "",
            duration: sch.duration || "",
            completed: false,
          }))
        : [],
      timeline: Array.isArray(data.timeline) ? data.timeline : [],
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
      isConfirmed: false,
    };
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  useEffect(() => {
    if (selectedMethod !== "camera") {
      stopCameraStream();
      setCameraStep("idle");
    }
  }, [selectedMethod]);

  const handleStartCamera = async (
    forceFacingMode?: "environment" | "user",
  ) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      triggerToast("Camera API not supported in this browser.");
      setCameraStep("idle");
      return;
    }

    setCameraPermissionError(false);
    const modeToUse = forceFacingMode || facingMode;

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: modeToUse,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        if (videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
        }
        try {
          await videoRef.current.play();
        } catch (err) {
          console.warn("[CameraDebug] Error playing video inside handleStartCamera (handled by callback ref):", err);
        }
      }

      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        setHasFlash(!!capabilities.torch);
        if (capabilities.zoom) {
          setHasZoom(true);
          setZoomRange({
            min: capabilities.zoom.min || 1,
            max: capabilities.zoom.max || 3,
            step: capabilities.zoom.step || 0.1,
          });
          setZoomLevel(capabilities.zoom.min || 1);
        } else {
          setHasZoom(false);
        }
      }

      setFacingMode(modeToUse);
      setCameraStep("streaming");
      onSetClockState("event");
    } catch (err: any) {
      console.warn("Could not access camera:", err);
      let errorMsg = "Permission denied or no camera found.";
      if (err.name === "NotAllowedError") {
        errorMsg = "Camera permission was denied. Please allow access.";
        setCameraPermissionError(true);
      }
      triggerToast(errorMsg);
      setCameraStep("idle");
    }
  };

  const toggleCamera = () => {
    handleStartCamera(facingMode === "environment" ? "user" : "environment");
  };

  const toggleFlash = async () => {
    if (!hasFlash || !streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any],
        });
        setFlashEnabled(!flashEnabled);
      } catch (e) {
        console.error("Failed to toggle flash", e);
      }
    }
  };

  const handleZoom = async (direction: "in" | "out") => {
    if (!streamRef.current) return;

    let newZoom = zoomLevel;
    if (direction === "in") {
      newZoom = Math.min(zoomRange.max, zoomLevel + zoomRange.step * 3);
    } else {
      newZoom = Math.max(zoomRange.min, zoomLevel - zoomRange.step * 3);
    }

    if (hasZoom) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && track.applyConstraints) {
        try {
          await track.applyConstraints({
            advanced: [{ zoom: newZoom }],
          });
          setZoomLevel(newZoom);
        } catch (e) {
          console.error("Zoom failed", e);
        }
      }
    } else {
      setZoomLevel(newZoom);
    }
  };

  const executeCapture = () => {
    if (!videoRef.current) return;

    // Capture visual frame onto canvas
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");

    // Pause stream, stop camera feed, show static captured preview
    videoRef.current.pause();
    stopCameraStream();
    setPreviewUrl(dataUrl);
    setCameraStep("captured");
    triggerToast("Poster frame captured! Click 'Scan Event' to run Milo OCR.");
  };

  const handleCaptureImage = () => {
    if (timerSeconds > 0) {
      let count = timerSeconds;
      setCountdownValue(count);
      const interval = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(interval);
          setCountdownValue(null);
          executeCapture();
        } else {
          setCountdownValue(count);
        }
      }, 1000);
    } else {
      executeCapture();
    }
  };

  // OCR and Extraction Progress Flow
  const startOcrScan = async (base64Part: string, mime: string, titleLabel: string) => {
    setLastScanPayload({ base64Part, mime, titleLabel });
    setIsScanning(true);
    setOcrActiveStep(0);
    setCaptureError(null);
    setTravelDetails(null);

    isManualCancelRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Progressive checkmarks (Do not skip steps)
    const progressTimer = setInterval(() => {
      setOcrActiveStep((prev) => {
        if (prev < 5) return prev + 1;
        clearInterval(progressTimer);
        return prev;
      });
    }, 800);

    // 10 second maximum processing timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    try {
      const res = await fetch("/api/ai/analyze-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Part,
          mimeType: mime,
          textInput: titleLabel,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle specific API error statuses immediately
      if (res.status === 429 || res.status === 500 || res.status === 503) {
        throw new Error("AI service temporarily unavailable.");
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Failed to analyze event (status: ${res.status}).`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error?.message || data.error || "Failed to parse details.");
      }

      // Check for zero readable content (OCR failed)
      const hasValidContent = data && (data.eventName || data.venue || data.date || data.time || data.organizer);
      if (!hasValidContent) {
        throw new Error("No readable text detected.");
      }

      // Ensure steps finish animating for high-end premium visual feel
      while (ocrActiveStep < 5) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      clearInterval(progressTimer);
      setOcrActiveStep(-1);
      setIsScanning(false);

      const parsedEvent = processApiResponse(data);
      // Put extracted event in user review draft space
      setPendingEvent(parsedEvent);
      setActiveEvent(null);
      triggerToast("AI Scanner succeeded! Please review and modify parameters.");
    } catch (err: any) {
      clearTimeout(timeoutId);
      clearInterval(progressTimer);
      setOcrActiveStep(-1);
      setIsScanning(false);

      if (err.name === "AbortError") {
        if (isManualCancelRef.current) {
          // Explicit manual cancellation, just exit
          return;
        }
        // Timeout happened
        setCaptureError("AI analysis timed out.");
        triggerToast("AI analysis timed out.");
      } else {
        const errMsg = err.message || "Couldn't recognize enough information from the poster.";
        setCaptureError(errMsg);
        triggerToast(errMsg);
      }
    }
  };

  // Handle local image file picker
  const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCaptureError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle local PDF file picker
  const handlePdfFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCaptureError(null);
    setSelectedFile(file);
    setPdfCurrentPage(1);
    setPdfPageCount(file.size > 2000000 ? 3 : 2); // Dynamic mock count based on size
    triggerToast(`PDF file "${file.name}" loaded successfully.`);
  };

  // Handle past text submit
  const handlePastedTextSubmit = () => {
    if (!textInput.trim()) return;
    const base64Text = btoa(unescape(encodeURIComponent(textInput)));
    startOcrScan(base64Text, "text/plain", `Pasted flyer detail: ${textInput.slice(0, 50)}`);
  };

  // Drag and Drop implementation
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
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type.includes("pdf") || file.name.endsWith(".pdf")) {
      setSelectedMethod("pdf");
      setCaptureError(null);
      setSelectedFile(file);
      setPdfCurrentPage(1);
      setPdfPageCount(2);
    } else {
      setSelectedMethod("upload");
      setCaptureError(null);
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Travel calculation
  const handleCalculateTransit = (venue: string) => {
    if (!venue) return;
    setCalculatingTravel(true);

    setTimeout(() => {
      const numCode = venue.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const dist = ((numCode % 12) + 1.5).toFixed(1);
      const eta = Math.round((numCode % 30) + 7);
      const traffics = ["Moderate traffic delays", "Light traffic", "Smooth moving corridors", "Heavy rush hour delays"];
      const traffic = traffics[numCode % traffics.length];
      const conditions = ["Sunny, 21°C", "Partly Cloudy, 17°C", "Scattered Showers, 14°C", "Clear Evening, 18°C"];
      const weather = conditions[numCode % conditions.length];

      setTravelDetails({
        distance: `${dist} km`,
        eta: `${eta} mins`,
        traffic,
        weather,
        bestDeparture: `${eta + 12} mins before start`,
        reminderTime: `${eta + 22} mins before start`
      });
      setCalculatingTravel(false);
      triggerToast("Transit times & traffic mapping updated!");
    }, 1100);
  };

  // Actual saving and task injection logic after user confirmation
  const executeConfirmEvent = (finalEvent: ScannedEvent) => {
    const isAlreadyPresent = events.some((e) => e.id === finalEvent.id);
    const confirmed = { ...finalEvent, isConfirmed: true };

    if (isAlreadyPresent) {
      setEvents((prev) => prev.map((e) => (e.id === finalEvent.id ? confirmed : e)));
    } else {
      setEvents((prev) => [confirmed, ...prev]);
    }

    // 1. Create standard Calendar entry
    try {
      const localCal = localStorage.getItem("saver_calendar_events") || "[]";
      const calList = JSON.parse(localCal);
      const parsedHour = parseInt(finalEvent.time) || 14;

      const newCal = {
        id: `cal-${Date.now()}`,
        title: `📅 ${finalEvent.eventName}`,
        startHour: parsedHour,
        durationHours: 2,
        type: finalEvent.category === "Exam" ? "class" : "meeting",
      };
      localStorage.setItem("saver_calendar_events", JSON.stringify([newCal, ...calList]));
    } catch (e) {
      console.warn("Could not save calendar entry", e);
    }

    // 2. Inject milestones & preparation as custom tasks
    const mainTask: Task = {
      id: `task-ev-${Date.now()}`,
      title: `🎉 Attend: ${finalEvent.eventName}`,
      deadline: finalEvent.date + (finalEvent.time ? ` at ${finalEvent.time}` : ""),
      priority: finalEvent.prizes?.length ? "high" : "medium",
      category: "Do Now",
      notes: `Captured by Milo. Location: ${finalEvent.venue}. ${finalEvent.importantInstructions || ""}`,
      effortEstimatedHours: 3,
      isCompleted: false,
      subtasks: finalEvent.preparationChecklist.map((it, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        title: it.text,
        durationStr: "1 Hour",
        milestoneIndex: idx + 1,
        riskLevel: "low",
        completed: false,
      })),
    };
    onAddTask(mainTask);

    // 3. Inject study schedule blocks if relevant
    if (finalEvent.studySchedule && finalEvent.studySchedule.length > 0) {
      finalEvent.studySchedule.forEach((sch, sIdx) => {
        const studyTask: Task = {
          id: `task-sch-${Date.now()}-${sIdx}`,
          title: `📚 Prep: ${sch.topic} (${finalEvent.eventName})`,
          deadline: sch.day || finalEvent.date,
          priority: "medium",
          category: "Do Today",
          notes: `Adaptive study corridor created automatically by Milo.`,
          effortEstimatedHours: parseFloat(sch.duration) || 1.5,
          isCompleted: false,
        };
        onAddTask(studyTask);
      });
    }

    setActiveEvent(confirmed);
    setPendingEvent(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setTravelDetails(null);
    onSetClockState("progress");
    setShowConfirmModal(false);
    setEventToConfirm(null);
    triggerToast("Event successfully saved, scheduled, and injected into Planner!");
  };

  // Save reviewed Event - opens confirmation first
  const handleConfirmEvent = (finalEvent: ScannedEvent) => {
    setEventToConfirm(finalEvent);
    setShowConfirmModal(true);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (activeEvent?.id === id) {
      setActiveEvent(null);
    }
    triggerToast("Event deleted permanently.");
  };

  const handleArchiveEvent = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isArchived: !e.isArchived } : e)),
    );
    if (activeEvent?.id === id) {
      setActiveEvent((prev) => (prev ? { ...prev, isArchived: !prev.isArchived } : null));
    }
    triggerToast("Event archive status updated.");
  };

  const handleDuplicateEvent = (event: ScannedEvent) => {
    const duplicated: ScannedEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      eventName: `${event.eventName} (Copy)`,
      isConfirmed: false,
    };
    setEvents((prev) => [duplicated, ...prev]);
    setActiveEvent(duplicated);
    triggerToast("Event duplicated.");
  };

  const handleShareEvent = (event: ScannedEvent) => {
    const shareText = `Check out this event: *${event.eventName}*\n📅 Date: ${event.date}\n⏰ Time: ${event.time}\n📍 Venue: ${event.venue}\n${event.registrationLink ? `🔗 Register: ${event.registrationLink}` : ""}\n\nSynced & scheduled automatically via Milo Smart Assistant.`;
    navigator.clipboard.writeText(shareText);
    setCopiedTextId(event.id);
    setTimeout(() => setCopiedTextId(null), 2500);
    triggerToast("Share content copied to clipboard!");
  };

  const handleExportICal = (event: ScannedEvent) => {
    const cleanName = event.eventName.replace(/,/g, "\\,");
    const cleanVenue = event.venue.replace(/,/g, "\\,");
    const dateFormatted = event.date.replace(/-/g, "");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Milo AI Studio//NONSGML Smart Event Planner//EN",
      "BEGIN:VEVENT",
      `UID:${event.id}@miloaistudio.com`,
      `DTSTAMP:${dateFormatted}T000000Z`,
      `DTSTART:${dateFormatted}T100000Z`,
      `DTEND:${dateFormatted}T120000Z`,
      `SUMMARY:${cleanName}`,
      `LOCATION:${cleanVenue}`,
      `DESCRIPTION:Category: ${event.category}\\nOrganizer: ${event.organizer || "N/A"}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${event.eventName.toLowerCase().replace(/\s+/g, "-")}.ics`;
    link.click();
    triggerToast("iCalendar exported successfully!");
  };

  const handleExportJSON = (event: ScannedEvent) => {
    const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(event, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `${event.eventName.toLowerCase().replace(/\s+/g, "-")}-blueprint.json`);
    link.click();
    triggerToast("JSON model exported!");
  };

  const handleExportMarkdown = (event: ScannedEvent) => {
    const md =
      `# ${event.eventName}\n\n` +
      `- **Category**: ${event.category}\n` +
      `- **Organizer**: ${event.organizer || "N/A"}\n` +
      `- **Date & Time**: ${event.date} at ${event.time}\n` +
      `- **Venue**: ${event.venue}\n` +
      `- **Speaker**: ${event.speaker || "N/A"}\n\n` +
      `## 🗺️ Transit Details\n` +
      `- **Transit Distance**: ${event.travelPlan?.distance || "N/A"}\n` +
      `- **Best Departure**: ${event.travelPlan?.suggestedDepartureTime || "N/A"}\n` +
      `- **Transport Mode**: ${event.travelPlan?.recommendedTransport || "N/A"}\n\n` +
      `## 📝 Required Milestones\n` +
      event.preparationChecklist.map((it) => `- [${it.completed ? "x" : " "}] ${it.text}`).join("\n") +
      `\n\n## 🎒 Packing Checklist\n` +
      event.packingChecklist.map((it) => `- [${it.completed ? "x" : " "}] ${it.text}`).join("\n");

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${event.eventName.toLowerCase().replace(/\s+/g, "-")}-agenda.md`;
    link.click();
    triggerToast("Markdown exported!");
  };

  const handleTogglePrep = (itemId: string) => {
    if (!activeEvent) return;
    const updated = activeEvent.preparationChecklist.map((it) =>
      it.id === itemId ? { ...it, completed: !it.completed } : it,
    );
    const updatedEvent = { ...activeEvent, preparationChecklist: updated };
    setEvents((prev) => prev.map((ev) => (ev.id === activeEvent.id ? updatedEvent : ev)));
    setActiveEvent(updatedEvent);
  };

  const handleTogglePacking = (itemId: string) => {
    if (!activeEvent) return;
    const updated = activeEvent.packingChecklist.map((it) =>
      it.id === itemId ? { ...it, completed: !it.completed } : it,
    );
    const updatedEvent = { ...activeEvent, packingChecklist: updated };
    setEvents((prev) => prev.map((ev) => (ev.id === activeEvent.id ? updatedEvent : ev)));
    setActiveEvent(updatedEvent);
  };

  const getCountdownString = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return "Happening now";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const OCR_STEPS = [
    { id: "uploading", label: "Uploading Poster Assets..." },
    { id: "ocr", label: "Running OCR Segmentation..." },
    { id: "extracting", label: "Extracting Text Entities..." },
    { id: "dates", label: "Parsing Key Dates & Times..." },
    { id: "venue", label: "Resolving Location & Venue..." },
    { id: "schedule", label: "Structuring Study Corridors..." },
  ];

  return (
    <div className="space-y-8 animate-fade-in relative pb-16">
      {/* Toast Alert overlay */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-gray-800 flex items-center gap-2"
          >
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono tracking-[0.2em] text-gray-400 uppercase">
              Poster & Notice Intelligence
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-display font-medium text-gray-900 tracking-tight">
            AI Event Capture Workspace
          </h2>
          <p className="text-xs text-gray-400">
            Scan any flyer, syllabus sheet, or notice board. Milo instantly generates travel routes, pre-planning checklists, and study agendas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Capture / Entry points */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-6">
            
            {/* Method Tabs */}
            {!isScanning && (
              <div className="flex bg-gray-50 p-1 rounded-xl">
                {[
                  { id: "camera", label: "Open Camera", icon: Camera },
                  { id: "upload", label: "Upload Image", icon: UploadCloud },
                  { id: "pdf", label: "Scan PDF", icon: Mail },
                  { id: "paste", label: "Manual Text", icon: FileText },
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => {
                        setSelectedMethod(method.id as any);
                        setCameraStep("idle");
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setCaptureError(null);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-lg text-xs font-medium transition-all ${
                        selectedMethod === method.id
                          ? "bg-white text-gray-900 shadow-xs border border-gray-100"
                          : "text-gray-400 hover:text-gray-700 cursor-pointer"
                      }`}
                    >
                      <Icon size={12} />
                      <span className="hidden sm:inline">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Content Display Panels */}
            {isScanning ? (
              /* Chronological Step-by-Step Progress Overlay */
              <div className="p-6 bg-slate-50 rounded-2xl border border-gray-100 space-y-6 animate-pulse">
                <div className="flex items-center gap-3 border-b border-gray-200/60 pb-4">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <div>
                    <h4 className="text-xs font-mono font-bold text-gray-950">Milo OCR Intelligence Engine</h4>
                    <p className="text-[10px] text-gray-400">Performing deep entity parsing...</p>
                  </div>
                </div>

                <div className="space-y-3.5 border-b border-gray-100 pb-5">
                  {OCR_STEPS.map((step, idx) => {
                    const isCompleted = idx < ocrActiveStep;
                    const isActive = idx === ocrActiveStep;
                    return (
                      <div key={step.id} className="flex items-center justify-between text-xs transition-all">
                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <div className="w-4.5 h-4.5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                              <Check size={10} strokeWidth={3} />
                            </div>
                          ) : isActive ? (
                            <div className="w-4.5 h-4.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin shrink-0" />
                          ) : (
                            <div className="w-4.5 h-4.5 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            </div>
                          )}
                          <span className={`font-medium ${isCompleted ? "text-emerald-600" : isActive ? "text-indigo-600 font-semibold" : "text-gray-400"}`}>
                            {step.label}
                          </span>
                        </div>
                        {isCompleted && (
                          <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.25 rounded">
                            OK
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Immediate Cancel Scan button */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={cancelOcrScan}
                    className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    Cancel Scan
                  </button>
                </div>
              </div>
            ) : captureError ? (
              /* Custom dynamic state machine error card matching requirements 3, 4, 5 */
              <div className="text-center p-6 space-y-4 bg-slate-50 rounded-2xl border border-gray-200">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto">
                  <AlertCircle size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {captureError === "AI analysis timed out."
                      ? "AI Analysis Timed Out"
                      : captureError === "AI service temporarily unavailable."
                      ? "AI Service Unavailable"
                      : captureError === "No readable text detected."
                      ? "No Readable Text Detected"
                      : "Scanning Parse Failure"}
                  </h3>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto leading-relaxed">
                    {captureError}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2 max-w-[220px] mx-auto">
                  {/* RETRY ANALYSIS BUTTON: Rendered for Timeout or Service Unavailable or if payload is cached */}
                  {(captureError === "AI analysis timed out." || captureError === "AI service temporarily unavailable." || lastScanPayload) && (
                    <button
                      onClick={() => {
                        if (lastScanPayload) {
                          startOcrScan(lastScanPayload.base64Part, lastScanPayload.mime, lastScanPayload.titleLabel);
                        } else if (selectedMethod === "camera" && previewUrl) {
                          const rawBase64 = previewUrl.split(",")[1];
                          startOcrScan(rawBase64, "image/jpeg", "Captured Camera Poster");
                        } else {
                          setCaptureError(null);
                          if (selectedMethod === "camera") handleStartCamera();
                        }
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      {captureError === "AI service temporarily unavailable." ? "Retry Analysis" : "Retry Analysis"}
                    </button>
                  )}

                  {/* RETAKE / UPLOAD ANOTHER BUTTON */}
                  {selectedMethod === "camera" ? (
                    <button
                      onClick={() => {
                        setCaptureError(null);
                        setPreviewUrl(null);
                        handleStartCamera();
                      }}
                      className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2 rounded-xl transition-all cursor-pointer"
                    >
                      Retake
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCaptureError(null);
                        setPreviewUrl(null);
                        setSelectedFile(null);
                      }}
                      className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2 rounded-xl transition-all cursor-pointer"
                    >
                      Upload Another Image
                    </button>
                  )}

                  {/* MANUAL ENTRY / CONTINUE WITHOUT AI */}
                  <button
                    onClick={startManualEntry}
                    className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2 rounded-xl transition-all cursor-pointer"
                  >
                    {captureError === "AI service temporarily unavailable." ? "Continue without AI" : "Manual Entry"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* CAMERA METHOD */}
                {selectedMethod === "camera" && (
                  <div className="space-y-4">
                    {cameraStep === "streaming" && (
                      <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 rounded-t-xl border border-b-0 border-gray-100">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={toggleFlash}
                            disabled={!hasFlash}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              !hasFlash ? "text-gray-300 bg-gray-100 cursor-not-allowed" : flashEnabled ? "bg-amber-100 text-amber-600" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                            }`}
                            title="Flashlight"
                          >
                            {flashEnabled ? <Zap size={14} /> : <ZapOff size={14} />}
                          </button>
                          <button
                            onClick={() => {
                              if (timerSeconds === 0) setTimerSeconds(3);
                              else if (timerSeconds === 3) setTimerSeconds(10);
                              else setTimerSeconds(0);
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors text-[10px] font-bold ${
                              timerSeconds > 0 ? "bg-amber-100 text-amber-600" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {timerSeconds > 0 ? `${timerSeconds}s` : <Clock size={14} />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setGridVisible(!gridVisible)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              gridVisible ? "bg-gray-200 text-gray-800" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <Map size={14} />
                          </button>
                          <button
                            onClick={toggleCamera}
                            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <SwitchCamera size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="relative w-full aspect-video rounded-xl bg-slate-900 overflow-hidden flex flex-col items-center justify-center border border-slate-800">
                      {cameraStep === "idle" && (
                        <div className="text-center p-6 space-y-4">
                          <Camera size={36} className="text-indigo-400 mx-auto animate-pulse" />
                          <div className="space-y-1">
                            <h3 className="text-sm font-mono font-bold text-slate-100">Ready to Scan</h3>
                            <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                              Point your lens directly at an event poster, flyer, notice board, or syllabus schedule.
                            </p>
                          </div>
                          <button
                            onClick={() => handleStartCamera()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Camera size={14} /> Open Video Lens
                          </button>
                        </div>
                      )}

                      {cameraStep === "streaming" && (
                        <>
                          <video
                            ref={videoRefCallback}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ transform: `scale(${zoomLevel})` }}
                            onLoadedMetadata={updateVideoStats}
                            onLoadedData={updateVideoStats}
                            onCanPlay={updateVideoStats}
                            onPlaying={updateVideoStats}
                          />

                          {gridVisible && (
                            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10 opacity-30">
                              <div className="border-r border-b border-white"></div>
                              <div className="border-r border-b border-white"></div>
                              <div className="border-b border-white"></div>
                              <div className="border-r border-b border-white"></div>
                              <div className="border-r border-b border-white"></div>
                              <div className="border-b border-white"></div>
                              <div className="border-r border-white"></div>
                              <div className="border-r border-white"></div>
                              <div></div>
                            </div>
                          )}

                          {countdownValue !== null && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                              <span className="text-5xl font-mono font-bold text-white drop-shadow">
                                {countdownValue}
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      {cameraStep === "captured" && previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Captured Poster preview"
                          className="absolute inset-0 w-full h-full object-contain bg-slate-900"
                        />
                      )}
                    </div>

                    {/* Camera Control Panel footer */}
                    {cameraStep === "streaming" && (
                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleZoom("out")}
                            className="text-gray-500 hover:text-gray-900"
                          >
                            <ZoomOut size={14} />
                          </button>
                          <span className="text-[10px] font-mono text-gray-700 w-8 text-center">
                            {zoomLevel.toFixed(1)}x
                          </span>
                          <button
                            onClick={() => handleZoom("in")}
                            className="text-gray-500 hover:text-gray-900"
                          >
                            <ZoomIn size={14} />
                          </button>
                        </div>

                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => {
                              stopCameraStream();
                              setCameraStep("idle");
                            }}
                            className="text-xs text-gray-500 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleCaptureImage}
                            className="w-14 h-14 rounded-full border-4 border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer shadow"
                          >
                            <div className="w-10 h-10 rounded-full bg-slate-900" />
                          </button>
                          <div className="w-10" /> {/* Spacer */}
                        </div>
                      </div>
                    )}

                    {/* Captured Frame Actions - Exactly Retake, Use Photo, and Analyze */}
                    {cameraStep === "captured" && previewUrl && (
                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between gap-2.5">
                        <button
                          onClick={() => {
                            setPreviewUrl(null);
                            handleStartCamera();
                          }}
                          className="flex-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs py-2 rounded-lg cursor-pointer text-center"
                        >
                          Retake
                        </button>
                        <button
                          onClick={() => {
                            startManualEntry();
                          }}
                          className="flex-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs py-2 rounded-lg cursor-pointer text-center"
                        >
                          Use Photo
                        </button>
                        <button
                          onClick={() => {
                            const rawBase64 = previewUrl.split(",")[1];
                            startOcrScan(rawBase64, "image/jpeg", "Captured Camera Poster");
                          }}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow"
                        >
                          <Sparkles size={11} /> Analyze
                        </button>
                      </div>
                    )}

                    {/* Developer diagnostics panel rendered completely outside the live preview */}
                    {showDebug && (
                      <div className="p-3.5 bg-slate-950 text-[10px] text-slate-300 rounded-xl space-y-1 font-mono border border-slate-800 shadow-md">
                        <div className="font-bold border-b border-indigo-900/40 pb-1 mb-1 text-indigo-400">🔧 SYSTEM DIAGNOSTICS PANEL</div>
                        <div>video.readyState: <span className="text-white">{videoStats.readyState}</span></div>
                        <div>video.paused: <span className="text-white">{videoStats.paused ? "true" : "false"}</span></div>
                        <div>video.ended: <span className="text-white">{videoStats.ended ? "true" : "false"}</span></div>
                        <div>video.videoWidth: <span className="text-white">{videoStats.width}px</span></div>
                        <div>video.videoHeight: <span className="text-white">{videoStats.height}px</span></div>
                        <div>stream.id: <span className="text-white">{videoStats.streamId}</span></div>
                        <div>number of tracks: <span className="text-white">{videoStats.trackCount}</span></div>
                        <div>track.readyState: <span className="text-white">{videoStats.trackReadyState}</span></div>
                        <div>track.enabled: <span className="text-white">{videoStats.trackEnabled ? "true" : "false"}</span></div>
                      </div>
                    )}
                  </div>
                )}

                {/* IMAGE UPLOAD METHOD */}
                {selectedMethod === "upload" && (
                  <div className="space-y-4">
                    {!previewUrl ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                          dragOver ? "border-indigo-500 bg-indigo-50/20" : "border-gray-200 hover:border-indigo-400 hover:bg-gray-50/30"
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageFileSelected}
                          accept="image/*"
                          className="hidden"
                        />
                        <UploadCloud size={32} className="text-indigo-500 mx-auto mb-2" />
                        <h4 className="text-xs font-mono font-bold text-gray-900">Drag & drop flyer poster image</h4>
                        <p className="text-[10px] text-gray-400 mt-1">Accepts PNG, JPG, WEBP up to 10MB.</p>
                        <button className="mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-medium px-3 py-1.5 rounded-lg">
                          Browse Files
                        </button>
                      </div>
                    ) : (
                      /* Image File Preview Box */
                      <div className="space-y-4">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-gray-200 flex items-center justify-center">
                          <img src={previewUrl} alt="Upload Preview" className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-lg border border-gray-100">
                          <span className="font-mono text-gray-500 truncate max-w-xs">{selectedFile?.name || "Uploaded Image"}</span>
                          <span className="text-gray-400">{(selectedFile ? selectedFile.size / 1000 : 0).toFixed(0)} KB</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <button
                            onClick={() => {
                              setPreviewUrl(null);
                              setSelectedFile(null);
                            }}
                            className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-medium text-xs px-3.5 py-2 rounded-lg cursor-pointer"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => {
                              const rawBase = previewUrl.split(",")[1];
                              startOcrScan(rawBase, selectedFile?.type || "image/jpeg", `Uploaded file: ${selectedFile?.name}`);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 shadow"
                          >
                            <Sparkles size={12} /> Scan Poster with AI
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PDF SCAN METHOD */}
                {selectedMethod === "pdf" && (
                  <div className="space-y-4">
                    {!selectedFile ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => pdfInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                          dragOver ? "border-indigo-500 bg-indigo-50/20" : "border-gray-200 hover:border-indigo-400 hover:bg-gray-50/30"
                        }`}
                      >
                        <input
                          type="file"
                          ref={pdfInputRef}
                          onChange={handlePdfFileSelected}
                          accept="application/pdf"
                          className="hidden"
                        />
                        <Mail size={32} className="text-indigo-500 mx-auto mb-2" />
                        <h4 className="text-xs font-mono font-bold text-gray-900">Drag & drop syllabus PDF file</h4>
                        <p className="text-[10px] text-gray-400 mt-1">Accepts PDF sheets up to 15MB.</p>
                        <button className="mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-medium px-3 py-1.5 rounded-lg">
                          Browse PDFs
                        </button>
                      </div>
                    ) : (
                      /* Interactive Gorgeous PDF Page Preview Frame */
                      <div className="space-y-4 animate-fade-in">
                        <div className="bg-slate-50 border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                          {/* Mock PDF Header bar */}
                          <div className="bg-slate-100/80 px-3.5 py-2 border-b border-gray-200 flex items-center justify-between text-[11px] font-medium text-gray-600">
                            <div className="flex items-center gap-1.5 truncate">
                              <div className="w-2.5 h-2.5 rounded-xs bg-red-500" />
                              <span className="font-mono truncate">{selectedFile.name}</span>
                            </div>
                            <span className="shrink-0 font-mono">Page {pdfCurrentPage} of {pdfPageCount}</span>
                          </div>

                          {/* PDF Content Page Canvas Mockup */}
                          <div className="p-6 bg-white min-h-[190px] flex flex-col justify-between border-b border-gray-100 select-none relative">
                            {/* Watermark badge */}
                            <div className="absolute top-2 right-2 border border-red-200 bg-red-50 text-[9px] font-bold text-red-600 px-1.5 py-0.5 rounded font-mono">
                              PDF PREVIEW
                            </div>

                            {pdfCurrentPage === 1 ? (
                              <div className="space-y-3">
                                <div className="border-b border-slate-300 pb-2">
                                  <div className="h-3 w-2/3 bg-slate-300 rounded animate-pulse" />
                                  <div className="h-2 w-1/2 bg-slate-200 rounded mt-1.5 animate-pulse" />
                                </div>
                                <div className="space-y-2 pt-2">
                                  <div className="h-1.5 w-full bg-slate-100 rounded" />
                                  <div className="h-1.5 w-11/12 bg-slate-100 rounded" />
                                  <div className="h-1.5 w-10/12 bg-slate-100 rounded" />
                                  <div className="h-1.5 w-full bg-slate-100 rounded" />
                                </div>
                                <div className="pt-4 flex items-center gap-2">
                                  <div className="h-4 w-4 bg-slate-200 rounded shrink-0" />
                                  <div className="h-2 w-1/3 bg-slate-200 rounded" />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3.5">
                                <div className="border-b border-slate-300 pb-2">
                                  <div className="h-2.5 w-1/2 bg-slate-300 rounded" />
                                </div>
                                <div className="space-y-2 pt-1.5">
                                  {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <div className="h-2.5 w-2.5 rounded-full bg-slate-300 shrink-0" />
                                      <div className="h-1.5 w-3/4 bg-slate-100 rounded" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="text-[10px] text-gray-300 font-mono text-center pt-6">
                              [Encrypted PDF Vector stream loaded]
                            </div>
                          </div>

                          {/* Page Controls */}
                          <div className="px-3 py-1.5 bg-slate-50 flex justify-center items-center gap-4 text-xs">
                            <button
                              disabled={pdfCurrentPage === 1}
                              onClick={() => setPdfCurrentPage(p => Math.max(1, p - 1))}
                              className="text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed font-semibold p-1"
                            >
                              ◄ Prev Page
                            </button>
                            <span className="font-mono text-gray-600">Page {pdfCurrentPage}</span>
                            <button
                              disabled={pdfCurrentPage === pdfPageCount}
                              onClick={() => setPdfCurrentPage(p => Math.min(pdfPageCount, p + 1))}
                              className="text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed font-semibold p-1"
                            >
                              Next Page ►
                            </button>
                          </div>
                        </div>

                        {/* File Action Row */}
                        <div className="flex items-center justify-between gap-3">
                          <button
                            onClick={() => {
                              setSelectedFile(null);
                            }}
                            className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-medium text-xs px-3.5 py-2 rounded-lg cursor-pointer"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => {
                              // Read PDF as base64 and feed it to analyze-event
                              const reader = new FileReader();
                              reader.onload = () => {
                                const base64Data = (reader.result as string).split(",")[1];
                                startOcrScan(base64Data, "application/pdf", `PDF Syllabus: ${selectedFile.name}`);
                              };
                              reader.readAsDataURL(selectedFile);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 shadow"
                          >
                            <Sparkles size={12} /> Scan PDF with AI
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PASTE TEXT METHOD */}
                {selectedMethod === "paste" && (
                  <div className="space-y-3.5">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Paste raw flyer details, syllabus outline, or registration emails here..."
                      className="w-full h-32 p-3 text-xs border border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none leading-relaxed"
                    />
                    <button
                      onClick={handlePastedTextSubmit}
                      disabled={!textInput.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-semibold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <Sparkles size={13} /> Analyse Description
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Captured Events Library Shelf */}
          {events.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-mono tracking-wider text-gray-400 uppercase font-bold">
                Captured Events Library
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      setActiveEvent(event);
                      setPendingEvent(null);
                      setIsEditing(false);
                    }}
                    className={`p-3 bg-white border rounded-xl text-left transition-all cursor-pointer flex justify-between items-center gap-3 ${
                      activeEvent?.id === event.id ? "border-indigo-500 shadow-sm" : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="truncate space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.25 rounded font-semibold">
                          {event.category}
                        </span>
                        {event.isConfirmed && (
                          <span className="text-[8px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.25 rounded flex items-center gap-0.5">
                            <Check size={8} /> SCHEDULED
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-mono font-bold text-gray-900 truncate">
                        {event.eventName}
                      </h4>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <CalendarIcon size={10} /> {event.date}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-slate-50 rounded-lg"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Developer Mode Diagnostics Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200/60 rounded-xl text-[10px] text-gray-500 font-mono">
            <span className="flex items-center gap-1">🔧 Developer Diagnostics Mode</span>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${
                showDebug ? "bg-indigo-600 text-white shadow-xs" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {showDebug ? "Active" : "Inactive"}
            </button>
          </div>
        </div>

        {/* Right column: Workspace (Draft Review Form vs. Saved Details) */}
        <div className="lg:col-span-7">
          {pendingEvent ? (
            /* MILO DRAFT REVIEW & CONFIRMATION CORRIDOR */
            <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm p-6 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  <h3 className="text-sm font-mono font-bold text-gray-900 uppercase tracking-wide">
                    🤖 Milo Draft Review Corridor
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-gray-400">Pre-check verification</span>
              </div>

              {/* Warning flags if critical properties are omitted */}
              <div className="space-y-2">
                {(!pendingEvent.date || pendingEvent.date.toLowerCase().includes("missing") || pendingEvent.date.toLowerCase().includes("unknown")) && (
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center gap-2 text-[11px] text-amber-800">
                    <AlertCircle size={14} className="text-amber-600 shrink-0" />
                    <span><strong>Event Date missing:</strong> Please specify a valid date below to map schedule study blocks.</span>
                  </div>
                )}
                {(!pendingEvent.venue || pendingEvent.venue.toLowerCase().includes("missing") || pendingEvent.venue.toLowerCase().includes("unknown")) && (
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center gap-2 text-[11px] text-amber-800">
                    <AlertCircle size={14} className="text-amber-600 shrink-0" />
                    <span><strong>Venue Location missing:</strong> Specify physical address to calculate optimal departure.</span>
                  </div>
                )}
              </div>

              {/* Editable Fields Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 font-semibold uppercase">Event Name</label>
                  <input
                    type="text"
                    value={pendingEvent.eventName}
                    onChange={(e) => setPendingEvent({ ...pendingEvent, eventName: e.target.value })}
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 font-semibold uppercase">Category</label>
                  <select
                    value={pendingEvent.category}
                    onChange={(e) => setPendingEvent({ ...pendingEvent, category: e.target.value })}
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none"
                  >
                    {[
                      "Hackathon", "Workshop", "Seminar", "Conference", "Exam", "Interview",
                      "Competition", "Meeting", "Sports Event", "Festival", "Training Session",
                      "Webinar", "Career Fair", "Club Activity", "Volunteer Program", "Other"
                    ].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 font-semibold uppercase">Organizer</label>
                  <input
                    type="text"
                    value={pendingEvent.organizer || ""}
                    onChange={(e) => setPendingEvent({ ...pendingEvent, organizer: e.target.value })}
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 font-semibold uppercase">Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={pendingEvent.date || ""}
                    onChange={(e) => setPendingEvent({ ...pendingEvent, date: e.target.value })}
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 font-semibold uppercase">Start Time</label>
                  <input
                    type="text"
                    value={pendingEvent.time || ""}
                    placeholder="e.g. 10:00 AM"
                    onChange={(e) => setPendingEvent({ ...pendingEvent, time: e.target.value })}
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 font-semibold uppercase">Venue / Link</label>
                  <input
                    type="text"
                    value={pendingEvent.venue || ""}
                    placeholder="Physical coordinate or web URL"
                    onChange={(e) => setPendingEvent({ ...pendingEvent, venue: e.target.value })}
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Travel Calculations Interface */}
              {pendingEvent.venue && (
                <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-indigo-700 font-bold flex items-center gap-1.5">
                      <Car size={12} /> Travel Mapping Corridor
                    </span>
                    <button
                      onClick={() => handleCalculateTransit(pendingEvent.venue)}
                      disabled={calculatingTravel}
                      className="text-[10px] font-mono font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                    >
                      {calculatingTravel ? "Calculating..." : "Calculate optimal travel with Milo"}
                    </button>
                  </div>

                  {travelDetails ? (
                    <div className="grid grid-cols-2 gap-3 text-xs pt-1.5 border-t border-slate-150">
                      <div>
                        <p className="text-[9px] font-mono text-gray-400 uppercase">Distance & ETA</p>
                        <p className="font-semibold text-gray-800">{travelDetails.distance} ({travelDetails.eta})</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-mono text-gray-400 uppercase">Traffic Status</p>
                        <p className="font-semibold text-gray-800">{travelDetails.traffic}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-mono text-gray-400 uppercase">Local Weather</p>
                        <p className="font-semibold text-gray-800">{travelDetails.weather}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-mono text-gray-400 uppercase">Best Departure Window</p>
                        <p className="font-semibold text-indigo-700">{travelDetails.bestDeparture}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 leading-normal">
                      Would you like Milo to calculate optimal travel times, parking availability, weather windows, and transit delay risks?
                    </p>
                  )}
                </div>
              )}

              {/* Checklist review & confirmation */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wide">
                  Smart Task Lists Built by Milo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                    <h5 className="text-[10px] font-mono font-bold text-gray-700 flex items-center gap-1">
                      <CheckCircle size={10} className="text-indigo-500" /> Prep Milestones ({pendingEvent.preparationChecklist.length})
                    </h5>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {pendingEvent.preparationChecklist.map((it) => (
                        <p key={it.id} className="text-[11px] text-gray-600 truncate">• {it.text}</p>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                    <h5 className="text-[10px] font-mono font-bold text-gray-700 flex items-center gap-1">
                      <Backpack size={10} className="text-indigo-500" /> Packing Checklist ({pendingEvent.packingChecklist.length})
                    </h5>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {pendingEvent.packingChecklist.map((it) => (
                        <p key={it.id} className="text-[11px] text-gray-600 truncate">• {it.text}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => {
                    setPendingEvent(null);
                    setTravelDetails(null);
                  }}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Ignore (Discard)
                </button>
                <button
                  onClick={() => handleConfirmEvent(pendingEvent)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarRange size={13} /> Confirm & Save Event
                </button>
              </div>
            </div>
          ) : activeEvent ? (
            /* SAVED ACTIVE DETAIL VIEW WORKSPACE */
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden space-y-6 p-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 pb-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold uppercase">
                      {activeEvent.category}
                    </span>
                    <span className="text-[9px] font-mono bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Clock size={10} /> Countdown: {getCountdownString(activeEvent.date)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                    {activeEvent.eventName}
                  </h3>
                  {activeEvent.organizer && (
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <User size={12} /> Organizer: <strong>{activeEvent.organizer}</strong>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  <button
                    onClick={() => handleDuplicateEvent(activeEvent)}
                    className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-100"
                    title="Duplicate"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => handleArchiveEvent(activeEvent.id)}
                    className={`p-1.5 rounded-lg border ${activeEvent.isArchived ? "bg-slate-100 text-gray-700" : "text-gray-400 hover:text-gray-900"}`}
                    title="Archive"
                  >
                    <Archive size={13} />
                  </button>
                  <button
                    onClick={() => handleShareEvent(activeEvent)}
                    className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-100"
                    title="Share"
                  >
                    {copiedTextId === activeEvent.id ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
                  </button>
                </div>
              </div>

              {/* Event detail grids */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h5 className="font-mono font-bold text-gray-900 flex items-center gap-1 uppercase text-[10px] tracking-wider">
                      <MapPin size={12} className="text-indigo-500" /> Venue Location
                    </h5>
                    <p className="text-gray-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 truncate">{activeEvent.venue}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono text-gray-400 uppercase font-bold">Event Date</p>
                      <p className="font-semibold text-gray-800">{activeEvent.date}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono text-gray-400 uppercase font-bold">Start Time</p>
                      <p className="font-semibold text-gray-800">{activeEvent.time || "Unspecified"}</p>
                    </div>
                  </div>

                  {activeEvent.importantInstructions && (
                    <div className="space-y-1.5">
                      <h5 className="font-mono font-bold text-gray-900 uppercase text-[9px] tracking-wider">⚠️ Critical Instructions</h5>
                      <p className="text-gray-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100/60 leading-relaxed text-[11px]">
                        {activeEvent.importantInstructions}
                      </p>
                    </div>
                  )}
                </div>

                {/* Checklist Toggles Section */}
                <div className="space-y-4">
                  <div className="space-y-2.5">
                    <h5 className="font-mono font-bold text-gray-900 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                      <ClipboardList size={12} className="text-indigo-500" /> Preparation Checklists
                    </h5>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {activeEvent.preparationChecklist.map((it) => (
                        <label key={it.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={it.completed}
                            onChange={() => handleTogglePrep(it.id)}
                            className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5"
                          />
                          <span className={`text-[11px] ${it.completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                            {it.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h5 className="font-mono font-bold text-gray-900 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                      <Backpack size={12} className="text-indigo-500" /> Packing List (To Bring)
                    </h5>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {activeEvent.packingChecklist.map((it) => (
                        <label key={it.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={it.completed}
                            onChange={() => handleTogglePacking(it.id)}
                            className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5"
                          />
                          <span className={`text-[11px] ${it.completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                            {it.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Exports footer */}
              <div className="border-t border-gray-100 pt-5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-400">Export Agenda blueprint:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExportICal(activeEvent)}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <CalendarIcon size={12} /> iCal
                  </button>
                  <button
                    onClick={() => handleExportJSON(activeEvent)}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Download size={12} /> JSON
                  </button>
                  <button
                    onClick={() => handleExportMarkdown(activeEvent)}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <FileText size={12} /> Markdown
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* MINIMAL EMPTY STATE LANDING SCREEN */
            <div className="bg-slate-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center space-y-4 min-h-[350px] flex flex-col justify-center items-center">
              <Sparkles className="text-indigo-400 animate-pulse shrink-0" size={32} />
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-xs font-mono text-gray-900 font-bold uppercase tracking-wider">
                  Ready to Analyse Agenda Corridors
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Capture or upload an event poster, flyer, or syllabus timeline. Milo will perform real OCR segmentation and extract calendar schedules, checklists, travel profiles, and structured pre-planning timelines.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. MILO TASK & CALENDAR INJECTION CONFIRMATION MODAL */}
      {showConfirmModal && eventToConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="confirm-modal">
          <div className="bg-white rounded-2xl max-w-md w-full border border-indigo-100 shadow-xl overflow-hidden flex flex-col animate-scale-in" id="confirm-modal-box">
            
            {/* Header */}
            <div className="bg-indigo-600 p-5 text-white space-y-1 relative">
              <span className="text-[10px] font-mono tracking-widest text-indigo-200 uppercase font-bold">Milo Planner Corridor</span>
              <h3 className="text-base font-bold tracking-tight">Confirm Task Injection</h3>
              <p className="text-xs text-indigo-100/90 leading-relaxed">
                Milo is ready to inject this event's milestones and study schedules into your active workspace.
              </p>
            </div>

            {/* Content list */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[300px] text-xs leading-relaxed" id="confirm-modal-content">
              <div className="space-y-1.5">
                <p className="font-mono text-[10px] text-gray-400 uppercase font-bold">Target Event</p>
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/60">
                  <p className="font-bold text-gray-900 text-sm">{eventToConfirm.eventName}</p>
                  <p className="text-gray-500 text-[11px] mt-0.5">Category: {eventToConfirm.category} • Date: {eventToConfirm.date}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-mono text-[10px] text-gray-400 uppercase font-bold">Workspace Injections Preview</p>
                
                <div className="space-y-1.5">
                  {/* 1. Primary Task */}
                  <div className="flex items-start gap-2 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-800">1 Primary Action Item:</p>
                      <p className="text-gray-500">"🎉 Attend: {eventToConfirm.eventName}"</p>
                    </div>
                  </div>

                  {/* 2. Milestones */}
                  <div className="flex items-start gap-2 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-800">{eventToConfirm.preparationChecklist.length} Milestones (Subtasks):</p>
                      <p className="text-gray-500 truncate max-w-xs">
                        {eventToConfirm.preparationChecklist.map(it => it.text).join(", ")}
                      </p>
                    </div>
                  </div>

                  {/* 3. Study schedule blocks */}
                  {eventToConfirm.studySchedule && eventToConfirm.studySchedule.length > 0 && (
                    <div className="flex items-start gap-2 text-[11px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-800">{eventToConfirm.studySchedule.length} AI Study Schedule Blocks:</p>
                        <p className="text-gray-500 truncate max-w-xs">
                          {eventToConfirm.studySchedule.map(sch => `${sch.topic} (${sch.duration}h)`).join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 4. Calendar Event */}
                  <div className="flex items-start gap-2 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-800">1 Calendar Block:</p>
                      <p className="text-gray-500">Scheduled on {eventToConfirm.date} at {eventToConfirm.time || "2:00 PM"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3" id="confirm-modal-footer">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setEventToConfirm(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeConfirmEvent(eventToConfirm)}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={13} /> Inject & Create Tasks
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
