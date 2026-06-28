const fs = require('fs');
let data = fs.readFileSync('src/App.tsx', 'utf8');
data = data.replace(/{ id: "habits" as const, label: t\("nav.habits"\) \|\| "Habits & Goals", icon: Flame, badge: "STREAK" },/g, '{ id: "habits" as const, label: t("nav.habits") || "Habits & Goals", icon: Flame, badge: "STREAK" },\n                        { id: "success_planner" as const, label: "AI Success Planner", icon: Target, badge: "ROADMAP" },');
fs.writeFileSync('src/App.tsx', data);
