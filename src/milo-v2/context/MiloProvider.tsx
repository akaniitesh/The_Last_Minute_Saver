import { useReducer, useEffect, useCallback, ReactNode, useRef } from "react";
import { MiloContext, MiloState, MiloReducerAction } from "./MiloContext";
import { serviceContainer } from "../services/ServiceContainer";
import { geminiService } from "../services/GeminiService";
import { speechService } from "../services/SpeechService";
import { settingsService } from "../services/SettingsService";
import { storageService } from "../services/StorageService";
import { eventBus } from "../services/EventBus";
import { STORAGE_KEYS, DEFAULT_SETTINGS } from "../utils/constants";
import { generateId } from "../utils/id";
import { ChatMessage, Conversation } from "../types/chat";
import { MemoryEntry } from "../types/memory";
import { SettingsState } from "../types/settings";
import { logger } from "../utils/logger";

// Props mapping for interoperability with parent app's workspace actions
interface MiloProviderProps {
  children: ReactNode;
  parentTasks?: any[];
  parentIsRescueMode?: boolean;
  onAddTask?: (task: any) => void;
  onNavigateTab?: (tab: any) => void;
  onToggleRescueMode?: () => void;
  onSetClockMode?: (mode: any) => void;
  onSetVoiceIntensity?: (intensity: number) => void;
}

const initialState: MiloState = {
  assistant: {
    isOpen: false,
    view: "chat",
    status: "idle",
    config: {
      personality: "balanced",
      smartSilence: true,
      voiceEnabled: true,
      isMuted: false,
      model: "gemini-3.5-flash"
    },
    currentError: null
  },
  chat: {
    conversations: [],
    activeConversationId: null,
    status: "idle",
    isStreaming: false,
    currentError: null
  },
  memory: {
    entries: [],
    status: "idle",
    currentError: null
  },
  planner: {
    tasks: [],
    goals: [],
    habits: [],
    filters: {},
    status: "idle",
    currentError: null
  },
  settings: DEFAULT_SETTINGS as any
};

function miloReducer(state: MiloState, action: MiloReducerAction): MiloState {
  switch (action.type) {
    case "TOGGLE_ASSISTANT":
      return {
        ...state,
        assistant: {
          ...state.assistant,
          isOpen: !state.assistant.isOpen
        }
      };
    case "SET_ASSISTANT_VIEW":
      return {
        ...state,
        assistant: {
          ...state.assistant,
          view: action.payload
        }
      };
    case "SET_ASSISTANT_STATUS":
      return {
        ...state,
        assistant: {
          ...state.assistant,
          status: action.payload
        }
      };
    case "SET_ASSISTANT_ERROR":
      return {
        ...state,
        assistant: {
          ...state.assistant,
          currentError: action.payload
        }
      };
    case "UPDATE_CONFIG":
      return {
        ...state,
        assistant: {
          ...state.assistant,
          config: {
            ...state.assistant.config,
            ...action.payload
          }
        }
      };
    case "START_STREAMING":
      return {
        ...state,
        chat: { ...state.chat, isStreaming: true }
      };
    case "STOP_STREAMING":
      return {
        ...state,
        chat: { ...state.chat, isStreaming: false }
      };
    case "SET_CONVERSATIONS":
      return {
        ...state,
        chat: {
          ...state.chat,
          conversations: action.payload,
          activeConversationId: state.chat.activeConversationId || (action.payload[0]?.id || null)
        }
      };
    case "SELECT_CONVERSATION":
      return {
        ...state,
        chat: { ...state.chat, activeConversationId: action.payload }
      };
    case "CREATE_CONVERSATION":
      return {
        ...state,
        chat: {
          ...state.chat,
          conversations: [action.payload, ...state.chat.conversations],
          activeConversationId: action.payload.id
        }
      };
    case "DELETE_CONVERSATION": {
      const remaining = state.chat.conversations.filter(c => c.id !== action.payload);
      return {
        ...state,
        chat: {
          ...state.chat,
          conversations: remaining,
          activeConversationId: state.chat.activeConversationId === action.payload
            ? (remaining[0]?.id || null)
            : state.chat.activeConversationId
        }
      };
    }
    case "CLEAR_CONVERSATIONS":
      return {
        ...state,
        chat: { ...state.chat, conversations: [], activeConversationId: null }
      };
    case "ADD_MESSAGE": {
      const updatedConversations = state.chat.conversations.map(c => {
        if (c.id === action.payload.conversationId) {
          return {
            ...c,
            messages: [...c.messages, action.payload.message],
            updatedAt: Date.now()
          };
        }
        return c;
      });
      return {
        ...state,
        chat: { ...state.chat, conversations: updatedConversations }
      };
    }
    case "UPDATE_MESSAGE_STATUS": {
      const updatedConversations = state.chat.conversations.map(c => {
        if (c.id === action.payload.conversationId) {
          return {
            ...c,
            messages: c.messages.map(m =>
              m.id === action.payload.messageId
                ? { ...m, status: action.payload.status, error: action.payload.error }
                : m
            )
          };
        }
        return c;
      });
      return {
        ...state,
        chat: { ...state.chat, conversations: updatedConversations }
      };
    }
    case "SET_MEMORIES":
      return {
        ...state,
        memory: { ...state.memory, entries: action.payload }
      };
    case "ADD_MEMORY":
      return {
        ...state,
        memory: { ...state.memory, entries: [action.payload, ...state.memory.entries] }
      };
    case "DELETE_MEMORY":
      return {
        ...state,
        memory: { ...state.memory, entries: state.memory.entries.filter(e => e.id !== action.payload) }
      };
    case "UPDATE_MEMORY":
      return {
        ...state,
        memory: {
          ...state.memory,
          entries: state.memory.entries.map(e => e.id === action.payload.id ? action.payload : e)
        }
      };
    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
          voice: {
            ...state.settings.voice,
            ...(action.payload.voice || {})
          }
        }
      };
    case "SET_TASKS":
      return {
        ...state,
        planner: { ...state.planner, tasks: action.payload }
      };
    case "SET_PLANNER_STATUS":
      return {
        ...state,
        planner: { ...state.planner, status: action.payload }
      };
    default:
      return state;
  }
}

export function MiloProvider({
  children,
  parentTasks = [],
  parentIsRescueMode = false,
  onAddTask,
  onNavigateTab,
  onToggleRescueMode,
  onSetClockMode,
  onSetVoiceIntensity
}: MiloProviderProps) {
  const [state, dispatch] = useReducer(miloReducer, initialState);
  
  // Keep values inside ref to avoid stale closure references inside event callbacks
  const stateRef = useRef(state);
  const parentTasksRef = useRef(parentTasks);
  const parentIsRescueModeRef = useRef(parentIsRescueMode);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    parentTasksRef.current = parentTasks;
  }, [parentTasks]);

  useEffect(() => {
    parentIsRescueModeRef.current = parentIsRescueMode;
  }, [parentIsRescueMode]);

  // Synchronize Tasks list to state
  useEffect(() => {
    dispatch({ type: "SET_TASKS", payload: parentTasks });
  }, [parentTasks]);

  // Handle service container initialization & disposal
  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        await serviceContainer.initializeAll();
        if (active) {
          // Sync saved settings
          const loadedSettings = settingsService.getSettings();
          dispatch({ type: "UPDATE_SETTINGS", payload: loadedSettings });

          // Sync saved chats
          const loadedConversations = storageService.get<Conversation[]>(STORAGE_KEYS.CHAT_HISTORY, []);
          dispatch({ type: "SET_CONVERSATIONS", payload: loadedConversations });

          // Sync saved memories
          const loadedMemories = storageService.get<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, []);
          dispatch({ type: "SET_MEMORIES", payload: loadedMemories });
        }
      } catch (error) {
        logger.error("Failed to initialize ServiceContainer in provider:", error);
      }
    };
    init();

    return () => {
      active = false;
      serviceContainer.disposeAll();
    };
  }, []);

  // Listen for settings and voice changes via EventBus
  useEffect(() => {
    const cleanSettingsSub = eventBus.on("settings_changed", (updated) => {
      dispatch({ type: "UPDATE_SETTINGS", payload: updated });
    });

    const cleanSpeechSyntStart = eventBus.on("speech_synthesis_start", () => {
      dispatch({ type: "SET_ASSISTANT_STATUS", payload: "speaking" });
      onSetVoiceIntensity?.(60);
    });

    const cleanSpeechSyntEnd = eventBus.on("speech_synthesis_end", () => {
      dispatch({ type: "SET_ASSISTANT_STATUS", payload: "idle" });
      onSetVoiceIntensity?.(0);
    });

    const cleanSpeechRecStart = eventBus.on("speech_recognition_start", () => {
      dispatch({ type: "SET_ASSISTANT_STATUS", payload: "listening" });
      dispatch({ type: "SET_ASSISTANT_ERROR", payload: null });
    });

    const cleanSpeechRecEnd = eventBus.on("speech_recognition_end", () => {
      dispatch({ type: "SET_ASSISTANT_STATUS", payload: "idle" });
    });

    const cleanSpeechRecError = eventBus.on("speech_recognition_error", (err: any) => {
      logger.error("Speech recognition event error received:", err);
      let userFriendlyMessage = err;
      if (err === "network") {
        userFriendlyMessage = "Speech recognition network error. Chrome's Web Speech API requires connection to Google's online speech servers, which can be restricted in sandboxed iframe or firewalled environments. Please type your message instead.";
      } else if (err === "not-allowed" || err === "permission-denied") {
        userFriendlyMessage = "Microphone access denied. Please grant microphone permissions in your browser.";
      } else if (err === "no-speech") {
        userFriendlyMessage = "No speech detected. Please speak clearly into your microphone.";
      } else if (typeof err === "string" && !err.includes(" ")) {
        userFriendlyMessage = `Microphone service encountered an issue: ${err}`;
      }
      dispatch({ type: "SET_ASSISTANT_ERROR", payload: userFriendlyMessage });
    });

    const cleanSpeechSyntError = eventBus.on("speech_synthesis_error", (err: any) => {
      logger.error("Speech synthesis event error received:", err);
      dispatch({ type: "SET_ASSISTANT_STATUS", payload: "idle" });
      onSetVoiceIntensity?.(0);
      
      // Filter out benign interrupted/canceled events
      if (err && err !== "interrupted" && err !== "canceled" && err !== "cancelled") {
        const userFriendlyMessage = `Audio voice synthesis encountered an issue: ${err}. Please check your audio output device or browser permissions.`;
        dispatch({ type: "SET_ASSISTANT_ERROR", payload: userFriendlyMessage });
      }
    });

    return () => {
      cleanSettingsSub();
      cleanSpeechSyntStart();
      cleanSpeechSyntEnd();
      cleanSpeechSyntError();
      cleanSpeechRecStart();
      cleanSpeechRecEnd();
      cleanSpeechRecError();
    };
  }, [onSetVoiceIntensity]);

  // Core execution routing for actions triggered programmatically by Gemini
  const handleAssistantAction = useCallback((actionType: string, actionPayload: any) => {
    if (!actionType || actionType === "none") return;

    logger.info(`Executing Assistant Trigger Action: [${actionType}]`, actionPayload);

    try {
      switch (actionType) {
        case "create_task": {
          if (onAddTask && actionPayload) {
            const parsedTask = {
              id: generateId("task"),
              title: actionPayload.title || "Voice Assistant Task",
              deadline: actionPayload.deadline || new Date(Date.now() + 86400000).toISOString(),
              notes: actionPayload.notes || "Sourced from Milo Voice Companion",
              priority: actionPayload.priority || "medium",
              category: actionPayload.category || "Do Today"
            };
            onAddTask(parsedTask);
            logger.info("Task added successfully via Voice Action trigger.");
          }
          break;
        }
        case "navigate": {
          if (onNavigateTab && actionPayload?.destination) {
            // Mapping speech destinations to project tab names
            const dest = actionPayload.destination.toLowerCase();
            if (dest.includes("plan") || dest.includes("calendar")) {
              onNavigateTab("planner");
            } else if (dest.includes("focus") || dest.includes("timer")) {
              onNavigateTab("focus");
            } else if (dest.includes("scan") || dest.includes("syllabus")) {
              onNavigateTab("scanner");
            } else if (dest.includes("settings")) {
              onNavigateTab("settings");
            } else {
              onNavigateTab("dashboard");
            }
          }
          break;
        }
        case "trigger_rescue_mode": {
          if (onToggleRescueMode) {
            onToggleRescueMode();
          }
          break;
        }
        default:
          logger.warn(`Unknown action type received: ${actionType}`);
      }
    } catch (err) {
      logger.error(`Failed executing programmatic assistant action:`, err);
    }
  }, [onAddTask, onNavigateTab, onToggleRescueMode]);

  // Main conversational loop
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const chatState = stateRef.current.chat;
    let currentConvId = chatState.activeConversationId;
    let currentConv = chatState.conversations.find(c => c.id === currentConvId);

    // If there is no active conversation, create a new one automatically
    if (!currentConvId || !currentConv) {
      currentConvId = generateId("conv");
      currentConv = {
        id: currentConvId,
        title: text.length > 25 ? `${text.substring(0, 25)}...` : text,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      dispatch({ type: "CREATE_CONVERSATION", payload: currentConv });
    }

    const userMessageId = generateId("msg");
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: text,
      timestamp: Date.now(),
      status: "sent"
    };

    dispatch({
      type: "ADD_MESSAGE",
      payload: { conversationId: currentConvId, message: userMsg }
    });

    const assistantMsgId = generateId("msg");
    const assistantPlaceholderMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      status: "sending"
    };

    dispatch({
      type: "ADD_MESSAGE",
      payload: { conversationId: currentConvId, message: assistantPlaceholderMsg }
    });

    dispatch({ type: "SET_ASSISTANT_STATUS", payload: "thinking" });

    try {
      // Gather current state and parent values for the context payload
      const loadedMemories = stateRef.current.memory.entries;
      const recentMessages = currentConv?.messages.slice(-6) || [];

      const contextPayload = {
        userName: localStorage.getItem("set_acc_name") || "Nitesh",
        currentTime: new Date().toISOString(),
        isRescueMode: parentIsRescueModeRef.current,
        tasks: parentTasksRef.current,
        goals: stateRef.current.planner.goals,
        habits: stateRef.current.planner.habits,
        memories: loadedMemories.map(m => m.content),
        pastConversations: recentMessages.map(m => ({
          role: m.role,
          content: m.content
        }))
      };

      const result = await geminiService.sendVoiceAssistantQuery(text, contextPayload);

      // Programmatically route clock animation triggers
      if (result.clockTrigger && onSetClockMode) {
        onSetClockMode(result.clockTrigger);
      }

      // Update the assistant message with final contents
      const finalizedAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: result.transcript,
        reasoning: result.reasoning,
        timestamp: Date.now(),
        status: "sent"
      };

      // Append suggestions or recommendations inside metadata if available
      if (result.generatedPlan) {
        finalizedAssistantMsg.content += `\n\n### 📋 Focus Strategy\n${result.generatedPlan}`;
      }

      // Dispatch state update
      dispatch({
        type: "UPDATE_MESSAGE_STATUS",
        payload: {
          conversationId: currentConvId,
          messageId: assistantMsgId,
          status: "sent"
        }
      });

      // Edit content directly to append generated strategies
      const updatedConversations = stateRef.current.chat.conversations.map(c => {
        if (c.id === currentConvId) {
          return {
            ...c,
            messages: c.messages.map(m =>
              m.id === assistantMsgId ? finalizedAssistantMsg : m
            )
          };
        }
        return c;
      });

      dispatch({ type: "SET_CONVERSATIONS", payload: updatedConversations });
      storageService.set(STORAGE_KEYS.CHAT_HISTORY, updatedConversations);

      dispatch({ type: "SET_ASSISTANT_STATUS", payload: "idle" });

      // Trigger text-to-speech speak audibly if sound is unmuted and enabled
      if (stateRef.current.assistant.config.voiceEnabled && !stateRef.current.assistant.config.isMuted) {
        speechService.speak(result.transcript, stateRef.current.settings.voice);
      }

      // Handle any triggered programmatic actions
      if (result.actionType) {
        handleAssistantAction(result.actionType, result.actionPayload);
      }

    } catch (error: any) {
      dispatch({
        type: "UPDATE_MESSAGE_STATUS",
        payload: {
          conversationId: currentConvId,
          messageId: assistantMsgId,
          status: "error",
          error: error.message || "An issue occurred. AI analysis unavailable."
        }
      });
      dispatch({ type: "SET_ASSISTANT_STATUS", payload: "error" });
    }
  }, [onSetClockMode, handleAssistantAction]);

  // Trigger mic listening
  const startVoiceSession = useCallback(() => {
    speechService.stopSpeaking();
    speechService.startListening();
  }, []);

  // Stop mic listening
  const stopVoiceSession = useCallback(() => {
    speechService.stopListening();
  }, []);

  const speakText = useCallback((text: string) => {
    speechService.speak(text, state.settings.voice);
  }, [state.settings.voice]);

  // Wire Speech Recognition results back to sendMessage automatically
  useEffect(() => {
    const unsub = eventBus.on("speech_recognition_result", (data) => {
      if (data.final) {
        sendMessage(data.final);
      }
    });
    return () => unsub();
  }, [sendMessage]);

  // Memory management actions
  const addFactMemory = useCallback((content: string, category: MemoryEntry["category"]) => {
    const newEntry: MemoryEntry = {
      id: generateId("mem"),
      content,
      category,
      importance: 5,
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    };
    dispatch({ type: "ADD_MEMORY", payload: newEntry });
    const currentList = [...stateRef.current.memory.entries, newEntry];
    storageService.set(STORAGE_KEYS.MEMORIES, currentList);
  }, []);

  const deleteFactMemory = useCallback((id: string) => {
    dispatch({ type: "DELETE_MEMORY", payload: id });
    const currentList = stateRef.current.memory.entries.filter(m => m.id !== id);
    storageService.set(STORAGE_KEYS.MEMORIES, currentList);
  }, []);

  const updateSettings = useCallback((updates: Partial<SettingsState>) => {
    settingsService.updateSettings(updates);
  }, []);

  const value = {
    state,
    dispatch,
    sendMessage,
    startVoiceSession,
    stopVoiceSession,
    speakText,
    addFactMemory,
    deleteFactMemory,
    updateSettings
  };

  return <MiloContext.Provider value={value}>{children}</MiloContext.Provider>;
}
