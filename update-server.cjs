const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoute = `
// 22. AI Success Planner
app.post("/api/ai/success-planner", async (req, res) => {
  const { planType, formData } = req.body;
  
  const client = getGeminiClient();
  if (!client) {
    return res.status(400).json({ error: "Gemini API key missing", apiError: true });
  }

  try {
    const prompt = \`
You are an expert academic and career advisor AI.
Create a comprehensive, highly structured masterplan for a user.

Plan Type: \${planType}
User Details: \${JSON.stringify(formData, null, 2)}

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
\`;

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
      title: \`\${planType.toUpperCase()} Masterplan\`,
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
`;

code = code.replace(/\/\/ Mount Vite middleware for asset serving in development/, newRoute + '\n// Mount Vite middleware for asset serving in development');
fs.writeFileSync('server.ts', code);
