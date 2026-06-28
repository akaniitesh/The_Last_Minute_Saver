import React, { useState, useEffect } from "react";
import { applyGlobalStyles } from "../utils/styles";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useLocalization } from "../context/LocalizationContext";
import { 
  Settings, 
  User, 
  Shield, 
  Sparkles, 
  Bell, 
  Sliders, 
  Globe, 
  Palette, 
  Accessibility, 
  Save, 
  RotateCcw, 
  X, 
  Laptop, 
  Smartphone, 
  Tablet,
  Search,
  Filter,
  ArrowUpDown,
  Edit3,
  Clock,
  LogOut, 
  Check, 
  Eye, 
  EyeOff, 
  Play, 
  AlertTriangle, 
  HelpCircle,
  Volume2,
  VolumeX,
  Upload,
  CheckCircle,
  ShieldAlert,
  Camera,
  RotateCw,
  Undo2,
  Trash2,
  Scissors,
  Maximize,
  SlidersHorizontal,
  Sparkle,
  Image as ImageIcon,
  FlipHorizontal,
  FlipVertical,
  Minus,
  Plus
} from "lucide-react";

interface SettingsTabProps {
  personalityMode: "silent" | "balanced" | "coach" | "rescue";
  onSetPersonalityMode: (mode: "silent" | "balanced" | "coach" | "rescue") => void;
  smartSilenceEnabled: boolean;
  setSmartSilenceEnabled: (enabled: boolean) => void;
  dndCalendarSync: boolean;
  setDndCalendarSync: (enabled: boolean) => void;
  budgetUsed: number;
  setBudgetUsed: (used: number) => void;
  quietRecoveryMode: boolean;
  setQuietRecoveryMode: (enabled: boolean) => void;
}

type SettingsCategory = 
  | "account" 
  | "security" 
  | "ai" 
  | "notifications" 
  | "intervention" 
  | "regional" 
  | "appearance" 
  | "accessibility";

export default function SettingsTab({
  personalityMode,
  onSetPersonalityMode,
  smartSilenceEnabled,
  setSmartSilenceEnabled,
  dndCalendarSync,
  setDndCalendarSync,
  budgetUsed,
  setBudgetUsed,
  quietRecoveryMode,
  setQuietRecoveryMode
}: SettingsTabProps) {
  const { user, logout } = useAuth();
  const { 
    appLanguage, setAppLanguage, 
    country, setCountry,
    state, setState,
    district, setDistrict,
    city, setCity,
    postalCode, setPostalCode,
    latitude, setLatitude,
    longitude, setLongitude,
    timezone, setTimezone
  } = useLocalization();

  // Active sub-category tab
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("account");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- ACCOUNT STATE ---
  const [profileName, setProfileName] = useState(() => localStorage.getItem("set_acc_name") || user?.displayName || "Active Commander");
  const [profileUsername, setProfileUsername] = useState(() => localStorage.getItem("set_acc_username") || "commander_one");
  const [profileEmail, setProfileEmail] = useState(() => localStorage.getItem("set_acc_email") || user?.email || "user@example.com");
  const [profilePhone, setProfilePhone] = useState(() => localStorage.getItem("set_acc_phone") || "+1 (555) 019-2834");
  const [profileGender, setProfileGender] = useState(() => localStorage.getItem("set_acc_gender") || "Male");
  const [profileDob, setProfileDob] = useState(() => localStorage.getItem("set_acc_dob") || "1998-05-15");
  const [profileLang, setProfileLang] = useState(() => localStorage.getItem("set_acc_lang") || "English");
  const [profileAiLang, setProfileAiLang] = useState(() => localStorage.getItem("set_acc_ailang") || "English");
  const [profileVoiceLang, setProfileVoiceLang] = useState(() => localStorage.getItem("set_acc_voicelang") || "English");
  const [selectedAvatar, setSelectedAvatar] = useState(() => localStorage.getItem("set_acc_avatar") || user?.photoURL || "");
  const [showAvatarGallery, setShowAvatarGallery] = useState(false);

  // --- ADVANCED PROFILE PICTURE STATES ---
  const [showProfilePicManager, setShowProfilePicManager] = useState(false);
  const [editAvatar, setEditAvatar] = useState<string>(() => localStorage.getItem("set_acc_avatar") || user?.photoURL || "");
  const [avatarHistory, setAvatarHistory] = useState<string[]>([]);
  const [cropType, setCropType] = useState<"circle" | "square">("circle");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blurBg, setBlurBg] = useState(false);
  const [removeBg, setRemoveBg] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiActionMessage, setAiActionMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Monogram States
  const [monogramBg, setMonogramBg] = useState("linear-gradient(135deg, #6366F1 0%, #EC4899 100%)");
  const [monogramIcon, setMonogramIcon] = useState<string>("none"); // "none" | "crown" | "star" | "sparkles" | "user" | "heart"
  const [monogramText, setMonogramText] = useState("");

  // --- ADVANCED PROFILE PICTURE ACTIONS ---
  const pushToHistory = () => {
    setAvatarHistory(prev => [...prev, editAvatar]);
  };

  const handleUndo = () => {
    if (avatarHistory.length > 0) {
      const prev = avatarHistory[avatarHistory.length - 1];
      setEditAvatar(prev);
      setAvatarHistory(prevHistory => prevHistory.slice(0, -1));
      triggerSuccess("Undid last photo adjustment.");
    }
  };

  const startCamera = async () => {
    setCameraError("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 } });
      setCameraStream(mediaStream);
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("API Error:", err);
      setCameraError("Camera permission denied, or camera is currently busy.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    const video = document.getElementById("avatar-webcam-preview") as HTMLVideoElement;
    if (video) {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL("image/jpeg");
        pushToHistory();
        setEditAvatar(dataUrl);
        stopCamera();
        triggerSuccess("Profile snapshot captured successfully!");
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validFormats = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!validFormats.includes(file.type)) {
        alert("Unsupported format. Supported extensions: PNG, JPG, JPEG, WEBP");
        return;
      }
      setUploadProgress(1);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 15;
        if (progress >= 100) {
          setUploadProgress(100);
          clearInterval(interval);
          const reader = new FileReader();
          reader.onload = () => {
            pushToHistory();
            setEditAvatar(reader.result as string);
            setUploadProgress(null);
            triggerSuccess("Profile picture uploaded successfully!");
          };
          reader.readAsDataURL(file);
        } else {
          setUploadProgress(progress);
        }
      }, 70);
    }
  };

  const handleImportAccount = (provider: "google" | "github" | "microsoft") => {
    setAiProcessing(true);
    setAiActionMessage(`Connecting secure ${provider} auth nodes...`);
    setTimeout(() => {
      setAiActionMessage(`Extracting certified high-resolution avatar...`);
      setTimeout(() => {
        pushToHistory();
        let mockUrl = "";
        if (provider === "google") {
          mockUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";
        } else if (provider === "github") {
          mockUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80";
        } else {
          mockUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80";
        }
        setEditAvatar(mockUrl);
        setAiProcessing(false);
        triggerSuccess(`Profile photo imported from ${provider.toUpperCase()}`);
      }, 1000);
    }, 1000);
  };

  const applyAiEnhancement = (enhancement: "enhance" | "sharpen" | "lighting" | "center" | "noise" | "upscale") => {
    setAiProcessing(true);
    let msg = "";
    switch(enhancement) {
      case "enhance": msg = "Balancing exposure contrast, and tone maps..."; break;
      case "sharpen": msg = "Applying deconvolution high-pass sharpening filters..."; break;
      case "lighting": msg = "Normalizing dynamic range and shadow illumination..."; break;
      case "center": msg = "Locating biometric facial centers and auto-re-centering..."; break;
      case "noise": msg = "Smoothing artifacts and reducing ISO sensor grain..."; break;
      case "upscale": msg = "Executing bicubic super-resolution edge rebuilding..."; break;
    }
    setAiActionMessage(msg);

    setTimeout(() => {
      pushToHistory();
      switch(enhancement) {
        case "enhance":
          setContrast(115);
          setSaturation(112);
          setBrightness(105);
          break;
        case "sharpen":
          setContrast(122);
          break;
        case "lighting":
          setBrightness(118);
          setContrast(94);
          break;
        case "center":
          setZoom(1.35);
          break;
        case "noise":
          setSaturation(106);
          break;
        case "upscale":
          setContrast(106);
          setBrightness(102);
          break;
      }
      setAiProcessing(false);
      triggerSuccess(`AI ${enhancement.charAt(0).toUpperCase() + enhancement.slice(1)} completed!`);
    }, 1200);
  };

  const applyMonogramSetup = (bg: string, icon: string, text: string) => {
    pushToHistory();
    const initials = (text || profileName.split(" ").map(n => n[0]).join("") || "U").toUpperCase().slice(0, 3);
    
    const isGrad = bg.includes("gradient");
    let backgroundDefs = "";
    let backgroundFill = bg;
    
    if (isGrad) {
      let stops = `<stop offset="0%" stop-color="#6366F1" /><stop offset="100%" stop-color="#EC4899" />`;
      if (bg.includes("#10B981")) {
        stops = `<stop offset="0%" stop-color="#10B981" /><stop offset="100%" stop-color="#3B82F6" />`;
      } else if (bg.includes("#F59E0B")) {
        stops = `<stop offset="0%" stop-color="#F59E0B" /><stop offset="100%" stop-color="#EF4444" />`;
      } else if (bg.includes("#8B5CF6")) {
        stops = `<stop offset="0%" stop-color="#8B5CF6" /><stop offset="100%" stop-color="#EC4899" />`;
      } else if (bg.includes("#475569")) {
        stops = `<stop offset="0%" stop-color="#475569" /><stop offset="100%" stop-color="#1E293B" />`;
      }
      backgroundDefs = `<linearGradient id="monograd" x1="0%" y1="0%" x2="100%" y2="100%">${stops}</linearGradient>`;
      backgroundFill = "url(#monograd)";
    }

    let iconSvg = "";
    if (icon === "crown") {
      iconSvg = `<path d="M40,140 L50,85 L85,115 L100,70 L115,115 L150,85 L160,140 Z" fill="rgba(255, 255, 255, 0.22)" />`;
    } else if (icon === "star") {
      iconSvg = `<path d="M100,60 L112,85 L140,89 L120,109 L125,137 L100,124 L75,137 L80,109 L60,89 L88,85 Z" fill="rgba(255, 255, 255, 0.18)" />`;
    } else if (icon === "sparkles") {
      iconSvg = `<path d="M90,60 Q100,80 120,90 Q100,100 90,120 Q80,100 60,90 Q80,80 90,60" fill="rgba(255, 255, 255, 0.22)" />`;
    } else if (icon === "heart") {
      iconSvg = `<path d="M100,90 C100,90 70,50 50,70 C30,90 100,150 100,150 C100,150 170,90 150,70 C130,50 100,90 100,90 Z" fill="rgba(255, 255, 255, 0.15)" />`;
    } else if (icon === "user") {
      iconSvg = `<circle cx="100" cy="85" r="25" fill="rgba(255, 255, 255, 0.15)" /><path d="M60,145 C60,120 75,115 100,115 C125,115 140,120 140,145" fill="rgba(255, 255, 255, 0.15)" />`;
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 200 200">
        <defs>${backgroundDefs}</defs>
        <rect width="200" height="200" fill="${backgroundFill}" />
        ${iconSvg}
        <text x="100" y="105" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="70" fill="white" text-anchor="middle" dominant-baseline="central" letter-spacing="-1.5">${initials}</text>
      </svg>
    `.trim();

    const dataUrl = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    setEditAvatar(dataUrl);
    triggerSuccess("Generated default monogram avatar!");
  };

  const handleSaveProfilePic = () => {
    if (!editAvatar) {
      setSelectedAvatar("");
      localStorage.setItem("set_acc_avatar", "");
      window.dispatchEvent(new Event("profile_updated"));
      setShowProfilePicManager(false);
      triggerSuccess("Profile picture removed.");
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${blurBg ? "blur(3px)" : ""}`;
        ctx.translate(200, 200);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        
        const s = 400 * zoom;
        ctx.drawImage(img, -s / 2, -s / 2, s, s);
        
        try {
          const processed = canvas.toDataURL("image/jpeg", 0.9);
          setSelectedAvatar(processed);
          localStorage.setItem("set_acc_avatar", processed);
          window.dispatchEvent(new Event("profile_updated"));
        } catch (e) {
          setSelectedAvatar(editAvatar);
          localStorage.setItem("set_acc_avatar", editAvatar);
          window.dispatchEvent(new Event("profile_updated"));
        }
      } else {
        setSelectedAvatar(editAvatar);
        localStorage.setItem("set_acc_avatar", editAvatar);
        window.dispatchEvent(new Event("profile_updated"));
      }
      setShowProfilePicManager(false);
      triggerSuccess("Profile picture compiled and locked!");
    };

    img.onerror = () => {
      setSelectedAvatar(editAvatar);
      localStorage.setItem("set_acc_avatar", editAvatar);
      window.dispatchEvent(new Event("profile_updated"));
      setShowProfilePicManager(false);
      triggerSuccess("Profile picture saved.");
    };

    img.src = editAvatar;
  };

  const handleRemovePhoto = () => {
    pushToHistory();
    setEditAvatar("");
    triggerSuccess("Photo cleared. Resetting default initials.");
  };

  const handleRestoreDefaultAvatar = () => {
    applyMonogramSetup("linear-gradient(135deg, #6366F1 0%, #EC4899 100%)", "none", "");
  };

  const premiumAvatars = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80", // Abstract Geometric
    "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=150&q=80", // Purple Glowing Art
    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=150&q=80", // Futuristic Sphere
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=150&q=80", // Creative Art
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&q=80"  // Cyberpunk Neon
  ];

  // --- SECURITY STATE ---
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [securityEmail, setSecurityEmail] = useState(profileEmail);
  const [isEmailVerified, setIsEmailVerified] = useState(() => localStorage.getItem("set_sec_verified") === "true");
  const [is2faEnabled, setIs2faEnabled] = useState(() => localStorage.getItem("set_sec_2fa") === "true");
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(() => localStorage.getItem("set_sec_biometric") === "true");
  const [connectedDevices, setConnectedDevices] = useState([
    { id: "dev-1", name: "MacBook Pro 16\"", type: "Desktop", system: "Chrome on macOS", os: "macOS Sonoma", browser: "Chrome v124", ip: "192.168.1.*** (Masked)", lastActive: "Just now", location: "San Francisco, USA", trusted: true, active: true, status: "current", dateAdded: "2026-06-25T05:00:00Z" },
    { id: "dev-2", name: "iPhone 15 Pro", type: "Mobile", system: "Safari on iOS", os: "iOS 17.4", browser: "Safari Mobile", ip: "10.0.8.*** (Masked)", lastActive: "Today, 04:15 AM", location: "San Francisco, USA", trusted: true, active: false, status: "trusted", dateAdded: "2026-05-12T10:30:00Z" },
    { id: "dev-3", name: "iPad Pro 12.9\"", type: "Tablet", system: "Native Companion App", os: "iPadOS 17.1", browser: "WebKit", ip: "10.15.2.*** (Masked)", lastActive: "Yesterday, 04:30 PM", location: "New York, USA", trusted: true, active: false, status: "trusted", dateAdded: "2026-06-10T14:20:00Z" },
    { id: "dev-4", name: "Windows Desktop workstation", type: "Desktop", system: "Firefox on Windows", os: "Windows 11 Professional", browser: "Firefox v125", ip: "172.16.4.*** (Masked)", lastActive: "Last week", location: "Chicago, USA", trusted: false, active: false, status: "suspicious", dateAdded: "2025-11-20T08:15:00Z" },
    { id: "dev-5", name: "Pixel 8 Pro", type: "Mobile", system: "Chrome on Android", os: "Android 14", browser: "Chrome Mobile v124", ip: "192.168.0.*** (Masked)", lastActive: "3 days ago", location: "Denver, USA", trusted: true, active: false, status: "new", dateAdded: "2026-06-22T11:45:00Z" }
  ]);

  // Redesigned Device Registry UI State
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("all"); // all, current, trusted, active, inactive, mobile, desktop, tablet
  const [deviceSort, setDeviceSort] = useState("last_active"); // last_active, name, location, newest, oldest
  const [renamingDeviceId, setRenamingDeviceId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState("");
  const [selectedDeviceDetails, setSelectedDeviceDetails] = useState<string | null>(null);
  const [expandedMobileDeviceId, setExpandedMobileDeviceId] = useState<string | null>(null);

  const handleSaveRename = (id: string) => {
    setConnectedDevices(prev => prev.map(d => d.id === id ? { ...d, name: renamingName } : d));
    setRenamingDeviceId(null);
  };

  // Login Activity History Log Data
  const [deviceActivityTimeline] = useState([
    { id: "act-1", browser: "Chrome", os: "Windows", time: "Today, 09:32 AM", ip: "172.16.4.***", location: "Chicago, USA", status: "Suspicious Match" },
    { id: "act-2", browser: "Chrome", os: "macOS", time: "Today, 05:00 AM", ip: "192.168.1.***", location: "San Francisco, USA", status: "Successful Login" },
    { id: "act-3", browser: "Safari", os: "iOS", time: "Today, 04:15 AM", ip: "10.0.8.***", location: "San Francisco, USA", status: "Successful Login" },
    { id: "act-4", browser: "Firefox", os: "Android", time: "Yesterday, 08:10 PM", ip: "192.168.0.***", location: "Denver, USA", status: "Successful Login" },
    { id: "act-5", browser: "WebKit", os: "iPadOS", time: "Yesterday, 04:30 PM", ip: "10.15.2.***", location: "New York, USA", status: "Successful Login" }
  ]);

  // --- AI PREFERENCES STATE ---
  const [voiceGender, setVoiceGender] = useState(() => localStorage.getItem("set_ai_voice_gender") || "Female");
  const [voiceSpeed, setVoiceSpeed] = useState(() => Number(localStorage.getItem("set_ai_voice_speed") || "1.0"));
  const [voicePitch, setVoicePitch] = useState(() => Number(localStorage.getItem("set_ai_voice_pitch") || "1.0"));
  const [aiSpeakingSpeed, setAiSpeakingSpeed] = useState(() => Number(localStorage.getItem("set_ai_speak_speed") || "100"));
  const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem("set_ai_autospeak") !== "false");
  const [voiceActivation, setVoiceActivation] = useState(() => localStorage.getItem("set_ai_voice_active") === "true");
  const [alwaysListen, setAlwaysListen] = useState(() => localStorage.getItem("set_ai_always_listen") === "true");
  const [wakeWord, setWakeWord] = useState(() => localStorage.getItem("set_ai_wakeword") || "Hey Chief");
  const [aiMemory, setAiMemory] = useState(() => localStorage.getItem("set_ai_memory") !== "false");
  const [voiceDialect, setVoiceDialect] = useState(() => localStorage.getItem("set_ai_voice_dialect") || "English-US");
  const [voiceVolume, setVoiceVolume] = useState(() => Number(localStorage.getItem("set_ai_voice_volume") || "80"));
  const [voiceProfile, setVoiceProfile] = useState(() => localStorage.getItem("set_ai_voice_profile") || "Milo Premium (Synthesized)");
  const [voiceTrainingProgress, setVoiceTrainingProgress] = useState(0);
  const [isVoiceTraining, setIsVoiceTraining] = useState(false);

  // --- NOTIFICATION STATE ---
  const [notifConfig, setNotifConfig] = useState<Record<string, { enabled: boolean; sound: boolean; vibration: boolean; popup: boolean; email: boolean; push: boolean; frequency: string }>>(() => {
    const stored = localStorage.getItem("set_notif_config");
    if (stored) {
      try { return JSON.parse(stored); } catch(e){}
    }
    const categories = ["Deadlines", "Meetings", "Assignments", "Bills", "Calendar", "Recovery Plans", "Voice Alerts", "Risk Alerts", "Habits", "Daily Summary", "Weekly Summary"];
    const init: any = {};
    categories.forEach(cat => {
      init[cat] = {
        enabled: true,
        sound: cat === "Deadlines" || cat === "Risk Alerts",
        vibration: cat === "Deadlines" || cat === "Risk Alerts",
        popup: true,
        email: cat === "Daily Summary" || cat === "Weekly Summary" || cat === "Bills",
        push: true,
        frequency: cat === "Deadlines" ? "Immediate" : "Daily"
      };
    });
    return init;
  });

  // --- INTERVENTION STATE ---
  const [muteDuration, setMuteDuration] = useState("1 Hour");
  const [focusModeDnd, setFocusModeDnd] = useState(() => localStorage.getItem("set_inter_focus_mode") === "true");
  const [dndSchedule, setDndSchedule] = useState(() => localStorage.getItem("set_inter_dnd") === "true");
  const [maxInterruptions, setMaxInterruptions] = useState(() => Number(localStorage.getItem("set_inter_max") || "4"));

  // --- REGIONAL STATE ---
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem("set_reg_date_format") || "MM/DD/YYYY");
  const [timeFormat, setTimeFormat] = useState(() => localStorage.getItem("set_reg_time_format") || "12h");
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(() => localStorage.getItem("set_reg_first_day") || "Monday");
  const [workScheduleRange, setWorkScheduleRange] = useState(() => localStorage.getItem("set_reg_schedule") || "09:00 - 17:00");
  const [regionalHolidays, setRegionalHolidays] = useState(() => localStorage.getItem("set_reg_holidays") !== "false");
  const [travelMode, setTravelMode] = useState(() => localStorage.getItem("set_reg_travel") === "true");
  const [autoTimezone, setAutoTimezone] = useState(() => localStorage.getItem("set_reg_autotz") !== "false");

  // --- APPEARANCE STATE ---
  const [appearanceTheme, setAppearanceTheme] = useState(() => localStorage.getItem("set_app_theme") || "Light");
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem("set_app_accent") || "indigo");
  const [density, setDensity] = useState(() => localStorage.getItem("set_app_density") || "cozy");
  const [animations, setAnimations] = useState(() => localStorage.getItem("set_app_animations") || "standard");
  const [glassStrength, setGlassStrength] = useState(() => Number(localStorage.getItem("set_app_glass") || "40"));
  const [clockAnimationIntensity, setClockAnimationIntensity] = useState(() => Number(localStorage.getItem("set_app_clock_anim") || "50"));
  const [sidebarStyle, setSidebarStyle] = useState(() => localStorage.getItem("set_app_sidebar") || "expanded");

  const accentColorMap: Record<string, string> = {
    indigo: "#6366F1",
    emerald: "#10B981",
    violet: "#8B5CF6",
    amber: "#F59E0B",
    rose: "#F43F5E",
    slate: "#475569"
  };

  // --- ACCESSIBILITY STATE ---
  const [textSizeSlider, setTextSizeSlider] = useState(() => Number(localStorage.getItem("set_acc_text_scale") || "100"));
  const [contrastSlider, setContrastSlider] = useState(() => Number(localStorage.getItem("set_acc_contrast_scale") || "0"));
  const [dyslexicFontType, setDyslexicFontType] = useState(() => localStorage.getItem("set_acc_dyslexia_type") || "Default");
  const [ttsSpeed, setTtsSpeed] = useState(() => Number(localStorage.getItem("set_acc_tts_speed") || "1.0"));
  const [ttsPitch, setTtsPitch] = useState(() => Number(localStorage.getItem("set_acc_tts_pitch") || "1.0"));
  const [ttsAutoDocs, setTtsAutoDocs] = useState(() => localStorage.getItem("set_acc_tts_autodocs") === "true");
  const [ttsAutoAi, setTtsAutoAi] = useState(() => localStorage.getItem("set_acc_tts_autoai") === "true");
  const [ttsNotifications, setTtsNotifications] = useState(() => localStorage.getItem("set_acc_tts_notif") === "true");
  const [motionReduction, setMotionReduction] = useState(() => Number(localStorage.getItem("set_acc_motion_scale") || "0"));
  const [cursorSize, setCursorSize] = useState(() => Number(localStorage.getItem("set_acc_cursor_size") || "24"));
  const [lineSpacing, setLineSpacing] = useState(() => Number(localStorage.getItem("set_acc_line_spacing") || "1.5"));
  const [buttonScale, setButtonScale] = useState(() => Number(localStorage.getItem("set_acc_button_scale") || "1.0"));

  // Trigger Toast Helper
  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Listen to external theme changes (e.g. from top bar quick toggle)
  useEffect(() => {
    const handleThemeChange = () => {
      const storedTheme = localStorage.getItem("set_app_theme") || "Light";
      if (storedTheme !== appearanceTheme) {
        setAppearanceTheme(storedTheme);
      }
    };
    window.addEventListener("theme_updated", handleThemeChange);
    return () => {
      window.removeEventListener("theme_updated", handleThemeChange);
    };
  }, [appearanceTheme]);

  // --- INJECT ACCESSIBILITY STYLES GLOBALLY IN REAL-TIME ---
  useEffect(() => {
    localStorage.setItem("set_acc_text_scale", textSizeSlider.toString());
    localStorage.setItem("set_acc_contrast_scale", contrastSlider.toString());
    localStorage.setItem("set_acc_dyslexia_type", dyslexicFontType);
    localStorage.setItem("set_acc_line_spacing", lineSpacing.toString());
    localStorage.setItem("set_acc_cursor_size", cursorSize.toString());
    localStorage.setItem("set_acc_button_scale", buttonScale.toString());
    localStorage.setItem("set_app_accent", accentColor);
    
    const prevTheme = localStorage.getItem("set_app_theme") || "Light";
    localStorage.setItem("set_app_theme", appearanceTheme);
    
    localStorage.setItem("set_app_density", density);
    localStorage.setItem("set_app_animations", animations);
    localStorage.setItem("set_app_glass", glassStrength.toString());
    localStorage.setItem("set_acc_motion_scale", motionReduction.toString());

    applyGlobalStyles();

    if (prevTheme !== appearanceTheme) {
      window.dispatchEvent(new Event("theme_updated"));
    }
  }, [
    textSizeSlider,
    contrastSlider,
    dyslexicFontType,
    lineSpacing,
    cursorSize,
    buttonScale,
    accentColor,
    appearanceTheme,
    density,
    animations,
    glassStrength,
    motionReduction
  ]);

  // --- GENERAL SAVE HANDLERS ---
  const handleSaveAccount = () => {
    localStorage.setItem("set_acc_name", profileName);
    localStorage.setItem("set_acc_username", profileUsername);
    localStorage.setItem("set_acc_email", profileEmail);
    localStorage.setItem("set_acc_phone", profilePhone);
    localStorage.setItem("set_acc_gender", profileGender);
    localStorage.setItem("set_acc_dob", profileDob);
    localStorage.setItem("set_acc_country", country);
    localStorage.setItem("set_acc_timezone", timezone);
    localStorage.setItem("set_acc_lang", profileLang);
    localStorage.setItem("set_acc_ailang", profileAiLang);
    localStorage.setItem("set_acc_voicelang", profileVoiceLang);
    localStorage.setItem("set_acc_avatar", selectedAvatar);
    
    // Sync to application localization as well
    setAppLanguage(profileLang as any);

    // Dispatch sync event for other components (like sidebar and header in App.tsx)
    window.dispatchEvent(new Event("profile_updated"));

    triggerSuccess("Profile node metrics written and saved successfully!");
  };

  const handleResetAccount = () => {
    setProfileName(user?.displayName || "Active Commander");
    setProfileUsername("commander_one");
    setProfileEmail(user?.email || "user@example.com");
    setProfilePhone("+1 (555) 019-2834");
    setProfileGender("Male");
    setProfileDob("1998-05-15");
    setSelectedAvatar(user?.photoURL || "");
    triggerSuccess("Account settings reset to cockpit defaults.");
  };

  const handleSaveSecurity = () => {
    localStorage.setItem("set_sec_verified", isEmailVerified.toString());
    localStorage.setItem("set_sec_2fa", is2faEnabled.toString());
    localStorage.setItem("set_sec_biometric", isBiometricEnabled.toString());
    
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        alert("New passwords do not match!");
        return;
      }
      setCurrPassword("");
      setNewPassword("");
      setConfirmPassword("");
      triggerSuccess("Credential key structure upgraded. Password updated!");
    } else {
      triggerSuccess("Security policies updated successfully.");
    }
  };

  const handleSaveAiPrefs = () => {
    localStorage.setItem("set_ai_voice_gender", voiceGender);
    localStorage.setItem("set_ai_voice_speed", voiceSpeed.toString());
    localStorage.setItem("set_ai_voice_pitch", voicePitch.toString());
    localStorage.setItem("set_ai_speak_speed", aiSpeakingSpeed.toString());
    localStorage.setItem("set_ai_autospeak", autoSpeak.toString());
    localStorage.setItem("set_ai_voice_active", voiceActivation.toString());
    localStorage.setItem("set_ai_always_listen", alwaysListen.toString());
    localStorage.setItem("set_ai_wakeword", wakeWord);
    localStorage.setItem("set_ai_memory", aiMemory.toString());
    localStorage.setItem("set_ai_voice_dialect", voiceDialect);
    localStorage.setItem("set_ai_voice_volume", voiceVolume.toString());
    localStorage.setItem("set_ai_voice_profile", voiceProfile);
    
    triggerSuccess("AI Voice settings and companion profile locked successfully!");
  };

  const handleSaveNotifications = () => {
    localStorage.setItem("set_notif_config", JSON.stringify(notifConfig));
    triggerSuccess("Pacing channel alerts and routing preferences compiled.");
  };

  const handleSaveIntervention = () => {
    localStorage.setItem("set_inter_focus_mode", focusModeDnd.toString());
    localStorage.setItem("set_inter_dnd", dndSchedule.toString());
    localStorage.setItem("set_inter_max", maxInterruptions.toString());
    triggerSuccess("Cognitive buffer shielding and interjection limits updated.");
  };

  const handleSaveRegional = () => {
    localStorage.setItem("set_reg_date_format", dateFormat);
    localStorage.setItem("set_reg_time_format", timeFormat);
    localStorage.setItem("set_reg_first_day", firstDayOfWeek);
    localStorage.setItem("set_reg_schedule", workScheduleRange);
    localStorage.setItem("set_reg_holidays", regionalHolidays.toString());
    localStorage.setItem("set_reg_travel", travelMode.toString());
    localStorage.setItem("set_reg_autotz", autoTimezone.toString());
    
    triggerSuccess("Regional intelligence settings, holidays, and timelines synchronized.");
  };

  const handleSaveAppearance = () => {
    localStorage.setItem("set_app_theme", appearanceTheme);
    localStorage.setItem("set_app_accent", accentColor);
    localStorage.setItem("set_app_density", density);
    localStorage.setItem("set_app_animations", animations);
    localStorage.setItem("set_app_glass", glassStrength.toString());
    localStorage.setItem("set_app_clock_anim", clockAnimationIntensity.toString());
    localStorage.setItem("set_app_sidebar", sidebarStyle);
    
    applyGlobalStyles();
    triggerSuccess("Graphical UI theme, colors, and asset styling updated.");
  };

  const handleResetAccessibility = () => {
    setTextSizeSlider(100);
    setContrastSlider(0);
    setDyslexicFontType("Default");
    setTtsSpeed(1.0);
    setTtsPitch(1.0);
    setTtsAutoDocs(false);
    setTtsAutoAi(true);
    setTtsNotifications(false);
    setMotionReduction(0);
    setCursorSize(24);
    setLineSpacing(1.5);
    setButtonScale(1.0);
    
    localStorage.setItem("set_acc_text_scale", "100");
    localStorage.setItem("set_acc_contrast_scale", "0");
    localStorage.setItem("set_acc_dyslexia_type", "Default");
    localStorage.setItem("set_acc_tts_speed", "1.0");
    localStorage.setItem("set_acc_tts_pitch", "1.0");
    localStorage.setItem("set_acc_tts_autodocs", "false");
    localStorage.setItem("set_acc_tts_autoai", "true");
    localStorage.setItem("set_acc_tts_notif", "false");
    localStorage.setItem("set_acc_motion_scale", "0");
    localStorage.setItem("set_acc_cursor_size", "24");
    localStorage.setItem("set_acc_line_spacing", "1.5");
    localStorage.setItem("set_acc_button_scale", "1.0");

    applyGlobalStyles();
    triggerSuccess("Accessibility parameters restored to core standards.");
  };

  const handleSaveAccessibility = () => {
    localStorage.setItem("set_acc_text_scale", textSizeSlider.toString());
    localStorage.setItem("set_acc_contrast_scale", contrastSlider.toString());
    localStorage.setItem("set_acc_dyslexia_type", dyslexicFontType);
    localStorage.setItem("set_acc_tts_speed", ttsSpeed.toString());
    localStorage.setItem("set_acc_tts_pitch", ttsPitch.toString());
    localStorage.setItem("set_acc_tts_autodocs", ttsAutoDocs.toString());
    localStorage.setItem("set_acc_tts_autoai", ttsAutoAi.toString());
    localStorage.setItem("set_acc_tts_notif", ttsNotifications.toString());
    localStorage.setItem("set_acc_motion_scale", motionReduction.toString());
    localStorage.setItem("set_acc_cursor_size", cursorSize.toString());
    localStorage.setItem("set_acc_line_spacing", lineSpacing.toString());
    localStorage.setItem("set_acc_button_scale", buttonScale.toString());

    triggerSuccess("Accessibility profile successfully locked and persisted!");
  };

  // Nav Item List
  const navItems = [
    { id: "account", label: "Account Profile", icon: User },
    { id: "security", label: "Security & Keys", icon: Shield },
    { id: "ai", label: "AI & Synthesizers", icon: Sparkles },
    { id: "notifications", label: "Alert Channels", icon: Bell },
    { id: "intervention", label: "AI Intervention", icon: Sliders },
    { id: "regional", label: "Regional Context", icon: Globe },
    { id: "appearance", label: "Appearance & Themes", icon: Palette },
    { id: "accessibility", label: "Accessibility Desk", icon: Accessibility },
  ] as const;

  return (
    <div className="bg-white border border-gray-150 rounded-3xl shadow-xs overflow-hidden font-sans min-h-[680px]">
      
      {/* SUCCESS TOAST MESSAGE */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3.5 bg-black text-white rounded-full border border-neutral-800 shadow-xl flex items-center gap-2 text-xs font-mono font-bold"
          >
            <CheckCircle size={15} className="text-emerald-500 animate-pulse" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row h-full min-h-[680px]">
        
        {/* LEFT COLUMN: CONTROL CENTER TABS NAVIGATION */}
        <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-150 bg-gray-50/50 p-5 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Settings size={18} className="text-indigo-600 animate-spin" style={{ animationDuration: "12s" }} />
                <span className="text-sm font-bold tracking-tight text-gray-900">Control Center</span>
              </div>
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Autonomous Companion</p>
            </div>

            <nav className="space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeCategory === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveCategory(item.id);
                      setSuccessMessage(null);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive 
                        ? "bg-black text-white shadow-xs border-l-4 border-indigo-500" 
                        : "text-gray-500 hover:text-black hover:bg-gray-100/50"
                    }`}
                  >
                    <Icon size={14} className={isActive ? "text-indigo-400" : "text-gray-400"} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-gray-150 mt-6 hidden lg:block text-[10px] font-mono text-gray-400 text-center">
            <p>Pacing Engine v2.4.0</p>
            <p className="mt-0.5 text-indigo-500/80">Authorized Session Secure</p>
          </div>
        </aside>

        {/* RIGHT COLUMN: ACTIVE VIEW PANEL */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[800px] bg-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 max-w-3xl"
            >
              
              {/* HEADER INFO */}
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-900 capitalize flex items-center gap-2">
                  {navItems.find(item => item.id === activeCategory)?.label}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeCategory === "account" && "Configure global operator credentials, contact vectors, and companion identity parameters."}
                  {activeCategory === "security" && "Manage localized session key rings, secondary biometric verification, and node logout pathways."}
                  {activeCategory === "ai" && "Calibrate vocal synthesis modules, auditory pacing boundaries, and context cache memory."}
                  {activeCategory === "notifications" && "Establish chronological pacing filters, warning sound vectors, and dispatch timelines."}
                  {activeCategory === "intervention" && "Calibrate proactive attention shield timers, quiet mode thresholds, and maximum alert bounds."}
                  {activeCategory === "regional" && "Calibrate geographical intelligence, calendar shifts, and local academic and fiscal holidays."}
                  {activeCategory === "appearance" && "Upgrade the visual console matrix, configure high-contrast skins, and customize layouts."}
                  {activeCategory === "accessibility" && "Tailor contrast grids, scale responsive typography, inject layout spacings, and customize cursor sizes."}
                </p>
              </div>

              {/* CATEGORY PANELS FIELDS */}

              {/* 1. ACCOUNT PANEL */}
              {activeCategory === "account" && (
                <div className="space-y-5">
                  {/* PREMIUM ADAPTIVE PROFILE PICTURE NODE */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-gray-50/80 rounded-3xl border border-gray-150 shadow-xs">
                    
                    {/* AVATAR TRIGGER - HOVER ACTIVE FOR DESKTOP, TAP FOR MOBILE */}
                    <div 
                      onClick={() => {
                        setEditAvatar(selectedAvatar);
                        setShowProfilePicManager(true);
                      }}
                      className="group relative w-24 h-24 rounded-full cursor-pointer overflow-hidden shadow-md select-none transition-all hover:scale-105 hover:shadow-lg active:scale-95"
                    >
                      {selectedAvatar ? (
                        <img 
                          src={selectedAvatar} 
                          alt="Operator Avatar" 
                          className="w-full h-full object-cover transition-all group-hover:brightness-75"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-pink-500 text-white font-mono font-black text-2xl flex items-center justify-center transition-all group-hover:brightness-75">
                          {(profileName || "U")[0].toUpperCase()}
                        </div>
                      )}

                      {/* Desktop Hover / Mobile Indicator Glassmorphism Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1">
                        <Camera size={18} className="animate-bounce" />
                        <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest mt-1">Edit Photo</span>
                      </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1.5">
                      <span className="text-[9px] font-mono font-bold uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full tracking-widest inline-block">
                        Certified Operator Profile
                      </span>
                      <h4 className="text-base font-display font-black text-gray-900 leading-tight">{profileName}</h4>
                      <p className="text-xs text-gray-500 font-mono">{profileEmail} · <span className="text-gray-400 font-bold">Node ID: SAVER-CO-9718</span></p>
                      
                      {/* Mobile Trigger Button */}
                      <div className="pt-1.5 block sm:hidden">
                        <button 
                          onClick={() => {
                            setEditAvatar(selectedAvatar);
                            setShowProfilePicManager(true);
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-mono font-bold tracking-widest uppercase cursor-pointer shadow-sm flex items-center gap-1.5 mx-auto"
                        >
                          <Camera size={11} />
                          <span>Manage Profile Photo</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* PREMIUM PROFILE PHOTO MANAGEMENT WORKSPACE (ADAPTIVE OVERLAY) */}
                  <AnimatePresence>
                    {showProfilePicManager && (
                      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 overflow-y-auto select-none">
                        
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 20 }}
                          className="bg-white border border-gray-200 rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]"
                        >
                          {/* Close Trigger */}
                          <button 
                            onClick={() => {
                              stopCamera();
                              setShowProfilePicManager(false);
                            }}
                            className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-black rounded-full transition-all cursor-pointer border border-gray-100"
                          >
                            <X size={15} />
                          </button>

                          {/* Modal Header */}
                          <div className="border-b border-gray-100 pb-3 mb-4 shrink-0">
                            <span className="text-[9px] font-mono font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
                              Identity Control Center
                            </span>
                            <h3 className="text-lg font-display font-black text-gray-900 mt-1">Profile Photo Studio</h3>
                            <p className="text-[10px] text-gray-400 font-mono">Capture, upload, edit, optimize, or generate your custom operator visual node.</p>
                          </div>

                          {/* MAIN BENTO LAYOUT */}
                          <div className="flex-1 overflow-y-auto pr-1 space-y-5 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-5">
                            
                            {/* BENTO COL 1: REAL-TIME GRAPHICAL PREVIEW STAGE (col-span-5) */}
                            <div className="lg:col-span-5 bg-gray-50 rounded-2xl border border-gray-200 p-4 flex flex-col items-center justify-center space-y-4 min-h-[280px]">
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-gray-400">Live Stage Preview</span>
                              
                              {/* CROP BOX PORT CONTAINER */}
                              <div className="relative flex items-center justify-center overflow-hidden bg-radial from-gray-200 to-gray-100 border-2 border-dashed border-gray-300 shadow-inner w-44 h-44 shrink-0">
                                {editAvatar ? (
                                  <div 
                                    className={`relative overflow-hidden w-full h-full ${cropType === "circle" ? "rounded-full" : "rounded-2xl"}`}
                                  >
                                    <img 
                                      src={editAvatar} 
                                      alt="Avatar under adjustment" 
                                      className="w-full h-full object-cover origin-center select-none"
                                      style={{
                                        filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${blurBg ? "blur(3px)" : ""}`,
                                        transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                                        transition: "transform 0.1s ease-out, filter 0.1s ease-out"
                                      }}
                                    />

                                    {/* AI Background removal simulator layer */}
                                    {removeBg && (
                                      <div className="absolute inset-0 bg-transparent flex items-center justify-center">
                                        {/* Scanner effect line */}
                                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-lg animate-bounce" style={{ animationDuration: "2.5s" }} />
                                        <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none" />
                                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-mono bg-black/80 text-white px-2 py-0.5 rounded font-bold tracking-widest uppercase">
                                          AI BG Cleared
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  /* INITIALS MONOGRAM EMBED */
                                  <div 
                                    className={`w-full h-full flex flex-col items-center justify-center text-white relative p-2 ${cropType === "circle" ? "rounded-full" : "rounded-2xl"}`}
                                    style={{ background: monogramBg }}
                                  >
                                    {monogramIcon === "crown" && <Sparkle size={32} className="opacity-20 absolute top-4" />}
                                    {monogramIcon === "star" && <Sparkle size={32} className="opacity-20 absolute top-4" />}
                                    {monogramIcon === "sparkles" && <Sparkle size={32} className="opacity-20 absolute top-4" />}
                                    <span className="text-5xl font-display font-black tracking-tighter">
                                      {(monogramText || profileName.split(" ").map(n => n[0]).join("") || "U").toUpperCase().slice(0, 3)}
                                    </span>
                                  </div>
                                )}

                                {/* UPLOAD ANIMATION RING */}
                                {uploadProgress !== null && (
                                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                                    <div className="w-10 h-10 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                                    <span className="text-[10px] font-mono font-bold tracking-wider mt-2">Uploading {uploadProgress}%</span>
                                  </div>
                                )}

                                {/* AI PROCESSING BANNER */}
                                {aiProcessing && (
                                  <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center p-3">
                                    <div className="w-8 h-8 rounded-full border-4 border-dashed border-pink-500 border-t-indigo-500 animate-spin mb-3" />
                                    <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest animate-pulse">AI Synthesis Engine</span>
                                    <span className="text-[9px] text-gray-300 font-sans mt-1 max-w-[150px] leading-relaxed">{aiActionMessage}</span>
                                  </div>
                                )}
                              </div>

                              {/* STAGE TOGGLES */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setCropType("circle")}
                                  className={`px-3 py-1 text-[9px] font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer ${cropType === "circle" ? "bg-black border-black text-white" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}
                                >
                                  Circular Crop
                                </button>
                                <button
                                  onClick={() => setCropType("square")}
                                  className={`px-3 py-1 text-[9px] font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer ${cropType === "square" ? "bg-black border-black text-white" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}
                                >
                                  Square Crop
                                </button>
                              </div>
                            </div>

                            {/* BENTO COL 2: CONTROL BOARD TAB INTERFACE (col-span-7) */}
                            <div className="lg:col-span-7 flex flex-col space-y-4">
                              
                              {/* TABS SELECTOR */}
                              <div className="grid grid-cols-4 gap-1 p-1 bg-gray-50 rounded-xl border border-gray-200 shrink-0">
                                {["capture", "edit", "ai", "monogram"].map(tb => (
                                  <button
                                    key={tb}
                                    onClick={() => {
                                      stopCamera();
                                      // Create a mock local state tab switch
                                      (window as any)._picTab = tb;
                                      setMonogramText((window as any)._picTab); // Trigger React re-render
                                    }}
                                    className={`py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                      ((window as any)._picTab || "capture") === tb
                                        ? "bg-white shadow-xs text-black border border-gray-150"
                                        : "text-gray-500 hover:text-black"
                                    }`}
                                  >
                                    {tb}
                                  </button>
                                ))}
                              </div>

                              {/* TAB 1: ACQUISITION / CAPTURE */}
                              {((window as any)._picTab || "capture") === "capture" && (
                                <div className="space-y-4 animate-fade-in flex-1">
                                  
                                  {/* Camera Module */}
                                  <div className="border border-gray-150 rounded-xl p-3 bg-gray-50/50 space-y-2 relative">
                                    <h4 className="text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1">
                                      <Camera size={11} />
                                      <span>Live Snapshot Capture</span>
                                    </h4>

                                    {isCameraActive ? (
                                      <div className="relative w-full h-44 bg-black rounded-lg overflow-hidden flex flex-col items-center justify-center">
                                        <video 
                                          id="avatar-webcam-preview" 
                                          autoPlay 
                                          playsInline 
                                          className="w-full h-full object-cover"
                                          ref={el => {
                                            if (el && cameraStream) el.srcObject = cameraStream;
                                          }}
                                        />
                                        <div className="absolute bottom-2 flex gap-2">
                                          <button
                                            onClick={capturePhoto}
                                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider shadow-md flex items-center gap-1 cursor-pointer"
                                          >
                                            <Camera size={12} />
                                            <span>Capture</span>
                                          </button>
                                          <button
                                            onClick={stopCamera}
                                            className="px-3 py-1.5 bg-gray-900/80 hover:bg-black text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-200 rounded-lg text-center space-y-2">
                                        <p className="text-[11px] text-gray-500">Capture an elegant face photo using your device webcam.</p>
                                        <button
                                          onClick={startCamera}
                                          className="px-4 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-[9px] font-mono font-bold uppercase tracking-widest text-indigo-600 cursor-pointer flex items-center gap-1"
                                        >
                                          <Camera size={12} />
                                          <span>Start Webcam Device</span>
                                        </button>
                                        {cameraError && <p className="text-[9px] text-red-500 font-mono font-bold">{cameraError}</p>}
                                      </div>
                                    )}
                                  </div>

                                  {/* Upload Area */}
                                  <div className="border border-gray-150 rounded-xl p-3 bg-gray-50/50 space-y-2">
                                    <h4 className="text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1">
                                      <Upload size={11} />
                                      <span>Local Media Upload</span>
                                    </h4>
                                    <label className="border border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white hover:border-indigo-400 transition-colors">
                                      <Upload size={20} className="text-gray-400 mb-1" />
                                      <span className="text-[10px] font-mono font-bold text-gray-600">CHOOSE DEVICE FILE</span>
                                      <span className="text-[8px] text-gray-400 uppercase tracking-wider font-sans mt-0.5">PNG, JPG, JPEG, WEBP ONLY</span>
                                      <input 
                                        type="file" 
                                        accept="image/png, image/jpeg, image/jpg, image/webp" 
                                        onChange={handleImageUpload} 
                                        className="hidden" 
                                      />
                                    </label>
                                  </div>

                                  {/* External Account Syncs */}
                                  <div className="border border-gray-150 rounded-xl p-3 bg-gray-50/50 space-y-2">
                                    <h4 className="text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider">Secure Account Ingestion</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                      <button
                                        onClick={() => handleImportAccount("google")}
                                        className="px-2 py-2 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-red-600 rounded-lg text-[9px] font-mono font-bold uppercase cursor-pointer transition-colors"
                                      >
                                        Google Sync
                                      </button>
                                      <button
                                        onClick={() => handleImportAccount("github")}
                                        className="px-2 py-2 bg-white hover:bg-gray-100 border border-gray-200 hover:border-black text-black rounded-lg text-[9px] font-mono font-bold uppercase cursor-pointer transition-colors"
                                      >
                                        GitHub Sync
                                      </button>
                                      <button
                                        onClick={() => handleImportAccount("microsoft")}
                                        className="px-2 py-2 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-blue-600 rounded-lg text-[9px] font-mono font-bold uppercase cursor-pointer transition-colors"
                                      >
                                        Microsoft Sync
                                      </button>
                                    </div>
                                  </div>

                                </div>
                              )}

                              {/* TAB 2: EDITING SUITE */}
                              {((window as any)._picTab || "capture") === "edit" && (
                                <div className="space-y-4 animate-fade-in flex-1">
                                  
                                  {/* Basic Controls Grid */}
                                  <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-150">
                                    <div className="space-y-1">
                                      <span className="text-[9px] font-mono font-bold text-gray-400 uppercase block">Scale Zoom</span>
                                      <div className="flex items-center gap-2">
                                        <Minus size={12} className="cursor-pointer text-gray-500" onClick={() => setZoom(Math.max(1, zoom - 0.15))} />
                                        <input 
                                          type="range" min="1" max="3" step="0.05" value={zoom} 
                                          onChange={e => setZoom(Number(e.target.value))} 
                                          className="w-full accent-indigo-600" 
                                        />
                                        <Plus size={12} className="cursor-pointer text-gray-500" onClick={() => setZoom(Math.min(3, zoom + 0.15))} />
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-[9px] font-mono font-bold text-gray-400 uppercase block">Rotate CW</span>
                                      <div className="flex gap-1.5">
                                        {[0, 90, 180, 270].map(deg => (
                                          <button
                                            key={deg}
                                            onClick={() => setRotation(deg)}
                                            className={`flex-1 py-1 text-[8px] font-mono font-bold border rounded ${rotation === deg ? "bg-black border-black text-white" : "bg-white border-gray-200 text-gray-500"}`}
                                          >
                                            {deg}°
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-[9px] font-mono font-bold text-gray-400 uppercase block">Mirror Flips</span>
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => setFlipH(!flipH)}
                                          className={`flex-1 py-1 text-[8px] font-mono font-bold border rounded flex items-center justify-center gap-1 ${flipH ? "bg-black border-black text-white" : "bg-white border-gray-200 text-gray-500"}`}
                                        >
                                          <FlipHorizontal size={10} />
                                          <span>Flip H</span>
                                        </button>
                                        <button
                                          onClick={() => setFlipV(!flipV)}
                                          className={`flex-1 py-1 text-[8px] font-mono font-bold border rounded flex items-center justify-center gap-1 ${flipV ? "bg-black border-black text-white" : "bg-white border-gray-200 text-gray-500"}`}
                                        >
                                          <FlipVertical size={10} />
                                          <span>Flip V</span>
                                        </button>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-[9px] font-mono font-bold text-gray-400 uppercase block">Spatial Blur / AI BG Cutout</span>
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => setBlurBg(!blurBg)}
                                          className={`flex-1 py-1 text-[8px] font-mono font-bold border rounded ${blurBg ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-200 text-gray-500"}`}
                                        >
                                          Blur BG
                                        </button>
                                        <button
                                          onClick={() => setRemoveBg(!removeBg)}
                                          className={`flex-1 py-1 text-[8px] font-mono font-bold border rounded ${removeBg ? "bg-pink-600 border-pink-600 text-white" : "bg-white border-gray-200 text-gray-500"}`}
                                        >
                                          Remove BG (AI)
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Filter Sliders */}
                                  <div className="border border-gray-150 rounded-xl p-3 bg-gray-50/50 space-y-3">
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[9px] font-mono font-bold text-gray-400 uppercase">
                                        <span>Brightness</span>
                                        <span className="text-black">{brightness}%</span>
                                      </div>
                                      <input 
                                        type="range" min="50" max="150" value={brightness} 
                                        onChange={e => setBrightness(Number(e.target.value))} 
                                        className="w-full accent-indigo-600" 
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[9px] font-mono font-bold text-gray-400 uppercase">
                                        <span>Contrast</span>
                                        <span className="text-black">{contrast}%</span>
                                      </div>
                                      <input 
                                        type="range" min="50" max="150" value={contrast} 
                                        onChange={e => setContrast(Number(e.target.value))} 
                                        className="w-full accent-indigo-600" 
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[9px] font-mono font-bold text-gray-400 uppercase">
                                        <span>Saturation</span>
                                        <span className="text-black">{saturation}%</span>
                                      </div>
                                      <input 
                                        type="range" min="0" max="200" value={saturation} 
                                        onChange={e => setSaturation(Number(e.target.value))} 
                                        className="w-full accent-indigo-600" 
                                      />
                                    </div>
                                  </div>

                                </div>
                              )}

                              {/* TAB 3: AI ENHANCEMENTS */}
                              {((window as any)._picTab || "capture") === "ai" && (
                                <div className="space-y-4 animate-fade-in flex-1">
                                  <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl text-center">
                                    <span className="text-[10px] font-mono font-black uppercase text-indigo-700 tracking-wider">AI Picture Optimizer Engine</span>
                                    <p className="text-[10px] text-indigo-950 font-sans mt-0.5">Apply high-grade procedural neural adjustments with a single tap.</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                      onClick={() => applyAiEnhancement("enhance")}
                                      className="p-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-400 rounded-xl text-left cursor-pointer transition-all space-y-1 group"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <Sparkles size={13} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-mono font-black uppercase text-gray-950">Enhance Quality</span>
                                      </div>
                                      <p className="text-[9px] text-gray-500 font-sans leading-snug">Calibrates auto tone maps, saturation, and exposure balancing.</p>
                                    </button>

                                    <button
                                      onClick={() => applyAiEnhancement("sharpen")}
                                      className="p-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-400 rounded-xl text-left cursor-pointer transition-all space-y-1 group"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <Scissors size={13} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-mono font-black uppercase text-gray-950">Sharpen Photo</span>
                                      </div>
                                      <p className="text-[9px] text-gray-500 font-sans leading-snug">Runs custom deconvolution matrix overlays to clear blurry edges.</p>
                                    </button>

                                    <button
                                      onClick={() => applyAiEnhancement("lighting")}
                                      className="p-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-400 rounded-xl text-left cursor-pointer transition-all space-y-1 group"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <SlidersHorizontal size={13} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-mono font-black uppercase text-gray-950">Auto Lighting</span>
                                      </div>
                                      <p className="text-[9px] text-gray-500 font-sans leading-snug">Normalizes deep shadows and balances bright backlight profiles.</p>
                                    </button>

                                    <button
                                      onClick={() => applyAiEnhancement("center")}
                                      className="p-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-400 rounded-xl text-left cursor-pointer transition-all space-y-1 group"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <Maximize size={13} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-mono font-black uppercase text-gray-950">Auto Center Face</span>
                                      </div>
                                      <p className="text-[9px] text-gray-500 font-sans leading-snug">Scans visual coordinates and centers your head for passport focus.</p>
                                    </button>

                                    <button
                                      onClick={() => applyAiEnhancement("noise")}
                                      className="p-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-400 rounded-xl text-left cursor-pointer transition-all space-y-1 group"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <Sparkles size={13} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-mono font-black uppercase text-gray-950">Remove Noise</span>
                                      </div>
                                      <p className="text-[9px] text-gray-500 font-sans leading-snug">Smooths sensor noise, low-light artifacts, and color pixels.</p>
                                    </button>

                                    <button
                                      onClick={() => applyAiEnhancement("upscale")}
                                      className="p-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-400 rounded-xl text-left cursor-pointer transition-all space-y-1 group"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <Maximize size={13} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-mono font-black uppercase text-gray-950">Upscale Resolution</span>
                                      </div>
                                      <p className="text-[9px] text-gray-500 font-sans leading-snug">Bakes super-sampling algorithms to cleanly upscale images.</p>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* TAB 4: AVATAR LAB & MONOGRAMS */}
                              {((window as any)._picTab || "capture") === "monogram" && (
                                <div className="space-y-4 animate-fade-in flex-1">
                                  
                                  {/* Custom monogram letters */}
                                  <div className="space-y-1 text-xs">
                                    <label className="font-mono text-[9px] text-gray-400 uppercase font-bold">Monogram Text Initials (1-3 chars)</label>
                                    <input 
                                      type="text" 
                                      maxLength={3}
                                      placeholder={profileName.split(" ").map(n => n[0]).join("").toUpperCase()}
                                      value={monogramText}
                                      onChange={e => {
                                        setMonogramText(e.target.value);
                                        // Update editAvatar to null to reveal monogram generator live
                                        setEditAvatar("");
                                      }}
                                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:border-black focus:outline-none uppercase font-mono"
                                    />
                                  </div>

                                  {/* Background options */}
                                  <div className="space-y-2 text-xs">
                                    <span className="font-mono text-[9px] text-gray-400 uppercase font-bold block">Background Preset / Gradient Palette</span>
                                    <div className="grid grid-cols-5 gap-2">
                                      {[
                                        { bg: "#1E293B", label: "Slate Dark" },
                                        { bg: "linear-gradient(135deg, #6366F1 0%, #EC4899 100%)", label: "Sunset Blaze" },
                                        { bg: "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)", label: "Ocean Teal" },
                                        { bg: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)", label: "Volcano Sun" },
                                        { bg: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)", label: "Cosmic Glow" }
                                      ].map((bgItem, i) => (
                                        <button
                                          key={i}
                                          title={bgItem.label}
                                          onClick={() => {
                                            setMonogramBg(bgItem.bg);
                                            setEditAvatar(""); // Reveal monogram
                                            applyMonogramSetup(bgItem.bg, monogramIcon, monogramText);
                                          }}
                                          className={`h-8 rounded-lg cursor-pointer border-2 transition-all ${monogramBg === bgItem.bg ? "border-black scale-110" : "border-transparent hover:scale-105"}`}
                                          style={{ background: bgItem.bg }}
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  {/* Avatar badges */}
                                  <div className="space-y-1 text-xs">
                                    <span className="font-mono text-[9px] text-gray-400 uppercase font-bold block">Overlay Icon Badge</span>
                                    <div className="grid grid-cols-6 gap-2">
                                      {[
                                        { id: "none", label: "None" },
                                        { id: "crown", label: "Crown" },
                                        { id: "star", label: "Star" },
                                        { id: "sparkles", label: "Sparkles" },
                                        { id: "heart", label: "Heart" },
                                        { id: "user", label: "User" }
                                      ].map(ico => (
                                        <button
                                          key={ico.id}
                                          onClick={() => {
                                            setMonogramIcon(ico.id);
                                            setEditAvatar(""); // Reveal monogram
                                            applyMonogramSetup(monogramBg, ico.id, monogramText);
                                          }}
                                          className={`py-1 text-[8px] font-mono font-bold border rounded uppercase transition-colors cursor-pointer ${monogramIcon === ico.id ? "bg-black text-white border-black" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
                                        >
                                          {ico.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="pt-2">
                                    <button
                                      onClick={() => applyMonogramSetup(monogramBg, monogramIcon, monogramText)}
                                      className="w-full py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-[10px] rounded-xl hover:bg-indigo-100 uppercase tracking-widest cursor-pointer"
                                    >
                                      Compile Monogram Setup
                                    </button>
                                  </div>
                                </div>
                              )}

                            </div>
                          </div>

                          {/* SYSTEM ACTION FOOTER CONTROLS */}
                          <div className="border-t border-gray-150 pt-4 mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                            
                            {/* Undo, Reset, Remove Group */}
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <button
                                onClick={handleUndo}
                                disabled={avatarHistory.length === 0}
                                className={`px-3 py-2 border rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                  avatarHistory.length > 0 
                                    ? "bg-white border-gray-200 hover:bg-gray-50 hover:text-black cursor-pointer text-gray-600" 
                                    : "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                                }`}
                              >
                                <Undo2 size={11} />
                                <span>Undo ({avatarHistory.length})</span>
                              </button>

                              <button
                                onClick={handleRestoreDefaultAvatar}
                                className="px-3 py-2 bg-white border border-gray-200 text-gray-600 hover:text-black hover:bg-gray-50 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                              >
                                <RotateCcw size={11} />
                                <span>Default Avatar</span>
                              </button>

                              <button
                                onClick={handleRemovePhoto}
                                className="px-3 py-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 size={11} />
                                <span>Remove Photo</span>
                              </button>
                            </div>

                            {/* Main Save & Backout Group */}
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => {
                                  stopCamera();
                                  setShowProfilePicManager(false);
                                }}
                                className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-200 text-gray-500 hover:text-black hover:bg-gray-50 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveProfilePic}
                                className="flex-1 sm:flex-none px-5 py-2.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                              >
                                <Save size={12} />
                                <span>Save Portrait</span>
                              </button>
                            </div>

                          </div>

                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">Full Operator Name</label>
                      <input 
                        type="text" 
                        value={profileName} 
                        onChange={e => setProfileName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">Unique Username</label>
                      <input 
                        type="text" 
                        value={profileUsername} 
                        onChange={e => setProfileUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">Email Address</label>
                      <input 
                        type="email" 
                        value={profileEmail} 
                        onChange={e => setProfileEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">Phone Number (Secure Access)</label>
                      <input 
                        type="text" 
                        value={profilePhone} 
                        onChange={e => setProfilePhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">Operator Gender</label>
                      <select 
                        value={profileGender} 
                        onChange={e => setProfileGender(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none bg-white"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Non-Binary</option>
                        <option>Prefer not to say</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">Date of Birth (Optional)</label>
                      <input 
                        type="date" 
                        value={profileDob} 
                        onChange={e => setProfileDob(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">Country</label>
                      <select 
                        value={country} 
                        onChange={e => setCountry(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none bg-white"
                      >
                        <option>United States</option>
                        <option>India</option>
                        <option>United Kingdom</option>
                        <option>Japan</option>
                        <option>Germany</option>
                        <option>France</option>
                        <option>Spain</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">State</label>
                      <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">District</label>
                      <input type="text" value={district} onChange={e => setDistrict(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">City</label>
                      <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">Postal Code</label>
                      <input type="text" value={postalCode} onChange={e => setPostalCode(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">Latitude</label>
                      <input type="text" value={latitude} onChange={e => setLatitude(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">Longitude</label>
                      <input type="text" value={longitude} onChange={e => setLongitude(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">Interface Language</label>
                      <select 
                        value={profileLang} 
                        onChange={e => setProfileLang(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none bg-white"
                      >
                        <option>English</option>
                        <option>Hindi</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                        <option>Japanese</option>
                        <option>Chinese</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">Voice Speech Language</label>
                      <select 
                        value={profileVoiceLang} 
                        onChange={e => setProfileVoiceLang(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none bg-white"
                      >
                        <option>English</option>
                        <option>Hindi</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button 
                      onClick={handleResetAccount}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw size={12} />
                      <span>Reset Defaults</span>
                    </button>
                    <button 
                      onClick={handleSaveAccount}
                      className="px-5 py-2.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Save size={12} />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. SECURITY PANEL */}
              {activeCategory === "security" && (
                <div className="space-y-5">
                  
                  {/* Change Password */}
                  <div className="p-4 bg-gray-50/50 border border-gray-150 rounded-2xl space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase text-gray-900 border-b border-gray-100 pb-1.5 flex items-center justify-between">
                      <span>Update Password Cryptography</span>
                      <button 
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="text-[9px] hover:text-black text-gray-500 cursor-pointer uppercase flex items-center gap-1"
                      >
                        {showPasswords ? <EyeOff size={10} /> : <Eye size={10} />}
                        <span>{showPasswords ? "Hide keys" : "Reveal keys"}</span>
                      </button>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-mono text-[9px] text-gray-400 font-bold uppercase">Current Password</label>
                        <input 
                          type={showPasswords ? "text" : "password"} 
                          value={currPassword}
                          onChange={e => setCurrPassword(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:border-black focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[9px] text-gray-400 font-bold uppercase">New Password</label>
                        <input 
                          type={showPasswords ? "text" : "password"} 
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:border-black focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[9px] text-gray-400 font-bold uppercase">Confirm New Password</label>
                        <input 
                          type={showPasswords ? "text" : "password"} 
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:border-black focus:outline-none"
                        />
                      </div>
                    </div>

                    {newPassword && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-gray-400">Password Strength Matrix:</span>
                          <span className={newPassword.length > 7 ? "text-emerald-500 font-bold" : "text-amber-500"}>
                            {newPassword.length > 7 ? "✓ HIGH SECURITY KEY" : "⚠️ SHORT / UNSECURE KEY"}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${newPassword.length > 7 ? "bg-emerald-500 w-full" : "bg-amber-500 w-1/2"}`} 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Toggles */}
                  <div className="space-y-3.5 text-xs">
                    {/* Verify Email Status */}
                    <div className="flex items-center justify-between p-3.5 border border-gray-150 rounded-2xl bg-white">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-800 flex items-center gap-2">
                          <span>Verify Cockpit Email Address</span>
                          <span className={`text-[8px] font-mono px-1.5 py-0.25 rounded font-bold ${isEmailVerified ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
                            {isEmailVerified ? "✓ VERIFIED NODE" : "● UNVERIFIED ACTION"}
                          </span>
                        </span>
                        <p className="text-[10px] text-gray-500">Secure critical alert pathways by completing authentication confirmation.</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsEmailVerified(true);
                          triggerSuccess("Mock verification link compiled & dispatched to " + profileEmail);
                        }}
                        disabled={isEmailVerified}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase cursor-pointer border ${
                          isEmailVerified ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-white hover:bg-gray-50 text-indigo-600 border-indigo-200"
                        }`}
                      >
                        {isEmailVerified ? "Confirmed" : "Dispatch Verification Link"}
                      </button>
                    </div>

                    {/* Enable Two-Factor (2FA) */}
                    <div className="flex flex-col p-3.5 border border-gray-150 rounded-2xl bg-white gap-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-800">Two-Factor Authenticator (2FA)</span>
                          <p className="text-[10px] text-gray-500">Upgrade session login steps by demanding an OTP authenticator token.</p>
                        </div>
                        <button
                          onClick={() => setIs2faEnabled(!is2faEnabled)}
                          className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                            is2faEnabled ? "bg-black justify-end" : "bg-gray-200 justify-start"
                          }`}
                        >
                          <div className="w-5 h-5 bg-white rounded-full shadow-xs" />
                        </button>
                      </div>

                      {is2faEnabled && (
                        <div className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-xl flex flex-col sm:flex-row items-center gap-4 animate-fade-in text-[10px] font-mono">
                          <div className="w-20 h-20 bg-white border border-gray-200 rounded-lg p-1 flex items-center justify-center shrink-0">
                            <span className="text-[8px] text-gray-400 font-bold uppercase text-center">[ QR CODE SECURITY ]</span>
                          </div>
                          <div className="space-y-1 text-gray-600">
                            <p className="font-bold text-gray-800">Authenticator Code Synchronizer</p>
                            <p>Manual Key String: <code className="bg-white px-1 py-0.5 border rounded">SAVER-COCKPIT-2FA-NODE-KEY</code></p>
                            <p className="text-[9px] text-gray-400">Scan using Google Authenticator, Authy, or Apple Keychain to lock session keys.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Biometric */}
                    <div className="flex items-center justify-between p-3.5 border border-gray-150 rounded-2xl bg-white">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-800">Enable Biometric Login Companion</span>
                        <p className="text-[10px] text-gray-500">Bypass passwords on mobile clients using FaceID, TouchID, or Android Biometrics.</p>
                      </div>
                      <button
                        onClick={() => setIsBiometricEnabled(!isBiometricEnabled)}
                        className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                          isBiometricEnabled ? "bg-black justify-end" : "bg-gray-200 justify-start"
                        }`}
                      >
                        <div className="w-5 h-5 bg-white rounded-full shadow-xs" />
                      </button>
                    </div>
                  </div>

                  {/* Devices & Active sessions Redesign */}
                  <div className="space-y-6 p-6 bg-white rounded-2xl border border-gray-150 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono tracking-[0.2em] text-gray-400 uppercase font-bold">Security Center</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 font-sans tracking-tight">Authorized Device Registry</h3>
                        <p className="text-xs text-gray-500">Monitor, authorize, or revoke active hardware access channels.</p>
                      </div>

                      <button 
                        onClick={() => {
                          setConnectedDevices(connectedDevices.filter(d => d.active));
                          triggerSuccess("Terminated all secondary sessions.");
                        }}
                        className="self-start sm:self-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-mono font-bold uppercase transition-all border border-red-200/40 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Terminate Secondary Sessions</span>
                      </button>
                    </div>

                    {/* Search & Filters Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      {/* Search Bar */}
                      <div className="relative md:col-span-5">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                          <Search size={14} />
                        </span>
                        <input
                          type="text"
                          value={deviceSearch}
                          onChange={(e) => setDeviceSearch(e.target.value)}
                          placeholder="Search by name, location, browser..."
                          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans placeholder-gray-400 focus:outline-hidden focus:border-black transition-colors"
                        />
                      </div>

                      {/* Filter Select */}
                      <div className="relative md:col-span-4 flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1 rounded-xl">
                        <Filter size={12} className="text-gray-400 shrink-0" />
                        <select
                          value={deviceFilter}
                          onChange={(e) => setDeviceFilter(e.target.value)}
                          className="w-full bg-transparent text-xs font-sans focus:outline-hidden cursor-pointer py-1 text-gray-700"
                        >
                          <option value="all">All Registered Devices</option>
                          <option value="current">Current Session</option>
                          <option value="trusted">Trusted Hardware Only</option>
                          <option value="recently_active">Recently Active</option>
                          <option value="inactive">Inactive Sessions</option>
                          <option value="mobile">Mobile Devices</option>
                          <option value="tablet">Tablets</option>
                          <option value="desktop">Desktops & Workstations</option>
                        </select>
                      </div>

                      {/* Sort Select */}
                      <div className="relative md:col-span-3 flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1 rounded-xl">
                        <ArrowUpDown size={12} className="text-gray-400 shrink-0" />
                        <select
                          value={deviceSort}
                          onChange={(e) => setDeviceSort(e.target.value)}
                          className="w-full bg-transparent text-xs font-sans focus:outline-hidden cursor-pointer py-1 text-gray-700"
                        >
                          <option value="last_active">Last Active</option>
                          <option value="name">Device Name</option>
                          <option value="location">Geographic Location</option>
                          <option value="newest">Newest Authenticated</option>
                          <option value="oldest">Oldest Authenticated</option>
                        </select>
                      </div>
                    </div>

                    {/* Devices Display Core */}
                    <div className="space-y-4">
                      {/* 1. DESKTOP VIEW: High-fidelity layout */}
                      <div className="hidden lg:block overflow-hidden border border-gray-100 rounded-xl">
                        <table className="w-full border-collapse text-left text-xs font-sans">
                          <thead>
                            <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                              <th className="p-4 font-bold">Device Name & Type</th>
                              <th className="p-4 font-bold">OS & Browser</th>
                              <th className="p-4 font-bold">IP & Location</th>
                              <th className="p-4 font-bold">Last Activity</th>
                              <th className="p-4 font-bold">Security Badge</th>
                              <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {connectedDevices
                              .filter(device => {
                                const matchesSearch = device.name.toLowerCase().includes(deviceSearch.toLowerCase()) || 
                                                      device.location.toLowerCase().includes(deviceSearch.toLowerCase()) ||
                                                      device.system.toLowerCase().includes(deviceSearch.toLowerCase());
                                if (!matchesSearch) return false;
                                if (deviceFilter === "all") return true;
                                if (deviceFilter === "current") return device.active;
                                if (deviceFilter === "trusted") return device.trusted;
                                if (deviceFilter === "recently_active") return device.lastActive.includes("now") || device.lastActive.includes("Today") || device.lastActive.includes("Yesterday");
                                if (deviceFilter === "inactive") return !device.lastActive.includes("now") && !device.lastActive.includes("Today") && !device.lastActive.includes("Yesterday");
                                if (deviceFilter === "mobile") return device.type === "Mobile";
                                if (deviceFilter === "desktop") return device.type === "Desktop";
                                if (deviceFilter === "tablet") return device.type === "Tablet";
                                return true;
                              })
                              .sort((a, b) => {
                                if (deviceSort === "name") return a.name.localeCompare(b.name);
                                if (deviceSort === "location") return a.location.localeCompare(b.location);
                                if (deviceSort === "newest") return new Date(b.dateAdded || "").getTime() - new Date(a.dateAdded || "").getTime();
                                if (deviceSort === "oldest") return new Date(a.dateAdded || "").getTime() - new Date(b.dateAdded || "").getTime();
                                if (a.active) return -1;
                                if (b.active) return 1;
                                return a.id.localeCompare(b.id);
                              })
                              .map(device => (
                                <tr key={device.id} className="hover:bg-gray-50/50 transition-colors">
                                  {/* Name & Type */}
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2.5 rounded-xl shrink-0 ${
                                        device.active ? "bg-black text-white" : "bg-gray-100 text-gray-500"
                                      }`}>
                                        {device.type === "Mobile" ? <Smartphone size={16} /> : device.type === "Tablet" ? <Tablet size={16} /> : <Laptop size={16} />}
                                      </div>
                                      <div className="space-y-0.5">
                                        {renamingDeviceId === device.id ? (
                                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                            <input
                                              type="text"
                                              value={renamingName}
                                              onChange={(e) => setRenamingName(e.target.value)}
                                              className="px-2 py-1 border border-gray-300 rounded-lg text-xs font-sans focus:outline-hidden focus:border-black max-w-[150px]"
                                            />
                                            <button
                                              onClick={() => handleSaveRename(device.id)}
                                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                              title="Save"
                                            >
                                              <Check size={14} />
                                            </button>
                                            <button
                                              onClick={() => setRenamingDeviceId(null)}
                                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                              title="Cancel"
                                            >
                                              <X size={14} />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-semibold text-gray-800 text-sm">{device.name}</span>
                                            <button
                                              onClick={() => { setRenamingDeviceId(device.id); setRenamingName(device.name); }}
                                              className="p-1 text-gray-400 hover:text-gray-900 rounded-md transition-colors cursor-pointer"
                                              title="Rename hardware client"
                                            >
                                              <Edit3 size={11} />
                                            </button>
                                          </div>
                                        )}
                                        <span className="text-[10px] text-gray-400 uppercase font-mono font-bold tracking-wider">{device.type} client</span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* OS & Browser */}
                                  <td className="p-4">
                                    <div className="space-y-0.5">
                                      <span className="text-gray-700 font-medium">{device.os}</span>
                                      <p className="text-[10px] text-gray-400">{device.browser}</p>
                                    </div>
                                  </td>

                                  {/* IP & Location */}
                                  <td className="p-4">
                                    <div className="space-y-0.5">
                                      <span className="text-gray-700 font-medium">{device.location}</span>
                                      <p className="text-[10px] text-gray-400 font-mono">{device.ip}</p>
                                    </div>
                                  </td>

                                  {/* Last Active */}
                                  <td className="p-4">
                                    <span className="text-gray-600 font-mono text-[11px]">{device.lastActive}</span>
                                  </td>

                                  {/* Status indicators */}
                                  <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                      {device.active && (
                                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono shrink-0">Current Device</span>
                                      )}
                                      {device.status === "suspicious" && (
                                        <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono shrink-0">Suspicious Login</span>
                                      )}
                                      {device.status === "new" && (
                                        <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono shrink-0">New Device</span>
                                      )}
                                      {device.trusted && !device.active && (
                                        <span className="bg-neutral-100 text-neutral-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono shrink-0">Trusted Hardware</span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Actions */}
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => setSelectedDeviceDetails(device.id)}
                                        className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg font-medium transition-colors cursor-pointer"
                                      >
                                        Details
                                      </button>
                                      
                                      {!device.active && (
                                        <button
                                          onClick={() => {
                                            setConnectedDevices(connectedDevices.filter(d => d.id !== device.id));
                                            triggerSuccess(`Revoked hardware authorization for ${device.name}`);
                                          }}
                                          className="px-2.5 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold transition-all cursor-pointer border border-red-100"
                                        >
                                          Revoke Access
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 2. TABLET VIEW: Double column bento cards */}
                      <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
                        {connectedDevices
                          .filter(device => {
                            const matchesSearch = device.name.toLowerCase().includes(deviceSearch.toLowerCase()) || 
                                                  device.location.toLowerCase().includes(deviceSearch.toLowerCase()) ||
                                                  device.system.toLowerCase().includes(deviceSearch.toLowerCase());
                            if (!matchesSearch) return false;
                            if (deviceFilter === "all") return true;
                            if (deviceFilter === "current") return device.active;
                            if (deviceFilter === "trusted") return device.trusted;
                            if (deviceFilter === "recently_active") return device.lastActive.includes("now") || device.lastActive.includes("Today") || device.lastActive.includes("Yesterday");
                            if (deviceFilter === "inactive") return !device.lastActive.includes("now") && !device.lastActive.includes("Today") && !device.lastActive.includes("Yesterday");
                            if (deviceFilter === "mobile") return device.type === "Mobile";
                            if (deviceFilter === "desktop") return device.type === "Desktop";
                            if (deviceFilter === "tablet") return device.type === "Tablet";
                            return true;
                          })
                          .map(device => (
                            <div key={device.id} className="flex flex-col justify-between p-4 bg-white border border-gray-150 rounded-xl space-y-3 shadow-2xs hover:shadow-xs transition-shadow min-h-[190px]">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-xl ${
                                    device.active ? "bg-black text-white" : "bg-gray-100 text-gray-500"
                                  }`}>
                                    {device.type === "Mobile" ? <Smartphone size={15} /> : device.type === "Tablet" ? <Tablet size={15} /> : <Laptop size={15} />}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-800 text-sm leading-tight">{device.name}</h4>
                                    <p className="text-[10px] text-gray-400">{device.type} · {device.location}</p>
                                  </div>
                                </div>

                                {device.active ? (
                                  <span className="bg-emerald-100 text-emerald-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase font-mono">Current</span>
                                ) : device.status === "suspicious" ? (
                                  <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase font-mono">Alert</span>
                                ) : null}
                              </div>

                              <div className="text-[11px] text-gray-500 space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                <p className="font-mono text-[9px]"><strong className="text-gray-400">OS:</strong> {device.os}</p>
                                <p className="font-mono text-[9px]"><strong className="text-gray-400">CLIENT:</strong> {device.browser}</p>
                                <p className="font-mono text-[9px]"><strong className="text-gray-400">IP ADDRESS:</strong> {device.ip}</p>
                                <p className="font-mono text-[9px]"><strong className="text-gray-400">LAST SEEN:</strong> {device.lastActive}</p>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                                <button 
                                  onClick={() => setSelectedDeviceDetails(device.id)}
                                  className="text-gray-600 hover:text-black font-semibold cursor-pointer"
                                >
                                  View Activity
                                </button>
                                
                                {!device.active && (
                                  <button 
                                    onClick={() => {
                                      setConnectedDevices(connectedDevices.filter(d => d.id !== device.id));
                                      triggerSuccess(`Revoked ${device.name}`);
                                    }}
                                    className="text-red-600 hover:bg-red-50 px-2 py-1 rounded-md font-bold cursor-pointer"
                                  >
                                    Revoke Access
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* 3. MOBILE VIEW: Stacked expandable robust cards */}
                      <div className="grid md:hidden grid-cols-1 gap-3">
                        {connectedDevices
                          .filter(device => {
                            const matchesSearch = device.name.toLowerCase().includes(deviceSearch.toLowerCase()) || 
                                                  device.location.toLowerCase().includes(deviceSearch.toLowerCase()) ||
                                                  device.system.toLowerCase().includes(deviceSearch.toLowerCase());
                            if (!matchesSearch) return false;
                            if (deviceFilter === "all") return true;
                            if (deviceFilter === "current") return device.active;
                            if (deviceFilter === "trusted") return device.trusted;
                            if (deviceFilter === "recently_active") return device.lastActive.includes("now") || device.lastActive.includes("Today") || device.lastActive.includes("Yesterday");
                            if (deviceFilter === "inactive") return !device.lastActive.includes("now") && !device.lastActive.includes("Today") && !device.lastActive.includes("Yesterday");
                            if (deviceFilter === "mobile") return device.type === "Mobile";
                            if (deviceFilter === "desktop") return device.type === "Desktop";
                            if (deviceFilter === "tablet") return device.type === "Tablet";
                            return true;
                          })
                          .map(device => {
                            const isExpanded = expandedMobileDeviceId === device.id;
                            return (
                              <div key={device.id} className="p-4 bg-white border border-gray-150 rounded-xl space-y-3 shadow-xs">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg shrink-0">
                                      {device.type === "Mobile" ? "📱" : device.type === "Tablet" ? "平板" : "💻"}
                                    </span>
                                    <div>
                                      <h4 className="font-bold text-gray-800 text-xs leading-none">{device.name}</h4>
                                      <p className="text-[9px] text-gray-400 mt-0.5">{device.location} · {device.lastActive}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {device.active ? (
                                      <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase font-mono">Active</span>
                                    ) : device.trusted ? (
                                      <span className="bg-gray-100 text-gray-700 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase font-mono">🟢 Trusted</span>
                                    ) : (
                                      <span className="bg-red-50 text-red-600 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase font-mono">⚠️ Alert</span>
                                    )}
                                  </div>
                                </div>

                                {/* Expand details button */}
                                <button
                                  onClick={() => setExpandedMobileDeviceId(isExpanded ? null : device.id)}
                                  className="w-full text-center py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-[10px] font-mono font-bold text-gray-500 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <span>{isExpanded ? "COLLAPSE SECURITY DETAILS" : "EXPAND SECURITY DETAILS"}</span>
                                </button>

                                {/* Detailed Section */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden space-y-3 pt-2 text-[10px] font-mono"
                                    >
                                      <div className="bg-neutral-50 p-3 rounded-lg border border-gray-100 text-gray-600 space-y-1.5">
                                        <p><strong>SYSTEM PLATFORM:</strong> {device.system}</p>
                                        <p><strong>OPERATING SYS:</strong> {device.os}</p>
                                        <p><strong>BROWSER CLIENT:</strong> {device.browser}</p>
                                        <p><strong>IP ADDRESS:</strong> {device.ip}</p>
                                        <p><strong>AUTHENTICATED:</strong> {new Date(device.dateAdded || "").toLocaleDateString()}</p>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button 
                                          onClick={() => setSelectedDeviceDetails(device.id)}
                                          className="flex-1 py-2 text-center bg-gray-100 hover:bg-gray-200 rounded-lg text-[10px] font-bold text-gray-700 cursor-pointer"
                                        >
                                          View Activity
                                        </button>
                                        
                                        {!device.active && (
                                          <button 
                                            onClick={() => {
                                              setConnectedDevices(connectedDevices.filter(d => d.id !== device.id));
                                              triggerSuccess(`Revoked ${device.name}`);
                                            }}
                                            className="flex-1 py-2 text-center bg-red-500 hover:bg-red-600 rounded-lg text-[10px] font-bold text-white cursor-pointer"
                                          >
                                            Remove Device
                                          </button>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Timeline & Security Auditing Logs */}
                    <div className="border-t border-gray-100 pt-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-mono font-bold text-gray-800 uppercase tracking-wide">Real-time Device Security Feed</h4>
                          <p className="text-[10px] text-gray-500 font-sans">Live feed tracking login requests, security checkpoints, and credential handshakes.</p>
                        </div>
                        <span className="text-[9px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">ACTIVE FEED</span>
                      </div>

                      <div className="relative border-l-2 border-gray-200 pl-4 ml-2 space-y-4">
                        {deviceActivityTimeline.map((item) => (
                          <div key={item.id} className="relative text-xs">
                            {/* Dot */}
                            <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border bg-white ${
                              item.status.includes("Suspicious") ? "border-amber-500" : "border-emerald-500"
                            }`} />
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                              <div>
                                <span className="font-bold text-gray-800 font-sans">{item.browser} on {item.os}</span>
                                <span className="text-[9px] text-gray-400 font-mono ml-2">IP: {item.ip} · {item.location}</span>
                              </div>
                              <div className="flex items-center gap-2 self-start sm:self-center">
                                <span className="text-[10px] text-gray-500 font-mono">{item.time}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.25 rounded-md uppercase tracking-wider font-mono ${
                                  item.status.includes("Suspicious") 
                                    ? "bg-amber-50 text-amber-700 border border-amber-200/50" 
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Device detail modal overlay */}
                  <AnimatePresence>
                    {selectedDeviceDetails && (() => {
                      const d = connectedDevices.find(device => device.id === selectedDeviceDetails);
                      if (!d) return null;
                      return (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
                          <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-gray-900 text-base">Client Device Specifications</h3>
                              <button 
                                onClick={() => setSelectedDeviceDetails(null)}
                                className="p-1.5 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 cursor-pointer"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            <div className="space-y-3.5 pt-2">
                              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-150">
                                <div className="p-2.5 bg-black text-white rounded-xl">
                                  {d.type === "Mobile" ? <Smartphone size={18} /> : d.type === "Tablet" ? <Tablet size={18} /> : <Laptop size={18} />}
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-800 text-sm">{d.name}</h4>
                                  <p className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">{d.type} Hardware Client</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-2.5 bg-neutral-50 rounded-lg border border-gray-100">
                                  <span className="text-[9px] text-gray-400 block font-mono font-bold">OPERATING SYSTEM</span>
                                  <span className="text-gray-800 font-semibold">{d.os}</span>
                                </div>
                                <div className="p-2.5 bg-neutral-50 rounded-lg border border-gray-100">
                                  <span className="text-[9px] text-gray-400 block font-mono font-bold">BROWSER ENGINE</span>
                                  <span className="text-gray-800 font-semibold">{d.browser}</span>
                                </div>
                                <div className="p-2.5 bg-neutral-50 rounded-lg border border-gray-100 col-span-2">
                                  <span className="text-[9px] text-gray-400 block font-mono font-bold">IP ADDRESS LOCATION</span>
                                  <span className="text-gray-800 font-semibold">{d.ip} ({d.location})</span>
                                </div>
                                <div className="p-2.5 bg-neutral-50 rounded-lg border border-gray-100">
                                  <span className="text-[9px] text-gray-400 block font-mono font-bold">LAST ACTIVE TIME</span>
                                  <span className="text-gray-800 font-mono font-semibold">{d.lastActive}</span>
                                </div>
                                <div className="p-2.5 bg-neutral-50 rounded-lg border border-gray-100">
                                  <span className="text-[9px] text-gray-400 block font-mono font-bold">INITIAL CONTEXT</span>
                                  <span className="text-gray-800 font-semibold">{new Date(d.dateAdded || "").toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-[11px] text-amber-800 flex gap-2">
                                <Shield className="shrink-0 text-amber-500 mt-0.5" size={14} />
                                <div>
                                  <span className="font-bold block">Trusted Authentication Integrity</span>
                                  <span>This client possesses cryptographic hardware-backed secure authorization certificates linked to your user profile.</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                              <button 
                                onClick={() => setSelectedDeviceDetails(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold font-mono uppercase cursor-pointer"
                              >
                                Close Details
                              </button>
                              {!d.active && (
                                <button 
                                  onClick={() => {
                                    setConnectedDevices(connectedDevices.filter(dev => dev.id !== d.id));
                                    setSelectedDeviceDetails(null);
                                    triggerSuccess(`Revoked security access for ${d.name}`);
                                  }}
                                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold font-mono uppercase cursor-pointer"
                                >
                                  Revoke Channel
                                </button>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      );
                    })()}
                  </AnimatePresence>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button 
                      onClick={() => logout()}
                      className="px-4 py-2 hover:bg-red-50 text-red-600 rounded-xl hover:border-red-200 text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut size={12} />
                      <span>Log Out of Cockpit</span>
                    </button>
                    <button 
                      onClick={handleSaveSecurity}
                      className="px-5 py-2.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Save size={12} />
                      <span>Save Security Rules</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. AI PREFERENCES PANEL */}
              {activeCategory === "ai" && (
                <div className="space-y-5">
                  
                  {/* AI Personality Choice (Direct State link) */}
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] text-gray-400 uppercase font-bold block">Active AI Personality Tuning</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: "silent", label: "Silent Partner", desc: "Completely suppress spoken alerts and tips. Quiet graphics updates only." },
                        { id: "balanced", label: "Balanced Advisor", desc: "Mild alerts. Proactive interjections if timeline risk slips above 50%." },
                        { id: "coach", label: "Accountability Coach", desc: "High engagement triggers. Active morning reviews and daily metrics summaries." },
                        { id: "rescue", label: "Extreme Rescue Coordinator", desc: "Maximum time shielding. Autopilot Pomodoro locks, compressed schedules." }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => onSetPersonalityMode(mode.id as any)}
                          className={`p-3 text-left border rounded-2xl flex flex-col justify-between h-24 transition-all cursor-pointer ${
                            personalityMode === mode.id 
                              ? "border-black bg-black text-white shadow-sm" 
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <span className="text-xs font-bold block flex items-center gap-1.5">
                            {personalityMode === mode.id && <Check size={12} className="text-indigo-400" />}
                            <span>{mode.label}</span>
                          </span>
                          <p className={`text-[10px] leading-normal mt-1 flex-1 ${personalityMode === mode.id ? "text-gray-300" : "text-gray-500"}`}>
                            {mode.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slider Synthesizers */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-4">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block font-mono">Speech Synthesizer Controls</span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="space-y-1">
                        <label className="text-gray-500">AI Voice Model Gender</label>
                        <select 
                          value={voiceGender}
                          onChange={e => setVoiceGender(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none"
                        >
                          <option>Female</option>
                          <option>Male</option>
                          <option>Adaptive Synth</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-500">Synthesis Speak Speed: <span className="font-bold text-indigo-600">{voiceSpeed}x</span></label>
                        <input 
                          type="range" min="0.5" max="2.5" step="0.1"
                          value={voiceSpeed}
                          onChange={e => setVoiceSpeed(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-500">Vocal Pitch Scale: <span className="font-bold text-indigo-600">{voicePitch}x</span></label>
                        <input 
                          type="range" min="0.5" max="2.0" step="0.1"
                          value={voicePitch}
                          onChange={e => setVoicePitch(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-500">Cognitive Prompting Speed: <span className="font-bold text-indigo-600">{aiSpeakingSpeed}%</span></label>
                        <input 
                          type="range" min="80" max="150" step="5"
                          value={aiSpeakingSpeed}
                          onChange={e => setAiSpeakingSpeed(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Auditory Settings Toggles */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-800">Auto Speak AI Suggestions</span>
                        <p className="text-[10px] text-gray-500">Automatically synthesize speech audio responses when alerts or schedules adjustment trigger.</p>
                      </div>
                      <button
                        onClick={() => setAutoSpeak(!autoSpeak)}
                        className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                          autoSpeak ? "bg-black justify-end" : "bg-gray-200 justify-start"
                        }`}
                      >
                        <div className="w-5 h-5 bg-white rounded-full shadow-xs" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-800">Acoustic Voice Activation (Mics)</span>
                        <p className="text-[10px] text-gray-500">Allow vocal commands by sync of keyboard triggers or continuous spectrum capturing.</p>
                      </div>
                      <button
                        onClick={() => setVoiceActivation(!voiceActivation)}
                        className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                          voiceActivation ? "bg-black justify-end" : "bg-gray-200 justify-start"
                        }`}
                      >
                        <div className="w-5 h-5 bg-white rounded-full shadow-xs" />
                      </button>
                    </div>

                    {voiceActivation && (
                      <div className="flex items-center justify-between p-3 border border-indigo-150 rounded-xl bg-indigo-50/10 animate-fade-in">
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-800">Continuous Microphone Capture (Always Listen)</span>
                          <p className="text-[10px] text-gray-500">Let the AI analyze ambient audio to detect conversations during focus gaps.</p>
                        </div>
                        <button
                          onClick={() => setAlwaysListen(!alwaysListen)}
                          className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                            alwaysListen ? "bg-black justify-end" : "bg-gray-200 justify-start"
                          }`}
                        >
                          <div className="w-5 h-5 bg-white rounded-full shadow-xs" />
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1 text-xs font-mono">
                        <label className="text-gray-400 font-bold uppercase text-[9px]">Acoustic Wake Word Phrase</label>
                        <select 
                          value={wakeWord} 
                          onChange={e => setWakeWord(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none"
                        >
                          <option>Hey Chief</option>
                          <option>Hey Companion</option>
                          <option>Jarvis</option>
                          <option>Focus Core</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white">
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-800">AI Context Memory Core</span>
                          <p className="text-[10px] text-gray-400">Remember historical task pacing patterns.</p>
                        </div>
                        <button
                          onClick={() => setAiMemory(!aiMemory)}
                          className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                            aiMemory ? "bg-black justify-end" : "bg-gray-200 justify-start"
                          }`}
                        >
                          <div className="w-5 h-5 bg-white rounded-full shadow-xs" />
                        </button>
                      </div>
                    </div>

                    {/* Voice dialect and volume settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1 text-xs font-mono">
                        <label className="text-gray-400 font-bold uppercase text-[9px]">Voice Dialect / Language</label>
                        <select 
                          value={voiceDialect} 
                          onChange={e => setVoiceDialect(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none"
                        >
                          <option value="English-US">English (United States)</option>
                          <option value="English-UK">English (United Kingdom)</option>
                          <option value="Hindi">Hindi (India)</option>
                          <option value="Hinglish">Hinglish (Mixed Dialect)</option>
                          <option value="Spanish">Spanish (Spain)</option>
                          <option value="French">French (Parisian)</option>
                        </select>
                      </div>

                      <div className="space-y-1 text-xs font-mono">
                        <label className="text-gray-400 font-bold uppercase text-[9px]">Voice Output Volume ({voiceVolume}%)</label>
                        <input 
                          type="range" min="0" max="100" step="5"
                          value={voiceVolume}
                          onChange={e => setVoiceVolume(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer h-9"
                        />
                      </div>
                    </div>

                    {/* Milo Voice Profile & Training */}
                    <div className="p-4 bg-indigo-50/10 border border-indigo-150 rounded-2xl space-y-4 pt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-mono text-indigo-600 font-bold uppercase tracking-wider block">Milo Voice Custom Profile</span>
                          <span className="text-xs font-bold text-gray-800">Voice Synthesis Model Calibration</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 font-semibold">{voiceProfile}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                        <div className="space-y-1">
                          <label className="text-gray-500 text-[10px]">Active Vocal Profile</label>
                          <select 
                            value={voiceProfile}
                            onChange={e => setVoiceProfile(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none"
                          >
                            <option value="Milo Premium (Synthesized)">Milo Premium (Synthesized)</option>
                            <option value="Classic Tutor (Formal)">Classic Tutor (Formal)</option>
                            <option value="Casual Companion">Casual Companion</option>
                            <option value="Custom Cloned Voice">Custom Cloned Voice</option>
                          </select>
                        </div>

                        <div className="flex flex-col justify-end space-y-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsVoiceTraining(true);
                                setVoiceTrainingProgress(10);
                                const interval = setInterval(() => {
                                  setVoiceTrainingProgress(prev => {
                                    if (prev >= 100) {
                                      clearInterval(interval);
                                      setIsVoiceTraining(false);
                                      setVoiceProfile("Custom Cloned Voice");
                                      triggerSuccess("Voice training completed successfully! Custom Cloned Voice active.");
                                      return 0;
                                    }
                                    return prev + 15;
                                  });
                                }, 300);
                              }}
                              disabled={isVoiceTraining}
                              className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-200 text-white font-mono font-bold uppercase rounded-xl transition-colors text-[10px] cursor-pointer"
                            >
                              {isVoiceTraining ? "Training..." : "Train Voice Model"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setVoiceProfile("Milo Premium (Synthesized)");
                                triggerSuccess("Voice profile reset to system default.");
                              }}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-mono font-bold uppercase rounded-xl transition-colors text-[10px] border border-gray-200 cursor-pointer"
                            >
                              Reset Voice Model
                            </button>
                          </div>
                        </div>
                      </div>

                      {isVoiceTraining && (
                        <div className="space-y-1.5 animate-fade-in font-mono text-[10px]">
                          <div className="flex justify-between text-gray-500">
                            <span>Biometric Voice Spectrum Analyzer:</span>
                            <span className="font-bold text-indigo-600">{voiceTrainingProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${voiceTrainingProgress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                    <button 
                      onClick={handleSaveAiPrefs}
                      className="px-5 py-2.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Save size={12} />
                      <span>Lock AI Tuning Matrix</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. NOTIFICATION SETTINGS PANEL */}
              {activeCategory === "notifications" && (
                <div className="space-y-5">
                  <span className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest block">Notification Alert Configuration</span>
                  
                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-2">
                    {Object.keys(notifConfig).map(catName => {
                      const item = notifConfig[catName];
                      return (
                        <div key={catName} className="p-3.5 bg-white border border-gray-150 rounded-2xl space-y-2.5 text-xs transition-all hover:border-gray-300">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-800">{catName} Alerts</span>
                            <button
                              onClick={() => {
                                setNotifConfig({
                                  ...notifConfig,
                                  [catName]: { ...item, enabled: !item.enabled }
                                });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider border cursor-pointer ${
                                item.enabled 
                                  ? "bg-black text-white border-black" 
                                  : "bg-gray-50 text-gray-400 border-gray-200"
                              }`}
                            >
                              {item.enabled ? "Enabled" : "Disabled"}
                            </button>
                          </div>

                          {item.enabled && (
                            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[10px] font-mono animate-fade-in text-gray-500">
                              {[
                                { k: "sound", label: "🔊 Sound" },
                                { k: "vibration", label: "📳 Vib" },
                                { k: "popup", label: "💬 Popup" },
                                { k: "email", label: "✉️ Email" },
                                { k: "push", label: "📱 Push" }
                              ].map(channel => (
                                <button
                                  key={channel.k}
                                  onClick={() => {
                                    setNotifConfig({
                                      ...notifConfig,
                                      [catName]: { ...item, [channel.k]: !((item as any)[channel.k]) }
                                    });
                                  }}
                                  className={`py-1 rounded-md border text-center font-bold cursor-pointer transition-all ${
                                    (item as any)[channel.k] 
                                      ? "border-indigo-200 bg-indigo-50/30 text-indigo-600" 
                                      : "border-gray-100 hover:border-gray-200 text-gray-400"
                                  }`}
                                >
                                  {channel.label}
                                </button>
                              ))}

                              <div className="col-span-2 sm:col-span-1">
                                <select
                                  value={item.frequency}
                                  onChange={e => {
                                    setNotifConfig({
                                      ...notifConfig,
                                      [catName]: { ...item, frequency: e.target.value }
                                    });
                                  }}
                                  className="w-full py-0.5 px-1 bg-white border border-gray-200 rounded text-[9px] focus:outline-none"
                                >
                                  <option>Hourly</option>
                                  <option>Daily</option>
                                  <option>Immediate</option>
                                  <option>Weekly</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                    <button 
                      onClick={handleSaveNotifications}
                      className="px-5 py-2.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Save size={12} />
                      <span>Lock Notification Channels</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 5. AI INTERVENTION CONTROLS PANEL */}
              {activeCategory === "intervention" && (
                <div className="space-y-5">
                  <div className="p-4 bg-amber-50/10 border border-amber-150 rounded-2xl space-y-3.5 text-xs">
                    <span className="text-[10px] font-mono text-amber-600 uppercase font-bold tracking-widest block flex items-center gap-1.5">
                      <AlertTriangle size={13} />
                      <span>Attention Mute presets</span>
                    </span>
                    <p className="text-gray-600">Instantly shroud all spoken AI interjections or warning popups. Choose a duration preset below:</p>
                    
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      {["15 Minutes", "30 Minutes", "1 Hour", "Until Tomorrow", "Until Current Task Ends"].map(dur => (
                        <button
                          key={dur}
                          onClick={() => {
                            setMuteDuration(dur);
                            setQuietRecoveryMode(true);
                            setSmartSilenceEnabled(true);
                            triggerSuccess(`Attention Shroud active: AI silenced for ${dur}`);
                          }}
                          className={`px-3 py-1.5 border rounded-xl font-bold transition-all cursor-pointer ${
                            muteDuration === dur 
                              ? "bg-black text-white border-black" 
                              : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
                          }`}
                        >
                          {dur}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center justify-between p-3 border border-gray-150 rounded-2xl bg-white">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-800">Strict Focus Mode Hardlock</span>
                        <p className="text-[10px] text-gray-500">Mutes notifications completely when focus sprint timer is running.</p>
                      </div>
                      <button
                        onClick={() => setFocusModeDnd(!focusModeDnd)}
                        className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                          focusModeDnd ? "bg-black justify-end" : "bg-gray-200 justify-start"
                        }`}
                      >
                        <div className="w-5 h-5 bg-white rounded-full shadow-xs" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-150 rounded-2xl bg-white">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-800">DND Schedule (Respect Sleeping Blocks)</span>
                        <p className="text-[10px] text-gray-500">Auto-silence all interjections between 10:00 PM and 7:00 AM.</p>
                      </div>
                      <button
                        onClick={() => setDndSchedule(!dndSchedule)}
                        className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                          dndSchedule ? "bg-black justify-end" : "bg-gray-200 justify-start"
                        }`}
                      >
                        <div className="w-5 h-5 bg-white rounded-full shadow-xs" />
                      </button>
                    </div>

                    <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl space-y-3 font-mono">
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase">
                        <span>Max AI Interruptions Per Day:</span>
                        <span className="text-indigo-600 text-xs font-bold">{maxInterruptions} / day</span>
                      </div>
                      <p className="text-[10px] text-gray-400">Restricts daily proactive alerts. Critical exceptions still pierce if risk probability exceeds 90%.</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400">0 (Strictly Mute)</span>
                        <input 
                          type="range" min="0" max="10" step="1"
                          value={maxInterruptions}
                          onChange={e => setMaxInterruptions(Number(e.target.value))}
                          className="flex-1 accent-black cursor-pointer"
                        />
                        <span className="text-[10px] text-gray-400">10 (Continuous feed)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                    <button 
                      onClick={handleSaveIntervention}
                      className="px-5 py-2.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Save size={12} />
                      <span>Lock Shield Limits</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 6. REGIONAL SETTINGS PANEL */}
              {activeCategory === "regional" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <label className="text-gray-400 font-bold uppercase text-[9px]">Local Country Node</label>
                      <select 
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none"
                      >
                        <option>United States</option>
                        <option>India</option>
                        <option>United Kingdom</option>
                        <option>Japan</option>
                        <option>Germany</option>
                        <option>France</option>
                        <option>Spain</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 font-bold uppercase text-[9px]">Localized Date Format</label>
                      <select 
                        value={dateFormat}
                        onChange={e => setDateFormat(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none"
                      >
                        <option>MM/DD/YYYY</option>
                        <option>DD/MM/YYYY</option>
                        <option>YYYY/MM/DD</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 font-bold uppercase text-[9px]">Localized Time Format</label>
                      <select 
                        value={timeFormat}
                        onChange={e => setTimeFormat(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none"
                      >
                        <option value="12h">12-Hour (11:30 PM)</option>
                        <option value="24h">24-Hour (23:30)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 font-bold uppercase text-[9px]">First Day of the Week</label>
                      <select 
                        value={firstDayOfWeek}
                        onChange={e => setFirstDayOfWeek(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none"
                      >
                        <option>Sunday</option>
                        <option>Monday</option>
                        <option>Saturday</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 font-bold uppercase text-[9px]">Standard Work Schedule Bounds</label>
                      <input 
                        type="text" 
                        value={workScheduleRange}
                        onChange={e => setWorkScheduleRange(e.target.value)}
                        placeholder="e.g. 09:00 - 17:00"
                        className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-800">Auto Time Zone Sync</span>
                        <p className="text-[9px] text-gray-400">Detect and shift on travel.</p>
                      </div>
                      <button
                        onClick={() => setAutoTimezone(!autoTimezone)}
                        className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                          autoTimezone ? "bg-black justify-end" : "bg-gray-200 justify-start"
                        }`}
                      >
                        <div className="w-5 h-5 bg-white rounded-full shadow-xs" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center justify-between p-3.5 border border-gray-150 rounded-2xl bg-white">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-800">Sync Regional Holidays Context</span>
                        <p className="text-[10px] text-gray-500">Auto-inject regional holidays to compress task lines and secure early weekend reviews.</p>
                      </div>
                      <button
                        onClick={() => setRegionalHolidays(!regionalHolidays)}
                        className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                          regionalHolidays ? "bg-black justify-end" : "bg-gray-200 justify-start"
                        }`}
                      >
                        <div className="w-5 h-5 bg-white rounded-full shadow-xs" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3.5 border border-gray-150 rounded-2xl bg-white">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-800">Travel Mode Intelligence</span>
                        <p className="text-[10px] text-gray-500">Detect when you are changing locations, and auto-convert dates, schedules, and reminders.</p>
                      </div>
                      <button
                        onClick={() => setTravelMode(!travelMode)}
                        className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                          travelMode ? "bg-black justify-end" : "bg-gray-200 justify-start"
                        }`}
                      >
                        <div className="w-5 h-5 bg-white rounded-full shadow-xs" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                    <button 
                      onClick={handleSaveRegional}
                      className="px-5 py-2.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Save size={12} />
                      <span>Lock Regional Anchors</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 7. APPEARANCE PANEL */}
              {activeCategory === "appearance" && (
                <div className="space-y-5">
                  
                  {/* Theme Select */}
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] text-gray-400 uppercase font-bold block">Interface Color Theme</label>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      {["Light", "Dark", "System"].map(themeOpt => (
                        <button
                          key={themeOpt}
                          onClick={() => setAppearanceTheme(themeOpt)}
                          className={`p-3.5 rounded-2xl text-left border font-mono font-bold uppercase transition-all cursor-pointer ${
                            appearanceTheme === themeOpt 
                              ? "border-black bg-black text-white shadow-sm" 
                              : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                          }`}
                        >
                          {themeOpt === "Light" && "☀️ "}
                          {themeOpt === "Dark" && "🌙 "}
                          {themeOpt === "System" && "💻 "}
                          <span>{themeOpt} theme</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent color picker */}
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] text-gray-400 uppercase font-bold block">Accent Brand Matrix</label>
                    <div className="flex gap-4">
                      {Object.keys(accentColorMap).map(colorKey => (
                        <button
                          key={colorKey}
                          onClick={() => {
                            setAccentColor(colorKey);
                            triggerSuccess(`Accent changed to ${colorKey.toUpperCase()}`);
                          }}
                          style={{ backgroundColor: accentColorMap[colorKey] }}
                          title={colorKey}
                          className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                            accentColor === colorKey ? "border-black scale-115 shadow-sm" : "border-white hover:scale-105"
                          }`}
                        >
                          {accentColor === colorKey && <Check size={14} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Density & animations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1.5">
                      <label className="text-gray-400 font-bold uppercase text-[9px]">Interface Layout Density</label>
                      <div className="grid grid-cols-3 gap-1.5 bg-gray-50 border border-gray-150 p-1 rounded-xl">
                        {["compact", "cozy", "expanded"].map(dens => (
                          <button
                            key={dens}
                            onClick={() => setDensity(dens)}
                            className={`py-1.5 rounded-lg font-bold text-[9px] uppercase cursor-pointer transition-all ${
                              density === dens ? "bg-white text-black shadow-3xs" : "text-gray-500 hover:text-black"
                            }`}
                          >
                            {dens}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-gray-400 font-bold uppercase text-[9px]">Motion Speeds</label>
                      <div className="grid grid-cols-2 gap-1.5 bg-gray-50 border border-gray-150 p-1 rounded-xl">
                        {["standard", "reduced"].map(animOpt => (
                          <button
                            key={animOpt}
                            onClick={() => {
                              setAnimations(animOpt);
                              if (animOpt === "reduced") {
                                setMotionReduction(100);
                              } else {
                                setMotionReduction(0);
                              }
                            }}
                            className={`py-1.5 rounded-lg font-bold text-[9px] uppercase cursor-pointer transition-all ${
                              animations === animOpt ? "bg-white text-black shadow-3xs" : "text-gray-500 hover:text-black"
                            }`}
                          >
                            {animOpt} motion
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sliders */}
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl space-y-4 font-mono text-xs">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                        <span>Glassmorphism backdrop scale:</span>
                        <span className="text-indigo-600 font-bold">{glassStrength}%</span>
                      </div>
                      <input 
                        type="range" min="10" max="100" step="5"
                        value={glassStrength}
                        onChange={e => setGlassStrength(Number(e.target.value))}
                        className="w-full accent-black cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                        <span>Floating Clock Rotation Speed:</span>
                        <span className="text-indigo-600 font-bold">{clockAnimationIntensity}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="5"
                        value={clockAnimationIntensity}
                        onChange={e => setClockAnimationIntensity(Number(e.target.value))}
                        className="w-full accent-black cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Sidebar preset */}
                  <div className="space-y-1.5 text-xs font-mono">
                    <label className="text-gray-400 font-bold uppercase text-[9px]">Sidebar Configuration</label>
                    <div className="grid grid-cols-3 gap-3">
                      {["compact", "expanded", "auto_hide"].map(styleOpt => (
                        <button
                          key={styleOpt}
                          onClick={() => setSidebarStyle(styleOpt)}
                          className={`p-2.5 rounded-xl border text-[10px] uppercase font-bold text-center cursor-pointer transition-all ${
                            sidebarStyle === styleOpt 
                              ? "bg-black text-white border-black" 
                              : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          {styleOpt.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                    <button 
                      onClick={handleSaveAppearance}
                      className="px-5 py-2.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Save size={12} />
                      <span>Apply Console Skin</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 8. ACCESSIBILITY PANEL */}
              {activeCategory === "accessibility" && (
                <div className="space-y-5">
                  <div className="p-4 bg-indigo-50/20 border border-indigo-150 rounded-2xl flex flex-col gap-2">
                    <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider block">Live Accessibility preview</span>
                    <div className="bg-white p-3.5 rounded-xl border border-gray-150/50 space-y-2">
                      <p className="text-xs font-bold text-gray-900">Dynamic UI Scaling Preview</p>
                      <p className="text-[10px] text-gray-500 leading-normal">
                        "Don't remind me. Help me finish it." Scale sliders below and this preview updates instantly to guarantee perfect vision and reading comfort.
                      </p>
                      <div className="flex gap-1.5">
                        <button className="px-3 py-1 bg-black text-white rounded-lg text-[9px] font-mono font-bold uppercase">Sample Button</button>
                        <button className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[9px] font-mono font-bold uppercase border border-gray-200">Secondary</button>
                      </div>
                    </div>
                  </div>

                  {/* Sliders layout */}
                  <div className="space-y-4 font-mono text-xs">
                    
                    {/* Typography size */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                        <span>Typography Font-Size Scale:</span>
                        <span className="text-indigo-600 font-bold">{textSizeSlider}%</span>
                      </div>
                      <input 
                        type="range" min="80" max="200" step="5"
                        value={textSizeSlider}
                        onChange={e => setTextSizeSlider(Number(e.target.value))}
                        className="w-full accent-black cursor-pointer"
                      />
                    </div>

                    {/* High contrast */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                        <span>Contrast Intensity Offset:</span>
                        <span className="text-indigo-600 font-bold">+{contrastSlider}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="5"
                        value={contrastSlider}
                        onChange={e => setContrastSlider(Number(e.target.value))}
                        className="w-full accent-black cursor-pointer"
                      />
                    </div>

                    {/* Line spacing */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                        <span>Interface Line-Height Spacing:</span>
                        <span className="text-indigo-600 font-bold">{lineSpacing}em</span>
                      </div>
                      <input 
                        type="range" min="1.0" max="2.4" step="0.1"
                        value={lineSpacing}
                        onChange={e => setLineSpacing(Number(e.target.value))}
                        className="w-full accent-black cursor-pointer"
                      />
                    </div>

                    {/* Button Padding size */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                        <span>Tactile Button size scale:</span>
                        <span className="text-indigo-600 font-bold">{Math.round(buttonScale * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0.8" max="1.8" step="0.05"
                        value={buttonScale}
                        onChange={e => setButtonScale(Number(e.target.value))}
                        className="w-full accent-black cursor-pointer"
                      />
                    </div>

                    {/* Motion reduction */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                        <span>Motion Reduction Coefficient:</span>
                        <span className="text-indigo-600 font-bold">{motionReduction}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="5"
                        value={motionReduction}
                        onChange={e => {
                          setMotionReduction(Number(e.target.value));
                          if (Number(e.target.value) > 50) {
                            setAnimations("reduced");
                          } else {
                            setAnimations("standard");
                          }
                        }}
                        className="w-full accent-black cursor-pointer"
                      />
                    </div>

                    {/* Cursor size */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                        <span>Dynamic Cursor Scale:</span>
                        <span className="text-indigo-600 font-bold">{cursorSize}px</span>
                      </div>
                      <input 
                        type="range" min="16" max="64" step="2"
                        value={cursorSize}
                        onChange={e => setCursorSize(Number(e.target.value))}
                        className="w-full accent-black cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Dyslexia Dropdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1.5">
                      <label className="text-gray-400 font-bold uppercase text-[9px]">Dyslexia-Friendly Typography</label>
                      <select
                        value={dyslexicFontType}
                        onChange={e => setDyslexicFontType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none"
                      >
                        <option value="Default">Default (Inter/Space Grotesk)</option>
                        <option value="Lexend">Lexend (Highly Legible Sans)</option>
                        <option value="Atkinson Hyperlegible">Atkinson Hyperlegible (Braille Institute)</option>
                        <option value="OpenDyslexic">OpenDyslexic (Weighted Bottoms)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-gray-400 font-bold uppercase text-[9px]">Acoustic Synthesizer (TTS) voice</label>
                      <select className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none">
                        <option>Google US English (Neural-3)</option>
                        <option>Google UK Female (Neural-1)</option>
                        <option>Google Hindi Male (Neural-2)</option>
                        <option>Local System Accent Native</option>
                      </select>
                    </div>
                  </div>

                  {/* Audio Synthesizers */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-4">
                    <span className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest block">Text-to-Speech Accessibility Controls</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="space-y-1">
                        <label className="text-gray-500">Audio Synth Speed: <span className="font-bold text-indigo-600">{ttsSpeed}x</span></label>
                        <input 
                          type="range" min="0.5" max="2.0" step="0.1"
                          value={ttsSpeed}
                          onChange={e => setTtsSpeed(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-500">Audio Synth Pitch: <span className="font-bold text-indigo-600">{ttsPitch}x</span></label>
                        <input 
                          type="range" min="0.5" max="2.0" step="0.1"
                          value={ttsPitch}
                          onChange={e => setTtsPitch(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3 space-y-2.5 text-xs">
                      {[
                        { k: "autodocs", label: "Auto Read Syllabus & Extracted Documents on load", v: ttsAutoDocs, set: setTtsAutoDocs },
                        { k: "autoai", label: "Auto Read Spoken AI Chief-of-Staff directives", v: ttsAutoAi, set: setTtsAutoAi },
                        { k: "notif", label: "Speak Incoming warning alerts instantly", v: ttsNotifications, set: setTtsNotifications }
                      ].map(ttsP => (
                        <div key={ttsP.k} className="flex items-center justify-between">
                          <span className="text-gray-600">{ttsP.label}</span>
                          <button
                            onClick={() => ttsP.set(!ttsP.v)}
                            className={`w-10 h-5 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                              ttsP.v ? "bg-black justify-end" : "bg-gray-200 justify-start"
                            }`}
                          >
                            <div className="w-4 h-4 bg-white rounded-full shadow-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button 
                      onClick={handleResetAccessibility}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw size={12} />
                      <span>Restore Defaults</span>
                    </button>
                    <button 
                      onClick={handleSaveAccessibility}
                      className="px-5 py-2.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Save size={12} />
                      <span>Save Accessibility rules</span>
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}
