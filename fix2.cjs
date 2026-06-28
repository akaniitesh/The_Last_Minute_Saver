const fs = require("fs");
const files = [
  "src/components/HabitsTab.tsx",
  "src/components/ScannerTab.tsx",
  "src/components/SmartMapTab.tsx",
  "src/components/VoiceAssistantCompanion.tsx",
  "src/components/EventCaptureTab.tsx",
  "src/components/DashboardHomeTab.tsx",
  "src/components/AuthView.tsx",
  "src/components/PlannerTab.tsx",
  "src/components/VoiceTab.tsx",
  "src/components/DashboardTab.tsx",
  "src/components/SettingsTab.tsx"
];

files.forEach(f => {
  let content = fs.readFileSync(f, "utf8");
  content = content.replace(/console\.error\(e\);/g, 'console.warn("API Error:", e);');
  content = content.replace(/console\.error\(err\);/g, 'console.warn("API Error:", err);');
  content = content.replace(/console\.error\("Capture failed:", e\);/g, 'console.warn("Capture failed:", e);');
  content = content.replace(/console\.error\("File upload parse error:", err\);/g, 'console.warn("File upload parse error:", err);');
  content = content.replace(/console\.error\("Paste parse error:", e\);/g, 'console.warn("Paste parse error:", e);');
  content = content.replace(/console\.error\("Drag Drop parse error:", err\);/g, 'console.warn("Drag Drop parse error:", err);');
  fs.writeFileSync(f, content);
});
