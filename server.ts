
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Lazy initializer for Google GenAI to prevent startup crash if API key is missing
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ GEMINI_API_KEY environment variable is not defined. Falling back to structured high-fidelity mock data.");
      return null;
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}


// 1.5 Weather
app.get("/api/weather", async (req, res) => {
  let { lat, lon, city, country } = req.query;

  if ((!lat || !lon) && (!city)) {
    return res.status(400).json({ error: "Missing latitude/longitude OR city" });
  }

  try {
    if (!lat || !lon) {
      // Geocode
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city as string)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        return res.status(404).json({ error: "Location not found" });
      }
      lat = geoData.results[0].latitude;
      lon = geoData.results[0].longitude;
    }

    const [forecastRes, airQualityRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=uv_index_max&timezone=auto`),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi`)
    ]);

    const forecastData = await forecastRes.json();
    const airQualityData = await airQualityRes.json();

    res.json({
      temperature: forecastData.current.temperature_2m,
      humidity: forecastData.current.relative_humidity_2m,
      rain: forecastData.current.precipitation,
      windSpeed: forecastData.current.wind_speed_10m,
      uvIndex: forecastData.daily.uv_index_max[0],
      aqi: airQualityData.current.european_aqi,
      conditionCode: forecastData.current.weather_code
    });
  } catch (error) {
    console.error("Weather API error:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

// 1. AI Deadline Intelligence
app.post("/api/ai/deadline-intelligence", async (req, res) => {
  const {
    taskName,
    deadline,
    notes = "",
    priority = "Medium",
    existingTasks = [],
    userWorkSchedule = "Standard 9-5",
    habits = [],
    travelPlans = "none",
    medicineSchedule = [],
    focusSessions = {},
    previousProductivityHistory = {}
  } = req.body;

  if (!taskName || !deadline) {
    return res.status(400).json({ error: "Missing required fields taskName and deadline" });
  }

  const runFallback = () => {
    const hasOverlap = existingTasks.length > 0;
    const isUrgent = priority === "Urgent" || priority === "High";
    const riskScoreValue = hasOverlap ? (isUrgent ? 78 : 55) : 18;
    const confidencePercent = 100 - riskScoreValue;
    const riskLevelStr = riskScoreValue > 70 ? "High" : riskScoreValue > 40 ? "Medium" : "Low";

    return {
      difficulty: isUrgent ? "High" : "Medium",
      estimatedWorkHours: isUrgent ? "12 Hours" : "8 Hours",
      recommendedSessionsCount: isUrgent ? 6 : 4,
      dailyTargetHours: isUrgent ? "3 Hours" : "2 Hours",
      confidenceScore: `${confidencePercent}%`,
      riskLevel: riskLevelStr,
      bestStartTime: "Today, 6:00 PM",
      latestSafeStartTime: "Tomorrow, 9:00 AM",
      predictedCompletion: "2 Days Before Deadline",
      riskScore: riskScoreValue,
      completionProbability: confidencePercent,
      delayReason: hasOverlap 
        ? "Potential resource conflict with overlapping deadlines in your queue." 
        : "None, schedule is clear and effort matches history.",
      milestones: [
        { title: "Research", duration: "2 Hours", priority: "High", suggestedDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], completed: false },
        { title: "Implementation", duration: "3 Hours", priority: "Medium", suggestedDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], completed: false },
        { title: "Testing", duration: "1 Hour", priority: "Low", suggestedDate: new Date(Date.now() + 259200000).toISOString().split('T')[0], completed: false },
        { title: "Documentation", duration: "1 Hour", priority: "Low", suggestedDate: new Date(Date.now() + 259200000).toISOString().split('T')[0], completed: false },
        { title: "Revision", duration: "0.5 Hours", priority: "Low", suggestedDate: new Date(Date.now() + 345600000).toISOString().split('T')[0], completed: false },
        { title: "Submission", duration: "0.5 Hours", priority: "High", suggestedDate: new Date(Date.now() + 345600000).toISOString().split('T')[0], completed: false }
      ],
      suggestions: [
        "Start today to avoid last-minute pressure.",
        "Split into focus blocks of 90 minutes.",
        hasOverlap ? "Avoid scheduling tomorrow due to an existing deadline conflict." : "Move focus sessions to morning hours based on productivity peaks.",
        "Ensure medication is taken before starting high-focus milestones."
      ],
      fallback: true
    };
  };

  const client = getGeminiClient();
  if (!client) {
    return res.json(runFallback());
  }

  try {
    const prompt = `Analyze this deadline, task, and the user's complete schedule and life context for high-precision risk assessment, and break it down into an execution plan.

USER CONTEXT:
- Work Schedule: ${JSON.stringify(userWorkSchedule)}
- Habits / Goals: ${JSON.stringify(habits)}
- Travel Plans: ${JSON.stringify(travelPlans)}
- Medicine Schedule: ${JSON.stringify(medicineSchedule)}
- Focus Sessions / Active cooldowns: ${JSON.stringify(focusSessions)}
- Previous Productivity History (ignored, closed, completed tasks): ${JSON.stringify(previousProductivityHistory)}

NEW TASK TO ANALYZE:
- Title: "${taskName}"
- Deadline Date & Time: "${deadline}"
- Priority: "${priority}"
- Description/Notes: "${notes}"

EXISTING OVERLAPPING DEADLINES/TASKS:
${JSON.stringify(existingTasks)}

Your task is to analyze the user's complete context and the new task to calculate realistic risks, estimate workload, calculate difficulty, check calendars for conflicts, check existing deadlines, estimate focus hours needed, generate an execution strategy, and build a milestone plan.

CRITICAL RISK CALCULATION RULE:
- If there is only one simple task (the new one) in existingTasks, the risk MUST remain low.
- If there are multiple overlapping deadlines or tight/conflicting schedules, the risk should increase appropriately based on real overlap and constraints. Never use fixed percentages.

Generate a highly structured JSON response with the following keys:
- difficulty: One of "Low", "Medium", "High", "Critical".
- estimatedWorkHours: Estimated active work hours (e.g., "8 Hours" or "15 Hours").
- recommendedSessionsCount: Recommended number of focus sessions (e.g., 4).
- dailyTargetHours: Recommended hours to spend per day (e.g., "2 Hours").
- confidenceScore: Confidence score percentage (e.g., "94%").
- riskLevel: Risk category ("Low", "Medium", "High").
- bestStartTime: The ideal start time (e.g., "Today, 6:00 PM").
- latestSafeStartTime: The latest possible start time to avoid extreme stress (e.g., "Tomorrow, 9:00 AM").
- predictedCompletion: Estimated completion timeline relative to deadline (e.g., "2 Days Before Deadline").
- riskScore: Numeric risk score 0-100 (for progress bars/metrics).
- completionProbability: Numeric completion likelihood 0-100.
- delayReason: Summary of the main factor increasing risk or conflict.
- milestones: An array of 4 to 6 milestones spanning the project timeline (e.g. Research, Implementation, Testing, etc.). Each milestone must have:
  - title: Name of milestone (e.g., "Research", "Implementation", "Testing", "Documentation", "Revision", "Submission")
  - duration: Estimated duration (e.g., "2 Hours")
  - priority: Priority of this milestone ("Low", "Medium", "High")
  - suggestedDate: Target completion date for this milestone in YYYY-MM-DD format
  - completed: false
- suggestions: An array of 3 to 5 clear, highly actionable and highly contextual tips generated dynamically from the user's actual data (e.g., overlapping meetings, productivity history, medication times, habits, or sleep cycle). For example: "Start today to avoid last-minute pressure", "Avoid scheduling tomorrow due to an existing meeting", "Move focus session to morning based on your productivity history", etc.
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            difficulty: { type: Type.STRING },
            estimatedWorkHours: { type: Type.STRING },
            recommendedSessionsCount: { type: Type.INTEGER },
            dailyTargetHours: { type: Type.STRING },
            confidenceScore: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
            bestStartTime: { type: Type.STRING },
            latestSafeStartTime: { type: Type.STRING },
            predictedCompletion: { type: Type.STRING },
            riskScore: { type: Type.INTEGER },
            completionProbability: { type: Type.INTEGER },
            delayReason: { type: Type.STRING },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  suggestedDate: { type: Type.STRING },
                  completed: { type: Type.BOOLEAN }
                },
                required: ["title", "duration", "priority", "suggestedDate", "completed"]
              }
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: [
            "difficulty",
            "estimatedWorkHours",
            "recommendedSessionsCount",
            "dailyTargetHours",
            "confidenceScore",
            "riskLevel",
            "bestStartTime",
            "latestSafeStartTime",
            "predictedCompletion",
            "riskScore",
            "completionProbability",
            "delayReason",
            "milestones",
            "suggestions"
          ]
        }
      }
    });

    if (response.text) {
      return res.json(JSON.parse(response.text.trim()));
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (error: any) {
    console.warn("Gemini Deadline Intelligence Error:", error);
    console.warn("Error details:", JSON.stringify(error, null, 2));
    console.warn("Falling back to local fallback data due to Gemini API Error / Rate limits.");
    return res.json({ ...runFallback(), apiError: true, apiErrorMessage: error.message });
  }
});

// 1.5. Real-Time Translation & Language Simplification
app.post("/api/ai/translate", async (req, res) => {
  const { text, targetLanguage, explanationLevel = "Student", learningMode = false } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing required 'text' parameter." });
  }

  const runFallback = () => {
    const levels: Record<string, string> = {
      Beginner: "Simplified to basic concepts without industry jargon.",
      Student: "Explained clearly with academic structure.",
      Professional: "Refined with technical terminology suitable for workplace use.",
      Expert: "Optimized with advanced research methodology terminology."
    };
    
    return {
      translatedText: targetLanguage === "English" ? text : `[${targetLanguage} Translation] ${text}`,
      originalLanguage: "Detected",
      simplifiedExplanation: `Adapted for ${explanationLevel}: ${levels[explanationLevel] || ""}`,
      fallback: true
    };
  };

  const client = getGeminiClient();
  if (!client) {
    return res.json(runFallback());
  }

  try {
    let prompt = `You are a real-time professional academic and productivity translator.
Translate the following source text accurately into "${targetLanguage}".
`;

    if (explanationLevel) {
      prompt += `Additionally, adapt and simplify the explanation level to suit a "${explanationLevel}".
- "Beginner": Extremely simple terms, zero jargon, conversational.
- "Student": Direct, supportive, structured, educational.
- "Professional": Expert terminology, elegant, precise, concise.
- "Expert": High-level research terminology, deeply analytical.
`;
    }

    if (learningMode) {
      prompt += `Format the response to provide the translation, but also include a side-by-side bilingual learning hint (e.g. original with phonetic pronunciation or equivalent translation comparison) if appropriate.`;
    }

    prompt += `
Source Text:
"${text}"

Return a structured JSON containing:
1. "translatedText": The accurate translation.
2. "originalLanguage": The detected language of the source text.
3. "simplifiedExplanation": A brief simplified explanation of the concept (if explanationLevel is requested).
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: { type: Type.STRING },
            originalLanguage: { type: Type.STRING },
            simplifiedExplanation: { type: Type.STRING }
          },
          required: ["translatedText", "originalLanguage"]
        }
      }
    });

    if (response.text) {
      return res.json(JSON.parse(response.text.trim()));
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (error: any) {
    console.warn("Gemini Translation Error:", error);
    console.warn("Falling back to local fallback data due to Gemini API Error / Rate limits.");
    return res.json({ ...runFallback(), apiError: true, apiErrorMessage: error.message });
  }
});

// 2. Intelligent Task Prioritization
app.post("/api/ai/task-priority", async (req, res) => {
  const { tasks } = req.body;
  if (!tasks || !Array.isArray(tasks)) {
    return res.status(400).json({ error: "Missing required array 'tasks'" });
  }

  const runFallback = () => {
    const categorized = tasks.map((t, idx) => {
      let category = "Can Wait";
      let justification = "This task has standard urgency and can be scheduled later.";
      if (idx === 0) {
        category = "Do Now";
        justification = "Extremely urgent with impending deadline.";
      } else if (idx === 1) {
        category = "Do Today";
        justification = "Requires completion today to keep the momentum.";
      } else if (idx === 4) {
        category = "Delegate";
        justification = "Low complexity task that is best passed to a peer.";
      } else if (idx === 5) {
        category = "Ignore";
        justification = "Low-value administrative item with no real impact.";
      }
      return { taskId: t.id, category, justification };
    });
    return { prioritizedTasks: categorized, fallback: true };
  };

  const client = getGeminiClient();
  if (!client) {
    return res.json(runFallback());
  }

  try {
    const prompt = `Classify the following tasks into 5 prioritization categories: 'Do Now' (extremely critical, immediate), 'Do Today' (high priority for today), 'Can Wait' (schedule for later), 'Delegate' (can be handed off), or 'Ignore' (low value, eliminate). Evaluate based on deadlines and notes.
Tasks:
${JSON.stringify(tasks, null, 2)}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prioritizedTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  taskId: { type: Type.STRING },
                  category: { type: Type.STRING, description: "Do Now | Do Today | Can Wait | Delegate | Ignore" },
                  justification: { type: Type.STRING, description: "Why this was assigned to this category" }
                },
                required: ["taskId", "category", "justification"]
              }
            }
          },
          required: ["prioritizedTasks"]
        }
      }
    });

    if (response.text) {
      return res.json(JSON.parse(response.text.trim()));
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (error: any) {
    console.warn("Gemini Task Priority Error:", error);
    console.warn("Falling back to local fallback data due to Gemini API Error / Rate limits.");
    return res.json({ ...runFallback(), apiError: true, apiErrorMessage: error.message });
  }
});

// 3. Autonomous Task Planning
app.post("/api/ai/task-planning", async (req, res) => {
  const { taskTitle, dueDate } = req.body;
  if (!taskTitle) {
    return res.status(400).json({ error: "Missing required field 'taskTitle'" });
  }

  const runFallback = () => {
    return {
      subtasks: [
        { title: "Initial literature survey & outline creation", durationStr: "1.5 hours", milestoneIndex: 0, riskLevel: "low" },
        { title: "Deep-dive data collection or research", durationStr: "3.5 hours", milestoneIndex: 1, riskLevel: "medium" },
        { title: "First complete draft preparation", durationStr: "4 hours", milestoneIndex: 2, riskLevel: "high" },
        { title: "Proofreading, citation checks & spelling review", durationStr: "1.5 hours", milestoneIndex: 3, riskLevel: "low" },
        { title: "Final PDF formatting and submission portal upload", durationStr: "1 hour", milestoneIndex: 4, riskLevel: "low" }
      ],
      fallback: true
    };
  };

  const client = getGeminiClient();
  if (!client) {
    return res.json(runFallback());
  }

  try {
    const prompt = `Create a realistic breakdown/milestone plan for completing this task before its deadline:
Task: "${taskTitle}"
Due Date: "${dueDate || "No date provided"}"

Generate a chronological plan of 4 to 6 milestone subtasks, each with an estimated duration, milestone index, and a risk level (low, medium, or high).`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  durationStr: { type: Type.STRING, description: "e.g., '2 hours' or '1 day'" },
                  milestoneIndex: { type: Type.INTEGER },
                  riskLevel: { type: Type.STRING, description: "low | medium | high" }
                },
                required: ["title", "durationStr", "milestoneIndex", "riskLevel"]
              }
            }
          },
          required: ["subtasks"]
        }
      }
    });

    if (response.text) {
      return res.json(JSON.parse(response.text.trim()));
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (error: any) {
    console.warn("Gemini Task Planning Error:", error);
    console.warn("Falling back to local fallback data due to Gemini API Error / Rate limits.");
    return res.json({ ...runFallback(), apiError: true, apiErrorMessage: error.message });
  }
});

// 4. Dynamic Replanning Engine
app.post("/api/ai/replanning-engine", async (req, res) => {
  const { tasks, missedTaskIndex } = req.body;
  if (!tasks || !Array.isArray(tasks)) {
    return res.status(400).json({ error: "Missing required parameter 'tasks'" });
  }

  const runFallback = () => {
    return {
      recoveryPlan: "Emergency recovery activated: Shift research hours to late evening, condense the draft review phase by 50%, and schedule a dedicated focus block tomorrow morning. Critical path secured.",
      rearrangedTimeline: tasks.map((t, idx) => ({
        ...t,
        newTime: idx >= missedTaskIndex ? "Rescheduled & Compacted" : t.time || "Unchanged"
      })),
      fallback: true
    };
  };

  const client = getGeminiClient();
  if (!client) {
    return res.json(runFallback());
  }

  try {
    const prompt = `We have missed a milestone in our project. Help us replan.
All Milestones: ${JSON.stringify(tasks, null, 2)}
Missed Milestone Index: ${missedTaskIndex}

Generate a sharp, motivational 1-paragraph recovery plan to recover from this delay, and provide a updated list of milestones showing how they shift or compress to guarantee on-time completion.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recoveryPlan: { type: Type.STRING, description: "Brief advice on how to recover" },
            rearrangedTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  status: { type: Type.STRING },
                  newTime: { type: Type.STRING, description: "New scheduled time/duration slot" }
                },
                required: ["title", "newTime"]
              }
            }
          },
          required: ["recoveryPlan", "rearrangedTimeline"]
        }
      }
    });

    if (response.text) {
      return res.json(JSON.parse(response.text.trim()));
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (error: any) {
    console.warn("Gemini Replanning Error:", error);
    console.warn("Falling back to local fallback data due to Gemini API Error / Rate limits.");
    return res.json({ ...runFallback(), apiError: true, apiErrorMessage: error.message });
  }
});

// 5. Context-Aware Productivity Coach
app.post("/api/ai/coach", async (req, res) => {
  const { currentTaskCount, deadlineProximity, energyLevel } = req.body;

  const runFallback = () => {
    return {
      recommendation: "Concentrate strictly on the primary bottleneck first. You have adequate cognitive runway if you initiate a focused 45-minute sprint now.",
      warning: "Attempting complex tasks later tonight with low energy increases risk of structural errors. Move lightweight preparation tasks to tonight.",
      fallback: true
    };
  };

  const client = getGeminiClient();
  if (!client) {
    return res.json(runFallback());
  }

  try {
    const prompt = `As an elite AI Productivity Chief-of-Staff, give a single highly actionable productivity advice point for a user with:
- Total tasks on desk: ${currentTaskCount || 4}
- Urgently pending tasks: ${deadlineProximity || "Due in 24 hours"}
- Current Energy level: ${energyLevel || "Medium"}

Give one practical, direct recommendation, and a quick context warning. Make it short, expert, and professional.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { type: Type.STRING, description: "Immediate, specific advice" },
            warning: { type: Type.STRING, description: "Critical trap to avoid right now" }
          },
          required: ["recommendation", "warning"]
        }
      }
    });

    if (response.text) {
      return res.json(JSON.parse(response.text.trim()));
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (error: any) {
    console.warn("Gemini Coach Error:", error);
    console.warn("Falling back to local fallback data due to Gemini API Error / Rate limits.");
    return res.json({ ...runFallback(), apiError: true, apiErrorMessage: error.message });
  }
});

// 6. Voice Assistant
function getVoiceAssistantFallback(query: string) {
  // Structured dynamic offline fallback data depending on query intent
  const lowercase = query.toLowerCase();
  let trigger = "pulse";
  let reasoning = "Local failsafe activated. I have conducted an instant triage of your active work environment. Your attention assets are currently compressed due to upcoming timelines.";
  let generatedPlan = "Initiate an aggressive focus sprint immediately. Minimize peripheral admin overhead and allocate 1.5-hour blocks for core research phases.";
  let priorityList = ["1. [CRITICAL] High-risk assignment milestones", "2. [HIGH] Core textbook or literature review", "3. [MEDIUM] Formatting, citation & proofreading checks"];
  let timeline = ["09:00 AM - Deep focus research session", "11:30 AM - Quick review & drafting milestone", "03:00 PM - Final validation & packaging"];
  let riskAssessment = "Predictive Risk Model: 65% chance of deadline delays if deep work blocks are not committed within the next 4 hours. High density of tasks detected.";
  let recommendedActions = ["Set deep focus timer for 45 minutes right now.", "Acknowledge upcoming warning triggers on your dashboard.", "Review your uploaded syllabus files for extra criteria."];

  let actionType = "none";
  let actionPayload: any = {};
  let transcript = `I have received your offline command regarding "${query}". Based on your active workspace, let's maintain alignment. I suggest jumping into focus mode to execute.`;

  if (lowercase.includes("hi") || lowercase.includes("hello") || lowercase.includes("hey") || lowercase.includes("morning")) {
    transcript = "Hello Nitesh 👋 What would you like me to help you with today? I can help you plan your day, scan events, check medicine reminders, or analyze your syllabus.";
  } else if (lowercase.includes("add") || lowercase.includes("create") || lowercase.includes("remind") || lowercase.includes("task") || lowercase.includes("todo")) {
    actionType = "create_task";
    let title = "Verbal Task Reminder";
    let category = "Do Today";
    let priority = "medium";
    let deadline = "Tomorrow";

    const match = query.match(/(?:add|create|remind me to)\s+(?:a\s+)?(?:task\s+to\s+)?([^,.]+)/i);
    if (match && match[1]) {
      title = match[1].trim();
      if (title.toLowerCase().includes("tomorrow")) {
        title = title.replace(/tomorrow/i, "").trim();
        deadline = "Tomorrow";
      } else if (title.toLowerCase().includes("friday")) {
        title = title.replace(/on friday|friday/i, "").trim();
        deadline = "Friday";
      } else if (title.toLowerCase().includes("today")) {
        title = title.replace(/today/i, "").trim();
        deadline = "Today";
      }
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }

    if (lowercase.includes("now") || lowercase.includes("urgent") || lowercase.includes("immediate")) {
      category = "Do Now";
      priority = "high";
    } else if (lowercase.includes("later") || lowercase.includes("wait")) {
      category = "Can Wait";
      priority = "low";
    }

    actionPayload = {
      title,
      deadline,
      priority,
      category,
      notes: "Parsed locally via fallback voice processing"
    };

    transcript = `I have added a new task "${title}" to your scheduler due ${deadline}. Let's secure this on your timeline.`;
    reasoning = `A new Task was added: "${title}".`;
    generatedPlan = `Task: ${title}\nDeadline: ${deadline}\nCategory: ${category}\nPriority: ${priority}\n\nI have loaded this item into your schedule cockpit. Let me know if you would like to schedule focus sessions for it.`;
  } else if (lowercase.includes("plan") || lowercase.includes("week") || lowercase.includes("schedule")) {
    trigger = "timeline";
    transcript = "Here is your custom daily pacing and execution schedule. I recommend completing major tasks early to avoid academic fatigue.";
    reasoning = "I've structured an optimized academic calendar projection based on your pending tasks. By balancing high-effort deliverables early in the week, we mitigate late-stage grade compression.";
    generatedPlan = "Weekly Acceleration Strategy: Complete 60% of research writing by Wednesday, allowing Thursday for revision cycles, and Friday morning for citation checks and submission portals.";
    priorityList = ["1. Draft core project sections (8h est)", "2. Research peer-reviewed citations", "3. Complete pending weekly habits"];
    timeline = ["Monday - Literature review and core brief outline", "Wednesday - Section writing and flowchart drafting", "Friday - Final verification and PDF submission"];
    riskAssessment = "Conflict Matrix: Low risk if weekly blocks are respected. Moderate risk if review stages are pushed past Thursday evening.";
    recommendedActions = ["Create today's first planned calendar block.", "Check details on your most urgent course task.", "Align priorities with team members if active."];
  } else if (lowercase.includes("risk") || lowercase.includes("likely") || lowercase.includes("fail") || lowercase.includes("safe")) {
    trigger = "gauge";
    transcript = "Warning: Multiple deadlines overlap on your critical path. I have calculated a higher risk score today.";
    reasoning = "Your timeline audit indicates standard scheduling compression. Multiple deadlines overlap on the critical path, suggesting potential resource bottlenecks if task switches occur frequently.";
    generatedPlan = "Risk Mitigation Blueprint: Isolate CS102 deliverables. Apply emergency compression rules to intermediate milestones (+35% time savings) to establish a buffer.";
    priorityList = ["1. [CRITICAL] High-risk timeline deliverables", "2. [ELEVATED] Overlapping course tasks", "3. [STABLE] Low-effort administrative items"];
    timeline = ["Hour 1-2: Eliminate distractions, mute Slack/Discord, and execute draft section.", "Hour 3: Submit early draft to peer reviewer.", "Hour 4: Final formatting check."];
    riskAssessment = "Overlapping Risk: Predictive score of 78% delay risk due to tight deadlines. Task context switching remains the primary performance threat.";
    recommendedActions = ["Mute all notifications and enter Focus Mode.", "Acknowledge high-priority alerts to engage cooldown shields.", "De-congest timeline cockpit immediately."];
  } else if (lowercase.includes("work") || lowercase.includes("next") || lowercase.includes("priority")) {
    trigger = "timeline";
    transcript = "I recommend working on your highest-risk task next, as it contributes to 75% of your immediate scheduling pressure.";
    reasoning = "I have conducted a priority mapping sweep. Your task 'CS102 Final Project' represents 75% of your immediate deadline pressure. Initiating action here creates the highest cognitive decompression.";
    generatedPlan = "Priority Execution Sequence: Isolate the largest active outline block, execute draft sections in focused intervals, and hold final formatting review for later.";
    priorityList = ["1. CS102 Project - Core Section Writing", "2. Read literature guidelines", "3. Schedule peer feedback check"];
    timeline = ["Next 45 mins: Uninterrupted writing sprint", "Break: 5 mins physical pacing", "Next 45 mins: Citation and formatting checks"];
    riskAssessment = "Friction Assessment: High initial cognitive friction. Overcoming the initial 15-minute start block decreases task failure rate by 80%.";
    recommendedActions = ["Open the CS102 task description panel.", "Trigger 'Do Now' classification for high-urgency items.", "Start 25-minute Pomodoro focus block."];
  } else if (lowercase.includes("rescue") || lowercase.includes("recovery") || lowercase.includes("emergency") || lowercase.includes("save")) {
    trigger = "timer";
    transcript = "Emergency recovery plan compiled. I have auto-compressed your scheduling weights by 45% to help you catch up.";
    reasoning = "Emergency Rescue Protocols activated. I have conducted an exhaustive sweep of all deadline risks and auto-compressed your scheduling weights by 45%.";
    generatedPlan = "Emergency Triage Roadmap: Postpone non-critical habits, compress research phases, and implement a dedicated high-intensity focus block today to secure the critical path.";
    priorityList = ["1. [EMERGENCY] Complete core project components", "2. [MANDATORY] Citation check & spelling review", "3. [PAUSED] Non-critical habits or study notes"];
    timeline = ["Now: 90-minute hyper-focus block", "2:00 PM: Critical requirements validation check", "4:00 PM: Final submission portal upload"];
    riskAssessment = "Emergency Status: Critical timeline compression. Probability of success raised to 85% with active triage protocols.";
    recommendedActions = ["Click 'Create Recovery Plan' inside the emergency prompt.", "Acknowledge any outstanding timeline warnings.", "Commit to a 90-minute focus block immediately."];
  }

  const defaultFallbackChips = [
    { label: "📅 Plan My Day", cmd: "Plan my day" },
    { label: "🎯 What should I do next?", cmd: "What should I do next?" },
    { label: "💊 Medicine Reminder", cmd: "When is my next medicine?" },
    { label: "📅 Upcoming Deadlines", cmd: "Show my upcoming deadlines" }
  ];

  return {
    transcript,
    reasoning,
    generatedPlan,
    priorityList,
    timeline,
    riskAssessment,
    recommendedActions,
    clockTrigger: trigger,
    actionType,
    actionPayload,
    suggestedChips: defaultFallbackChips,
    fallback: true
  };
}

app.post("/api/ai/voice-assistant", async (req, res) => {
  const { query, context = {} } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Missing required field 'query'" });
  }

  const client = getGeminiClient();
  if (!client) {
    return res.json({
      ...getVoiceAssistantFallback(query)
    });
  }

  try {
    const prompt = `You are Chief (or Milo), an AI Chief of Staff that serves as:
- Task Orchestrator: Break down work into executable blocks
- Travel Intelligence: Real-time route planning with weather/AQI/safety
- Accessibility Companion: Voice-first interface for blind/low-vision users
- Execution Copilot: Time-based notifications and smart scheduling
- Risk Analyst: Predict delays, suggest alternatives, optimize routes

Your mission: Convert vague requests into precise, actionable plans with real-time intelligence.

Current Local Time & Date: ${context.currentTime || new Date().toISOString()}
Current Location: ${context.currentLocation || "Unknown Location"}
Current Weather Context: ${JSON.stringify(context.weather || { temperature: 24, condition: "Clear", aqi: 45, rain: 0 })}
Active Workspace / Tab the user was in before opening voice: ${context.activeWorkspace || "dashboard"}
User Profile Name: ${context.userName || "Nitesh"}

User Query: "${query}"

Active System Context:
- Tasks/Schedules: ${JSON.stringify(context.tasks || [])}
- Uploaded Handouts/Syllabi: ${JSON.stringify(context.scannedDocs || [])}
- Active Medicine Schedule: ${JSON.stringify(context.medications || [])}
- Active Calendar Blocks: ${JSON.stringify(context.calendarEvents || [])}
- Active Career / Success Plans (Roadmaps): ${JSON.stringify(context.successPlans || [])}
- Active Focus Stats: ${JSON.stringify(context.focusStats || [])}
- Scanned Events: ${JSON.stringify(context.scannedEvents || [])}
- Goals: ${JSON.stringify(context.goals || [])}
- Habits: ${JSON.stringify(context.habits || [])}
- Notifications: ${JSON.stringify(context.notifications || [])}
- Is Rescue Mode Active? ${context.isRescueMode ? "Yes" : "No"}
- Travel Planner State: ${JSON.stringify(context.travel || {})}
- Conversation History / Previous Context: ${JSON.stringify(context.pastConversations || [])}

==================================================
CRITICAL RULE: ALWAYS DIFFERENTIATE RESPONSES
==================================================
Every query requires you to:
1. Identify the request type (task, travel, info, scheduling, voice command)
2. Provide SPECIFIC, different responses (never give generic answers)
3. Never repeat the same response twice - each answer must be unique and contextual
4. Ask clarifying questions if intent is ambiguous
5. Provide real-time, accurate data (not generic templates)

==================================================
REQUEST TYPE DETECTION & RESPONSE PATTERNS
==================================================

--------------------------------------------------
TYPE 1: WORK/TASK PLANNING
--------------------------------------------------
When user asks about work, assignments, projects, deadlines:
- DO: Break into time-blocks with specific durations. Identify actual deadlines from context. Estimate effort realistically. Flag resource/skill gaps. Suggest parallel work opportunities. Provide minute-by-minute breakdown if urgent.
- DON'T: Give generic "you got this" encouragement, repeat previous responses, ignore specific constraints user mentioned, or provide vague time estimates.
- Examples:
  - User: "I have an ML paper due Friday" -> Provide extraction, subtasks, timeline.
  - User: "I have 3 assignments due Friday" -> Triage by weight, suggest reordering, identify conflicts.
  - User: "I haven't started my project" -> Emergency rescue mode, show survival plan.
Make each response DIFFERENT based on the user's specific situation.

--------------------------------------------------
TYPE 2: TRAVEL & LOCATION PLANNING
--------------------------------------------------
When user asks about going places, navigation, traffic, weather:
- MUST DO:
  1. Acquire exact user location from context or device GPS (stored in format: {latitude, longitude, city, address}). Verify: "Starting from [USER'S EXACT LOCATION], correct?".
  2. Destination clarification: Ask: "Going to which SBI Bank?" (not just "nearby SBI"). List options with branch names + distances, user selects.
  3. Real-time route intelligence: Calculate actual route from GPS/map contexts. Return distance, travel time, traffic conditions, toll info.
  4. Weather & Environmental Data (at destination): Temperature, AQI (Air Quality Index), wind speed, UV index, humidity, rainfall probability, and visibility.
  5. Safety & Accessibility: Nearby hospitals, police stations, pharmacies (with distances), emergency contacts, road conditions, and lighting status (night travel warning).
  6. Nearby Essentials: Coffee shops, ATMs, gas stations, food stops, restrooms (all with ACTUAL distances).
  7. Multi-transport options: Driving, public transit, walking, cycling, with cost estimates.
  8. Time-based planning: E.g., "Leaving at 2 PM -> arrive 3:45 PM". Traffic delays: "High congestion expected 4-6 PM, leave by 3 PM". Weather impact: "Rain likely, add 15 min to travel time". Add to calendar, set departure reminders.
- NEVER: Show random far away locations, give generic traffic/weather, miss user's actual location, show impossible distances, or ignore user's accessibility needs.

--------------------------------------------------
TYPE 3: VOICE COMMANDS (Accessibility First)
--------------------------------------------------
When user gives voice input (treating as blind/low-vision user):
- MUST DO:
  1. Voice-to-Action mapping: e.g. "Add task: write report" -> Confirm details audibly. "Navigate to coffee" -> Read turn-by-turn aloud. "What time should I leave?" -> Precise, audible time. "Remind me at 3 PM" -> Confirm time in 12/24-hour format.
  2. Audible feedback (not visual): Read everything aloud. Use clear, distinct voice. Spell out numbers. Pause between sections for listening.
  3. No visual assumptions: Don't say "see the map" -> say "Navigate: turn right in 50 meters, then left". Don't say "click this button" -> say "Say 'Add Task' or press space". Don't describe colors -> describe locations/directions.
  4. Confirmation loops: "Adding task: 'Write ML paper, due Friday 11 PM, 8 hours'. Is this correct? Say yes to confirm, or correct me." Wait for explicit yes/no.
  5. Context memory: Remember recent tasks. "You mentioned ML paper earlier. Related to that?" Build session history.
- NEVER: Assume user can see, use visual terms, skip confirmation for important actions, speak too fast or unclearly, or ignore voice input.

--------------------------------------------------
TYPE 4: SMART SCHEDULING & NOTIFICATIONS
--------------------------------------------------
When user plans time-blocked activities:
- MUST DO:
  1. Parse time requests precisely: User says "Plan my day" -> Ask what activities. User says "I have meetings at 2, 3, 5 PM" -> Build schedule around these. User says "I need 4 hours for work tomorrow" -> Suggest time blocks.
  2. Create time-based itinerary.
  3. Set smart notifications: 15-min before task start, at start time, midway, before travel, and at destination.
  4. Adjust for variables: Traffic delays, weather, task overrun.
  5. Calendar integration: Check for conflicts, block time, send invites.
- NEVER: Set reminder without specifying exact time, create overlapping/impossible schedules, miss travel time in calculation, or ignore existing commitments.

--------------------------------------------------
TYPE 5: MULTI-PURPOSE QUERIES (Complex Requests)
--------------------------------------------------
When user asks about multiple things simultaneously (e.g., "I need to go to the bank, then work on my project, and there's a meeting at 5 PM"):
- DO:
  1. Parse all constraints (locations, durations, times, traffic, current time).
  2. Build an integrated chronological plan.
  3. Flag issues: E.g., "Only 1 hour 20 min for project work before meeting. Is this enough?"
  4. Offer alternatives.
  5. Set reminders for transitions.

==================================================
MAP & LOCATION INTEGRATION
==================================================
DO NOT show random far-away locations. Always assume the user's location is verified relative to their active position. Calculate real distances correctly (using actual routes). Fill "Current Location" in UI automatically and geocode accurately.

==================================================
WEATHER & AQI INTEGRATION
==================================================
Provide actual temperature, feels like, humidity, wind, AQI, UV index, rainfall probability, and visibility.

==================================================
ACTION TRACKING & CLOCK METRICS
==================================================
Map user commands to appropriate actions and select the correct clockTrigger mood:
- 'create_task': Set payload with title, deadline, priority, category, and notes.
- 'create_medicine': Set payload with title, deadline, and notes.
- 'navigate': Set payload with destination and routeInstructions.
- 'none': If no programmatic action is needed.

Set "clockTrigger" to:
- 'scanner' (documents, briefings, syllabus)
- 'timeline' (daily schedules, focus pipelines, calendars)
- 'gauge' (deadline risks, delay likelihoods)
- 'event' (notifications, meetings, calendar matches)
- 'timer' (active focus blocks, emergency mode)
- 'progress' (placement roadmaps, goals, habits completed)
- 'pulse' (standard greetings, jokes, general knowledge)

==================================================
OUTPUT SCHEMA COMPLIANCE
==================================================
Return a structured JSON matching the requested schema. Ensure suggestedChips is always populated with 3 to 6 contextually appropriate quick action options.
Do not use generic templates or make up unrealistic distances (like 1135 km to a local bank). Be precise. Be real. Be helpful.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            generatedPlan: { type: Type.STRING },
            priorityList: { type: Type.ARRAY, items: { type: Type.STRING } },
            timeline: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskAssessment: { type: Type.STRING },
            recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
            clockTrigger: { type: Type.STRING },
            actionType: { type: Type.STRING },
            actionPayload: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                deadline: { type: Type.STRING },
                priority: { type: Type.STRING },
                category: { type: Type.STRING },
                notes: { type: Type.STRING },
                destination: { type: Type.STRING },
                eta: { type: Type.STRING },
                routeInstructions: { type: Type.STRING }
              }
            },
            suggestedChips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  cmd: { type: Type.STRING }
                },
                required: ["label", "cmd"]
              }
            }
          },
          required: [
            "transcript",
            "reasoning",
            "generatedPlan",
            "priorityList",
            "timeline",
            "riskAssessment",
            "recommendedActions",
            "clockTrigger",
            "actionType",
            "suggestedChips"
          ]
        }
      }
    });

    if (response.text) {
      return res.json(JSON.parse(response.text.trim()));
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (error: any) {
    console.warn("Gemini Voice Assistant Error (falling back):", error);
    return res.json({
      ...getVoiceAssistantFallback(query)
    });
  }
});

// 7. PDF / Assignment Intelligence File Upload Analyzer
app.post("/api/ai/analyze-pdf", async (req, res) => {
  const { fileName, fileText, aiLanguage = "English" } = req.body;
  if (!fileName || !fileText) {
    return res.status(400).json({ error: "Missing required file information" });
  }

  const runFallback = () => {
    return {
      title: fileName.replace(/\.[^/.]+$/, ""),
      deadlines: ["Interim Milestone: Friday at 11:59 PM", "Final Submission: Next Tuesday at 4:00 PM"],
      keyRequirements: [
        "Include a minimum of 5 peer-reviewed journals cited correctly.",
        "Include a functional diagram or flow outline in Section 3.",
        "Limit total file size and write within the 3,000 word ceiling."
      ],
      risks: [
        "Extremely compact drafting window due to upcoming exams.",
        "Dependency on secondary survey data which might be delayed."
      ],
      estimatedHours: 12.5,
      studyPlan: [
        { week: "Phase 1: Research & Cite", focus: "Source verification, literature outline creation" },
        { week: "Phase 2: Rough Drafting", focus: "Write sections 1-3, map diagrams" },
        { week: "Phase 3: Refine & Submit", focus: "Citation validation, review against criteria, export" }
      ],
      fallback: true
    };
  };

  const client = getGeminiClient();
  if (!client) {
    return res.json(runFallback());
  }

  try {
    const prompt = `You are a high-speed multilingual academic and professional document parser.
Document Name: "${fileName}"
Extracted Content:
"${fileText.substring(0, 10000)}"

Instructions:
1. Automatically detect the language of the Extracted Content (which may contain English, Hindi, Hinglish, Spanish, French, German, Japanese, Chinese, or a mixture of these).
2. Translate all extracted information, key requirements, deadlines, and the study plan into "${aiLanguage}" so that the student or professional receives a fully native, cohesive plan.
3. Extract all key requirements and dates with high fidelity, translating them naturally into "${aiLanguage}".
4. Estimate total study effort in hours.
5. Create a tailored 3-phase study/execution plan.

Return structured JSON matching the requested schema.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            deadlines: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedHours: { type: Type.NUMBER },
            studyPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  week: { type: Type.STRING, description: "Phase or timeline milestone label" },
                  focus: { type: Type.STRING, description: "Main activity to focus on" }
                },
                required: ["week", "focus"]
              }
            }
          },
          required: ["title", "deadlines", "keyRequirements", "risks", "estimatedHours", "studyPlan"]
        }
      }
    });

    if (response.text) {
      return res.json(JSON.parse(response.text.trim()));
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (error: any) {
    console.warn("Gemini PDF Analysis Error:", error);
    console.warn("Falling back to local fallback data due to Gemini API Error / Rate limits.");
    return res.json({ ...runFallback(), apiError: true, apiErrorMessage: error.message });
  }
});

// 14.5. AI Event Capture Analyzer
app.post("/api/ai/analyze-event", async (req, res) => {
  const { imageBase64, mimeType, textInput } = req.body;

  const client = getGeminiClient();
  if (!client) {
    return res.status(400).json({ error: "Gemini API key is required to analyze events.", apiError: true });
  }

  try {
    let contents: any;
    
    const textPrompt = `You are an advanced Event and Flyer intelligent parser.
Analyze the following event details (from an image, notice board, invitation poster, PDF text, email, or pasted flyer text).
Extract the event fields with 100% precision. In addition, perform smart calendar, travel, and preparation planning.

Inputs provided:
${textInput ? `Text Input: "${textInput}"` : "Analyzed Image Poster"}

Extract and plan:
1. eventName: Full official title.
2. organizer: Organizing body or individual.
3. date: ISO YYYY-MM-DD or most specific date.
4. time: e.g., "10:00 AM" or duration.
5. venue: Exact physical location or digital link.
6. speaker: Key presenter or judges.
7. registrationLink: URL to sign up.
8. qrCode: Scanned value from any poster QR code if present.
9. contactNumber: Organizer phone.
10. website: Event homepage URL.
11. email: Organizer email.
12. entryFee: Cost of entry (e.g., "Free", "$15").
13. deadline: Registration closing date.
14. requiredDocuments: Array of items needed (e.g. ID Card, Ticket).
15. dressCode: Recommended outfit (e.g. Formal, Casual).
16. competitionType: e.g. "Team", "Individual".
17. skillsRequired: Array of technical or general skills.
18. eligibility: Who is allowed to register.
19. prizes: Array of rewards or cash prizes.
20. certificates: Details about credentials/participation proofs.
21. importantInstructions: Any vital warnings or schedule details.
22. category: Must be one of: Hackathon, Workshop, Seminar, Conference, Exam, Interview, Competition, Meeting, Sports Event, Festival, Training Session, Webinar, Career Fair, Club Activity, Volunteer Program, Other.
23. estimatedTravelTime: e.g. "40 mins".
24. riskAssessment: 1-paragraph summary of potential timing conflicts or transit delays.
25. travelPlan: Object containing travel advice (destination, distance, estimatedTime, suggestedDepartureTime, recommendedTransport, trafficStatus, weatherStatus, parkingStatus, bookingLink, navigationUrl).
26. preparationChecklist: Array of actions/tasks to complete before the event.
27. packingChecklist: Array of items/tools to bring to the event.
28. studySchedule: Array of chronologically structured days/topics/durations leading up to the event (highly relevant for Hackathons, Exams, Interviews, Competitions).
29. timeline: Chronological timeline of the event day (departure, check-in, keynotes, breaks, conclusion).
30. recommendations: Tailored advice on transit, weather, packing, and target skills.

You must structure your JSON response matching this schema strictly.`;

    if (imageBase64) {
      const imagePart = {
        inlineData: {
          mimeType: mimeType || "image/png",
          data: imageBase64,
        },
      };
      const textPart = { text: textPrompt };
      contents = { parts: [imagePart, textPart] };
    } else {
      contents = textPrompt;
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eventName: { type: Type.STRING },
            organizer: { type: Type.STRING },
            date: { type: Type.STRING },
            time: { type: Type.STRING },
            venue: { type: Type.STRING },
            speaker: { type: Type.STRING },
            registrationLink: { type: Type.STRING },
            qrCode: { type: Type.STRING },
            contactNumber: { type: Type.STRING },
            website: { type: Type.STRING },
            email: { type: Type.STRING },
            entryFee: { type: Type.STRING },
            deadline: { type: Type.STRING },
            requiredDocuments: { type: Type.ARRAY, items: { type: Type.STRING } },
            dressCode: { type: Type.STRING },
            competitionType: { type: Type.STRING },
            skillsRequired: { type: Type.ARRAY, items: { type: Type.STRING } },
            eligibility: { type: Type.STRING },
            prizes: { type: Type.ARRAY, items: { type: Type.STRING } },
            certificates: { type: Type.STRING },
            importantInstructions: { type: Type.STRING },
            category: { type: Type.STRING },
            estimatedTravelTime: { type: Type.STRING },
            riskAssessment: { type: Type.STRING },
            travelPlan: {
              type: Type.OBJECT,
              properties: {
                destination: { type: Type.STRING },
                distance: { type: Type.STRING },
                estimatedTime: { type: Type.STRING },
                suggestedDepartureTime: { type: Type.STRING },
                recommendedTransport: { type: Type.STRING },
                trafficStatus: { type: Type.STRING },
                weatherStatus: { type: Type.STRING },
                parkingStatus: { type: Type.STRING },
                bookingLink: { type: Type.STRING },
                navigationUrl: { type: Type.STRING }
              },
              required: ["destination"]
            },
            preparationChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
            packingChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
            studySchedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  duration: { type: Type.STRING }
                },
                required: ["day", "topic", "duration"]
              }
            },
            timeline: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["eventName", "category", "date", "time", "venue", "travelPlan", "preparationChecklist", "packingChecklist"]
        }
      }
    });

    if (response.text) {
      return res.json(JSON.parse(response.text.trim()));
    } else {
      throw new Error("Empty response from Gemini Event Capture Parser");
    }
  } catch (error: any) {
    console.warn("Gemini Event Capture Parser Error:", error);
    return res.status(400).json({ error: error.message || "Failed to analyze event due to AI API limit or error." });
  }
});

// 15. AI-Powered Explanation Level Engine
app.post("/api/ai/explain", async (req, res) => {
  const { question, level } = req.body;
  if (!question || !level) {
    return res.status(400).json({ error: "Missing required fields 'question' or 'level'" });
  }

  const runFallback = () => {
    const lowQ = question.toLowerCase();
    let text = "";
    if (lowQ.includes("dynamic programming")) {
      if (level === "Beginner") {
        text = "Imagine you are climbing a staircase and want to find the cheapest way. Instead of recalculating the cost of every single step combination over and over, you write down the cheapest cost for step 1, step 2, etc., on a notepad. Next time you need them, you just look at your notepad! Dynamic Programming is just remembering past answers so you don't do double work.";
      } else if (level === "Student") {
        text = "Dynamic Programming (DP) is an algorithmic optimization technique used to solve complex problems by breaking them down into simpler subproblems. It is applicable when subproblems overlap (recurrent calculations) and the problem has optimal substructure. Usually implemented via Memoization (top-down) or Tabulation (bottom-up), DP reduces exponential O(2^N) complexity to polynomial O(N) or O(N^2) time.";
      } else if (level === "Professional") {
        text = "Dynamic Programming is a software engineering pattern used to optimize highly redundant computational tasks. By storing intermediate results in a cache (Memoization) or an iterative array (Tabulation), we trade memory space to achieve significant execution speedups. It is commonly leveraged in financial routing, string parsing (like git diff / Levenshtein distance), and resource allocation pipelines.";
      } else { // Expert
        text = "Formally, Dynamic Programming solves sequential decision problems governed by Bellman's Principle of Optimality: an optimal policy has the property that whatever the initial state and decisions are, the remaining decisions must constitute an optimal policy with regard to the state resulting from the first decision. In state-space formulation, the recurrence relation V_t(s) = max_a { R(s,a) + gamma * V_{t+1}(s') } is solved backward or forward using value/policy iteration, bounding worst-case runtime complexity.";
      }
    } else if (lowQ.includes("rag") || lowQ.includes("retrieval")) {
      if (level === "Beginner") {
        text = "RAG is like an open-book exam for AI. Instead of guessing from memory, the AI goes to a library, grabs a specific textbook, looks up the exact page, and answers your question using that fresh information. This keeps it accurate and up-to-date!";
      } else if (level === "Student") {
        text = "Retrieval-Augmented Generation (RAG) is a framework that combines an information retrieval system with a generative model. When a user asks a question, a vector search is performed across a document store using embeddings to find relevant passages. These passages are prepended to the user query as context in the prompt, allowing the LLM to generate responses grounded in specific external data.";
      } else if (level === "Professional") {
        text = "RAG is a production architecture used to ground Large Language Models in proprietary enterprise data without fine-tuning. It relies on a pipeline: document chunking, semantic vector indexing (e.g., Pinecone, pgvector), real-time cosine similarity retrieval, and context-stuffed prompt construction. This minimizes hallucinations and respects data access control.";
      } else { // Expert
        text = "Retrieval-Augmented Generation optimizes the conditional probability P(Y | X) of sequence generation by introducing a latent retrieval step z ~ p(z | X). The model computes the marginal probability over retrieved documents: P(Y | X) = sum_{z} P(Y | X, z) * P(z | X). Embeddings are generated via bi-encoder neural networks, similarity is computed via MIPS (Maximum Inner Product Search), and the cross-attention layers of the generative decoder synthesize the context tokens.";
      }
    } else if (lowQ.includes("kubernetes")) {
      if (level === "Beginner") {
        text = "Kubernetes is like a harbor master or shipping port manager. You have lots of little shipping containers (your apps). Kubernetes makes sure each container gets placed on the right ship (servers), tells them when to open, replaces broken ones, and handles traffic jams.";
      } else if (level === "Student") {
        text = "Kubernetes (K8s) is an open-source container orchestration platform designed to automate deploying, scaling, and operating application containers. It organizes containers into logical units called Pods, schedules them across a cluster of nodes, and manages networking, storage mounting, and service discovery using declarative YAML specifications.";
      } else if (level === "Professional") {
        text = "Kubernetes is an enterprise infrastructure orchestration engine. It coordinates microservices across multi-cloud clusters, ensuring high availability through self-healing, rolling updates, and autoscaling. Standard resources include Deployments, Services, Ingress controllers, and ConfigMaps, managed declaratively via GitOps workflows.";
      } else { // Expert
        text = "Kubernetes operates as a highly concurrent control system using control loops that constantly reconcile the cluster's current state toward the declared desired state. The architecture relies on an active control plane (etcd for consistent state, api-server, controller-manager, scheduler) communicating with kubelet agents on worker nodes. It implements service-mesh networking models, container runtime interfaces (CRI), container network interfaces (CNI), and custom controllers (CRDs).";
      }
    } else {
      // Default general explanation fallback
      if (level === "Beginner") {
        text = `Let's make "${question}" simple! Think of it like a daily life analogy: everything is split into small pieces, we take it step-by-step, and we keep it highly visual without any complex jargon.`;
      } else if (level === "Student") {
        text = `In academic terms, "${question}" is a structured framework that divides complex topics into testable definitions, core attributes, and procedural steps. It builds on fundamentals to clarify how the component operates.`;
      } else if (level === "Professional") {
        text = `From a business and industry perspective, "${question}" is a practical tool. It is utilized to streamline execution, increase team productivity, and achieve operational efficiency. Key metrics include throughput, safety boundaries, and modular scalability.`;
      } else { // Expert
        text = `Analytically, "${question}" represents a systemic configuration governed by rigorous constraints. It optimizes variables, minimizes latency overhead, and enforces strict operational parameters to ensure high performance.`;
      }
    }

    return { text, fallback: true };
  };

  const client = getGeminiClient();
  if (!client) {
    return res.json(runFallback());
  }

  try {
    const prompt = `You are an expert tutor. Please explain the following topic or answer the following question:
Topic/Question: "${question}"

Explain it strictly for the following audience / explanation level:
Level: "${level}"

Audience Guidelines:
- "Beginner": Use zero technical jargon. Use highly relatable daily-life analogies, warm conversational language, and simple summaries.
- "Student": Use clear academic concepts, study milestones, structured steps, and helpful outlines.
- "Professional": Use concise workplace terminology, action-oriented bullet points, practical checklist criteria, and industry contexts.
- "Expert": Use advanced mathematical, structural, or architectural notations, deep formal constraints, and precise engineering/scientific parameters.

Your answer should be detailed, highly informative, and perfectly suited for this specific level. Do not include introductory text like "Here is your explanation" — start directly with the explanation.`;

    const result = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = result.text || "No explanation could be generated.";
    res.json({ text });
  } catch (error: any) {
    console.warn("Gemini Explain Error:", error);
    console.warn("Falling back to local fallback data due to Gemini API Error / Rate limits.");
    return res.json({ ...runFallback(), apiError: true, apiErrorMessage: error.message });
  }
});

// 8. AI-Powered Study Aid Generation Engine
app.post("/api/ai/study-aid", async (req, res) => {
  const { title, text, type } = req.body;
  if (!text || !type) {
    return res.status(400).json({ error: "Missing required fields 'text' or 'type'" });
  }

  const runFallback = () => {
    if (type === "flashcards") {
      return {
        type: "flashcards",
        flashcards: [
          { question: `What are the primary submission requirements for "${title || "this document"}"?`, answer: "The assignment requires a final polished draft complying with citation guidelines and structural constraints outlined in the brief." },
          { question: "What is the core pacing strategy recommended for this content?", answer: "Pacing requires breaking down high-effort tasks into early research/outlining milestones to prevent schedule compression." },
          { question: "Why is late submission high risk?", answer: "Late submissions trigger grade penalties (typically 10% per hour or day) and cascade delays into other active tracks." },
          { question: "How many scholarly sources are standard for research documents like this?", answer: "Typically a minimum of 5 to 8 scholarly secondary sources coupled with verified primary source documentation." },
          { question: "What review step is critical before final compilation?", answer: "Reviewing citation formats, footnote styles, and executing comprehensive proofreading checks." }
        ],
        fallback: true
      };
    } else if (type === "summary") {
      return {
        type: "summary",
        summary: [
          `Core Focus: Systematic execution of "${title || "the document requirements"}" to protect high-grade rubrics.`,
          "Milestone Pacing: Breaking complex projects into sequential outlines, drafting phases, and review checkpoints secures on-time delivery.",
          "Checklist Integrity: Adhering strictly to length limits, file formats, and citation footnote conventions prevents standard deductions.",
          "Risk Remediation: Spotting executive or resource scheduling conflicts early enables seamless delegation or focus rescheduling."
        ],
        fallback: true
      };
    } else { // questions
      return {
        type: "questions",
        questions: [
          {
            question: "Which execution block has the highest probability of causing late-stage panic?",
            options: ["Early outlining and research", "Formatting, footnote checks, and compilations", "Taking short pacing breaks", "Filing early drafts"],
            correctIndex: 1,
            explanation: "Review, formatting, and file exports are often compressed at the absolute end, increasing stress."
          },
          {
            question: "What is the optimal pacing strategy to prevent cognitive fatigue?",
            options: ["Piling everything into a single 12-hour sprint", "Breaking tasks into modular milestones with distinct timelines", "Postponing complex segments to the deadline day", "Delegating all tasks without tracking"],
            correctIndex: 1,
            explanation: "Modular milestone breakdown lets users finish complex workloads with constant momentum."
          },
          {
            question: "What does the Last-Minute Saver system emphasize for high-risk deliverables?",
            options: ["Continuous alarms and warning spam", "Direct action recommendations and timing adjustments", "Removing milestones altogether", "Converting all text into slides"],
            correctIndex: 1,
            explanation: "Direct, adaptive coaching feedback protects user focus and completion confidence without notification spam."
          }
        ],
        fallback: true
      };
    }
  };

  const client = getGeminiClient();
  if (!client) {
    return res.json(runFallback());
  }

  try {
    let prompt = "";
    let responseSchema: any = {};

    if (type === "flashcards") {
      prompt = `Analyze the following lecture note/document text:
Title: "${title || "Syllabus"}"
Content:
"${text.substring(0, 8000)}"

Generate exactly 5 high-yield study flashcards for exam preparation. Each flashcard should have a clear, concise question and a highly informative, accurate answer based directly on the text content.`;
      
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: "A clear exam-style study question" },
                answer: { type: Type.STRING, description: "A precise, complete study answer" }
              },
              required: ["question", "answer"]
            }
          }
        },
        required: ["type", "flashcards"]
      };
    } else if (type === "summary") {
      prompt = `Analyze the following lecture note/document text:
Title: "${title || "Syllabus"}"
Content:
"${text.substring(0, 8000)}"

Generate a concise, highly structured study summary. Return exactly 4 bullet points capturing the most critical, testable takeaways, formulas, or concepts.`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          summary: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["type", "summary"]
      };
    } else { // questions
      prompt = `Analyze the following lecture note/document text:
Title: "${title || "Syllabus"}"
Content:
"${text.substring(0, 8000)}"

Generate exactly 3 high-fidelity multiple-choice practice questions for exam preparation. Each question must contain:
1. Question text
2. Exactly 4 logical options
3. The correctIndex (0-3) which points to the correct option in the options array
4. A short explanation of why that option is correct.`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctIndex", "explanation"]
            }
          }
        },
        required: ["type", "questions"]
      };
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    if (response.text) {
      const parsedData = JSON.parse(response.text.trim());
      parsedData.type = type;
      return res.json(parsedData);
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (error: any) {
    console.warn("Gemini Study Aid Generation Error:", error);
    console.warn("Falling back to local fallback data due to Gemini API Error / Rate limits.");
    return res.json({ ...runFallback(), apiError: true, apiErrorMessage: error.message });
  }
});

// 9. Accessibility OCR & Surrounding Object Analyzer for Visually Impaired Users
app.post("/api/ai/analyze-image", async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: "Missing required 'imageBase64' parameter." });
  }

  const runFallback = () => {
    return {
      textDetected: "CS 102 - Final Exam Prep Guide\nDate: Friday at 2:00 PM\nTopics: Big-O notation, Binary Search Trees, Graphs.",
      surroundingsDescription: "The camera is capturing a printed computer science study guide lying on a light wood desk, next to a black pen and a hot mug.",
      keyTakeaways: [
        "Big-O notation is highlighted with a yellow marker.",
        "BST deletion cases are listed under Section 4.",
        "A final deadline is noted at the bottom right corner."
      ],
      recommendations: "Start by reviewing Binary Tree rotation cases, as they represent the highest density of marks on this sheet.",
      fallback: true
    };
  };

  const client = getGeminiClient();
  if (!client) {
    return res.json(runFallback());
  }

  try {
    // Extract base64 clean data
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanBase64
      }
    };

    const promptText = `Analyze this image from a student's webcam. The student is blind or visually impaired.
    You must:
    1. Identify and transcribe ANY text, printed documents, assignment sheets, syllabus details, or computer screen contents.
    2. Identify and describe the surrounding physical objects, setting, and environment.
    3. Generate 3-4 key takeaways/items discovered.
    4. Provide immediate educational recommendations based on what you see.
    
    Please structure your response as JSON matching these keys:
    - textDetected: String (transcription of all detected text)
    - surroundingsDescription: String (clear, highly descriptive explanation of what's visible)
    - keyTakeaways: Array of Strings (bullet points of findings)
    - recommendations: String (supportive study advice)
    
    Be warm, professional, and descriptive.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            textDetected: { type: Type.STRING },
            surroundingsDescription: { type: Type.STRING },
            keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.STRING }
          },
          required: ["textDetected", "surroundingsDescription", "keyTakeaways", "recommendations"]
        }
      }
    });

    if (response.text) {
      return res.json(JSON.parse(response.text.trim()));
    } else {
      throw new Error("Empty image analysis response from Gemini");
    }
  } catch (err: any) {
    console.warn("Gemini Image Analysis Error:", err);
    console.warn("Falling back to local fallback data due to Gemini API Error / Rate limits.");
    return res.json({ ...runFallback(), apiError: true, apiErrorMessage: err.message });
  }
});

// 10. AI Goal & Milestone Planner
app.post("/api/ai/goals-planner", async (req, res) => {
  const { goalQuery } = req.body;
  if (!goalQuery) {
    return res.status(400).json({ error: "Missing required 'goalQuery' parameter." });
  }

  const runFallback = () => {
    const query = goalQuery.toLowerCase();
    let title = "Custom Strategic Goal";
    let category = "personal";
    let description = `Develop a consistent execution strategy for: "${goalQuery}"`;
    let priority = "medium";
    let estimatedEffort = "6 weeks";
    let estimatedCompletionTime = "Approx. 80 Hours of total deep focus";
    
    let milestones = [
      { id: "m1", title: "Information Gathering & Core Planning", estimatedTime: "5 hours", priority: "high", deadline: "End of Week 1", completionPercentage: 0 },
      { id: "m2", title: "Core Skills & Iterative Drills", estimatedTime: "15 hours", priority: "high", deadline: "End of Week 2", completionPercentage: 0 },
      { id: "m3", title: "First Prototyping & Draft Stage", estimatedTime: "25 hours", priority: "medium", deadline: "End of Week 4", completionPercentage: 0 },
      { id: "m4", title: "Feedback Integration & Tuning", estimatedTime: "15 hours", priority: "medium", deadline: "End of Week 5", completionPercentage: 0 },
      { id: "m5", title: "Final Polish & Submission Ready", estimatedTime: "10 hours", priority: "high", deadline: "End of Week 6", completionPercentage: 0 }
    ];

    let weeklyPlan = [
      "Week 1: Foundations, tool selection, and setting up daily triggers.",
      "Week 2: Deep diving into fundamental techniques and completing initial milestones.",
      "Week 3: Practical implementation and active problem-solving blocks.",
      "Week 4: Synthesis, testing, and handling complex bottlenecks.",
      "Week 5: Comprehensive review, refactoring, and integration.",
      "Week 6: Presentation practice and deployment."
    ];

    let suggestedHabits = [
      "Deep Work block (45 min)",
      "Daily progress logging",
      "Concept flashcard review"
    ];

    let riskFactors = [
      "Cognitive overload due to compressed timeline.",
      "Lack of immediate structured feedback during drafting.",
      "Inconsistency in maintaining daily logging discipline."
    ];

    if (query.includes("gate") || query.includes("exam") || query.includes("test")) {
      title = "Crack GATE & Competitive Exams";
      category = "academic";
      priority = "high";
      description = "Systematically master competitive exam modules, solve previous year papers, and take scheduled mock tests.";
      estimatedEffort = "12 weeks";
      estimatedCompletionTime = "Approx. 150 Hours of focused review";
      milestones = [
        { id: "m1", title: "Syllabus Mapping & Topic Prioritization", estimatedTime: "10 hours", priority: "high", deadline: "Week 2", completionPercentage: 0 },
        { id: "m2", title: "Core Conceptual Review (Standard Books)", estimatedTime: "40 hours", priority: "high", deadline: "Week 5", completionPercentage: 0 },
        { id: "m3", title: "PYQs (Past Years Questions) Solved Cycle", estimatedTime: "30 hours", priority: "medium", deadline: "Week 8", completionPercentage: 0 },
        { id: "m4", title: "Topic-wise Simulated Mock Exam Series", estimatedTime: "30 hours", priority: "medium", deadline: "Week 10", completionPercentage: 0 },
        { id: "m5", title: "Full-Length Test Series & Revision Sprints", estimatedTime: "40 hours", priority: "high", deadline: "Week 12", completionPercentage: 0 }
      ];
      weeklyPlan = [
        "Weeks 1-2: Analyze exam weightage and map reference textbooks.",
        "Weeks 3-5: Review core structural topics and summarize formulas.",
        "Weeks 6-8: Solve questions from previous 10 years step-by-step.",
        "Weeks 9-10: Take diagnostic subject tests to uncover weak zones.",
        "Weeks 11-12: Complete 3 full simulated test papers under real exam pressure."
      ];
      suggestedHabits = [
        "Solve 10 past questions",
        "Formulas active recall (15 min)",
        "Review mistakes logbook"
      ];
      riskFactors = [
        "Syllabus scope creep wasting time on marginal topics.",
        "Over-relying on theory while neglecting interactive problem solving.",
        "Anxiety spikes during early low-scoring mock results."
      ];
    } else if (query.includes("thesis") || query.includes("paper") || query.includes("project")) {
      title = "Submit High-Quality Academic Thesis";
      category = "academic";
      priority = "high";
      description = "Formulate a sound research question, compile references, code the simulation, and draft the thesis dissertation.";
      estimatedEffort = "8 weeks";
      estimatedCompletionTime = "Approx. 100 Hours of research & drafting";
      milestones = [
        { id: "m1", title: "Literature Review & Problem Definition", estimatedTime: "15 hours", priority: "high", deadline: "Week 2", completionPercentage: 0 },
        { id: "m2", title: "Experiment Setup & Data Parsing", estimatedTime: "25 hours", priority: "high", deadline: "Week 4", completionPercentage: 0 },
        { id: "m3", title: "Drafting Main Research Chapters (1-3)", estimatedTime: "20 hours", priority: "medium", deadline: "Week 6", completionPercentage: 0 },
        { id: "m4", title: "Refining Discussion & Critical Analysis", estimatedTime: "15 hours", priority: "medium", deadline: "Week 7", completionPercentage: 0 },
        { id: "m5", title: "Bibliography Check, Proofread & Formatting", estimatedTime: "25 hours", priority: "high", deadline: "Week 8", completionPercentage: 0 }
      ];
      weeklyPlan = [
        "Weeks 1-2: Collate 15 peer-reviewed papers and define scope boundaries.",
        "Weeks 3-4: Execute empirical simulations or user surveys.",
        "Weeks 5-6: Write introductions, research methodologies, and early findings.",
        "Week 7: Frame key discussions and draft thesis recommendations.",
        "Week 8: Style references via BibTeX and proofread mathematical proofs."
      ];
      suggestedHabits = [
        "Write 300 thesis words",
        "Read 1 research paper",
        "Backup document draft"
      ];
      riskFactors = [
        "Unrealistic scope definition leading to late experimental failures.",
        "Formatting errors ignoring strict advisory stylesheets.",
        "Procrastination in writing due to writer's block."
      ];
    } else if (query.includes("react") || query.includes("learn") || query.includes("code") || query.includes("typescript")) {
      title = "Master Full-Stack React & TypeScript";
      category = "personal";
      priority = "medium";
      description = "Learn hooks, modern state management libraries, API design integration, and deploy 3 production apps.";
      estimatedEffort = "4 weeks";
      estimatedCompletionTime = "Approx. 40 Hours of interactive coding";
      milestones = [
        { id: "m1", title: "Master Modern JSX & State Hook Workflows", estimatedTime: "8 hours", priority: "high", deadline: "Week 1", completionPercentage: 0 },
        { id: "m2", title: "Build Side-Effect Models (useEffect, async)", estimatedTime: "10 hours", priority: "high", deadline: "Week 2", completionPercentage: 0 },
        { id: "m3", title: "Implement State Architecture (Context/Zustand)", estimatedTime: "12 hours", priority: "medium", deadline: "Week 3", completionPercentage: 0 },
        { id: "m4", title: "Develop Capstone Project & Deploy to Cloud", estimatedTime: "10 hours", priority: "high", deadline: "Week 4", completionPercentage: 0 }
      ];
      weeklyPlan = [
        "Week 1: Create interactive visual counters and to-do boards from scratch.",
        "Week 2: Fetch and render data from external JSON libraries safely.",
        "Week 3: Set up modular states across layouts with absolute type safety.",
        "Week 4: Assemble a rich developer portfolio and host it live."
      ];
      suggestedHabits = [
        "Coding Practice (30 min)",
        "Read React beta docs",
        "Refactor existing code blocks"
      ];
      riskFactors = [
        "Over-engineering simple layouts with unnecessary external libraries.",
        "Ignoring console warnings and missing React rendering loop states.",
        "Forgetting type safety declarations in component interfaces."
      ];
    }

    return {
      title,
      category,
      priority,
      description,
      estimatedEffort,
      estimatedCompletionTime,
      milestones,
      weeklyPlan,
      suggestedHabits,
      riskFactors,
      fallback: true
    };
  };

  const client = getGeminiClient();
  if (!client) {
    return res.json(runFallback());
  }

  try {
    const prompt = `Formulate a comprehensive plan for a student's personal goal.
Goal request: "${goalQuery}"

Analyze the request and provide a detailed strategy.
You must output:
1. title: A polished, concise goal name.
2. category: Must be one of ["academic", "career", "personal", "health", "finance", "custom"]. Choose the most relevant.
3. priority: Must be one of ["low", "medium", "high"].
4. description: A clear 2-sentence description of what this goal achieves.
5. estimatedEffort: A readable string representing estimated effort (e.g., "6 weeks", "3 months").
6. estimatedCompletionTime: Total hours estimate (e.g. "Approx. 60 Hours").
7. milestones: An array of exactly 4-6 milestones. Each must have:
   - title: Short milestone task name.
   - estimatedTime: Duration (e.g. "12 hours", "4 hours").
   - priority: "low" | "medium" | "high".
   - deadline: Descriptive timeframe (e.g. "Week 2", "By Month-end").
   - completionPercentage: Initialized to 0.
8. weeklyPlan: Array of string summaries for week-by-week actions.
9. suggestedHabits: Array of 3 short daily habits that support this goal (e.g. "Read 1 research paper", "Coding practice").
10. riskFactors: Array of 3 potential blockages or failure risks.

Please structure your response as JSON matching these keys exactly. Be constructive, logical, and extremely structured.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING },
            priority: { type: Type.STRING },
            description: { type: Type.STRING },
            estimatedEffort: { type: Type.STRING },
            estimatedCompletionTime: { type: Type.STRING },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  estimatedTime: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  completionPercentage: { type: Type.INTEGER }
                },
                required: ["title", "estimatedTime", "priority", "deadline", "completionPercentage"]
              }
            },
            weeklyPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedHabits: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "category", "priority", "description", "estimatedEffort", "estimatedCompletionTime", "milestones", "weeklyPlan", "suggestedHabits", "riskFactors"]
        }
      }
    });

    if (response.text) {
      return res.json(JSON.parse(response.text.trim()));
    } else {
      throw new Error("Empty goals response from Gemini");
    }
  } catch (err: any) {
    console.warn("Gemini Goals Planning Error:", err);
    console.warn("Falling back to local fallback data due to Gemini API Error / Rate limits.");
    return res.json({ ...runFallback(), apiError: true, apiErrorMessage: err.message });
  }
});

// 11. AI Habits Suggestions
app.post("/api/ai/habit-suggestions", async (req, res) => {
  const { goalTitle, category } = req.body;
  
  const runFallback = () => {
    let items = [
      { name: "Deep focus hour (60m)", frequency: "daily", reminder: "09:00 AM", reason: "AI selected morning hours for peak cognitive reserve." },
      { name: "Daily log recap (10m)", frequency: "daily", reminder: "09:00 PM", reason: "Reviewing daily logs before sleeping locks in achievements." },
      { name: "Stretching & Hydration", frequency: "daily", reminder: "02:00 PM", reason: "Mid-afternoon energy levels naturally drop; perfect for physical reset." }
    ];

    if (category === "health") {
      items = [
        { name: "Gym or Cardio (45m)", frequency: "daily", reminder: "07:30 AM", reason: "Morning workout burns calories efficiently and boosts circulation." },
        { name: "Meal Prep Logging", frequency: "daily", reminder: "12:30 PM", reason: "Tracking midday macros prevents mindless snacking late-day." },
        { name: "No Screen Time before bed", frequency: "daily", reminder: "10:30 PM", reason: "Reduces melatonin disruption for restorative sleep cycle." }
      ];
    } else if (category === "academic" || category === "career") {
      items = [
        { name: "Write 200 words / solve 5 questions", frequency: "daily", reminder: "10:00 AM", reason: "Ensures tangible progressive work daily before distractions accumulate." },
        { name: "Review mistakes logbook", frequency: "weekdays", reminder: "05:00 PM", reason: "End of study cycle is ideal to summarize failed conceptual vectors." },
        { name: "Read peer journal / tech news", frequency: "daily", reminder: "08:30 AM", reason: "Acquiring domain insights keeps your projects current." }
      ];
    }

    return {
      habits: items,
      fallback: true
    };
  };

  const client = getGeminiClient();
  if (!client) {
    return res.json(runFallback());
  }

  try {
    const prompt = `Recommend 3 supporting daily or weekly habits for a student working on the goal: "${goalTitle || "General Development"}" of category: "${category || "personal"}".
For each habit recommendation, you must provide:
1. name: A short physical habit action (e.g. "Do 10 pushups", "Solve 2 coding patterns").
2. frequency: "daily" | "weekdays" | "weekends" | "custom".
3. reminder: Recommended optimal time (e.g., "08:30 AM", "06:00 PM").
4. reason: A 1-sentence behavioral explanation of why this timing and frequency maximizes completion likelihood.

Please structure your output as JSON with a single root key 'habits' containing an array of objects matching these keys.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            habits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  reminder: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["name", "frequency", "reminder", "reason"]
              }
            }
          },
          required: ["habits"]
        }
      }
    });

    if (response.text) {
      return res.json(JSON.parse(response.text.trim()));
    } else {
      throw new Error("Empty habits response from Gemini");
    }
  } catch (err: any) {
    console.warn("Gemini Habit Suggestions Error:", err);
    console.warn("Falling back to local fallback data due to Gemini API Error / Rate limits.");
    return res.json({ ...runFallback(), apiError: true, apiErrorMessage: err.message });
  }
});


// 22. AI Success Planner
app.post("/api/ai/success-planner", async (req, res) => {
  const { planType, formData } = req.body;
  
  const client = getGeminiClient();
  if (!client) {
    return res.status(400).json({ error: "Gemini API key missing", apiError: true });
  }

  try {
    const prompt = `
You are an expert academic and career advisor AI.
Create a comprehensive, highly structured masterplan for a user.

Plan Type: ${planType}
User Details: ${JSON.stringify(formData, null, 2)}

Provide a detailed JSON response matching this exact schema, with NO markdown formatting, just raw JSON:
{
  "title": "A catchy title for this masterplan",
  "modules": [
    {
      "name": "Phase 1: Module Name",
      "difficulty": "Easy" | "Medium" | "Hard",
      "estHours": 10,
      "completed": false
    }
  ],
  "dailySchedule": [
    {
      "time": "09:00",
      "activity": "Activity Name (study, break, revision, mock test)",
      "duration": 60 // in minutes
    }
  ],
  "recommendations": ["Tip 1", "Tip 2"]
}
`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (response.text) {
      return res.json(JSON.parse(response.text.trim()));
    } else {
      throw new Error("Empty response from AI Success Planner");
    }
  } catch (error: any) {
    console.warn("Gemini Success Planner Error:", error);
    // Provide a detailed fallback based on the requested plan type
    let fallbackPlan = {
      title: `${planType.toUpperCase()} Masterplan`,
      modules: [
        { name: "Phase 1: Fundamentals", difficulty: "Medium", estHours: 10, completed: false },
        { name: "Phase 2: Core Subject Matter", difficulty: "Hard", estHours: 25, completed: false },
        { name: "Phase 3: Advanced Topics & Revision", difficulty: "Hard", estHours: 15, completed: false }
      ],
      dailySchedule: [
        { time: "07:00", activity: "Wake up & Exercise", duration: 60 },
        { time: "08:30", activity: "Study Phase 1", duration: 120 },
        { time: "11:00", activity: "Break / Revision", duration: 60 },
        { time: "14:00", activity: "Study Phase 2", duration: 180 },
        { time: "19:00", activity: "Mock Test / Practice", duration: 60 }
      ],
      recommendations: ["Stay consistent", "Focus on active recall", "Get enough sleep"]
    };
    return res.json(fallbackPlan);
  }
});

// Mount Vite middleware for asset serving in development, or serve built static files in production
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Development server is running at http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Production server is running on port ${PORT}`);
  });
}
