const fs = require("fs");
let code = fs.readFileSync("server.ts", "utf8");
code = code.replace(/console\.error\(\"Gemini/g, "console.warn(\"Gemini");
code = code.replace(/console\.error\(\"Error details:\"/g, "console.warn(\"Error details:\"");
fs.writeFileSync("server.ts", code);

const scanner = fs.readFileSync("src/components/ScannerTab.tsx", "utf8");
fs.writeFileSync("src/components/ScannerTab.tsx", scanner.replace(/console\.error\("Failed to generate/g, "console.warn(\"Failed to generate"));
