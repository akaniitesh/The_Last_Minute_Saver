import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Settings, 
  Sun, 
  Moon, 
  Monitor, 
  Bell, 
  HelpCircle, 
  Shield, 
  Info, 
  LogOut, 
  X, 
  Check, 
  ShieldAlert, 
  Cpu, 
  Clock, 
  ChevronRight, 
  Heart 
} from "lucide-react";

interface MobileAccountMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  localProfileName: string;
  localAvatar: string;
  currentTheme: string;
  onUpdateTheme: (theme: string) => void;
  onOpenNotifications: () => void;
  onNavigateSettings: () => void;
  onLogout: () => Promise<void>;
}

export default function MobileAccountMenu({
  isOpen,
  onClose,
  user,
  localProfileName,
  localAvatar,
  currentTheme,
  onUpdateTheme,
  onOpenNotifications,
  onNavigateSettings,
  onLogout
}: MobileAccountMenuProps) {
  // State for sub-modals
  const [activeModal, setActiveModal] = useState<"profile" | "help" | "privacy" | "about" | "logout" | null>(null);
  
  // Ref for outside click detection on dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close menu on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeModal) {
          setActiveModal(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeModal, onClose]);

  // Handle click outside dropdown (tablet layout)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen && 
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        !activeModal // Don't close parent if sub-modal is open
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, activeModal, onClose]);

  if (!isOpen) return null;

  // Custom function to handle logout confirmation and execution
  const executeLogout = async () => {
    try {
      // Clear user-specific cached local data
      localStorage.removeItem("auth_guest_user");
      localStorage.removeItem("saver_tasks");
      localStorage.removeItem("saver_docs");
      localStorage.removeItem("saver_notifications");
      localStorage.removeItem("smart_map_saved_places");
      localStorage.removeItem("smart_map_recent_searches");
      localStorage.removeItem("saver_onboarding_complete");
      localStorage.removeItem("saver_first_upload_celebrated");
      localStorage.removeItem("saver_goal_progresses");
      localStorage.removeItem("saver_cooldowns");
      localStorage.removeItem("saver_acknowledged_warnings");
      localStorage.removeItem("saver_ignored_count");
      localStorage.removeItem("saver_closed_count");
      localStorage.removeItem("saver_completed_count");
      
      // Execute original auth logout
      await onLogout();
      setActiveModal(null);
      onClose();
    } catch (err) {
      console.error("Failed to complete full logout flow", err);
    }
  };

  const handleMenuClick = (action: () => void) => {
    action();
    // Close the primary menu/drawer if not opening a modal
  };

  const menuItems = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
      color: "text-blue-500 bg-blue-50/50 dark:bg-blue-900/20",
      action: () => setActiveModal("profile")
    },
    {
      id: "settings",
      label: "Account Settings",
      icon: Settings,
      color: "text-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20",
      action: () => {
        onNavigateSettings();
        onClose();
      }
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      color: "text-amber-500 bg-amber-50/50 dark:bg-amber-900/20",
      action: () => {
        onOpenNotifications();
        onClose();
      }
    },
    {
      id: "help",
      label: "Help & Support",
      icon: HelpCircle,
      color: "text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20",
      action: () => setActiveModal("help")
    },
    {
      id: "privacy",
      label: "Privacy Policy",
      icon: Shield,
      color: "text-purple-500 bg-purple-50/50 dark:bg-purple-900/20",
      action: () => setActiveModal("privacy")
    },
    {
      id: "about",
      label: "About Application",
      icon: Info,
      color: "text-pink-500 bg-pink-50/50 dark:bg-pink-900/20",
      action: () => setActiveModal("about")
    }
  ];

  return (
    <>
      {/* MOBILE ACCOUNT MENU PORTAL & OVERLAYS */}
      <AnimatePresence>
        {/* Gray Backdrop for mobile sliding sheet */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black z-45 sm:hidden cursor-pointer"
        />

        {/* 1. MOBILE BOTTOM SHEET (Viewport < 640px) */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-[2.5rem] border-t border-neutral-200 dark:border-neutral-800 shadow-[0_-10px_30px_rgba(0,0,0,0.12)] z-50 p-6 flex flex-col sm:hidden max-h-[85vh] overflow-y-auto"
          id="mobile-account-bottom-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-profile-title"
        >
          {/* Drag Handle Indicator */}
          <div className="w-12 h-1 bg-gray-200 dark:bg-neutral-800 rounded-full mx-auto mb-4 shrink-0" />

          {/* User Header Details */}
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            {localAvatar ? (
              <img 
                src={localAvatar} 
                alt="Profile avatar" 
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full border border-neutral-200 dark:border-neutral-800 object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-neutral-900 dark:bg-neutral-800 text-white flex items-center justify-center text-xl font-mono font-bold uppercase shrink-0">
                {(localProfileName || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">Active Agent Session</span>
              <h3 id="mobile-profile-title" className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {localProfileName}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5" title={user?.email || ""}>
                {user?.email || "guest@tasksync.local"}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-400 dark:text-neutral-500 transition-colors cursor-pointer shrink-0"
              aria-label="Close profile menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick inline theme picker inside mobile sheet */}
          <div className="mb-6 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-2">
              Preference Theme
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "Light", icon: Sun, label: "Light" },
                { id: "Dark", icon: Moon, label: "Dark" },
                { id: "System", icon: Monitor, label: "System" }
              ].map((themeOpt) => {
                const IconComp = themeOpt.icon;
                const isActive = currentTheme === themeOpt.id;
                return (
                  <button
                    key={`mobile-theme-${themeOpt.id}`}
                    onClick={() => onUpdateTheme(themeOpt.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      isActive 
                        ? "bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-900/50" 
                        : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <IconComp size={15} />
                    <span className="text-[10px]">{themeOpt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary menu items */}
          <div className="space-y-1 mb-6">
            {menuItems.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={`mobile-item-${item.id}`}
                  onClick={() => handleMenuClick(item.action)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-all text-left group cursor-pointer border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800/20"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${item.color}`}>
                      <IconComp size={16} />
                    </div>
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-neutral-300 dark:text-neutral-600 group-hover:translate-x-0.5 transition-transform" />
                </button>
              );
            })}
          </div>

          {/* Permanent Logout Row */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
            <button
              onClick={() => setActiveModal("logout")}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-2xl transition-all shadow-md shadow-red-600/10 cursor-pointer touch-manipulation min-h-[44px]"
            >
              <LogOut size={16} />
              <span>Sign Out of Account</span>
            </button>
          </div>
        </motion.div>

        {/* 2. TABLET DROPDOWN MENU (Viewport >= 640px, but below full desktop) */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            ref={dropdownRef}
            className="absolute right-0 top-12 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl z-45 p-5 hidden sm:flex flex-col font-sans"
            id="tablet-account-dropdown"
          >
            {/* Tablet Header */}
            <div className="flex items-center gap-3 pb-3 mb-3.5 border-b border-neutral-100 dark:border-neutral-800">
              {localAvatar ? (
                <img 
                  src={localAvatar} 
                  alt="Profile Avatar" 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-800 object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-800 text-white flex items-center justify-center text-xs font-mono font-bold uppercase shrink-0">
                  {(localProfileName || "U")[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">Tablet Interface</span>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {localProfileName}
                </h4>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate" title={user?.email || ""}>
                  {user?.email || "guest@tasksync.local"}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-full text-neutral-400 dark:text-neutral-500 cursor-pointer shrink-0"
                aria-label="Close menu"
              >
                <X size={14} />
              </button>
            </div>

            {/* Menu Options Grid (Tablet specific layout) */}
            <div className="grid grid-cols-2 gap-2 mb-3.5">
              {menuItems.map((item) => {
                const IconComp = item.icon;
                return (
                  <button
                    key={`tablet-item-${item.id}`}
                    onClick={() => handleMenuClick(item.action)}
                    className="flex flex-col items-start p-3 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/30 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-all text-left border border-neutral-100/50 dark:border-neutral-800/50 group cursor-pointer"
                  >
                    <div className={`p-1.5 rounded-lg mb-2 ${item.color}`}>
                      <IconComp size={14} />
                    </div>
                    <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tablet Theme Control */}
            <div className="mb-4 bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest pl-1">
                Theme
              </span>
              <div className="flex bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-xl border border-gray-200 dark:border-neutral-700 select-none">
                {[
                  { id: "Light", icon: Sun },
                  { id: "Dark", icon: Moon },
                  { id: "System", icon: Monitor }
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={`tablet-theme-${t.id}`}
                      onClick={() => onUpdateTheme(t.id)}
                      className={`p-1.5 rounded-lg text-xs cursor-pointer transition-all flex items-center justify-center ${
                        currentTheme === t.id 
                          ? "bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-xs" 
                          : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                      title={t.id}
                    >
                      <Icon size={12} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tablet Logout Footer */}
            <button
              onClick={() => setActiveModal("logout")}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-xl transition-all border border-red-100 dark:border-red-900/40 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUB-MODALS COMPONENT INJECTOR */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 flex items-center justify-center z-55 px-4">
            {/* Modal Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 bg-black/60 cursor-pointer"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.25 }}
              className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2.2rem] shadow-2xl border border-neutral-150 dark:border-neutral-800 p-6 z-60 text-left font-sans relative overflow-hidden"
              role="dialog"
              aria-modal="true"
            >
              {/* Close Button top-right */}
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-5 right-5 p-2 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 rounded-full transition-colors cursor-pointer"
                aria-label="Close modal dialog"
              >
                <X size={16} />
              </button>

              {/* 1. PROFILE DETAILS SPEC */}
              {activeModal === "profile" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-2xl">
                      <User size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">Active Profile</h3>
                      <p className="text-[10px] font-mono text-gray-400 dark:text-neutral-500 uppercase tracking-widest">User Credentials & Specs</p>
                    </div>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 space-y-3.5">
                    <div className="flex justify-between items-center py-1 border-b border-neutral-100 dark:border-neutral-800/50">
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold">User Handle</span>
                      <span className="text-xs font-bold text-neutral-800 dark:text-white">{localProfileName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-neutral-100 dark:border-neutral-800/50">
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold">Verified Address</span>
                      <span className="text-xs font-mono font-bold text-neutral-800 dark:text-white max-w-[200px] truncate" title={user?.email || "guest@tasksync.local"}>
                        {user?.email || "guest@tasksync.local"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-neutral-100 dark:border-neutral-800/50">
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold">Unique User ID</span>
                      <span className="text-[10px] font-mono text-neutral-800 dark:text-neutral-400 max-w-[180px] truncate" title={user?.uid || "guest-session"}>
                        {user?.uid || "guest-session-local"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold">Session Status</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Authenticated
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveModal(null);
                      onNavigateSettings();
                    }}
                    className="w-full py-3 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-md shadow-indigo-600/15 cursor-pointer"
                  >
                    Edit Profile Details in Settings
                  </button>
                </div>
              )}

              {/* 2. HELP & SUPPORT ACCORDION */}
              {activeModal === "help" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-2xl">
                      <HelpCircle size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">Help & Support</h3>
                      <p className="text-[10px] font-mono text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Frequently Asked Questions</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                    <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-100 dark:border-neutral-800">
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-white">📍 How does GPS Routing work?</h4>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        The Cockpit utilizes high-precision maps and route vectors. Tap a custom destination pin, choose your favorite travel mode, and start the GPS Simulation tracking.
                      </p>
                    </div>
                    <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-100 dark:border-neutral-800">
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-white">🕒 What is the Global AI Clock?</h4>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        It's a synchronized chronometer matching real-world ticks. The surrounding dial adjusts depending on your risk levels, deadline parameters, or focus timers.
                      </p>
                    </div>
                    <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-100 dark:border-neutral-800">
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-white">⚡ What is Emergency Rescue Mode?</h4>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        If deadlines build up, toggle Rescue Mode from the settings to instantly compress non-critical plans and activate high-priority focus trackers.
                      </p>
                    </div>
                  </div>

                  <div className="text-center pt-1.5">
                    <p className="text-[10px] text-neutral-400">Need direct human agent support?</p>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5 cursor-pointer">
                      support@tasksync.com
                    </p>
                  </div>
                </div>
              )}

              {/* 3. PRIVACY ACCORDION */}
              {activeModal === "privacy" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/30 text-purple-500 rounded-2xl">
                      <Shield size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">Privacy & Security</h3>
                      <p className="text-[10px] font-mono text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Your Data Controls & Trust</p>
                    </div>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 space-y-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 max-h-[220px] overflow-y-auto">
                    <p className="font-bold text-neutral-800 dark:text-white">1. Secure Local Storage</p>
                    <p>
                      Your active tasks, uploaded documents, scanned images, and scheduled reminders remain stored within your personal sandboxed browser context. They are only synced with secure Firestore nodes upon active user authorization.
                    </p>
                    <p className="font-bold text-neutral-800 dark:text-white">2. Third-Party Credentials</p>
                    <p>
                      Authentication tokens (Google, GitHub, Microsoft) are signed using official Firebase Auth workflows and are never exposed. Logging out completely purges all active session identifiers.
                    </p>
                    <p className="font-bold text-neutral-800 dark:text-white">3. Analytics & Geolocation</p>
                    <p>
                      We do not sell, track, or share your live map geolocation, route planners, or physical coordinates. Everything runs isolated for secure workflow cockpit automation.
                    </p>
                  </div>

                  <div className="text-center">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">
                      Last Revision: June 2026
                    </span>
                  </div>
                </div>
              )}

              {/* 4. ABOUT INFORMATION CARD */}
              {activeModal === "about" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-pink-50 dark:bg-pink-950/30 text-pink-500 rounded-2xl">
                      <Info size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">About Application</h3>
                      <p className="text-[10px] font-mono text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Cockpit Platform Specs</p>
                    </div>
                  </div>

                  <div className="text-center py-2.5">
                    <div className="w-16 h-16 bg-neutral-900 text-white rounded-[1.5rem] flex items-center justify-center text-3xl font-mono font-extrabold mx-auto shadow-lg mb-2">
                      M
                    </div>
                    <h4 className="text-sm font-black text-neutral-950 dark:text-white">Milo TaskSync Cockpit</h4>
                    <p className="text-[10px] text-neutral-400 font-mono">VERSION 2.4.0-COSMIC</p>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-800/35 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400 space-y-2">
                    <p className="flex justify-between">
                      <span className="font-semibold">Execution Layer:</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Vite + React TS</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-semibold">Styling Architecture:</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Tailwind CSS</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-semibold">Model Intelligence:</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Gemini Flash AI</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-semibold">Maps API:</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">High-Vector GPS v2</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-400 mt-2">
                    <span>Crafted with passion &</span>
                    <Heart size={10} className="text-rose-500 fill-rose-500" />
                    <span>for Milo Users</span>
                  </div>
                </div>
              )}

              {/* 5. LOGOUT CONFIRMATION DIALOGUE */}
              {activeModal === "logout" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-2xl">
                      <ShieldAlert size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">Confirm Logout</h3>
                      <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest font-bold">Action Required</p>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Are you sure you want to log out? This will end your active session and safely clear your local cached sync data. Your custom app configurations and theme settings will be preserved.
                  </p>

                  <div className="flex gap-2.5 pt-1.5">
                    <button
                      onClick={() => setActiveModal(null)}
                      className="flex-1 py-3 px-4 text-xs font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-2xl transition-all cursor-pointer min-h-[44px]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeLogout}
                      className="flex-1 py-3 px-4 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-2xl transition-all shadow-md shadow-red-600/15 cursor-pointer touch-manipulation min-h-[44px]"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
