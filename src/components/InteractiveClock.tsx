import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocalization } from "../context/LocalizationContext";

interface InteractiveClockProps {
  mode: "scanner" | "timeline" | "gauge" | "event" | "timer" | "progress" | "pulse" | "default" | "listening" | "thinking" | "speaking";
  riskScore?: number; // 0-100
  focusPercent?: number; // 0-100
  timeLeftStr?: string; // e.g., "25:00"
  voiceIntensity?: number; // 0-100
  goalProgresses?: number[]; // up to 3 percentages
  activeTaskCount?: number;
  isRescueMode?: boolean;
  attentionMuted?: boolean;
  clockRotationTrigger?: number;
  isWidget?: boolean;
}

export default function InteractiveClock({
  mode,
  riskScore = 50,
  focusPercent = 0,
  timeLeftStr = "25:00",
  voiceIntensity = 0,
  goalProgresses = [70, 45, 80],
  activeTaskCount = 3,
  isRescueMode = false,
  attentionMuted = false,
  clockRotationTrigger = 0,
  isWidget = false,
}: InteractiveClockProps) {
  const [time, setTime] = useState(new Date());
  const { t, formatDate, formatTime, isTravelMode, homeCountry, country: localCountry } = useLocalization();

  // Keep internal time ticking for the default hands
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timezone Map
  const timezoneMap: Record<string, string> = {
    "India": "Asia/Kolkata",
    "United States": "America/New_York",
    "United Kingdom": "Europe/London",
    "Japan": "Asia/Tokyo",
    "Germany": "Europe/Berlin",
    "Canada": "America/Toronto"
  };

  const getCountryTime = (ctry: string) => {
    const tz = timezoneMap[ctry] || "America/New_York";
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false
      }).formatToParts(time);
      
      const hr = parseInt(parts.find(p => p.type === "hour")?.value || "0");
      const min = parseInt(parts.find(p => p.type === "minute")?.value || "0");
      const sec = parseInt(parts.find(p => p.type === "second")?.value || "0");
      return { hr, min, sec };
    } catch (e) {
      return { hr: time.getHours(), min: time.getMinutes(), sec: time.getSeconds() };
    }
  };

  const localTimeObj = getCountryTime(localCountry);
  const homeTimeObj = getCountryTime(homeCountry);

  const hourDegrees = (localTimeObj.hr % 12) * 30 + localTimeObj.min * 0.5;
  const minuteDegrees = localTimeObj.min * 6;
  const secondDegrees = attentionMuted ? (localTimeObj.sec * 1.5) : (localTimeObj.sec * 6);

  const homeHourDegrees = (homeTimeObj.hr % 12) * 30 + homeTimeObj.min * 0.5;
  const homeMinuteDegrees = homeTimeObj.min * 6;

  // Regional Ambient Gradients
  const ambientGradients: Record<string, string> = {
    "India": "rgba(239, 131, 38, 0.08)",
    "United States": "rgba(59, 130, 246, 0.08)",
    "United Kingdom": "rgba(100, 116, 139, 0.08)",
    "Japan": "rgba(244, 63, 94, 0.08)",
    "Germany": "rgba(16, 185, 129, 0.08)",
    "Canada": "rgba(239, 68, 68, 0.08)"
  };
  const activeAmbientGlow = ambientGradients[localCountry] || "rgba(0,0,0,0.03)";

  // Compute colors based on emergency state
  const accentColor = isRescueMode ? "#EF4444" : "#000000"; // Black accent for Geometric Balance
  const secondaryAccent = isRescueMode ? "rgba(239, 68, 68, 0.08)" : "rgba(0, 0, 0, 0.05)";

  return (
    <div className={isWidget ? "relative flex flex-col items-center justify-center select-none" : "relative flex flex-col items-center justify-center p-8 bg-white border border-gray-100 rounded-3xl shadow-sm h-[460px] w-full max-w-[420px] mx-auto overflow-hidden"}>
      {/* Background Soft Glow */}
      {!isWidget && (
        <div 
          className="absolute inset-0 transition-all duration-1000 rounded-3xl opacity-30 blur-[85px]"
          style={{
            background: isRescueMode 
              ? "radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(0,0,0,0) 70%)"
              : `radial-gradient(circle, ${activeAmbientGlow.replace("0.08", "0.4")} 0%, rgba(0,0,0,0) 75%)`
          }}
        />
      )}

      {/* Clock Face Rim */}
      <motion.div 
        animate={{ 
          rotate: clockRotationTrigger ? clockRotationTrigger * 360 : 0 
        }}
        transition={{ 
          duration: 1.25, 
          ease: [0.34, 1.56, 0.64, 1] // Custom snappy elastic spring curve
        }}
        className="relative w-[280px] h-[280px] rounded-full border border-gray-150 flex items-center justify-center bg-white shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)]"
      >
        
        {/* ------------------- DYNAMIC ADAPTIVE ATTENTION RINGS & WEDGES ------------------- */}
        {attentionMuted ? (
          /* Subtle focus indicator pulsing ring when muted */
          <motion.div 
            className="absolute -inset-1.5 rounded-full border border-indigo-500/10 pointer-events-none"
            animate={{ scale: [1, 1.03, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          />
        ) : (
          <>
            {/* Low-Risk (<40): Slow, subtle pulsing outline */}
            {(riskScore < 40 && !isRescueMode) && (
              <motion.div 
                className="absolute inset-0 rounded-full border border-emerald-500/10 pointer-events-none"
                animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.3, 0.8, 0.3] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              />
            )}

            {/* Medium-Risk (40-75): Highlighted Dial Wedge segments representing risk blocks */}
            {(riskScore >= 40 && riskScore <= 75 && !isRescueMode) && (
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle
                  cx="140"
                  cy="140"
                  r="134"
                  fill="none"
                  stroke="#D97706"
                  strokeWidth="4"
                  strokeDasharray="840"
                  strokeDashoffset={840 - (840 * (riskScore / 200))}
                  className="opacity-15"
                  strokeLinecap="round"
                />
              </svg>
            )}

            {/* High-Risk (75-85): Strong visual ticking/pulsing orange border */}
            {(riskScore > 75 && riskScore <= 85 && !isRescueMode) && (
              <motion.div 
                className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500 pointer-events-none"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              />
            )}

            {/* Emergency Mode (riskScore > 85 or isRescueMode): Rapid high-intensity countdown visual red rings */}
            {(riskScore > 85 || isRescueMode) && (
              <>
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-dashed border-red-500 pointer-events-none"
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                />
                <motion.div 
                  className="absolute -inset-2 rounded-full border border-red-500/20 pointer-events-none"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                />
              </>
            )}
          </>
        )}

        {/* Subtle Dial Markers */}
        <div className="absolute inset-2 rounded-full border border-gray-50 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 left-1/2 w-[1px] h-[6px] bg-gray-300 origin-bottom"
              style={{
                transform: `translateX(-50%) rotate(${i * 30}deg)`,
                height: i % 3 === 0 ? "10px" : "6px",
                backgroundColor: i % 3 === 0 ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.06)",
              }}
            />
          ))}
        </div>

        {/* ------------------- MODE 1: DEFAULT CLOCK HANDS ------------------- */}
        <AnimatePresence>
          {(mode === "default" || mode === "pulse") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                // Apply subtle breathing pulse under low risk (<40)
                y: (riskScore < 40 && !isRescueMode && !attentionMuted) ? [0, -1.5, 0] : 0
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                y: { repeat: Infinity, duration: attentionMuted ? 8 : 5, ease: "easeInOut" },
                duration: 0.5 
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Home Hour Hand (Dashed, Semi-transparent, shown in Travel Mode) */}
              {isTravelMode && (
                <motion.div
                  className="absolute w-[4px] h-[52px] border border-dashed border-rose-500 rounded-full origin-bottom"
                  style={{
                    transform: `translateY(-50%) rotate(${homeHourDegrees}deg)`,
                    top: "24%",
                    background: "rgba(244, 63, 94, 0.2)"
                  }}
                  animate={{ rotate: homeHourDegrees }}
                  transition={{ type: "spring", stiffness: 50 }}
                />
              )}

              {/* Hour Hand */}
              <motion.div
                className="absolute w-[4px] h-[60px] bg-gray-800 rounded-full origin-bottom"
                style={{
                  transform: `translateY(-50%) rotate(${hourDegrees}deg)`,
                  top: "20%",
                }}
                animate={{ rotate: hourDegrees }}
                transition={{ type: "spring", stiffness: 50 }}
              />

              {/* Minute Hand */}
              <motion.div
                className="absolute w-[2px] h-[90px] bg-gray-500 rounded-full origin-bottom"
                style={{
                  transform: `translateY(-50%) rotate(${minuteDegrees}deg)`,
                  top: "10%",
                }}
                animate={{ rotate: minuteDegrees }}
                transition={{ type: "spring", stiffness: 50 }}
              />

              {/* Second Hand (Ticking / Slow Sweep when muted) */}
              <motion.div
                className="absolute w-[1px] h-[105px] origin-bottom"
                style={{
                  transform: `translateY(-50%) rotate(${secondDegrees}deg)`,
                  top: "5%",
                  backgroundColor: attentionMuted ? "#6366F1" : accentColor, // indigo in focus mode
                }}
                animate={{ rotate: secondDegrees }}
                transition={{ ease: "linear", duration: attentionMuted ? 1.0 : 0.2 }}
              />

              {/* Center Dot */}
              <div 
                className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: attentionMuted ? "#6366F1" : accentColor }}
              />

              {/* Ambient Breathing Circle behind Center */}
              <motion.div
                className="absolute w-8 h-8 rounded-full pointer-events-none"
                style={{ backgroundColor: attentionMuted ? "rgba(99, 102, 241, 0.08)" : secondaryAccent }}
                animate={{ scale: attentionMuted ? [1, 1.15, 1] : [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: attentionMuted ? 8 : 4, ease: "easeInOut" }}
              />

              {/* Subtle Protected Zone Indicator inside Clock Face */}
              {attentionMuted && (
                <div className="absolute bottom-[24%] flex flex-col items-center justify-center text-center pointer-events-none animate-fade-in">
                  <span className="text-[8px] font-mono tracking-[0.25em] text-indigo-500 font-bold flex items-center gap-1">
                    🔕 DEEP FLOW
                  </span>
                  <span className="text-[7px] text-gray-400 font-sans mt-0.5 tracking-wider">PROTECTED ZONE</span>
                </div>
              )}

              {/* Dynamic Time Zone Tags on the Face */}
              {isTravelMode && !attentionMuted && (
                <div className="absolute bottom-[20%] flex flex-col items-center justify-center text-center pointer-events-none animate-fade-in">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-gray-700 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-150">
                    <span className="text-gray-400">🏠 {homeCountry.substring(0, 3).toUpperCase()}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-rose-500">📍 {localCountry.substring(0, 3).toUpperCase()}</span>
                  </div>
                  <span className="text-[7px] text-gray-400 mt-1 tracking-[0.1em] font-sans uppercase">
                    Dual Time Active
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ------------------- MODE 2: RADAR / DOCUMENT SCANNER ------------------- */}
        <AnimatePresence>
          {mode === "scanner" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Laser Sweeper Line */}
              <motion.div
                className="absolute w-[1px] h-[135px] origin-bottom top-[5%]"
                style={{
                  background: `linear-gradient(to top, rgba(0,0,0,0), ${accentColor})`,
                  boxShadow: `0 0 4px ${accentColor}`,
                }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              />

              {/* Grid Dots */}
              <div className="absolute inset-8 grid grid-cols-4 grid-rows-4 gap-4 opacity-10">
                {[...Array(16)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-black"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      delay: (i % 4) * 0.3 + Math.floor(i / 4) * 0.2,
                    }}
                  />
                ))}
              </div>

              {/* Scanning Rings */}
              <motion.div
                className="absolute border border-dashed rounded-full pointer-events-none"
                style={{ borderColor: accentColor, width: "160px", height: "160px", opacity: 0.1 }}
                animate={{ scale: [0.9, 1.1, 0.9] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute border border-solid rounded-full pointer-events-none"
                style={{ borderColor: accentColor, width: "220px", height: "220px", opacity: 0.04 }}
                animate={{ scale: [1.1, 0.9, 1.1] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              />

              {/* Center analyzing light */}
              <div className="absolute flex flex-col items-center">
                <span className="text-[10px] tracking-[0.2em] font-mono text-gray-400 uppercase">Scanning</span>
                <span className="text-xs font-mono font-bold mt-0.5" style={{ color: accentColor === "#000000" ? "#2563EB" : accentColor }}>AI.DOC</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ------------------- MODE 3: TIMELINE WHEEL ------------------- */}
        <AnimatePresence>
          {mode === "timeline" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Central Progress Circle */}
              <svg className="absolute w-[220px] h-[220px] -rotate-90">
                <circle
                  cx="110"
                  cy="110"
                  r="95"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="2"
                />
                <motion.circle
                  cx="110"
                  cy="110"
                  r="95"
                  fill="none"
                  stroke={accentColor === "#000000" ? "#2563EB" : accentColor}
                  strokeWidth="3"
                  strokeDasharray="596"
                  initial={{ strokeDashoffset: 596 }}
                  animate={{ strokeDashoffset: 596 - (596 * 0.7) }} // e.g. 70% project done
                  transition={{ duration: 1, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>

              {/* Timeline Nodes / Milestones */}
              {[...Array(5)].map((_, idx) => {
                const angle = idx * (360 / 5) - 90; // offset by 90 to start top
                const rad = (angle * Math.PI) / 180;
                const r = 95; // radius
                const x = 140 + r * Math.cos(rad);
                const y = 140 + r * Math.sin(rad);

                return (
                  <motion.div
                    key={idx}
                    className="absolute w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-mono font-bold shadow-sm"
                    style={{
                      left: `${x - 10}px`,
                      top: `${y - 10}px`,
                      backgroundColor: idx <= 2 ? (accentColor === "#000000" ? "#2563EB" : accentColor) : "#e5e7eb",
                      color: idx <= 2 ? "#fff" : "#4b5563",
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.1, type: "spring" }}
                  >
                    {idx + 1}
                  </motion.div>
                );
              })}

              <div className="absolute text-center">
                <p className="text-[10px] tracking-[0.2em] font-mono text-gray-400 uppercase">Timeline</p>
                <p className="text-xl font-mono font-medium text-gray-900">70%</p>
                <p className="text-[9px] font-mono text-gray-500 mt-0.5">3/5 Milestones</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ------------------- MODE 4: RISK GAUGE METER ------------------- */}
        <AnimatePresence>
          {mode === "gauge" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Semi-circular gauge background arc */}
              <svg className="absolute w-[240px] h-[240px]" style={{ transform: "rotate(-180deg)" }}>
                {/* Safe Gray Arc */}
                <circle
                  cx="120"
                  cy="120"
                  r="90"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="6"
                  strokeDasharray="283" // half circle
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                {/* Active Risk Segment */}
                <motion.circle
                  cx="120"
                  cy="120"
                  r="90"
                  fill="none"
                  stroke={riskScore > 75 ? "#EF4444" : riskScore > 40 ? "#D97706" : "#10B981"}
                  strokeWidth="8"
                  strokeDasharray="283"
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 283 - (283 * (riskScore / 100)) }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>

              {/* Indicator Needle */}
              <motion.div
                className="absolute w-[4px] h-[95px] origin-bottom bg-black rounded-full"
                style={{
                  top: "14%", // positioned just above center
                  transformOrigin: "bottom center",
                }}
                animate={{ rotate: (riskScore / 100) * 180 - 90 }}
                transition={{ type: "spring", damping: 15 }}
              />

              {/* Needle pivot */}
              <div className="absolute w-4 h-4 bg-gray-900 border-2 border-white rounded-full shadow-md mt-[48px]" />

              {/* Risk Data text */}
              <div className="absolute bottom-10 text-center">
                <span className="text-[10px] tracking-[0.2em] font-mono text-gray-400 uppercase block">Risk Score</span>
                <span className="text-3xl font-mono font-bold" style={{ color: riskScore > 75 ? "#EF4444" : riskScore > 40 ? "#D97706" : "#10B981" }}>
                  {riskScore}%
                </span>
                <span className="text-[10px] font-mono text-gray-500 block mt-0.5">
                  {riskScore > 75 ? "CRITICAL RISK" : riskScore > 40 ? "ELEVATED DELAY" : "SAFE ZONE"}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ------------------- MODE 5: CALENDAR EVENT BLOCKS ------------------- */}
        <AnimatePresence>
          {mode === "event" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Simulated Calendar Event Arcs around perimeter */}
              <svg className="absolute w-[240px] h-[240px] -rotate-90">
                {/* Base Outer Dial */}
                <circle cx="120" cy="120" r="105" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                
                {/* Event 1 (10 AM - 12 PM) -> 60 deg to 120 deg (represented by dasharray) */}
                <circle
                  cx="120"
                  cy="120"
                  r="105"
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.08)"
                  strokeWidth="8"
                  strokeDasharray="660"
                  strokeDashoffset="440" // Positioned
                  strokeLinecap="round"
                />
                
                {/* Event 2: Focus Session (2 PM - 5 PM) -> Highlighted Gold */}
                <motion.circle
                  cx="120"
                  cy="120"
                  r="105"
                  fill="none"
                  stroke={accentColor === "#000000" ? "#2563EB" : accentColor}
                  strokeWidth="10"
                  strokeDasharray="660"
                  initial={{ strokeDashoffset: 660 }}
                  animate={{ strokeDashoffset: 180 }} // Fills a large focus arc
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round"
                />

                {/* Event 3: Urgent Meeting Conflict (6 PM - 7:30 PM) -> Red */}
                <circle
                  cx="120"
                  cy="120"
                  r="105"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="8"
                  strokeDasharray="660"
                  strokeDashoffset="540"
                  strokeLinecap="round"
                />
              </svg>

              {/* Central Details */}
              <div className="absolute text-center">
                <p className="text-[10px] tracking-[0.2em] font-mono text-gray-400 uppercase">Free Blocks</p>
                <p className="text-lg font-mono font-medium text-gray-900">4.5 Hrs Open</p>
                <div className="flex items-center justify-center gap-1 mt-1 text-[9px] font-mono bg-gray-50 px-2 py-0.5 rounded-full border border-gray-150">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Slots Optimized</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ------------------- MODE 6: POMODORO FOCUS TIMER ------------------- */}
        <AnimatePresence>
          {mode === "timer" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Concentric Progress Track */}
              <svg className="absolute w-[230px] h-[230px] -rotate-90">
                <circle
                  cx="115"
                  cy="115"
                  r="100"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="115"
                  cy="115"
                  r="100"
                  fill="none"
                  stroke={accentColor === "#000000" ? "#2563EB" : accentColor}
                  strokeWidth="6"
                  strokeDasharray="628"
                  strokeDashoffset={628 - (628 * (focusPercent / 100))}
                  transition={{ ease: "easeInOut" }}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute text-center">
                <p className="text-[10px] tracking-[0.2em] font-mono text-gray-400 uppercase mb-1">
                  {isRescueMode ? "RESCUE BLOCK" : "DEEP FOCUS"}
                </p>
                <p className="text-3xl font-mono font-bold text-gray-900 tracking-tight">
                  {timeLeftStr}
                </p>
                <p className="text-[10px] font-mono text-gray-500 mt-1">
                  {isRescueMode ? "Active Compression" : `Sprint: ${Math.round(focusPercent)}% Completed`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ------------------- MODE 7: GOAL ACHIEVEMENT RINGS ------------------- */}
        <AnimatePresence>
          {mode === "progress" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Triple concentric rings */}
              <svg className="absolute w-[240px] h-[240px] -rotate-90">
                {/* Academic Goal Ring */}
                <circle cx="120" cy="120" r="95" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                <motion.circle
                  cx="120"
                  cy="120"
                  r="95"
                  fill="none"
                  stroke={accentColor === "#000000" ? "#2563EB" : accentColor}
                  strokeWidth="6"
                  strokeDasharray="596"
                  initial={{ strokeDashoffset: 596 }}
                  animate={{ strokeDashoffset: 596 - (596 * ((goalProgresses && goalProgresses[0] !== undefined ? goalProgresses[0] : 0) / 100)) }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round"
                />

                {/* Career Goal Ring */}
                <circle cx="120" cy="120" r="75" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                <motion.circle
                  cx="120"
                  cy="120"
                  r="75"
                  fill="none"
                  stroke="#4b5563"
                  strokeWidth="6"
                  strokeDasharray="471"
                  initial={{ strokeDashoffset: 471 }}
                  animate={{ strokeDashoffset: 471 - (471 * ((goalProgresses && goalProgresses[1] !== undefined ? goalProgresses[1] : 0) / 100)) }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  strokeLinecap="round"
                />

                {/* Personal Goal Ring */}
                <circle cx="120" cy="120" r="55" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                <motion.circle
                  cx="120"
                  cy="120"
                  r="55"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="6"
                  strokeDasharray="345"
                  initial={{ strokeDashoffset: 345 }}
                  animate={{ strokeDashoffset: 345 - (345 * ((goalProgresses && goalProgresses[2] !== undefined ? goalProgresses[2] : 0) / 100)) }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute text-center mt-1">
                <span className="text-[9px] tracking-[0.2em] font-mono text-gray-400 block">GOALS</span>
                <span className="text-xl font-mono font-medium text-gray-900">{Math.round((goalProgresses[0]+goalProgresses[1]+goalProgresses[2])/3)}%</span>
                <span className="text-[9px] font-mono text-gray-500 block mt-0.5">Weighted Avg</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ------------------- VOICE ASSISTANT MODES ------------------- */}
        <AnimatePresence>
          {mode === "listening" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div 
                className="absolute inset-0 rounded-full bg-blue-50/10 blur-xl transition-all duration-300"
                style={{
                  boxShadow: `0 0 ${20 + voiceIntensity * 0.4}px rgba(59, 130, 246, ${0.1 + voiceIntensity / 200})`
                }}
              />
              <motion.div 
                className="absolute rounded-full border border-blue-400 bg-blue-50/5"
                style={{
                  width: `${110 + voiceIntensity * 1.1}px`,
                  height: `${110 + voiceIntensity * 1.1}px`,
                  opacity: 0.25 + (voiceIntensity / 150)
                }}
              />
              <motion.div 
                className="absolute rounded-full border border-blue-300"
                style={{
                  width: `${150 + voiceIntensity * 0.7}px`,
                  height: `${150 + voiceIntensity * 0.7}px`,
                  opacity: 0.15 + (voiceIntensity / 200)
                }}
              />
              <motion.div 
                className="absolute rounded-full border border-dashed border-blue-500/20"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                style={{
                  width: "210px",
                  height: "210px",
                }}
              />
              <div className="absolute flex flex-col items-center">
                <span className="text-[10px] tracking-[0.25em] font-mono text-blue-600 uppercase font-bold animate-pulse">LISTENING</span>
                <span className="text-xs font-mono text-gray-600 mt-1 font-medium">AUDIO_FEED</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mode === "thinking" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <motion.div 
                className="absolute rounded-full border-2 border-dashed border-indigo-500/30"
                style={{ width: "220px", height: "220px" }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
              />
              <motion.div 
                className="absolute rounded-full border border-dotted border-purple-500/50"
                style={{ width: "170px", height: "170px" }}
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              />
              <motion.div
                className="absolute w-[2px] h-[105px] bg-gradient-to-t from-transparent to-indigo-500 origin-bottom"
                style={{ top: "12.5%", transformOrigin: "bottom center" }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
              />
              <motion.div 
                className="absolute w-14 h-14 rounded-full bg-indigo-50/50 border border-indigo-150 shadow-[0_0_12px_rgba(99,102,241,0.1)] flex items-center justify-center"
                animate={{ scale: [0.96, 1.04, 0.96] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              >
                <span className="text-[9px] font-mono text-indigo-600 font-bold">AI_CPU</span>
              </motion.div>
              <div className="absolute bottom-6">
                <span className="text-[9px] tracking-[0.25em] font-mono text-indigo-500 uppercase font-bold block">PROCESSING</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mode === "speaking" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <motion.div 
                className="absolute rounded-full bg-amber-500/5 border border-amber-500/20"
                style={{
                  width: `${105 + voiceIntensity * 1.3}px`,
                  height: `${105 + voiceIntensity * 1.3}px`,
                }}
                animate={{ scale: [0.98, 1.02, 0.98] }}
                transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute rounded-full bg-amber-500/5 border border-amber-500/10"
                style={{
                  width: `${145 + voiceIntensity * 0.8}px`,
                  height: `${145 + voiceIntensity * 0.8}px`,
                }}
              />
              <motion.div 
                className="absolute rounded-full border border-amber-400/30"
                style={{
                  width: "190px",
                  height: "190px",
                }}
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              />
              <div className="absolute flex flex-col items-center">
                <span className="text-[10px] tracking-[0.2em] font-mono text-amber-600 uppercase font-bold animate-pulse">SPEAKING</span>
                <span className="text-[9px] font-mono text-gray-500 mt-1">AI_VOICE_OUT</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>

      {/* Ticker status text under the clock */}
      {!isWidget && (
        <div className="mt-5 text-center px-4 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={attentionMuted ? "muted" : mode}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              <p className="text-xs font-mono font-bold tracking-wide text-gray-900">
                {attentionMuted ? (
                  <span className="text-indigo-600">🔕 PROTECTED DEEP WORK ACTIVE</span>
                ) : (
                  <>
                    {mode === "default" && "CLOCK ENGINE: IDLE"}
                    {mode === "scanner" && "DOC INTELLIGENCE: EXTRACTING BRIEF"}
                    {mode === "timeline" && "CHRONOLOGICAL EXECUTION WHEEL"}
                    {mode === "gauge" && "PREDICTIVE PRIORITY RISK METER"}
                    {mode === "event" && "CALENDAR FOCUS ALIGNMENT SLOTS"}
                    {mode === "timer" && (isRescueMode ? "EMERGENCY RESCUE COUNTDOWN" : "AI DEEP FOCUS ACTIVE")}
                    {mode === "progress" && "CONCENTRIC GOALS EXPANSION TRACK"}
                    {mode === "pulse" && (voiceIntensity > 15 ? "VOICE UI: ANALYZING SPEECH" : "VOICE ENGINE: LISTENING")}
                    {mode === "listening" && "VOICE ENGINE: ASSISTANT LISTENING"}
                    {mode === "thinking" && "COGNITIVE COMPANION: RECEDING CORES"}
                    {mode === "speaking" && "AI CHIEF-OF-STAFF: SPEAKING OUT LOUD"}
                  </>
                )}
              </p>
              <p className="text-[10px] font-mono text-gray-500 mt-1 max-w-[300px] leading-relaxed break-words">
                {attentionMuted ? (
                  "AI Chief-of-Staff is maintaining absolute silence. Suggestions and notifications are suppressed to protect your cognitive flow."
                ) : (
                  <>
                    {mode === "default" && "Don't remind me. Help me finish it."}
                    {mode === "scanner" && "Extracting dates, requirements, academic checklists, and study paths."}
                    {mode === "timeline" && "Workload balanced milestones aligned linearly to secure submission."}
                    {mode === "gauge" && "Urgency, effort, and likelihood of delay dynamically evaluated."}
                    {mode === "event" && "Auto-resolving appointment conflicts and scheduling focus blocks."}
                    {mode === "timer" && "Minimizing cognitive load, blocking out distractions."}
                    {mode === "progress" && "Academic and personal consistency metrics updated hourly."}
                    {mode === "pulse" && "Vocal query captured. Speak: 'Plan my week', or 'Am I safe for Friday?'"}
                    {mode === "listening" && "Capturing live vocal frequency spectrum. Speak naturally to plan your schedule."}
                    {mode === "thinking" && "Recalibrating schedule algorithms, assessing critical paths, and modeling deadlines..."}
                    {mode === "speaking" && "Simulating speech patterns to deliver optimized task schedules and rescue actions."}
                  </>
                )}
              </p>
              
              {/* EMERGENCY RECOVERY CHECKLIST PLAN */}
              {(isRescueMode || riskScore > 85) && (
                <div className="mt-3.5 p-3.5 bg-red-50/75 border border-red-150 rounded-xl text-left text-[10px] font-mono text-red-700 w-full animate-fade-in space-y-1 min-w-0 overflow-hidden">
                  <span className="font-bold uppercase tracking-wider block border-b border-red-200 pb-1 mb-1.5 break-words">🚨 Emergency Recovery Plan</span>
                  <p className="flex items-center gap-1.5 font-medium break-words">
                    <span className="w-1 h-1 rounded-full bg-red-600 shrink-0" />
                    <span className="break-words">Focus on critical path items immediately.</span>
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
