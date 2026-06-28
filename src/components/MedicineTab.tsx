import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  Bell, 
  User, 
  ShieldAlert, 
  Mic, 
  MicOff, 
  Volume2, 
  Download, 
  Settings, 
  RotateCcw, 
  Activity, 
  Lock, 
  Eye, 
  Briefcase, 
  Smartphone,
  CheckCircle,
  FileText,
  FileDown,
  Info,
  Phone,
  Heart,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// --- INTERFACES ---
export interface Medication {
  id: string;
  name: string;
  type: "tablet" | "capsule" | "syrup" | "injection" | "drops" | "inhaler" | "other";
  dosage: string;
  strength?: string;
  purpose?: string;
  doctorName?: string;
  prescriptionImage?: string;
  scheduleType: "once" | "twice" | "three" | "custom" | "specific_days" | "alternate_days" | "weekly" | "monthly" | "as_needed";
  specificDays?: string[]; // e.g. ["Mon", "Wed", "Fri"]
  reminderTimes: string[]; // e.g. ["08:00 AM", "02:00 PM"]
  duration: "finished" | "days" | "date" | "longterm";
  durationDays?: number;
  durationEndDate?: string;
  startDate?: string;
  endDate?: string;
  foodPreference: "before" | "after" | "with" | "empty" | "none";
  totalQuantity?: number;
  remainingQuantity?: number;
  refillThreshold?: number;
  reminderSound?: string;
  voiceReminder?: boolean;
  isPaused?: boolean;
  isArchived?: boolean;
  createdAt: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  medicationName: string;
  timestamp: string; // ISO string
  status: "taken" | "skipped" | "snoozed" | "missed" | "not_available";
  doseTimeScheduled: string; // e.g., "08:00 AM"
  dateString: string; // e.g. "2026-06-25"
}

export interface EmergencyInfo {
  contactName: string;
  contactPhone: string;
  doctorName: string;
  doctorPhone: string;
  pharmacyName: string;
  pharmacyPhone: string;
  notes: string;
  medicalId: string;
}

// Default initial state for emergency info
const initialEmergencyState: EmergencyInfo = {
  contactName: "Sarah Carter (Spouse)",
  contactPhone: "415-555-0199",
  doctorName: "Dr. Amanda Ross (Cardiology)",
  doctorPhone: "415-555-0122",
  pharmacyName: "Walgreens Pharmacy #4120",
  pharmacyPhone: "415-555-3000",
  notes: "Allergic to Penicillin. Blood Type: A-positive. High blood pressure history.",
  medicalId: "MED-99481-AR"
};

// Common medication categories & purposes for suggestions
const SUGGESTED_MEDS: any[] = [];

export default function MedicineTab() {
  const { user } = useAuth();

  // --- COMPONENT STATE ---
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [emergencyInfo, setEmergencyInfo] = useState<EmergencyInfo>(initialEmergencyState);
  
  // App-level customization
  const [isCloudSyncDisabled, setIsCloudSyncDisabled] = useState(false);
  const [travelModeActive, setTravelModeActive] = useState(false);
  const [travelLocalTimeConfirmed, setTravelLocalTimeConfirmed] = useState(false);
  
  // PIN lock screen simulation
  const [isPlannerLocked, setIsPlannerLocked] = useState(false);
  const [plannerPin, setPlannerPin] = useState("1234");
  const [pinInput, setPinInput] = useState("");
  const [isPinSetupOpen, setIsPinSetupOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");
  const [isPinLockEnabled, setIsPinLockEnabled] = useState(false);

  // Accessibility settings
  const [largeTextEnabled, setLargeTextEnabled] = useState(false);
  const [highContrastEnabled, setHighContrastEnabled] = useState(false);
  const [voiceReadingEnabled, setVoiceReadingEnabled] = useState(false);
  const [oneTapActionsEnabled, setOneTapActionsEnabled] = useState(false);

  // UI state controllers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSnoozeModalOpen, setIsSnoozeModalOpen] = useState(false);
  const [selectedMedForSnooze, setSelectedMedForSnooze] = useState<{ medId: string, timeScheduled: string } | null>(null);
  const [activeToast, setActiveToast] = useState<{ message: string; type: "success" | "warning" | "error" | "info" } | null>(null);
  
  // Form input states
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<Medication["type"]>("tablet");
  const [formDosage, setFormDosage] = useState("1 Tablet");
  const [formStrength, setFormStrength] = useState("");
  const [formPurpose, setFormPurpose] = useState("");
  const [formDoctorName, setFormDoctorName] = useState("");
  const [formPrescriptionImage, setFormPrescriptionImage] = useState<string | null>(null);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [formEndDate, setFormEndDate] = useState("");
  const [formReminderSound, setFormReminderSound] = useState("chime");
  const [formVoiceReminder, setFormVoiceReminder] = useState(false);
  const [editingMedicationId, setEditingMedicationId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLearnModalOpen, setIsLearnModalOpen] = useState(false);
  const [formScheduleType, setFormScheduleType] = useState<Medication["scheduleType"]>("once");
  const [formSpecificDays, setFormSpecificDays] = useState<string[]>(["Mon", "Wed", "Fri"]);
  const [formReminderTimes, setFormReminderTimes] = useState<string[]>(["08:00 AM"]);
  const [newTimeInput, setNewTimeInput] = useState("08:00");
  const [formDuration, setFormDuration] = useState<Medication["duration"]>("longterm");
  const [formDurationDays, setFormDurationDays] = useState(30);
  const [formDurationEndDate, setFormDurationEndDate] = useState("");
  const [formFoodPref, setFormFoodPref] = useState<Medication["foodPreference"]>("none");
  const [formTotalQty, setFormTotalQty] = useState<number>(60);
  const [formRemainingQty, setFormRemainingQty] = useState<number>(60);
  const [formRefillThreshold, setFormRefillThreshold] = useState<number>(5);
  const [trackRefillEnabled, setTrackRefillEnabled] = useState(true);

  // Calendar state
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string>("2026-06-25");
  const [activeCalendarMonth, setActiveCalendarMonth] = useState<number>(5); // June (0-indexed 5)
  const [activeCalendarYear, setActiveCalendarYear] = useState<number>(2026);

  // Custom Simulator states
  const [activeVoiceCommand, setActiveVoiceCommand] = useState("");
  const [voiceLogResponse, setVoiceLogResponse] = useState<string | null>(null);
  const [swipingMedId, setSwipingMedId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0); // -100 for snooze, +100 for taken
  const [longPressedMed, setLongPressedMed] = useState<Medication | null>(null);
  const [isEditingEmergency, setIsEditingEmergency] = useState(false);

  // Smart floating notification simulation state
  const [simulatedNotification, setSimulatedNotification] = useState<{
    medication: Medication;
    timeScheduled: string;
  } | null>(null);

  // Simulated pattern observations for AI personalization
  const [showPatternSuggestion, setShowPatternSuggestion] = useState<boolean>(true);
  const [patternSuggestionText, setPatternSuggestionText] = useState<string>(
    "You usually take your Lisinopril tablet 20 minutes late (around 8:20 AM). Would you like to move the scheduled reminder to 8:20 AM for better consistency?"
  );

  // --- TOAST HELPER ---
  const triggerToast = (message: string, type: "success" | "warning" | "error" | "info" = "success") => {
    setActiveToast({ message, type });
    if (voiceReadingEnabled) {
      speakText(message);
    }
    setTimeout(() => setActiveToast(null), 3500);
  };

  // --- VOICE SYNTHESIS HELPER ---
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- FIRESTORE PERSISTENCE ---
  // Load data
  useEffect(() => {
    const loadData = async () => {
      // 1. Load from LocalStorage
      const cachedMeds = localStorage.getItem("saver_medications");
      const cachedLogs = localStorage.getItem("saver_medication_logs");
      const cachedEmergency = localStorage.getItem("saver_emergency_info");
      const cachedPinLock = localStorage.getItem("saver_pin_lock_enabled");
      const cachedPin = localStorage.getItem("saver_planner_pin");
      
      if (cachedMeds) setMedications(JSON.parse(cachedMeds));
      if (cachedLogs) setLogs(JSON.parse(cachedLogs));
      if (cachedEmergency) setEmergencyInfo(JSON.parse(cachedEmergency));
      if (cachedPinLock === "true") {
        setIsPinLockEnabled(true);
        setIsPlannerLocked(true);
      }
      if (cachedPin) setPlannerPin(cachedPin);

      // 2. If user exists and cloud sync is not disabled, load from Firestore
      if (user && user.uid !== "guest-user-session" && !isCloudSyncDisabled) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.medications) {
              setMedications(data.medications);
              localStorage.setItem("saver_medications", JSON.stringify(data.medications));
            }
            if (data.medication_logs) {
              setLogs(data.medication_logs);
              localStorage.setItem("saver_medication_logs", JSON.stringify(data.medication_logs));
            }
            if (data.emergency_info) {
              setEmergencyInfo(data.emergency_info);
              localStorage.setItem("saver_emergency_info", JSON.stringify(data.emergency_info));
            }
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
        }
      }
    };

    loadData();
  }, [user, isCloudSyncDisabled]);

  // Save changes helper
  const syncToStorage = async (updatedMeds: Medication[], updatedLogs: MedicationLog[], updatedEmergency?: EmergencyInfo) => {
    // Save locally
    localStorage.setItem("saver_medications", JSON.stringify(updatedMeds));
    localStorage.setItem("saver_medication_logs", JSON.stringify(updatedLogs));
    if (updatedEmergency) {
      localStorage.setItem("saver_emergency_info", JSON.stringify(updatedEmergency));
    }

    // Save to Firestore if available
    if (user && user.uid !== "guest-user-session" && !isCloudSyncDisabled) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
          medications: updatedMeds,
          medication_logs: updatedLogs,
          ...(updatedEmergency ? { emergency_info: updatedEmergency } : {})
        }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  };

  // Removed default demo medications seed if list is empty


  // Handle active travel confirmation local adjustments
  useEffect(() => {
    if (travelModeActive && !travelLocalTimeConfirmed) {
      // Trigger a soft AI traveling alert
      triggerToast("✈️ Travel Mode active: Do you want to adjust schedule local times?", "info");
    }
  }, [travelModeActive]);

  // --- ACTIONS ---

  // Helper to completely reset the form states
  const resetFormState = () => {
    setFormName("");
    setFormType("tablet");
    setFormDosage("1 Tablet");
    setFormStrength("");
    setFormPurpose("");
    setFormDoctorName("");
    setFormPrescriptionImage(null);
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormEndDate("");
    setFormReminderSound("chime");
    setFormVoiceReminder(false);
    setFormScheduleType("once");
    setFormReminderTimes(["08:00 AM"]);
    setFormFoodPref("none");
    setFormTotalQty(60);
    setFormRemainingQty(60);
    setFormRefillThreshold(5);
    setTrackRefillEnabled(true);
    setEditingMedicationId(null);
  };

  // Add & Edit Medicine Form logic
  const handleAddNewMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      triggerToast("Please enter a medication name", "error");
      return;
    }

    const medData: Medication = {
      id: editingMedicationId || `med-${Date.now()}`,
      name: formName,
      type: formType,
      dosage: formDosage,
      strength: formStrength.trim() ? formStrength : undefined,
      purpose: formPurpose.trim() ? formPurpose : undefined,
      doctorName: formDoctorName.trim() ? formDoctorName : undefined,
      prescriptionImage: formPrescriptionImage || undefined,
      scheduleType: formScheduleType,
      specificDays: formScheduleType === "specific_days" ? formSpecificDays : undefined,
      reminderTimes: formReminderTimes,
      duration: formDuration,
      durationDays: formDuration === "days" ? formDurationDays : undefined,
      durationEndDate: formDuration === "date" ? formDurationEndDate : undefined,
      startDate: formStartDate,
      endDate: formEndDate || undefined,
      foodPreference: formFoodPref,
      totalQuantity: trackRefillEnabled ? formTotalQty : undefined,
      remainingQuantity: trackRefillEnabled ? formRemainingQty : undefined,
      refillThreshold: trackRefillEnabled ? formRefillThreshold : undefined,
      reminderSound: formReminderSound,
      voiceReminder: formVoiceReminder,
      createdAt: new Date().toISOString()
    };

    let updated: Medication[];
    if (editingMedicationId) {
      updated = medications.map(m => m.id === editingMedicationId ? { ...m, ...medData } : m);
      triggerToast(`Updated ${formName} successfully!`, "success");
    } else {
      updated = [...medications, medData];
      triggerToast(`Added ${formName} successfully!`, "success");
    }

    setMedications(updated);
    syncToStorage(updated, logs);
    setIsAddModalOpen(false);
    resetFormState();
  };

  // Populate form with existing values for editing
  const handleEditMedication = (med: Medication) => {
    setEditingMedicationId(med.id);
    setFormName(med.name);
    setFormType(med.type);
    setFormDosage(med.dosage);
    setFormStrength(med.strength || "");
    setFormPurpose(med.purpose || "");
    setFormDoctorName(med.doctorName || "");
    setFormPrescriptionImage(med.prescriptionImage || null);
    setFormScheduleType(med.scheduleType);
    setFormReminderTimes(med.reminderTimes);
    setFormFoodPref(med.foodPreference);
    setFormStartDate(med.startDate || new Date().toISOString().split("T")[0]);
    setFormEndDate(med.endDate || "");
    setFormTotalQty(med.totalQuantity || 60);
    setFormRemainingQty(med.remainingQuantity || 60);
    setFormRefillThreshold(med.refillThreshold || 5);
    setTrackRefillEnabled(med.totalQuantity !== undefined);
    setFormReminderSound(med.reminderSound || "chime");
    setFormVoiceReminder(med.voiceReminder || false);
    setIsAddModalOpen(true);
  };

  // Duplicate an existing medication
  const handleDuplicateMedication = (med: Medication) => {
    const duplicated: Medication = {
      ...med,
      id: `med-${Date.now()}`,
      name: `${med.name} (Copy)`,
      createdAt: new Date().toISOString()
    };
    const updated = [...medications, duplicated];
    setMedications(updated);
    syncToStorage(updated, logs);
    triggerToast(`Duplicated ${med.name} successfully!`, "success");
  };

  // Pause or Resume notifications for a medication
  const handleTogglePauseMedication = (id: string) => {
    const updated = medications.map(m => {
      if (m.id === id) {
        const nextPaused = !m.isPaused;
        triggerToast(nextPaused ? `Paused reminders for ${m.name}` : `Resumed reminders for ${m.name}`, "info");
        return { ...m, isPaused: nextPaused };
      }
      return m;
    });
    setMedications(updated);
    syncToStorage(updated, logs);
  };

  // Archive a medication
  const handleArchiveMedication = (id: string) => {
    const updated = medications.map(m => {
      if (m.id === id) {
        triggerToast(`Archived ${m.name}`, "info");
        return { ...m, isArchived: true };
      }
      return m;
    });
    setMedications(updated);
    syncToStorage(updated, logs);
  };

  // Export details of a single medication
  const handleExportSingleMedication = (med: Medication) => {
    const data = {
      exportDate: new Date().toISOString(),
      medication: med
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${med.name.replace(/\s+/g, "_")}_schedule.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast(`Exported schedule for ${med.name}!`, "success");
  };

  const addFormReminderTime = () => {
    // convert military to standard 12hr format
    const [hrs, mins] = newTimeInput.split(":");
    let h = parseInt(hrs);
    const m = mins;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12; // hour 0 is 12
    const formatted = `${h.toString().padStart(2, "0")}:${m} ${ampm}`;
    
    if (formReminderTimes.includes(formatted)) {
      triggerToast("Time already exists", "warning");
      return;
    }
    setFormReminderTimes([...formReminderTimes, formatted].sort());
  };

  const removeFormReminderTime = (timeToRemove: string) => {
    setFormReminderTimes(formReminderTimes.filter(t => t !== timeToRemove));
  };

  // Mark Dose / Confirmation
  const handleMedicationStatus = (
    medId: string, 
    timeScheduled: string, 
    status: MedicationLog["status"], 
    customSnoozeMinutes?: number
  ) => {
    const med = medications.find(m => m.id === medId);
    if (!med) return;

    // 1. Log trip to history
    const newLog: MedicationLog = {
      id: `log-${Date.now()}`,
      medicationId: medId,
      medicationName: med.name,
      timestamp: new Date().toISOString(),
      status: status,
      doseTimeScheduled: timeScheduled,
      dateString: calendarSelectedDate
    };

    const updatedLogs = [newLog, ...logs];

    // 2. Adjust remaining quantity & check refill limit
    let updatedMeds = [...medications];
    if (status === "taken" && med.remainingQuantity !== undefined) {
      updatedMeds = medications.map(m => {
        if (m.id === medId && m.remainingQuantity !== undefined) {
          const rem = Math.max(0, m.remainingQuantity - 1);
          
          // Check for refill alert triggers (notify when 5, 3, or 1 left)
          if (m.refillThreshold !== undefined && rem <= m.refillThreshold) {
            setTimeout(() => {
              triggerToast(`💊 Refill Required soon: Only ${rem} left of ${m.name}!`, "warning");
            }, 1000);
          }
          return { ...m, remainingQuantity: rem };
        }
        return m;
      });
    }

    // 3. Handle specific Snooze updates
    if (status === "snoozed" && customSnoozeMinutes) {
      triggerToast(`Snoozed ${med.name} for ${customSnoozeMinutes} minutes. AI rescheduled reminder.`, "info");
    } else if (status === "taken") {
      triggerToast(`Satisfying: ${med.name} dose logged! Keep your streak up!`, "success");
    } else if (status === "skipped") {
      triggerToast(`Skipped ${med.name} dose.`, "info");
    } else if (status === "not_available") {
      triggerToast(`Logged ${med.name} as Not Available.`, "warning");
    }

    setMedications(updatedMeds);
    setLogs(updatedLogs);
    syncToStorage(updatedMeds, updatedLogs);
    setSimulatedNotification(null); // Clear active notifications if any
  };

  // Snooze action
  const openSnoozeDialog = (medId: string, timeScheduled: string) => {
    setSelectedMedForSnooze({ medId, timeScheduled });
    setIsSnoozeModalOpen(true);
  };

  // Delete/Clear Medications
  const handleDeleteMedication = (id: string) => {
    const updated = medications.filter(m => m.id !== id);
    const updatedLogs = logs.filter(l => l.medicationId !== id);
    setMedications(updated);
    setLogs(updatedLogs);
    syncToStorage(updated, updatedLogs);
    triggerToast("Medication deleted", "warning");
  };

  const handleClearAllData = () => {
    if (confirm("Are you absolutely sure you want to permanently delete all medication records, logs, and emergency profiles? This action is irreversible.")) {
      setMedications([]);
      setLogs([]);
      setEmergencyInfo(initialEmergencyState);
      localStorage.removeItem("saver_medications");
      localStorage.removeItem("saver_medication_logs");
      localStorage.removeItem("saver_emergency_info");
      triggerToast("All medicine planner data cleared permanently.", "error");
    }
  };

  // Backup / Export
  const handleExportBackup = () => {
    const data = {
      exportDate: new Date().toISOString(),
      userEmail: user?.email || "anonymous",
      medications,
      logs,
      emergencyInfo
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saver_medicine_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast("Exported backup file successfully!", "success");
  };

  // Emergency profile updates
  const handleUpdateEmergencyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingEmergency(false);
    syncToStorage(medications, logs, emergencyInfo);
    triggerToast("Emergency medical profile updated successfully!", "success");
  };

  // Simulate floating smart notifications
  const handleTriggerSimulatedNotification = (med: Medication, time: string) => {
    setSimulatedNotification({ medication: med, timeScheduled: time });
    triggerToast(`🔔 Simulated notification received for ${med.name}!`, "info");
  };

  // AI behavior patterns adjustments (e.g. reschedule late ones)
  const handleAcceptScheduleAdjustment = (medName: string, originalTime: string, newTime: string) => {
    const updated = medications.map(m => {
      if (m.name.toLowerCase() === medName.toLowerCase()) {
        const index = m.reminderTimes.indexOf(originalTime);
        const nextTimes = [...m.reminderTimes];
        if (index !== -1) {
          nextTimes[index] = newTime;
        } else {
          nextTimes.push(newTime);
        }
        return { ...m, reminderTimes: nextTimes.sort() };
      }
      return m;
    });
    setMedications(updated);
    syncToStorage(updated, logs);
    setShowPatternSuggestion(false);
    triggerToast(`Adjusted Lisinopril scheduled time to ${newTime}!`, "success");
  };

  // --- ANALYTICS CALCULATIONS ---
  // Calculates active consecutive day streak
  const calculateStreak = () => {
    let currentStreak = 0;
    const todayStr = "2026-06-25";
    const dateLogs = new Map<string, string[]>(); // Map date -> statuses
    
    logs.forEach(l => {
      const existing = dateLogs.get(l.dateString) || [];
      existing.push(l.status);
      dateLogs.set(l.dateString, existing);
    });

    // Count backwards starting from today/yesterday
    let checkDate = new Date(todayStr);
    for (let i = 0; i < 30; i++) {
      const checkStr = checkDate.toISOString().split("T")[0];
      const statuses = dateLogs.get(checkStr);
      if (statuses && statuses.length > 0) {
        const hasMissed = statuses.includes("missed");
        const hasTaken = statuses.includes("taken");
        if (hasTaken && !hasMissed) {
          currentStreak++;
        } else {
          break;
        }
      } else {
        // If it's today and no logs yet, don't break the streak immediately
        if (i > 0) break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return currentStreak > 0 ? currentStreak : 3; // Default 3 days as starter demo if no logs
  };

  const calculateAdherenceRate = () => {
    if (logs.length === 0) return 100;
    const completed = logs.filter(l => l.status === "taken").length;
    const totalWithStatus = logs.filter(l => ["taken", "skipped", "missed", "not_available"].includes(l.status)).length;
    if (totalWithStatus === 0) return 94; // fallback mockup
    return Math.round((completed / totalWithStatus) * 100);
  };

  const getMissedDosesCount = () => {
    // Returns active missed doses for today (scheduled times earlier than current time 07:44 AM, with no status log)
    const todayStr = "2026-06-25";
    const currentTimeMinutes = 7 * 60 + 44; // 07:44 AM

    let missedCount = 0;
    medications.forEach(med => {
      if (med.isArchived) return;
      med.reminderTimes.forEach(timeStr => {
        // Parse time Str (e.g. 08:00 AM)
        const [time, ampm] = timeStr.split(" ");
        let [hrs, mins] = time.split(":").map(Number);
        if (ampm === "PM" && hrs < 12) hrs += 12;
        if (ampm === "AM" && hrs === 12) hrs = 0;
        const schedMinutes = hrs * 60 + mins;

        if (schedMinutes < currentTimeMinutes) {
          // Check if there is already a log (taken/skipped/missed) for this medication and scheduled time today
          const logged = logs.some(l => l.medicationId === med.id && l.doseTimeScheduled === timeStr && l.dateString === todayStr);
          if (!logged) {
            missedCount++;
          }
        }
      });
    });

    // Also count explicit missed logged instances
    const explicitMissedToday = logs.filter(l => l.dateString === todayStr && l.status === "missed").length;
    return missedCount + explicitMissedToday;
  };

  // --- CALENDAR GRID HELPER ---
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(activeCalendarMonth, activeCalendarYear);
    const firstDay = getFirstDayOfMonth(activeCalendarMonth, activeCalendarYear);
    const cells = [];

    // Empty blank cells for offset
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    // Days numbers
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${activeCalendarYear}-${(activeCalendarMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const isSelected = calendarSelectedDate === dateStr;
      
      // Check if medications are scheduled on this date
      const hasMeds = medications.length > 0; // Simple boolean mockup check for demo visual indicators
      
      // Check logs on this date to highlight completed/missed dots
      const dateLogs = logs.filter(l => l.dateString === dateStr);
      const allTaken = dateLogs.length > 0 && dateLogs.every(l => l.status === "taken");
      const hasMissed = dateLogs.some(l => l.status === "missed");

      cells.push(
        <button
          key={`day-${day}`}
          onClick={() => setCalendarSelectedDate(dateStr)}
          className={`h-9 w-9 text-[11px] font-mono rounded-xl transition-all relative flex flex-col items-center justify-center cursor-pointer ${
            isSelected 
              ? "bg-slate-900 text-white font-bold shadow-md scale-105" 
              : "hover:bg-slate-50 text-gray-700"
          }`}
        >
          <span>{day}</span>
          {hasMeds && (
            <div className="absolute bottom-1 flex gap-0.5">
              <span className={`w-1 h-1 rounded-full ${
                hasMissed ? "bg-red-500" : allTaken ? "bg-emerald-500" : "bg-indigo-400"
              }`} />
            </div>
          )}
        </button>
      );
    }
    return cells;
  };

  // --- VOICE SPEECH INTERACTIVE COMMANDS SIMULATOR ---
  const handleVoiceCommandSubmit = (commandText: string) => {
    const cmd = commandText.trim().toLowerCase();
    setActiveVoiceCommand(commandText);

    if (cmd.includes("add medicine") || cmd.includes("add medication")) {
      setIsAddModalOpen(true);
      setVoiceLogResponse("Opened the 'Add Medicine' form for you. Please complete the fields.");
      speakText("I have opened the add medicine form for you.");
    } 
    else if (cmd.includes("i took my medicine") || cmd.includes("mark taken") || cmd.includes("took medicine")) {
      // Find first medication that has pending logs or reminder times for today
      const pendingMed = medications[0];
      if (pendingMed) {
        handleMedicationStatus(pendingMed.id, pendingMed.reminderTimes[0] || "08:00 AM", "taken");
        setVoiceLogResponse(`Great! I've marked your dose of ${pendingMed.name} as taken.`);
      } else {
        setVoiceLogResponse("No medications scheduled to mark as taken.");
      }
    } 
    else if (cmd.includes("remind me tonight") || cmd.includes("snooze")) {
      const firstMed = medications[0];
      if (firstMed) {
        handleMedicationStatus(firstMed.id, firstMed.reminderTimes[0] || "08:00 AM", "snoozed", 30);
        setVoiceLogResponse(`Alright, I rescheduled the next reminder for ${firstMed.name} to tonight.`);
      } else {
        setVoiceLogResponse("No medications active to reschedule.");
      }
    } 
    else if (cmd.includes("skip today") || cmd.includes("skip dose")) {
      const firstMed = medications[0];
      if (firstMed) {
        handleMedicationStatus(firstMed.id, firstMed.reminderTimes[0] || "08:00 AM", "skipped");
        setVoiceLogResponse(`Marked ${firstMed.name} as skipped for today.`);
      } else {
        setVoiceLogResponse("No active medications to skip.");
      }
    } 
    else if (cmd.includes("show today's medicines") || cmd.includes("show medicines")) {
      setCalendarSelectedDate("2026-06-25");
      setVoiceLogResponse("Displaying your current medication list for today, June 25, 2026.");
      speakText("Here is your medication schedule for today.");
    } 
    else if (cmd.includes("read today") || cmd.includes("read schedule") || cmd.includes("read list")) {
      const medListText = medications
        .map(m => `${m.name}, ${m.dosage} scheduled at ${m.reminderTimes.join(" and ")}.`)
        .join(" ");
      const speech = `Your medication routine for today includes: ${medListText || "No medications scheduled."}`;
      setVoiceLogResponse(speech);
      speakText(speech);
    } 
    else {
      setVoiceLogResponse(`Command received: "${commandText}". Try saying 'Add medicine', 'I took my medicine', or 'Read today\'s medication schedule'.`);
    }
  };

  return (
    <div className={`p-4 sm:p-6 lg:p-8 space-y-6 ${highContrastEnabled ? "bg-white border-2 border-black" : "bg-gray-50/50"} ${largeTextEnabled ? "text-lg" : "text-sm"}`} id="medicine-planner-container">
      
      {/* Smart Actionable Floating Simulated Notification Center */}
      <AnimatePresence>
        {simulatedNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-indigo-150 p-4 z-50 overflow-hidden font-sans"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Bell size={18} className="animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">💊 Time for medication</h4>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{simulatedNotification.medication.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Take {simulatedNotification.medication.dosage} ({simulatedNotification.medication.strength || "Standard strength"}) 
                  {simulatedNotification.medication.foodPreference !== "none" ? ` ${simulatedNotification.medication.foodPreference} food.` : "."}
                </p>
                <div className="flex gap-2 mt-3.5">
                  <button
                    onClick={() => handleMedicationStatus(simulatedNotification.medication.id, simulatedNotification.timeScheduled, "taken")}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
                  >
                    Taken
                  </button>
                  <button
                    onClick={() => openSnoozeDialog(simulatedNotification.medication.id, simulatedNotification.timeScheduled)}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
                  >
                    Snooze
                  </button>
                  <button
                    onClick={() => handleMedicationStatus(simulatedNotification.medication.id, simulatedNotification.timeScheduled, "skipped")}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-mono text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
                  >
                    Skip
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setSimulatedNotification(null)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider">
              Clinical Grade
            </span>
            {travelModeActive && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                ✈️ Travel local-time
              </span>
            )}
          </div>
          <h1 className="text-2xl font-display font-black text-gray-900 tracking-tight mt-1 flex items-center gap-2">
            AI Medicine & Health Routines
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Your personal, offline-first clinical assistant & schedule synchronizer.
          </p>
        </div>

        {/* Action Controls & Preset seed buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-indigo-100 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={14} /> Add Medicine
          </button>
          
          <button
            onClick={() => setTravelModeActive(!travelModeActive)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              travelModeActive 
                ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
            }`}
          >
            ✈️ Travel Mode
          </button>

          <button
            onClick={() => setIsPinSetupOpen(true)}
            className={`p-2.5 rounded-xl border bg-white border-gray-200 hover:bg-gray-50 text-gray-600 transition-all cursor-pointer`}
            title="Privacy Security Lock"
          >
            <Lock size={15} />
          </button>

          <button
            onClick={() => {
              // Trigger simulated medication warning for testing
              if (medications.length > 0) {
                handleTriggerSimulatedNotification(medications[0], medications[0].reminderTimes[0] || "08:00 AM");
              } else {
                triggerToast("Add a medication first to trigger notification demo!", "info");
              }
            }}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 bg-white cursor-pointer"
            title="Simulate Active Notification Alarm"
          >
            <Bell size={15} className="animate-pulse" />
          </button>
        </div>
      </div>

      {/* PIN LOCK SCREEN SIMULATOR OVERLAY */}
      {isPinLockEnabled && isPlannerLocked && (
        <div className="fixed inset-0 bg-slate-900/98 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-6 shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Lock size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide font-mono">Medicine Routine Locked</h3>
              <p className="text-xs text-gray-500">
                Please enter your 4-digit PIN access key to view medical schedules.
              </p>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setPinInput(val);
                  if (val === plannerPin) {
                    setIsPlannerLocked(false);
                    setPinInput("");
                    triggerToast("Planner unlocked", "success");
                  }
                }}
                placeholder="••••"
                className="w-32 text-center text-2xl font-mono border-b-2 border-gray-300 focus:border-indigo-500 outline-none tracking-widest py-1 mx-auto"
              />
              <p className="text-[10px] text-gray-400 font-mono">
                Hint: Type <span className="font-bold text-indigo-600">{plannerPin}</span> for demo testing
              </p>
            </div>
            <button
              onClick={() => {
                setIsPlannerLocked(false);
                setIsPinLockEnabled(false);
                triggerToast("Temporary bypassed lock", "info");
              }}
              className="text-xs font-mono text-gray-400 hover:text-gray-600 block mx-auto underline cursor-pointer"
            >
              Disable Security Lock Screen
            </button>
          </div>
        </div>
      )}

      {/* TRAVEL MODE TIMEZONE ADVICE PROMPT */}
      {travelModeActive && !travelLocalTimeConfirmed && (
        <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex gap-3">
            <span className="text-2xl">✈️</span>
            <div>
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Timezone Synchronization</h4>
              <p className="text-xs text-emerald-700 mt-1">
                You're travelling tomorrow. Would you like your medication scheduled reminders to follow your destination's local time?
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setTravelLocalTimeConfirmed(true);
                triggerToast("Times adjusted to destination timezone automatically", "success");
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer"
            >
              Yes, Adjust Times
            </button>
            <button
              onClick={() => {
                setTravelLocalTimeConfirmed(true);
                triggerToast("Times kept at your current home timezone", "info");
              }}
              className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-mono font-bold uppercase hover:bg-emerald-100/50 cursor-pointer"
            >
              Keep Home Time
            </button>
          </div>
        </div>
      )}

      {medications.length === 0 ? (
        <div className="max-w-3xl mx-auto py-12 px-4 text-center space-y-8 bg-white border border-gray-150 rounded-3xl shadow-sm" id="empty-medications-state">
          <div className="text-7xl animate-bounce">💊</div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-gray-950 font-display">No Medications Added Yet</h2>
            <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed font-sans">
              Stay on top of your health by creating a personalized medication schedule. 
              Your AI Chief of Staff will remind you at the right time and help you stay consistent.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <button
              onClick={() => {
                setEditingMedicationId(null);
                setIsAddModalOpen(true);
              }}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 font-mono"
            >
              ➕ Add Medicine
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 font-mono"
            >
              📥 Import Schedule
            </button>
          </div>

          <div>
            <button 
              onClick={() => setIsLearnModalOpen(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer underline transition-colors font-mono"
            >
              Learn How It Works
            </button>
          </div>

          <div className="pt-6 border-t border-gray-100 max-w-md mx-auto">
            <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 text-xs text-gray-500 font-mono flex items-center gap-3">
              <span className="text-lg">📊</span>
              <p className="text-left leading-normal">
                Your medication insights will appear after you add your first medicine.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* BENTO DASHBOARD WIDGETS */}
          {medications.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="medicine-bento-dashboard">
          
          {/* 1. UPCOMING DOSE CARD */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Upcoming Dose</span>
              <span className="p-1.5 rounded-lg bg-slate-800 text-indigo-400">
                <Clock size={15} />
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold font-display tracking-tight text-white">
                {medications.length > 0 ? medications[1]?.name || medications[0]?.name : "None Scheduled"}
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Dose: <span className="text-indigo-300 font-semibold">{medications.length > 0 ? medications[1]?.dosage || medications[0]?.dosage : "N/A"}</span>
              </p>
              <p className="text-[10px] text-gray-400 font-mono mt-1">
                Scheduled: <span className="text-white font-bold">{medications.length > 0 ? medications[1]?.reminderTimes[0] || medications[0]?.reminderTimes[0] : "08:00 AM"}</span>
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Next alarm in:</span>
              <span className="text-emerald-400 font-black">~ 24 minutes</span>
            </div>
          </div>

          {/* 2. ADHERENCE RATE CARD */}
          <div className="bg-white rounded-2xl p-5 border border-gray-150 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">Medicine Adherence</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Activity size={15} />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black font-mono text-gray-900">{calculateAdherenceRate()}%</h3>
              <span className="text-xs font-mono font-bold text-emerald-600">Excellent</span>
            </div>
            <div className="space-y-1">
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all" 
                  style={{ width: `${calculateAdherenceRate()}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span>Weekly Completion</span>
                <span>100% target</span>
              </div>
            </div>
          </div>

          {/* 3. CURRENT STREAK CARD */}
          <div className="bg-white rounded-2xl p-5 border border-gray-150 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">Streak Count</span>
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-500 text-xs font-bold">🔥</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black font-mono text-gray-900">{calculateStreak()} Days</h3>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Longest streak: <strong className="text-gray-800">14 Days</strong>
              </p>
            </div>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span>Streak health:</span>
              <span className="text-amber-500 font-bold uppercase">Consistency High</span>
            </div>
          </div>

          {/* 4. MISSED DOSES ALERT WIDGET */}
          <div className={`rounded-2xl p-5 border flex flex-col justify-between space-y-3 transition-colors ${
            getMissedDosesCount() > 0 
              ? "bg-red-50 border-red-200 text-red-900" 
              : "bg-white border-gray-150 text-gray-900"
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                getMissedDosesCount() > 0 ? "text-red-700" : "text-gray-500"
              }`}>
                Missed Medicines
              </span>
              <span className={`p-1.5 rounded-lg ${
                getMissedDosesCount() > 0 ? "bg-red-100 text-red-600" : "bg-gray-50 text-gray-400"
              }`}>
                <ShieldAlert size={15} />
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-black font-mono">
                {getMissedDosesCount()} Today
              </h3>
              <p className="text-[10px] mt-1 font-sans leading-relaxed text-gray-500">
                {getMissedDosesCount() > 0 ? (
                  <span className="font-bold text-red-700">
                    ⚠️ Action required. Tap to check missed doses below.
                  </span>
                ) : (
                  "You're perfectly on track today!"
                )}
              </p>
            </div>
            <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest pt-1 border-t border-gray-100">
              {getMissedDosesCount() > 0 ? "Check clinical rules" : "Fully synchronized"}
            </div>
          </div>

        </div>
      )}

      {/* SMART AI INSIGHTS & REMINDER BUBBLE */}
      {medications.length > 0 && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles size={14} className="animate-spin" />
            </div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide font-mono">AI Health Assistant</h3>
          </div>

          {/* Adaptive Context Prompt */}
          <div className="space-y-3">
            <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-950 leading-relaxed">
                &ldquo;Good morning! It is time to take your <strong className="text-indigo-600">Vitamin D3 tablet</strong>. 
                Take it after breakfast with water to optimize absorption. Your next dose of Omega-3 is scheduled at <strong className="text-indigo-600">08:00 PM</strong>.&rdquo;
              </p>
            </div>

            {/* AI Observation pattern card (if behavior patterns match) */}
            {showPatternSuggestion && (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-wide">🧠 AI Habit Observation</span>
                  <p className="text-amber-900 leading-relaxed font-sans">{patternSuggestionText}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAcceptScheduleAdjustment("Lisinopril", "08:20 AM", "08:20 AM")}
                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer"
                  >
                    Adjust
                  </button>
                  <button
                    onClick={() => setShowPatternSuggestion(false)}
                    className="px-2.5 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-lg text-[10px] font-mono font-bold uppercase hover:bg-amber-100 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: TODAY'S MEDICINE AGENDA & TRACKER */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4">
            
            {/* Header with active calendar picker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-display">Medication Schedule Tracker</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  Viewing schedule for: <strong className="text-indigo-600 font-mono">{calendarSelectedDate}</strong>
                </p>
              </div>

              {/* Day selection controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const d = new Date(calendarSelectedDate);
                    d.setDate(d.getDate() - 1);
                    setCalendarSelectedDate(d.toISOString().split("T")[0]);
                  }}
                  className="p-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-600 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setCalendarSelectedDate("2026-06-25")}
                  className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-mono text-gray-700 cursor-pointer"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const d = new Date(calendarSelectedDate);
                    d.setDate(d.getDate() + 1);
                    setCalendarSelectedDate(d.toISOString().split("T")[0]);
                  }}
                  className="p-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-600 cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* List of Scheduled Medicines */}
            <div className="space-y-4">
              {medications.filter(m => !m.isArchived).length === 0 ? (
                <div className="text-center py-20 space-y-6">
                  <div className="text-6xl">💊</div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-gray-900">No Medications Added Yet</h4>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                      Stay on top of your health by creating a personalized medication schedule. 
                      Your AI Chief of Staff will remind you at the right time and help you stay consistent.
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      ➕ Add Medicine
                    </button>
                    <button
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      📥 Import Schedule
                    </button>
                  </div>
                  <button className="text-xs text-indigo-600 font-bold cursor-pointer underline">
                    Learn How It Works
                  </button>
                </div>
              ) : (
                medications
                  .filter(m => !m.isArchived)
                  .map(med => {
                    return (
                      <div 
                        key={med.id} 
                        className={`p-4 rounded-2xl border transition-all relative ${
                          med.isPaused ? "opacity-60 bg-slate-50/50" : ""
                        } ${
                          highContrastEnabled 
                            ? "border-2 border-black" 
                            : "border-gray-150 hover:shadow-md hover:border-indigo-100 bg-white"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          
                          {/* Info section */}
                          <div className="flex gap-3">
                            <span className="text-2xl pt-1">
                              {med.type === "tablet" ? "💊" : med.type === "capsule" ? "💊" : med.type === "syrup" ? "🧪" : med.type === "injection" ? "💉" : "💧"}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-gray-900 font-display">{med.name}</h4>
                                {med.strength && (
                                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-mono">
                                    {med.strength}
                                  </span>
                                )}
                                {med.isPaused && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-mono font-bold uppercase border border-amber-100">
                                    Paused
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1 font-mono">
                                Dose: <strong className="text-gray-700">{med.dosage}</strong> 
                                {med.foodPreference !== "none" && (
                                  <span className="text-indigo-600 ml-1">
                                    ({med.foodPreference} food)
                                  </span>
                                )}
                              </p>
                              {med.purpose && (
                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                  Purpose: {med.purpose}
                                </p>
                              )}
                              {med.doctorName && (
                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                                  Doctor: <span className="font-semibold">{med.doctorName}</span>
                                </p>
                              )}

                              {/* Refill status bar */}
                              {med.remainingQuantity !== undefined && (
                                <div className="mt-2.5 flex items-center gap-2">
                                  <div className="w-20 bg-gray-100 h-1 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${med.remainingQuantity <= 5 ? "bg-red-500" : "bg-emerald-500"}`}
                                      style={{ width: `${(med.remainingQuantity / (med.totalQuantity || 60)) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono text-gray-500">
                                    {med.remainingQuantity} / {med.totalQuantity} Left
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Interactive Scheduled times control row */}
                          <div className="space-y-2">
                            <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest block text-left sm:text-right">
                              Reminders
                            </span>
                            <div className="flex flex-wrap gap-2.5">
                              {med.reminderTimes.map(timeStr => {
                                // Find if a log already exists for this date and time
                                const log = logs.find(l => l.medicationId === med.id && l.doseTimeScheduled === timeStr && l.dateString === calendarSelectedDate);
                                
                                return (
                                  <div key={timeStr} className="flex flex-col items-center gap-1.5 bg-gray-50 p-2 rounded-xl border border-gray-150">
                                    <div className="flex items-center gap-1">
                                      <Clock size={11} className="text-gray-400" />
                                      <span className="text-[10px] font-mono font-bold text-gray-600">{timeStr}</span>
                                    </div>

                                    {/* Action buttons or logged state */}
                                    {log ? (
                                      <div className={`px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide flex items-center gap-1 ${
                                        log.status === "taken" 
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                          : log.status === "skipped" 
                                          ? "bg-amber-50 text-amber-700 border border-amber-100" 
                                          : "bg-red-50 text-red-700 border border-red-100"
                                      }`}>
                                        <Check size={10} /> {log.status}
                                      </div>
                                    ) : (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleMedicationStatus(med.id, timeStr, "taken")}
                                          className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[9px] font-mono font-bold uppercase cursor-pointer"
                                          title="Mark Taken"
                                          disabled={med.isPaused}
                                        >
                                          <Check size={11} />
                                        </button>
                                        <button
                                          onClick={() => openSnoozeDialog(med.id, timeStr)}
                                          className="px-1.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
                                          title="Snooze Reminder"
                                          disabled={med.isPaused}
                                        >
                                          Snooze
                                        </button>
                                        <button
                                          onClick={() => handleMedicationStatus(med.id, timeStr, "skipped")}
                                          className="p-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
                                          title="Skip Dose"
                                          disabled={med.isPaused}
                                        >
                                          <X size={11} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>

                        {/* Complete Actions Toolbar */}
                        <div className="mt-4 pt-3 border-t border-gray-150 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              onClick={() => handleEditMedication(med)}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold cursor-pointer transition-all"
                              title="Edit Details"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleTogglePauseMedication(med.id)}
                              className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                                med.isPaused 
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100" 
                                  : "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100"
                              }`}
                              title={med.isPaused ? "Resume Reminders" : "Pause Reminders"}
                            >
                              {med.isPaused ? "▶️ Resume" : "⏸️ Pause"}
                            </button>
                            <button
                              onClick={() => handleDuplicateMedication(med)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold cursor-pointer transition-all border border-indigo-100"
                              title="Duplicate Medication"
                            >
                              👥 Clone
                            </button>
                            <button
                              onClick={() => handleArchiveMedication(med.id)}
                              className="px-2 py-1 bg-gray-50 hover:bg-gray-150 text-gray-600 rounded-lg font-bold cursor-pointer transition-all border border-gray-200"
                              title="Archive out of view"
                            >
                              📦 Archive
                            </button>
                            <button
                              onClick={() => handleExportSingleMedication(med)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold cursor-pointer transition-all border border-blue-100"
                              title="Export Single Schedule"
                            >
                              📥 Export JSON
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteMedication(med.id)}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold cursor-pointer transition-all border border-red-100"
                            title="Delete Permanently"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

          </div>

          {/* MEDICAL MISSED DOSES WARNING BOX (DO NOT GIVE MEDICAL ADVICE REQUIREMENT) */}
          {getMissedDosesCount() > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-red-800 font-bold text-xs font-mono uppercase tracking-wider">
                <AlertCircle size={14} />
                Medical Routine Safety Notice
              </div>
              <p className="text-xs text-red-900 leading-relaxed font-sans">
                &ldquo;You missed your scheduled reminder. If you're unsure whether to take this dose now, consult the instructions provided with your medication or your healthcare professional.&rdquo;
              </p>
              <p className="text-[10px] text-red-600 font-mono">
                This planner is purely an offline tracking assistant and does not constitute certified medical treatment guidance.
              </p>
            </div>
          )}

          {/* INTERACTIVE SWIPING DEVICE SIMULATOR EXPERIENCE */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-display">Mobile Touch Gesture Simulator</h3>
              <p className="text-xs text-gray-500 font-mono">
                Drag or toggle arrows to simulate high-precision touch gestures for smartphone users.
              </p>
            </div>

            <div className="border border-gray-100 bg-slate-50/50 rounded-2xl p-4 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-full max-w-xs bg-white rounded-2xl border border-gray-150 p-4 shadow-sm overflow-hidden h-20 flex items-center justify-between select-none">
                
                {/* Swipe guides */}
                <div className="absolute inset-y-0 left-0 bg-amber-500 text-white w-20 flex items-center justify-center text-[10px] font-mono font-bold uppercase transition-opacity">
                  Snooze
                </div>
                <div className="absolute inset-y-0 right-0 bg-emerald-500 text-white w-20 flex items-center justify-center text-[10px] font-mono font-bold uppercase transition-opacity">
                  Taken
                </div>

                {/* Sliding inner card */}
                <div 
                  className="absolute inset-0 bg-white px-4 flex items-center justify-between border-x border-gray-100 transition-transform duration-300"
                  style={{ transform: `translateX(${swipeOffset}px)` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💊</span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Vitamin D3</h4>
                      <p className="text-[10px] text-gray-400 font-mono">Swipe right to take, left to snooze</p>
                    </div>
                  </div>
                  <Smartphone size={16} className="text-gray-400 animate-pulse" />
                </div>

              </div>

              {/* Gesture Controls */}
              <div className="flex gap-2">
                <button
                  onMouseDown={() => setSwipeOffset(-100)}
                  onMouseUp={() => {
                    setTimeout(() => setSwipeOffset(0), 1000);
                    if (medications.length > 0) handleMedicationStatus(medications[0].id, medications[0].reminderTimes[0] || "08:00 AM", "snoozed", 10);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer"
                >
                  ◀ Swipe Left (Snooze)
                </button>
                <button
                  onMouseDown={() => setSwipeOffset(100)}
                  onMouseUp={() => {
                    setTimeout(() => setSwipeOffset(0), 1000);
                    if (medications.length > 0) handleMedicationStatus(medications[0].id, medications[0].reminderTimes[0] || "08:00 AM", "taken");
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer"
                >
                  Swipe Right (Taken) ▶
                </button>
                <button
                  onClick={() => {
                    if (medications.length > 0) {
                      setLongPressedMed(medications[0]);
                    } else {
                      triggerToast("No medications available", "warning");
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer"
                >
                  [Long Press] Details
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CALENDAR INTEGRATION & VOICE ASSISTANT */}
        <div className="space-y-6">
          
          {/* 1. CALENDAR INTEGRATION */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900 font-display">Medication Calendar</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-gray-400">June 2026</span>
            </div>

            {/* Mini month header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-mono text-gray-400 uppercase font-bold tracking-widest pb-1 border-b border-gray-100">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Monthly Calendar Grid Cells */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>

            <p className="text-[10px] text-gray-400 text-center font-mono italic leading-normal">
              Green dot = Fully Taken, Red dot = Missed medication, Indigo = Pending schedule.
            </p>
          </div>

          {/* 2. VOICE COMPANION PLAYGROUND */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic size={16} className="text-indigo-600 animate-pulse" />
                <h3 className="text-sm font-bold text-gray-900 font-display">Voice Routine Assistant</h3>
              </div>
              <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">Simulator</span>
            </div>

            <p className="text-xs text-gray-500 font-mono">
              Test hands-free accessibility commands by selecting or typing one below:
            </p>

            {/* Action quick-prompts */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "Add medicine",
                "I took my medicine",
                "Skip today's dose",
                "Show today's medicines",
                "Read today's medication schedule"
              ].map(cmdStr => (
                <button
                  key={cmdStr}
                  onClick={() => handleVoiceCommandSubmit(cmdStr)}
                  className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-[10px] font-mono transition-colors text-left cursor-pointer"
                >
                  🎤 "{cmdStr}"
                </button>
              ))}
            </div>

            {/* Console Response Output */}
            {voiceLogResponse && (
              <div className="p-3 bg-slate-900 text-white rounded-xl font-mono text-[11px] space-y-1">
                <p className="text-gray-400">&gt; Voice Input: "{activeVoiceCommand}"</p>
                <p className="text-emerald-400 leading-relaxed">{voiceLogResponse}</p>
              </div>
            )}
          </div>

          {/* 3. EMERGENCY medical ID SECTION (EDITABLE BY USER) */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-500" />
                <h3 className="text-sm font-bold text-gray-900 font-display">Emergency Medical ID</h3>
              </div>
              <button
                onClick={() => setIsEditingEmergency(!isEditingEmergency)}
                className="text-xs font-mono text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer"
              >
                {isEditingEmergency ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {isEditingEmergency ? (
              <form onSubmit={handleUpdateEmergencyInfo} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block font-mono">Medical ID Number</label>
                  <input
                    type="text"
                    value={emergencyInfo.medicalId}
                    onChange={(e) => setEmergencyInfo({ ...emergencyInfo, medicalId: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-mono outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block font-mono">Primary Doctor</label>
                    <input
                      type="text"
                      value={emergencyInfo.doctorName}
                      onChange={(e) => setEmergencyInfo({ ...emergencyInfo, doctorName: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block font-mono">Doctor Phone</label>
                    <input
                      type="text"
                      value={emergencyInfo.doctorPhone}
                      onChange={(e) => setEmergencyInfo({ ...emergencyInfo, doctorPhone: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-mono outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block font-mono">Emergency Contact</label>
                    <input
                      type="text"
                      value={emergencyInfo.contactName}
                      onChange={(e) => setEmergencyInfo({ ...emergencyInfo, contactName: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block font-mono">Contact Phone</label>
                    <input
                      type="text"
                      value={emergencyInfo.contactPhone}
                      onChange={(e) => setEmergencyInfo({ ...emergencyInfo, contactPhone: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-mono outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block font-mono">Medical Notes / Allergies</label>
                  <textarea
                    rows={2}
                    value={emergencyInfo.notes}
                    onChange={(e) => setEmergencyInfo({ ...emergencyInfo, notes: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Save Profile
                </button>
              </form>
            ) : (
              <div className="space-y-3.5">
                <div className="p-3 bg-red-50/50 rounded-2xl border border-red-100 flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-500">ID Access Code:</span>
                  <span className="font-bold text-red-700">{emergencyInfo.medicalId}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[9px] text-gray-400 block font-bold uppercase">Doctor</span>
                    <strong className="text-gray-800 block truncate">{emergencyInfo.doctorName}</strong>
                    <span className="text-[10px] text-gray-500 block mt-0.5">{emergencyInfo.doctorPhone}</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[9px] text-gray-400 block font-bold uppercase">Family Contact</span>
                    <strong className="text-gray-800 block truncate">{emergencyInfo.contactName}</strong>
                    <span className="text-[10px] text-gray-500 block mt-0.5">{emergencyInfo.contactPhone}</span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1">
                  <span className="text-[9px] text-gray-400 block font-bold uppercase font-mono">Active Allergies & Notes</span>
                  <p className="text-gray-700 leading-relaxed">{emergencyInfo.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* 4. PRIVACY & SECURITY DATA EXPORT */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-display">Privacy & Security Controls</h3>
              <p className="text-xs text-gray-500 font-mono">
                Your medical data is secured. You have absolute ownership & control.
              </p>
            </div>

            {/* Cloud sync disable toggle */}
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-600">Local Only (No Cloud Sync)</span>
              <button
                onClick={() => {
                  setIsCloudSyncDisabled(!isCloudSyncDisabled);
                  triggerToast(isCloudSyncDisabled ? "Cloud Sync enabled" : "Storing data purely in Local Storage", "info");
                }}
                className={`w-10 h-6 rounded-full p-1 transition-colors outline-none cursor-pointer ${
                  isCloudSyncDisabled ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isCloudSyncDisabled ? "translate-x-4" : ""}`} />
              </button>
            </div>

            {/* Export and Wipe buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportBackup}
                className="py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] font-mono font-bold uppercase rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download size={12} /> Export JSON
              </button>
              <button
                onClick={handleClearAllData}
                className="py-2.5 border border-red-200 hover:bg-red-50 text-red-600 text-[10px] font-mono font-bold uppercase rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={12} /> Wipe All
              </button>
            </div>
          </div>

          {/* ACCESSIBILITY UTILITY WIDGET */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 font-display flex items-center gap-2">
              <User size={15} />
              Accessibility Center
            </h3>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span>Large Text Size Mode</span>
                <input 
                  type="checkbox" 
                  checked={largeTextEnabled} 
                  onChange={(e) => setLargeTextEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>High Contrast Interface</span>
                <input 
                  type="checkbox" 
                  checked={highContrastEnabled} 
                  onChange={(e) => setHighContrastEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Speech Reading Voice</span>
                <input 
                  type="checkbox" 
                  checked={voiceReadingEnabled} 
                  onChange={(e) => setVoiceReadingEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

        </div>

      </div>
      </>
      )}

      {/* --- ADD MEDICATION DIALOG MODAL --- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-gray-100"
            >
              
              {/* Header with Close */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 font-display uppercase tracking-wider">
                    {editingMedicationId ? "✏️ Edit Medication Routine" : "➕ Add Routine Medicine"}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {editingMedicationId ? "Update your dosage, doctor instructions, and alerts." : "Configure your dosage, schedule timers, and refill limits."}
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Main Setup Form */}
              <form onSubmit={handleAddNewMedication} className="space-y-4">
                
                {/* Row 1: Name and Strength */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block font-mono">Medicine Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Lipitor, Ventolin" 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:bg-white outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block font-mono">Strength (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 10 mg, 100 mcg" 
                      value={formStrength}
                      onChange={(e) => setFormStrength(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* Row 2: Type Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block font-mono">Medicine Form Type</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { id: "tablet", label: "Tablet", emoji: "💊" },
                      { id: "capsule", label: "Capsule", emoji: "💊" },
                      { id: "syrup", label: "Syrup", emoji: "🧪" },
                      { id: "injection", label: "Inject", emoji: "💉" },
                      { id: "drops", label: "Drops", emoji: "💧" },
                      { id: "inhaler", label: "Inhaler", emoji: "🌬️" },
                    ].map(typeObj => (
                      <button
                        key={typeObj.id}
                        type="button"
                        onClick={() => {
                          setFormType(typeObj.id as Medication["type"]);
                          if (typeObj.id === "syrup") setFormDosage("5 ml");
                          else if (typeObj.id === "capsule") setFormDosage("1 Capsule");
                          else setFormDosage("1 Tablet");
                        }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          formType === typeObj.id 
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold font-mono" 
                            : "border-gray-200 hover:bg-gray-50 text-gray-600"
                        }`}
                      >
                        <div className="text-lg">{typeObj.emoji}</div>
                        <div className="text-[9px] mt-0.5">{typeObj.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 3: Dosage and Purpose */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block font-mono">Dosage Quantity</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 1 Tablet, 5 ml, 2 Puffs" 
                      value={formDosage}
                      onChange={(e) => setFormDosage(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:bg-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block font-mono">Medical Purpose (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Blood Pressure, Antibiotic" 
                      value={formPurpose}
                      onChange={(e) => setFormPurpose(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* Doctor Name & Prescription Image Attachment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block font-mono">Doctor Name (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dr. Jane Smith" 
                      value={formDoctorName}
                      onChange={(e) => setFormDoctorName(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:bg-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block font-mono">Prescription Scan (Optional)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        id="prescription-upload-modal-input"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormPrescriptionImage(reader.result as string);
                              triggerToast("Prescription image loaded successfully!", "info");
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <label 
                        htmlFor="prescription-upload-modal-input"
                        className="flex-1 p-2 border border-dashed border-gray-300 rounded-xl bg-gray-50 text-center text-xs text-gray-600 hover:bg-gray-100 cursor-pointer transition-all"
                      >
                        {formPrescriptionImage ? "📸 Uploaded" : "📁 Choose Photo"}
                      </label>
                      {formPrescriptionImage && (
                        <button
                          type="button"
                          onClick={() => setFormPrescriptionImage(null)}
                          className="px-2 py-1 text-[10px] text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-mono font-bold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Start Date & End Date Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block font-mono">Start Date</label>
                    <input 
                      type="date" 
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:bg-white outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block font-mono">End Date (Optional)</label>
                    <input 
                      type="date" 
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:bg-white outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Custom Alarm Sound & Voice Reminder Option */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-150 p-3 rounded-xl bg-slate-50/40">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block font-mono">Reminder Alarm Sound</label>
                    <select
                      value={formReminderSound}
                      onChange={(e) => setFormReminderSound(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-xs focus:bg-white outline-none cursor-pointer font-mono"
                    >
                      <option value="chime">🔔 Gentle Chime</option>
                      <option value="beep">⚡ Digital Beep</option>
                      <option value="bell">🛎️ Service Bell</option>
                      <option value="harp">🎵 Classic Harp</option>
                      <option value="none">🔇 Mute / None</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-xl mt-4 sm:mt-5">
                    <span className="text-[11px] font-mono font-bold text-gray-600">Voice Reminder Speech</span>
                    <input
                      type="checkbox"
                      checked={formVoiceReminder}
                      onChange={(e) => setFormVoiceReminder(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Row 4: Food Preference & Schedule selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block font-mono">Food Preference</label>
                    <select
                      value={formFoodPref}
                      onChange={(e) => setFormFoodPref(e.target.value as Medication["foodPreference"])}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:bg-white outline-none cursor-pointer"
                    >
                      <option value="none">No Preference</option>
                      <option value="before">Before Food</option>
                      <option value="after">After Food</option>
                      <option value="with">With Food</option>
                      <option value="empty">Empty Stomach</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block font-mono">Schedule Frequency</label>
                    <select
                      value={formScheduleType}
                      onChange={(e) => setFormScheduleType(e.target.value as Medication["scheduleType"])}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:bg-white outline-none cursor-pointer"
                    >
                      <option value="once">Once Daily</option>
                      <option value="twice">Twice Daily</option>
                      <option value="three">Three Times Daily</option>
                      <option value="specific_days">Specific Days</option>
                      <option value="weekly">Weekly</option>
                      <option value="as_needed">As Needed / PRN</option>
                    </select>
                  </div>
                </div>

                {/* Reminder Times Setup Row */}
                <div className="space-y-2 border border-gray-150 p-3.5 rounded-xl bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Configure Alarm Reminders</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={newTimeInput}
                        onChange={(e) => setNewTimeInput(e.target.value)}
                        className="p-1 border border-gray-200 rounded text-xs bg-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={addFormReminderTime}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-mono uppercase font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {formReminderTimes.map(timeStr => (
                      <span key={timeStr} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-mono text-gray-700 flex items-center gap-1">
                        {timeStr}
                        <button 
                          type="button" 
                          onClick={() => removeFormReminderTime(timeStr)}
                          className="text-gray-400 hover:text-red-500 text-[9px] font-black"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Refill Track Option Card */}
                <div className="space-y-3.5 border border-gray-150 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-gray-700">Track Remaining Pill Quantity</span>
                    <input
                      type="checkbox"
                      checked={trackRefillEnabled}
                      onChange={(e) => setTrackRefillEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 cursor-pointer"
                    />
                  </div>

                  {trackRefillEnabled && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-400 block font-mono font-bold uppercase">Total Pack Qty</label>
                        <input
                          type="number"
                          value={formTotalQty}
                          onChange={(e) => setFormTotalQty(parseInt(e.target.value) || 60)}
                          className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-mono outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-400 block font-mono font-bold uppercase">Remaining Left</label>
                        <input
                          type="number"
                          value={formRemainingQty}
                          onChange={(e) => setFormRemainingQty(parseInt(e.target.value) || 60)}
                          className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-mono outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-400 block font-mono font-bold uppercase">Refill Alert Limit</label>
                        <input
                          type="number"
                          value={formRefillThreshold}
                          onChange={(e) => setFormRefillThreshold(parseInt(e.target.value) || 5)}
                          className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-mono outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold uppercase rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Save Routine
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SNOOZE ACTION TIMER MODAL --- */}
      <AnimatePresence>
        {isSnoozeModalOpen && selectedMedForSnooze && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-gray-150"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <Clock size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-900 font-display">Reschedule Dose Reminder</h4>
                <p className="text-xs text-gray-500 font-mono">
                  Select a duration. AI Assistant will automatically notify you later today.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[10, 30, 60, 120].map(mins => (
                  <button
                    key={mins}
                    onClick={() => {
                      handleMedicationStatus(selectedMedForSnooze.medId, selectedMedForSnooze.timeScheduled, "snoozed", mins);
                      setIsSnoozeModalOpen(false);
                      setSelectedMedForSnooze(null);
                    }}
                    className="py-2.5 bg-gray-50 hover:bg-amber-50 hover:text-amber-900 border border-gray-200 hover:border-amber-200 text-gray-700 text-xs font-mono rounded-xl transition-all cursor-pointer"
                  >
                    {mins >= 60 ? `${mins / 60} Hour` : `${mins} Minutes`}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setIsSnoozeModalOpen(false);
                  setSelectedMedForSnooze(null);
                }}
                className="w-full py-2 text-xs font-mono text-gray-400 hover:text-gray-600 uppercase"
              >
                Cancel Snooze
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PIN CREATION SETUP MODAL --- */}
      <AnimatePresence>
        {isPinSetupOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-gray-150">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Lock size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-900 font-display">Privacy Lock Screen PIN</h4>
                <p className="text-xs text-gray-500">
                  Protect sensitive medicine lists. Set a 4-digit security code.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span>Enable Password Lock</span>
                  <input
                    type="checkbox"
                    checked={isPinLockEnabled}
                    onChange={(e) => {
                      setIsPinLockEnabled(e.target.checked);
                      localStorage.setItem("saver_pin_lock_enabled", String(e.target.checked));
                      triggerToast(e.target.checked ? "Security lock activated!" : "Security lock disabled", "info");
                    }}
                    className="rounded border-gray-300 text-indigo-600 cursor-pointer"
                  />
                </div>

                {isPinLockEnabled && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider font-mono">Change 4-Digit PIN</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 1234"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-center text-sm font-mono tracking-widest outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsPinSetupOpen(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
                {isPinLockEnabled && (
                  <button
                    onClick={() => {
                      if (newPinInput.length !== 4) {
                        triggerToast("PIN must be exactly 4 digits", "error");
                        return;
                      }
                      setPlannerPin(newPinInput);
                      localStorage.setItem("saver_planner_pin", newPinInput);
                      setIsPinSetupOpen(false);
                      triggerToast("PIN passcode changed successfully!", "success");
                    }}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Save PIN
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- LONG PRESS DETAILS MODAL --- */}
      <AnimatePresence>
        {longPressedMed && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-gray-150">
              <div className="text-3xl">💊</div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-900 font-display">{longPressedMed.name}</h4>
                <p className="text-xs text-gray-500 font-mono">Active Prescription Dossier</p>
              </div>

              <div className="text-left text-xs font-mono space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-400">Form Type:</span>
                  <span className="font-bold uppercase">{longPressedMed.type}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-400">Strength:</span>
                  <span className="font-bold">{longPressedMed.strength || "Standard"}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-400">Dosage:</span>
                  <span className="font-bold">{longPressedMed.dosage}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-400">Schedule:</span>
                  <span className="font-bold uppercase">{longPressedMed.scheduleType}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-400">Food Restriction:</span>
                  <span className="font-bold uppercase text-indigo-600">{longPressedMed.foodPreference}</span>
                </div>
                {longPressedMed.remainingQuantity !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Remaining pills:</span>
                    <span className="font-bold">{longPressedMed.remainingQuantity} left</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setLongPressedMed(null)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- IMPORT MEDICINE SCHEDULE DIALOG MODAL --- */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 font-display uppercase tracking-wider">📥 Import Medication Schedule</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">Import your health routine from multiple formats securely.</p>
                </div>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Method 1: CSV Text Import */}
                <div className="space-y-2 border border-gray-150 p-3.5 rounded-xl bg-slate-50/50">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Option 1: Paste CSV Schedule Row</label>
                  <p className="text-[10px] text-gray-400 font-mono leading-normal">
                    Format: <code className="bg-white px-1 py-0.5 border border-gray-200 text-indigo-600 rounded">Name, Strength, Type, Dosage, Frequency</code><br/>
                    Example: <code className="bg-white px-1 py-0.5 border border-gray-200 text-gray-600 rounded">Aspirin, 81 mg, tablet, 1 Tablet, once</code>
                  </p>
                  <textarea 
                    placeholder="PillName, Strength, FormType, DoseQty, Frequency"
                    id="import-csv-textarea"
                    rows={2}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const textVal = (document.getElementById("import-csv-textarea") as HTMLTextAreaElement)?.value || "";
                      if (!textVal.trim()) {
                        triggerToast("Please paste CSV data to import.", "error");
                        return;
                      }
                      try {
                        const lines = textVal.split("\n").filter(l => l.trim() !== "");
                        const parsedMeds: Medication[] = [];
                        lines.forEach(line => {
                          const parts = line.split(",").map(p => p.trim());
                          if (parts[0]) {
                            parsedMeds.push({
                              id: `med-${Date.now()}-${Math.random()}`,
                              name: parts[0],
                              strength: parts[1] || undefined,
                              type: (parts[2]?.toLowerCase() || "tablet") as Medication["type"],
                              dosage: parts[3] || "1 Tablet",
                              scheduleType: (parts[4]?.toLowerCase() || "once") as Medication["scheduleType"],
                              reminderTimes: ["08:00 AM"],
                              foodPreference: "none",
                              duration: "longterm",
                              createdAt: new Date().toISOString()
                            });
                          }
                        });
                        if (parsedMeds.length > 0) {
                          const updated = [...medications, ...parsedMeds];
                          setMedications(updated);
                          syncToStorage(updated, logs);
                          triggerToast(`Successfully imported ${parsedMeds.length} medications!`, "success");
                          setIsImportModalOpen(false);
                        } else {
                          triggerToast("No valid entries parsed from text.", "error");
                        }
                      } catch (err) {
                        triggerToast("Invalid CSV format. Please correct it.", "error");
                      }
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer"
                  >
                    Parse & Import Schedule
                  </button>
                </div>

                {/* Method 2: Document Drag & Drop */}
                <div className="space-y-2 border border-gray-150 p-3.5 rounded-xl bg-slate-50/50">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Option 2: Health Platform & Prescription Upload</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerToast("Connecting Apple Health securely...", "info");
                        setTimeout(() => triggerToast("Apple Health connected: No medications found.", "warning"), 1200);
                      }}
                      className="p-2.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-[10px] font-mono text-gray-700 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      🍎 Apple Health
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerToast("Connecting Google Health Connect...", "info");
                        setTimeout(() => triggerToast("Google Health: Connected successfully.", "success"), 1200);
                      }}
                      className="p-2.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-[10px] font-mono text-gray-700 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      🤖 Google Health
                    </button>
                  </div>
                  <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center bg-white hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <input 
                      type="file" 
                      accept=".csv,.pdf,image/*" 
                      id="prescription-file-uploader" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          triggerToast(`Scanning: ${file.name}...`, "info");
                          setTimeout(() => {
                            // Automatically mock parse standard medications
                            const scanned: Medication = {
                              id: `med-${Date.now()}`,
                              name: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
                              type: "tablet",
                              dosage: "1 Tablet",
                              scheduleType: "once",
                              reminderTimes: ["08:00 AM"],
                              foodPreference: "none",
                              duration: "longterm",
                              createdAt: new Date().toISOString()
                            };
                            const updated = [...medications, scanned];
                            setMedications(updated);
                            syncToStorage(updated, logs);
                            triggerToast(`Extracted ${scanned.name} schedule!`, "success");
                            setIsImportModalOpen(false);
                          }, 1500);
                        }
                      }}
                    />
                    <label htmlFor="prescription-file-uploader" className="cursor-pointer space-y-1 block">
                      <span className="text-xl block">📄</span>
                      <strong className="text-[11px] text-gray-700 block font-display">Choose prescription document</strong>
                      <span className="text-[9px] text-gray-400 block font-mono">Supports CSV, PDF, or Prescription Photo scans</span>
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer"
              >
                Close Window
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- LEARN HOW IT WORKS MODAL --- */}
      <AnimatePresence>
        {isLearnModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 font-display uppercase tracking-wider">🌸 How Your Chief of Staff Works</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">An elegant, automated assistant for managing your family's health.</p>
                </div>
                <button
                  onClick={() => setIsLearnModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-gray-600 font-mono">
                <div className="space-y-1.5 p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                  <strong className="text-indigo-900 block font-display">🔒 Local-First Absolute Privacy</strong>
                  <p className="text-[11px] text-indigo-950 leading-normal">
                    Your medical history is extremely private. All schedule records are saved locally or on your private Firestore. You can toggle offline-only mode anytime.
                  </p>
                </div>

                <div className="space-y-1.5 p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-xl">
                  <strong className="text-emerald-900 block font-display">⏰ Smart Alarm Reminders</strong>
                  <p className="text-[11px] text-emerald-950 leading-normal">
                    Whenever it is time to take a medicine, your Chief of Staff fires customizable audio sound reminders (Chime, Beep, Harp) and reads voice-synthesized alerts.
                  </p>
                </div>

                <div className="space-y-1.5 p-3.5 bg-slate-50 border border-gray-150 rounded-xl">
                  <strong className="text-gray-900 block font-display">🔄 Refill Tracking & Analytics</strong>
                  <p className="text-[11px] text-gray-700 leading-normal">
                    The tracker automatically decrements remaining quantities each time you confirm a dose, letting you know when pack totals drop below your custom refill alert limits.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLearnModalOpen(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer"
              >
                Got It, Thank You!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Alert pop */}
      <AnimatePresence>
        {activeToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl text-xs font-mono shadow-xl border z-50 animate-fade-in flex items-center gap-2 ${
              activeToast.type === "error" 
                ? "bg-red-50 border-red-200 text-red-700" 
                : activeToast.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : activeToast.type === "info" 
                ? "bg-blue-50 border-blue-200 text-blue-700" 
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            <span>{activeToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
