import { useState, useEffect } from "react";
import { useMilo } from "../context/useMilo";
import { Settings, Volume2, User, HelpCircle, Shield, RefreshCw, Sliders, Check } from "lucide-react";

export default function SettingsTab() {
  const { state, updateSettings, dispatch } = useMilo();
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isSaved, setIsSaved] = useState(false);

  const voiceSettings = state.settings.voice;

  useEffect(() => {
    if (voiceSettings.rate !== undefined) setRate(voiceSettings.rate);
    if (voiceSettings.pitch !== undefined) setPitch(voiceSettings.pitch);
    if (voiceSettings.volume !== undefined) setVolume(voiceSettings.volume);
  }, [voiceSettings]);

  const handleSave = () => {
    updateSettings({
      voice: {
        gender: voiceSettings.gender || "neutral",
        rate,
        pitch,
        volume
      }
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleVoiceEnabled = () => {
    dispatch({
      type: "UPDATE_CONFIG",
      payload: { voiceEnabled: !state.assistant.config.voiceEnabled }
    });
  };

  const handlePersonalityChange = (val: "balanced" | "coach" | "rescue" | "silent") => {
    dispatch({
      type: "UPDATE_CONFIG",
      payload: { personality: val }
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs">
      
      {/* Header Bar */}
      <div className="bg-gray-50 border-b border-gray-150 p-3 px-4">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
          <Settings size={13} className="text-gray-600" />
          <span>Milo System Controls</span>
        </h3>
        <p className="text-[10px] text-gray-400 mt-0.5">Control speech rates, assistant modes, and personality guidelines.</p>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FCFCFC]">
        
        {/* ASSISTANT PERSONALITY CARD */}
        <div className="bg-white border border-gray-150 p-3.5 rounded-2xl shadow-5xs space-y-3">
          <h4 className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1.5">
            <User size={12} />
            Co-Pilot Persona
          </h4>
          
          <div className="grid grid-cols-4 gap-1.5 bg-gray-50 border border-gray-150 p-1 rounded-xl">
            {(["balanced", "coach", "rescue", "silent"] as const).map((p) => (
              <button
                key={p}
                onClick={() => handlePersonalityChange(p)}
                className={`py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  state.assistant.config.personality === p
                    ? "bg-black text-white shadow-3xs"
                    : "text-gray-400 hover:text-black hover:bg-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-gray-400 font-mono leading-relaxed leading-normal block">
            {state.assistant.config.personality === "coach"
              ? "⚡ Coach: Milo responds with motivational and productivity chief advice."
              : state.assistant.config.personality === "rescue"
              ? "🚨 Rescue: Extreme time compression to guide syllabus recovery."
              : state.assistant.config.personality === "silent"
              ? "🤫 Silent: Voice feedback is suspended; text layout mode only."
              : "⚖️ Balanced: Combined text, bullet points, and reasoning toggles."}
          </p>
        </div>

        {/* VOICE AND AUDIO SYNTHESIS CARD */}
        <div className="bg-white border border-gray-150 p-3.5 rounded-2xl shadow-5xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1.5">
              <Volume2 size={12} />
              Text-To-Speech Synthesis
            </h4>
            
            <button
              onClick={toggleVoiceEnabled}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-hidden ${
                state.assistant.config.voiceEnabled ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                state.assistant.config.voiceEnabled ? "translate-x-4" : "translate-x-0"
              }`} />
            </button>
          </div>

          {state.assistant.config.voiceEnabled && (
            <div className="space-y-3 pt-1 border-t border-gray-100">
              
              {/* Speed rate control */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono font-medium text-gray-500">
                  <span>Speech Speed:</span>
                  <span>{rate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-black h-1 bg-gray-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* Pitch control */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono font-medium text-gray-500">
                  <span>Vocal Pitch:</span>
                  <span>{pitch.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-black h-1 bg-gray-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* Volume control */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono font-medium text-gray-500">
                  <span>Synthesizer Volume:</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-black h-1 bg-gray-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* Save Voice Configuration Button */}
              <button
                onClick={handleSave}
                className={`w-full mt-2 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1.5 border ${
                  isSaved
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-black text-white hover:bg-neutral-800 border-black shadow-xs"
                }`}
              >
                {isSaved ? (
                  <>
                    <Check size={12} />
                    <span>Config Secured</span>
                  </>
                ) : (
                  <span>Apply Voice Preferences</span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* SYSTEM SHORTCUTS INFO CARD */}
        <div className="bg-white border border-gray-150 p-3.5 rounded-2xl shadow-5xs space-y-2.5">
          <h4 className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1.5">
            <HelpCircle size={12} />
            System Help
          </h4>
          <div className="space-y-2 text-[10px] font-mono text-gray-500 leading-normal block">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span>Verbal task matching:</span>
              <span className="text-gray-700 text-right">"add task [name] due [time]"</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span>Verbal routing:</span>
              <span className="text-gray-700 text-right">"go to [tab_name]"</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Durable database:</span>
              <span className="text-emerald-600 text-right font-bold">Encrypted Local Engine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
