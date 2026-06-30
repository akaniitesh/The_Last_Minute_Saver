import React, { useContext, useState, useEffect } from "react";
import { SmartMapContext } from "../context/SmartMapContext";
import { Reminder, ReminderCategory, ReminderType } from "../types/reminder";
import { TripPlanningService, TripPlanningResult } from "../services/tripPlanning";
import { NotificationService } from "../services/notification";
import { 
  Bell, 
  Clock, 
  MapPin, 
  CloudRain, 
  Car, 
  Settings, 
  Trash2, 
  Check, 
  Plus, 
  AlertTriangle, 
  Calendar, 
  Pill, 
  FileText, 
  Users, 
  GraduationCap, 
  ShoppingCart, 
  Home,
  Volume2,
  CheckCircle2,
  Compass,
  AlertCircle
} from "lucide-react";
import { formatDuration } from "../utils/format";

export const ReminderPanel: React.FC = () => {
  const context = useContext(SmartMapContext);
  if (!context) return null;

  const {
    currentLocation,
    reminders,
    notifications,
    reminderSettings,
    updateReminderSettings,
    createReminder,
    deleteReminder,
    updateReminderStatus,
    clearNotificationHistory,
    markNotificationsAsRead,
    savedPlaces,
  } = context;

  // Tabs: "reminders" | "notifications" | "planner" | "settings"
  const [activeTab, setActiveTab] = useState<"reminders" | "notifications" | "planner" | "settings">("reminders");

  // Custom Reminder state
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<ReminderCategory>("custom");
  const [newType, setNewType] = useState<ReminderType>("time");
  const [newTime, setNewTime] = useState("");
  const [selectedDestId, setSelectedDestId] = useState("");
  const [rainThreshold, setRainThreshold] = useState(50);
  const [trafficDelayThreshold, setTrafficDelayThreshold] = useState(15);

  // Live Trip Planner state
  const [planDestId, setPlanDestId] = useState("");
  const [planBuffer, setPlanBuffer] = useState(reminderSettings.defaultBufferMinutes);
  const [planMode, setPlanMode] = useState<"car" | "walking" | "bicycle" | "train">("car");
  const [planTime, setPlanTime] = useState("");
  const [tripResult, setTripResult] = useState<TripPlanningResult | null>(null);

  // Trigger trip planning simulation
  useEffect(() => {
    if (planDestId) {
      const dest = savedPlaces.find((p) => p.id === planDestId);
      if (dest) {
        const destCoords = { lat: dest.lat, lng: dest.lng };
        // Set simulated arrival time if empty (e.g., 2 hours from now)
        let targetTimeStr = planTime;
        if (!targetTimeStr) {
          const future = new Date(Date.now() + 120 * 60 * 1000);
          const hh = String(future.getHours()).padStart(2, "0");
          const mm = String(future.getMinutes()).padStart(2, "0");
          targetTimeStr = `${hh}:${mm}`;
        }
        const plan = TripPlanningService.planTrip(
          currentLocation,
          destCoords,
          planMode,
          targetTimeStr,
          planBuffer
        );
        setTripResult(plan);
      }
    } else {
      setTripResult(null);
    }
  }, [planDestId, planBuffer, planMode, planTime, currentLocation, savedPlaces]);

  // Handle setting permission toggles
  const handleToggleNotifications = async (checked: boolean) => {
    if (checked) {
      const state = await NotificationService.requestPermission();
      updateReminderSettings({
        ...reminderSettings,
        enableBrowserNotifications: state === "granted",
      });
      if (state === "granted") {
        NotificationService.triggerNotification(
          "Notifications Enabled 🔔",
          "Reminder details and safety warnings will be delivered in real-time.",
          "custom"
        );
      }
    } else {
      updateReminderSettings({
        ...reminderSettings,
        enableBrowserNotifications: false,
      });
    }
  };

  const handleCreateCustomReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let targetTimeStr = undefined;
    if (newTime) {
      const today = new Date();
      const [h, m] = newTime.split(":");
      today.setHours(parseInt(h));
      today.setMinutes(parseInt(m));
      today.setSeconds(0);
      targetTimeStr = today.toISOString();
    }

    const dest = savedPlaces.find((p) => p.id === selectedDestId);

    createReminder(newTitle, newType, newCategory, {
      description: newDesc,
      targetTime: targetTimeStr,
      locationName: dest?.name || undefined,
      coords: dest ? { lat: dest.lat, lng: dest.lng } : undefined,
      weatherRainProbabilityThreshold: newType === "weather" ? rainThreshold : undefined,
      trafficDelayMinutesThreshold: newType === "traffic" ? trafficDelayThreshold : undefined,
    });

    // Reset Form
    setNewTitle("");
    setNewDesc("");
    setNewCategory("custom");
    setNewType("time");
    setNewTime("");
    setSelectedDestId("");
    setIsAddingReminder(false);
  };

  const handleCreateTripReminder = () => {
    if (!tripResult || !planDestId) return;
    const dest = savedPlaces.find((p) => p.id === planDestId);
    if (!dest) return;

    createReminder(
      `Trip to ${dest.name}`,
      "planner",
      newCategory,
      {
        description: `Travel alert for ${dest.name}. Buffer: ${tripResult.bufferMin}m.`,
        targetTime: tripResult.estimatedArrivalTime,
        locationName: dest.name,
        coords: { lat: dest.lat, lng: dest.lng },
      }
    );

    NotificationService.triggerNotification(
      "Trip Reminder Created ⏱️",
      `Saved travel alert to ${dest.name}. Leave time: ${new Date(tripResult.recommendedDepartureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      newCategory
    );

    setActiveTab("reminders");
  };

  const getCategoryIcon = (cat: ReminderCategory) => {
    switch (cat) {
      case "leave_home":
        return <Home className="w-4 h-4 text-emerald-500" />;
      case "reach_destination":
        return <MapPin className="w-4 h-4 text-rose-500" />;
      case "meeting":
        return <Users className="w-4 h-4 text-sky-500" />;
      case "class":
        return <GraduationCap className="w-4 h-4 text-purple-500" />;
      case "medicine":
        return <Pill className="w-4 h-4 text-amber-500" />;
      case "assignment":
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case "exam":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "shopping":
        return <ShoppingCart className="w-4 h-4 text-teal-500" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getTypeBadge = (type: ReminderType) => {
    let style = "bg-neutral-50 text-neutral-600 border-neutral-200";
    if (type === "weather") style = "bg-amber-50 text-amber-600 border-amber-200";
    if (type === "traffic") style = "bg-indigo-50 text-indigo-600 border-indigo-200";
    if (type === "planner") style = "bg-purple-50 text-purple-600 border-purple-200";
    if (type === "ai") style = "bg-emerald-50 text-emerald-600 border-emerald-200";

    return (
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${style}`}>
        {type}
      </span>
    );
  };

  // Helper to format ISO time nicely
  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 h-full space-y-4">
      {/* Tab bar header */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-2 shrink-0">
        <div className="flex items-center space-x-1">
          <Bell className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-neutral-800">Reminders & Alert Hub</h2>
        </div>

        <div className="flex bg-neutral-100 p-0.5 rounded-lg space-x-1">
          <button
            onClick={() => { setActiveTab("reminders"); setIsAddingReminder(false); }}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === "reminders" ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Alerts ({reminders.filter((r) => r.status === "upcoming").length})
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`text-xs px-2.5 py-1 rounded-md font-medium relative transition-all ${
              activeTab === "notifications" ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Logs
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="absolute top-1.5 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("planner")}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === "planner" ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Trip Plan
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === "settings" ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main body viewport */}
      <div className="flex-1 overflow-y-auto min-h-0">
        
        {/* TAB 1: REMINDERS */}
        {activeTab === "reminders" && (
          <div className="space-y-3.5">
            {isAddingReminder ? (
              <form onSubmit={handleCreateCustomReminder} className="bg-neutral-50 rounded-xl p-3 border border-neutral-150 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-150 pb-1.5 mb-1.5">
                  <h3 className="text-xs font-bold text-neutral-700">New Alert Condition</h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingReminder(false)}
                    className="text-[10px] text-neutral-400 hover:text-neutral-600 uppercase font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Leave for College Exam"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as ReminderCategory)}
                      className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                    >
                      <option value="leave_home">Leave Home</option>
                      <option value="reach_destination">Destination</option>
                      <option value="meeting">Meeting</option>
                      <option value="class">Class</option>
                      <option value="medicine">Medicine</option>
                      <option value="assignment">Assignment</option>
                      <option value="exam">Exam</option>
                      <option value="shopping">Shopping</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Trigger type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as ReminderType)}
                      className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                    >
                      <option value="time">Time Based</option>
                      <option value="weather">Weather Alert</option>
                      <option value="traffic">Traffic Alert</option>
                    </select>
                  </div>
                </div>

                {newType === "time" && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase">Target Trigger Time</label>
                    <input
                      type="time"
                      required
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                )}

                {newType === "weather" && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase">Rain Trigger Threshold ({rainThreshold}%)</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={rainThreshold}
                      onChange={(e) => setRainThreshold(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 h-1"
                    />
                    <span className="text-[10px] text-neutral-400">Trigger alert if rain chance matches or exceeds threshold.</span>
                  </div>
                )}

                {newType === "traffic" && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase">Delay Threshold ({trafficDelayThreshold} mins)</label>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="5"
                      value={trafficDelayThreshold}
                      onChange={(e) => setTrafficDelayThreshold(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 h-1"
                    />
                    <span className="text-[10px] text-neutral-400">Trigger alert if expected travel route delays exceed this time.</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1 font-medium">Link Saved Location</label>
                  <select
                    value={selectedDestId}
                    onChange={(e) => setSelectedDestId(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                  >
                    <option value="">-- No Location Linked --</option>
                    {savedPlaces.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase">Instruction Details</label>
                  <textarea
                    placeholder="Carry keys, charge laptop, check traffic..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none h-14"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Configure Active Alert</span>
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Reminders</span>
                  <button
                    onClick={() => {
                      setIsAddingReminder(true);
                      if (reminderSettings.enableBrowserNotifications === false) {
                        handleToggleNotifications(true);
                      }
                    }}
                    className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100/70 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Alert</span>
                  </button>
                </div>

                {reminders.filter((r) => r.status === "upcoming").length === 0 ? (
                  <div className="text-center py-10 bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl">
                    <Compass className="w-8 h-8 text-neutral-300 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs text-neutral-400 font-semibold">No upcoming alerts active</p>
                    <p className="text-[10px] text-neutral-400 mt-1">Configure custom time/weather alarms to start monitoring.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {reminders
                      .filter((r) => r.status === "upcoming")
                      .map((r) => (
                        <div
                          key={r.id}
                          className="flex flex-col bg-white border border-neutral-150 rounded-xl p-3 shadow-sm hover:border-neutral-250 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start space-x-2.5 min-w-0">
                              <div className="p-1.5 bg-neutral-50 rounded-lg shrink-0 mt-0.5 border border-neutral-100">
                                {getCategoryIcon(r.category)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-neutral-800 leading-snug">{r.title}</p>
                                {r.description && <p className="text-[10px] text-neutral-500 mt-0.5 line-clamp-2">{r.description}</p>}
                              </div>
                            </div>

                            <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 shrink-0">
                              <button
                                onClick={() => updateReminderStatus(r.id, "completed")}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-100 transition-all"
                                title="Complete"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteReminder(r.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Trigger Metadata footer */}
                          <div className="flex flex-wrap items-center justify-between gap-1 mt-3 pt-2 border-t border-neutral-100 text-[10px] text-neutral-400 font-semibold">
                            <div className="flex items-center space-x-1">
                              {getTypeBadge(r.type)}
                              {r.targetTime && (
                                <span className="flex items-center font-bold text-neutral-500">
                                  <Clock className="w-3 h-3 mr-0.5 shrink-0" />
                                  {formatTime(r.targetTime)}
                                </span>
                              )}
                              {r.locationName && (
                                <span className="truncate max-w-[120px] text-neutral-500">
                                  @ {r.locationName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Interactive Trip details expanded metrics card */}
                          {r.tripDetails && (
                            <div className="mt-2.5 p-2 bg-amber-50/50 rounded-lg border border-amber-100/60 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-amber-700 font-bold">Estimated Leave Window:</span>
                                <span className="font-extrabold text-amber-800">{formatTime(r.tripDetails.recommendedDepartureTime)}</span>
                              </div>
                              <div className="grid grid-cols-3 text-[9px] text-neutral-500 font-medium">
                                <div>Distance: <b>{r.tripDetails.distanceKm}km</b></div>
                                <div>Duration: <b>{r.tripDetails.durationMin}m</b></div>
                                <div>Buffer: <b>{r.tripDetails.bufferMinutes}m</b></div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                {/* HISTORICAL COMPLETED SECTION */}
                {reminders.filter((r) => r.status !== "upcoming").length > 0 && (
                  <div className="mt-4 pt-3 border-t border-neutral-100">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">History / Cleared ({reminders.filter((r) => r.status !== "upcoming").length})</span>
                    <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1">
                      {reminders
                        .filter((r) => r.status !== "upcoming")
                        .map((r) => (
                          <div key={r.id} className="flex items-center justify-between p-2 bg-neutral-50/70 border border-neutral-100 rounded-lg text-neutral-500 opacity-60">
                            <div className="flex items-center space-x-2 truncate">
                              {getCategoryIcon(r.category)}
                              <span className="text-xs truncate">{r.title}</span>
                            </div>
                            <span className="text-[9px] font-bold bg-neutral-100 text-neutral-500 border px-1 rounded uppercase tracking-wider">{r.status}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NOTIFICATIONS (LOGS) */}
        {activeTab === "notifications" && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">PWA Notification Center</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={markNotificationsAsRead}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline uppercase"
                >
                  Read All
                </button>
                <span className="text-neutral-300">•</span>
                <button
                  onClick={clearNotificationHistory}
                  className="text-[10px] font-bold text-neutral-500 hover:text-rose-600 uppercase"
                >
                  Clear
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                <CheckCircle2 className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs text-neutral-400 font-semibold">No recent logs</p>
                <p className="text-[10px] text-neutral-400 mt-1">Delivered browser alerts will log here offline.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all ${
                      item.isRead ? "bg-white border-neutral-150 opacity-75" : "bg-indigo-50/30 border-indigo-100 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5">
                        <div className="p-1.5 bg-neutral-100 rounded-lg shrink-0 mt-0.5">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-800">{item.title}</p>
                          <p className="text-[10px] text-neutral-500 mt-1 leading-normal">{item.body}</p>
                        </div>
                      </div>
                      
                      {!item.isRead && (
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>

                    <div className="text-[9px] text-neutral-400 font-bold mt-2.5 text-right">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIVE TRIP PLANNER */}
        {activeTab === "planner" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-3 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-85">Interactive Trip Estimator</h3>
                <p className="text-[10px] mt-1 text-indigo-100">Simulate traffic delays and weather changes before you depart.</p>
              </div>
              <div className="absolute right-2 -bottom-2 opacity-15">
                <Car className="w-20 h-20 text-white" />
              </div>
            </div>

            <div className="space-y-3 bg-neutral-50 border border-neutral-150 p-3 rounded-xl">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Select Saved Destination</label>
                <select
                  value={planDestId}
                  onChange={(e) => setPlanDestId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                >
                  <option value="">-- Choose Target Location --</option>
                  {savedPlaces.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Travel Mode</label>
                  <select
                    value={planMode}
                    onChange={(e) => setPlanMode(e.target.value as any)}
                    className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                  >
                    <option value="car">Car / Ride</option>
                    <option value="walking">Walking</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="train">Transit / Train</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Target Arrival</label>
                  <input
                    type="time"
                    value={planTime}
                    onChange={(e) => setPlanTime(e.target.value)}
                    className="w-full text-xs p-1.5 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1 flex justify-between">
                  <span>Safety Buffer minutes</span>
                  <span className="text-indigo-600 font-extrabold">{planBuffer}m</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={planBuffer}
                  onChange={(e) => setPlanBuffer(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 h-1"
                />
              </div>
            </div>

            {/* Calculations Render Panel */}
            {tripResult && planDestId && (
              <div className="space-y-3.5">
                {/* 1. Times and departures */}
                <div className="bg-white border border-neutral-150 rounded-xl p-3 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-neutral-100 pb-2">
                    <span className="font-bold text-neutral-500">Recommended Leave:</span>
                    <span className="font-extrabold text-indigo-600 text-sm">
                      {new Date(tripResult.recommendedDepartureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-neutral-50 p-2 rounded-lg text-center">
                      <span className="block text-[9px] font-bold text-neutral-400 uppercase">Duration</span>
                      <b className="text-neutral-800 text-sm">{formatDuration(tripResult.totalDurationMin)}</b>
                      <span className="block text-[8px] text-neutral-400 mt-0.5">(Inc. {tripResult.trafficDelayMin}m delay)</span>
                    </div>

                    <div className="bg-neutral-50 p-2 rounded-lg text-center">
                      <span className="block text-[9px] font-bold text-neutral-400 uppercase">Est. Arrival</span>
                      <b className="text-neutral-800 text-sm">
                        {new Date(tripResult.estimatedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </b>
                      <span className="block text-[8px] text-neutral-400 mt-0.5">(With {tripResult.bufferMin}m buffer)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-semibold pt-1">
                    <span>Direct Distance: <b>{tripResult.distanceKm} km</b></span>
                    <span>Safety Buffer: <b>{tripResult.bufferMin} mins</b></span>
                  </div>
                </div>

                {/* 2. Weather Status at Destination */}
                <div className="bg-neutral-50 border border-neutral-150 rounded-xl p-3 space-y-2.5">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center">
                    <CloudRain className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    Destination Weather Forecast
                  </h4>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-extrabold text-neutral-800">{tripResult.destinationWeather.temp}°F</span>
                      <span className="text-xs text-neutral-500 ml-2 font-medium">({tripResult.destinationWeather.condition})</span>
                    </div>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      Rain Chance: {tripResult.destinationWeather.rainProbability}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-500 font-medium">
                    <div>Wind: <b>{tripResult.destinationWeather.windSpeedMph} mph</b></div>
                    <div>Visibility: <b>{tripResult.destinationWeather.visibilityMiles} mi</b></div>
                  </div>

                  <p className="text-[10px] text-neutral-400 leading-normal bg-white p-2 border border-neutral-100 rounded-lg italic">
                    {tripResult.destinationWeather.description}
                  </p>
                </div>

                {/* 3. Traffic Status */}
                <div className="bg-neutral-50 border border-neutral-150 rounded-xl p-3 space-y-2">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center">
                    <Car className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                    Live Traffic Monitor
                  </h4>

                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      tripResult.traffic.level === "severe" || tripResult.traffic.level === "heavy"
                        ? "bg-red-50 text-red-600 border-red-100"
                        : tripResult.traffic.level === "moderate"
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    }`}>
                      {tripResult.traffic.level} traffic
                    </span>
                    <span className="text-[10px] font-bold text-neutral-500">
                      Delay: <b className="text-neutral-800 font-extrabold">{tripResult.traffic.delayMinutes} mins</b>
                    </span>
                  </div>

                  <p className="text-[10px] text-neutral-400 leading-normal italic">
                    {tripResult.traffic.description}
                  </p>
                </div>

                {/* Heavy Weather/Delay Warning banners */}
                {tripResult.warningMessage && (
                  <div className="flex items-start space-x-2 bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 text-[11px] leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{tripResult.warningMessage}</span>
                  </div>
                )}

                <button
                  onClick={handleCreateTripReminder}
                  className="w-full py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Pin Trip Alert to Schedule</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Reminder Settings</h3>

            <div className="space-y-3.5 bg-neutral-50 border border-neutral-150 p-3 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-700 block">Browser Notifications</span>
                  <span className="text-[10px] text-neutral-400 block">Receive alerts in desktop system banner.</span>
                </div>
                <input
                  type="checkbox"
                  checked={reminderSettings.enableBrowserNotifications}
                  onChange={(e) => handleToggleNotifications(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                <div>
                  <span className="text-xs font-bold text-neutral-700 block">Weather Monitor</span>
                  <span className="text-[10px] text-neutral-400 block">Track rain and visibility alerts automatically.</span>
                </div>
                <input
                  type="checkbox"
                  checked={reminderSettings.enableWeatherAlerts}
                  onChange={(e) => updateReminderSettings({ ...reminderSettings, enableWeatherAlerts: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                <div>
                  <span className="text-xs font-bold text-neutral-700 block">Live Traffic Monitor</span>
                  <span className="text-[10px] text-neutral-400 block">Watch route bottleneck triggers.</span>
                </div>
                <input
                  type="checkbox"
                  checked={reminderSettings.enableTrafficAlerts}
                  onChange={(e) => updateReminderSettings({ ...reminderSettings, enableTrafficAlerts: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                <div>
                  <span className="text-xs font-bold text-neutral-700 block">AI Suggestion Reminders</span>
                  <span className="text-[10px] text-neutral-400 block">Allow Milo agent to propose reminders.</span>
                </div>
                <input
                  type="checkbox"
                  checked={reminderSettings.enableAISuggestions}
                  onChange={(e) => updateReminderSettings({ ...reminderSettings, enableAISuggestions: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Platform Trust Transparency Statement */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-150 space-y-2">
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center">
                <Volume2 className="w-3.5 h-3.5 mr-1 text-neutral-500" />
                Browser & PWA Environment Notice
              </h4>
              <p className="text-[10px] text-neutral-500 leading-normal">
                This service relies on standard HTML5 Web Notifications and local service workers.
              </p>
              <p className="text-[10px] text-neutral-400 leading-relaxed italic bg-white p-2 border border-neutral-100 rounded-md">
                "Smartwatch syncing, direct companion Wear OS status updates, and physical smartwatch bluetooth companion linkages are simulated/planned features requiring an external Android package. Alerts are safely delivered in your browser or installed web application shell."
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ReminderPanel;
