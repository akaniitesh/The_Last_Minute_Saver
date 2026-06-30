import { BaseService } from "./BaseService";
import { logger } from "../utils/logger";
import { eventBus } from "./EventBus";

// Type-safe declarations for SpeechRecognition to avoid raw "any" types.
interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onaudioend: (() => void) | null;
  onnomatch: (() => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export class SpeechService extends BaseService {
  protected name = "SpeechService";
  private recognition: ISpeechRecognition | null = null;
  private isListening = false;
  private manuallyStopped = true;
  private synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  private devLog(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV !== "production") {
      logger.info(`[SpeechService Dev] ${message}`, ...args);
    }
  }

  protected onInitialize(): void {
    if (typeof window === "undefined") return;

    // Detect browser info for development logs
    const browserInfo = this.getBrowserInfo();
    this.devLog("Initializing SpeechService. Browser environment info:", browserInfo);

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      this.devLog("SpeechRecognition Class found. Creating single recognition instance.");
      this.recognition = new SpeechRecognitionClass() as ISpeechRecognition;
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";

      // 7. Event Handling: Implement correctly all requested event interfaces
      this.recognition.onstart = () => {
        this.devLog("SpeechRecognition: onstart event triggered.");
        this.isListening = true;
        eventBus.emit("speech_recognition_start");
      };

      this.recognition.onaudiostart = () => {
        this.devLog("SpeechRecognition: onaudiostart event. Audio capturing is active.");
      };

      this.recognition.onspeechstart = () => {
        this.devLog("SpeechRecognition: onspeechstart event. Sound recognized as speech detected.");
      };

      this.recognition.onspeechend = () => {
        this.devLog("SpeechRecognition: onspeechend event. Speech has stopped being detected.");
      };

      this.recognition.onaudioend = () => {
        this.devLog("SpeechRecognition: onaudioend event. Finished capturing audio source.");
      };

      this.recognition.onnomatch = () => {
        this.devLog("SpeechRecognition: onnomatch event. No significant speech matched.");
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        logger.error("SpeechRecognition native error:", event.error);
        
        // 12. UI & Error Translation: Map raw browser errors to helpful, friendly user strings
        const friendlyMessage = this.getFriendlyError(event.error);
        eventBus.emit("speech_recognition_error", friendlyMessage);
      };

      this.recognition.onend = () => {
        this.devLog("SpeechRecognition: onend event. Service has disconnected.");
        this.isListening = false;
        eventBus.emit("speech_recognition_end");

        // 6. Restart Logic: Restart only if continuous mode is enabled and NOT manually stopped
        if (this.recognition && this.recognition.continuous && !this.manuallyStopped) {
          this.devLog("SpeechRecognition: Continuous mode enabled. Auto-restarting session.");
          try {
            this.recognition.start();
          } catch (err) {
            logger.error("SpeechRecognition auto-restart failed:", err);
          }
        }
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        eventBus.emit("speech_recognition_result", {
          final: finalTranscript,
          interim: interimTranscript
        });
      };
    } else {
      logger.warn("SpeechRecognition is not supported natively in this browser.");
    }
  }

  protected onDispose(): void {
    this.stopListening();
    this.stopSpeaking();
    
    // Clean up event handlers to prevent memory leaks
    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onaudiostart = null;
      this.recognition.onspeechstart = null;
      this.recognition.onspeechend = null;
      this.recognition.onaudioend = null;
      this.recognition.onnomatch = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition.onresult = null;
      this.recognition = null;
    }
  }

  async startListening(): Promise<void> {
    this.manuallyStopped = false;

    // Diagnose system and sandbox restrictions before starting
    const preCheckError = await this.getPreCheckError();
    if (preCheckError) {
      this.devLog(`Speech pre-check diagnostic failed: ${preCheckError}`);
      eventBus.emit("speech_recognition_error", preCheckError);
      return;
    }

    if (!this.recognition) {
      eventBus.emit("speech_recognition_error", "Speech recognition not supported.");
      return;
    }

    if (this.isListening) {
      this.devLog("Speech recognition is already listening. Ignoring start command.");
      return;
    }

    try {
      this.recognition.start();
      this.devLog("SpeechRecognition: .start() requested successfully.");
    } catch (error: unknown) {
      logger.error("Error starting speech recognition:", error);
      eventBus.emit("speech_recognition_error", "Speech service unavailable. Please check your microphone.");
    }
  }

  stopListening(): void {
    this.manuallyStopped = true;
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
      this.devLog("SpeechRecognition: .stop() requested successfully.");
    } catch (error: unknown) {
      logger.error("Error stopping speech recognition:", error);
    }
  }

  // Abort speech recognition immediately (e.g. on unmount)
  abortListening(): void {
    this.manuallyStopped = true;
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.abort();
      this.devLog("SpeechRecognition: .abort() requested successfully.");
    } catch (error: unknown) {
      logger.error("Error aborting speech recognition:", error);
    }
  }

  speak(text: string, voiceSettings?: { rate?: number; pitch?: number; volume?: number; voiceName?: string }): void {
    if (!this.synth) {
      logger.warn("Speech synthesis is not supported in this browser.");
      return;
    }

    this.stopSpeaking();

    try {
      const cleanText = text.replace(/[*_#`[\]()]/g, " ").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      if (voiceSettings) {
        if (voiceSettings.rate !== undefined) utterance.rate = voiceSettings.rate;
        if (voiceSettings.pitch !== undefined) utterance.pitch = voiceSettings.pitch;
        if (voiceSettings.volume !== undefined) utterance.volume = voiceSettings.volume;
        
        if (voiceSettings.voiceName) {
          const voices = this.synth.getVoices();
          const targetVoice = voices.find(v => v.name === voiceSettings.voiceName);
          if (targetVoice) utterance.voice = targetVoice;
        }
      }

      utterance.onstart = () => {
        this.devLog("Speech synthesis started.");
        eventBus.emit("speech_synthesis_start");
      };

      utterance.onend = () => {
        this.devLog("Speech synthesis ended.");
        eventBus.emit("speech_synthesis_end");
        this.currentUtterance = null;
      };

      utterance.onerror = (event) => {
        logger.error("Speech synthesis error:", event);
        eventBus.emit("speech_synthesis_error", event.error);
        this.currentUtterance = null;
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    } catch (error: unknown) {
      logger.error("Error starting speech synthesis:", error);
    }
  }

  stopSpeaking(): void {
    if (!this.synth) return;

    try {
      this.synth.cancel();
      this.currentUtterance = null;
      eventBus.emit("speech_synthesis_end");
    } catch (error: unknown) {
      logger.error("Error stopping speech synthesis:", error);
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  // 2. Browser Detection & Context Diagnostics
  getBrowserInfo() {
    if (typeof navigator === "undefined") {
      return { name: "Unknown", isSupported: false, isChromeOrEdge: false };
    }
    const ua = navigator.userAgent.toLowerCase();
    const isChrome = ua.includes("chrome") && !ua.includes("edg") && !ua.includes("opr") && !ua.includes("brave");
    const isEdge = ua.includes("edg");
    const isSafari = ua.includes("safari") && !ua.includes("chrome");
    const isFirefox = ua.includes("firefox");

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    return {
      name: isChrome ? "Chrome" : isEdge ? "Edge" : isSafari ? "Safari" : isFirefox ? "Firefox" : "Other",
      isSupported: !!SpeechRecognitionClass,
      isChromeOrEdge: isChrome || isEdge
    };
  }

  // 3 & 4 & 9. Checks secure contexts, permissions, sandboxing
  private async getPreCheckError(): Promise<string | null> {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return "Speech recognition not supported in this environment.";
    }

    // 1. Check browser recognition support
    const browserInfo = this.getBrowserInfo();
    if (!browserInfo.isSupported) {
      return "Speech recognition not supported. Please use Google Chrome or Microsoft Edge.";
    }

    // 9. Sandbox / iframe Detection
    const isIframe = window.self !== window.top;
    if (isIframe) {
      return "Voice input is unavailable in embedded previews. Please open the application directly in Chrome.";
    }

    // 3. Secure Context Verification (except localhost/127.0.0.1)
    const isSecure = window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isSecure) {
      return "Voice input requires a secure context (HTTPS). Please access the application over a secure connection.";
    }

    // 4. Proactive Microphone Permission check
    const permissionState = await this.queryMicrophonePermission();
    this.devLog("Polled microphone permission state:", permissionState);
    if (permissionState === "denied") {
      return "No microphone permission. Please allow microphone access in your browser settings.";
    }

    return null;
  }

  private async queryMicrophonePermission(): Promise<"granted" | "denied" | "prompt" | "unsupported"> {
    if (!navigator.permissions || !navigator.permissions.query) {
      return "unsupported";
    }
    try {
      // Direct feature-permission check
      const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
      return result.state;
    } catch (err) {
      this.devLog("navigator.permissions.query for microphone is unsupported or threw:", err);
      return "unsupported";
    }
  }

  // 5 & 12. Map raw Web Speech API errors to clean user experiences
  private getFriendlyError(errorCode: string): string {
    const isIframe = typeof window !== "undefined" && window.self !== window.top;
    if (isIframe && (errorCode === "network" || errorCode === "not-allowed")) {
      return "Voice input is unavailable in embedded previews. Please open the application directly in Chrome.";
    }

    switch (errorCode) {
      case "not-allowed":
      case "permission-denied":
        return "No microphone permission. Please allow microphone access in your browser settings.";
      case "network":
        return "Network unavailable. Chrome's Web Speech API requires connection to Google's online speech servers.";
      case "audio-capture":
        return "Speech service unavailable. No microphone detected.";
      case "service-not-allowed":
        return "Speech service unavailable. Speech recognition is not permitted on this system.";
      case "language-not-supported":
        return "The configured language is not supported by this browser's speech recognition engine.";
      case "no-speech":
        return "No speech detected. Please speak clearly into your microphone.";
      case "aborted":
        return "Speech recognition aborted.";
      default:
        return `Speech service encountered an issue: ${errorCode}`;
    }
  }
}

export const speechService = new SpeechService();
export default speechService;
