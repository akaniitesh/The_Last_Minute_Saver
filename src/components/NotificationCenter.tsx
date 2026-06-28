import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Bell, 
  Check, 
  Trash2, 
  Archive, 
  Pin, 
  VolumeX, 
  Plus, 
  Eye, 
  Calendar, 
  ShieldAlert, 
  Sparkles, 
  Upload, 
  CheckCircle, 
  Info 
} from "lucide-react";

export interface AppNotification {
  id: string;
  type: "risk" | "calendar" | "suggestion" | "deadline" | "upload" | "task" | "system";
  title: string;
  message: string;
  time: string; // e.g., "Today, 10:45 AM", "Yesterday, 2:15 PM"
  read: boolean;
  archived: boolean;
  pinned: boolean;
  mutedType?: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAllRead: () => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onTogglePin: (id: string) => void;
  onMuteSimilar: (type: AppNotification["type"]) => void;
  onCreateTask: (notification: AppNotification) => void;
}

export default function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkUnread,
  onMarkAllRead,
  onClearAllRead,
  onDelete,
  onArchive,
  onTogglePin,
  onMuteSimilar,
  onCreateTask
}: NotificationCenterProps) {
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);

  // Filter out archived unless we want to view archive
  const activeNotifications = notifications.filter(n => !n.archived);

  // Group notifications
  const pinnedNotifs = activeNotifications.filter(n => n.pinned);
  const unpinnedNotifs = activeNotifications.filter(n => !n.pinned);

  const todayNotifs = unpinnedNotifs.filter(n => n.time.includes("Today"));
  const yesterdayNotifs = unpinnedNotifs.filter(n => n.time.includes("Yesterday"));
  const earlierNotifs = unpinnedNotifs.filter(n => !n.time.includes("Today") && !n.time.includes("Yesterday"));

  // Helper to render type-specific icons and colors
  const getTypeMeta = (type: AppNotification["type"]) => {
    switch (type) {
      case "risk":
        return { icon: ShieldAlert, color: "text-red-500 bg-red-50" };
      case "calendar":
        return { icon: Calendar, color: "text-indigo-500 bg-indigo-50" };
      case "suggestion":
        return { icon: Sparkles, color: "text-amber-500 bg-amber-50" };
      case "deadline":
        return { icon: Info, color: "text-rose-500 bg-rose-50" };
      case "upload":
        return { icon: Upload, color: "text-emerald-500 bg-emerald-50" };
      case "task":
        return { icon: CheckCircle, color: "text-blue-500 bg-blue-50" };
      default:
        return { icon: Bell, color: "text-gray-500 bg-gray-50" };
    }
  };

  const renderNotifItem = (notif: AppNotification) => {
    const meta = getTypeMeta(notif.type);
    const IconComp = meta.icon;

    return (
      <div 
        key={notif.id}
        className={`p-3.5 rounded-2xl border transition-all flex gap-3.5 group relative overflow-hidden ${
          notif.read 
            ? "bg-white border-gray-100 opacity-80" 
            : "bg-indigo-50/15 border-indigo-100 shadow-[0_1px_3px_rgba(99,102,241,0.03)]"
        }`}
      >
        {/* Unread indicator dot */}
        {!notif.read && (
          <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
        )}

        {/* Left Side Icon */}
        <div className={`p-2.5 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center ${meta.color}`}>
          <IconComp size={16} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">{notif.type} Alert</span>
            <span className="text-[9px] font-mono text-gray-400">{notif.time}</span>
          </div>
          <h4 className={`text-xs font-bold leading-snug truncate ${notif.read ? "text-gray-800" : "text-black"}`}>
            {notif.title}
          </h4>
          <p className="text-[10px] text-gray-500 leading-normal line-clamp-2">
            {notif.message}
          </p>

          {/* Quick interactive action bar */}
          <div className="pt-2 flex items-center gap-2 text-[9px] font-mono font-bold uppercase opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
            {!notif.read ? (
              <button 
                onClick={() => onMarkAsRead(notif.id)}
                className="text-emerald-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                title="Mark as Read"
              >
                <Check size={10} />
                <span>Read</span>
              </button>
            ) : (
              <button 
                onClick={() => onMarkUnread(notif.id)}
                className="text-gray-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                title="Mark as Unread"
              >
                <Bell size={10} />
                <span>Unread</span>
              </button>
            )}
            <button 
              onClick={() => setSelectedNotif(notif)}
              className="text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
              title="View full detail specs"
            >
              <Eye size={10} />
              <span>Details</span>
            </button>
            {notif.type === "risk" && (
              <button 
                onClick={() => onCreateTask(notif)}
                className="text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                title="Convert this alert into an active task study milestone"
              >
                <Plus size={10} />
                <span>Shed. Task</span>
              </button>
            )}
            <button 
              onClick={() => onArchive(notif.id)}
              className="text-gray-500 hover:underline flex items-center gap-0.5 cursor-pointer"
              title="Archive notification"
            >
              <Archive size={10} />
              <span>Archive</span>
            </button>
            <button 
              onClick={() => onDelete(notif.id)}
              className="text-red-500 hover:underline flex items-center gap-0.5 cursor-pointer"
              title="Delete notification"
            >
              <Trash2 size={10} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Right Side Hover Options Panel */}
        <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-150 shadow-xs">
          <button 
            onClick={() => onTogglePin(notif.id)}
            className={`p-1 rounded hover:bg-gray-50 ${notif.pinned ? "text-amber-500" : "text-gray-400"}`}
            title={notif.pinned ? "Unpin notification" : "Pin notification to top"}
          >
            <Pin size={10} className={notif.pinned ? "fill-amber-500" : ""} />
          </button>
          <button 
            onClick={() => onMuteSimilar(notif.type)}
            className="p-1 rounded hover:bg-gray-50 text-gray-400 hover:text-black"
            title={`Mute similar ${notif.type} alerts`}
          >
            <VolumeX size={10} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* SLIDE-OUT OVERLAY PANEL */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />

            {/* Sidebar drawer */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white z-50 shadow-2xl border-l border-gray-150 flex flex-col font-sans"
            >
              
              {/* Header */}
              <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
                    <Bell size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Notification Center</h3>
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                      {activeNotifications.filter(n => !n.read).length} UNREAD METRICS
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {activeNotifications.some(n => !n.read) && (
                    <button 
                      onClick={onMarkAllRead}
                      className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase hover:bg-gray-100 text-gray-500 hover:text-black border border-gray-200 rounded-lg transition-all cursor-pointer"
                    >
                      Mark All Read
                    </button>
                  )}
                  {notifications.some(n => n.read) && (
                    <button 
                      onClick={onClearAllRead}
                      className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase hover:bg-red-50 text-red-500 hover:text-red-700 border border-red-200 rounded-lg transition-all cursor-pointer"
                    >
                      Clear All Read
                    </button>
                  )}
                  <button 
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-400 hover:text-black transition-all cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Notification Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {activeNotifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl border border-dashed border-gray-200">
                      <Bell size={24} className="animate-pulse" />
                    </div>
                    <span className="text-xs font-bold text-gray-700 font-mono uppercase tracking-wide">Cockpit Slate Fully Clear</span>
                    <p className="text-[10px] text-gray-400 max-w-[240px] leading-relaxed">
                      No active alerts, delays, or warnings. Your cognitive timeline corridor is fully optimized.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* PINNED SECTION */}
                    {pinnedNotifs.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Pin size={10} className="fill-amber-500" />
                          <span>Pinned Bulletins ({pinnedNotifs.length})</span>
                        </span>
                        <div className="space-y-2.5">
                          {pinnedNotifs.map(renderNotifItem)}
                        </div>
                      </div>
                    )}

                    {/* TODAY SECTION */}
                    {todayNotifs.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Today</span>
                        <div className="space-y-2.5">
                          {todayNotifs.map(renderNotifItem)}
                        </div>
                      </div>
                    )}

                    {/* YESTERDAY SECTION */}
                    {yesterdayNotifs.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Yesterday</span>
                        <div className="space-y-2.5">
                          {yesterdayNotifs.map(renderNotifItem)}
                        </div>
                      </div>
                    )}

                    {/* EARLIER SECTION */}
                    {earlierNotifs.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Earlier Specs</span>
                        <div className="space-y-2.5">
                          {earlierNotifs.map(renderNotifItem)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-150 bg-gray-50/50 flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span>Stored Session Nodes</span>
                <span className="text-indigo-500">Autonomous Defense Grid Active</span>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* VIEW DETAILS MODAL */}
      <AnimatePresence>
        {selectedNotif && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotif(null)}
              className="absolute inset-0 bg-black cursor-pointer"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-200 p-6 rounded-3xl shadow-2xl max-w-md w-full relative z-10 text-left space-y-4 font-sans"
            >
              <button 
                onClick={() => setSelectedNotif(null)}
                className="absolute right-4 top-4 p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-black transition-all cursor-pointer"
              >
                <X size={14} />
              </button>

              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className={`p-2.5 rounded-xl ${getTypeMeta(selectedNotif.type).color}`}>
                  {React.createElement(getTypeMeta(selectedNotif.type).icon, { size: 16 })}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest">{selectedNotif.type} Bulletin</span>
                  <p className="text-xs font-bold text-gray-900">{selectedNotif.title}</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-gray-400 uppercase font-bold block">Spec Message</span>
                  <p className="text-xs text-gray-700 leading-relaxed font-mono whitespace-pre-wrap bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    {selectedNotif.message}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                  <span>Logged Epoch: <strong>{selectedNotif.time}</strong></span>
                  <span className={selectedNotif.read ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                    {selectedNotif.read ? "✓ VIEWED" : "● UNREAD CHANNEL"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs font-mono font-bold uppercase">
                {selectedNotif.type === "risk" && (
                  <button 
                    onClick={() => {
                      onCreateTask(selectedNotif);
                      setSelectedNotif(null);
                    }}
                    className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Schedule Task</span>
                  </button>
                )}
                <button 
                  onClick={() => {
                    onMarkAsRead(selectedNotif.id);
                    setSelectedNotif(null);
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                >
                  Close Details
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
