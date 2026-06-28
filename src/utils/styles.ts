export function applyGlobalStyles() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const textSizeSlider = Number(localStorage.getItem("set_acc_text_scale") || "100");
  const contrastSlider = Number(localStorage.getItem("set_acc_contrast_scale") || "0");
  const dyslexicFontType = localStorage.getItem("set_acc_dyslexia_type") || "Default";
  const lineSpacing = Number(localStorage.getItem("set_acc_line_spacing") || "1.5");
  const cursorSize = Number(localStorage.getItem("set_acc_cursor_size") || "24");
  const buttonScale = Number(localStorage.getItem("set_acc_button_scale") || "1.0");
  const accentColor = localStorage.getItem("set_app_accent") || "indigo";
  const appearanceTheme = localStorage.getItem("set_app_theme") || "Light";
  const density = localStorage.getItem("set_app_density") || "cozy";
  const animations = localStorage.getItem("set_app_animations") || "standard";
  const glassStrength = Number(localStorage.getItem("set_app_glass") || "40");
  const motionReduction = Number(localStorage.getItem("set_acc_motion_scale") || "0");

  let activeTheme = appearanceTheme;
  if (activeTheme === "System") {
    const isSystemDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    activeTheme = isSystemDark ? "Dark" : "Light";
  }

  const accentColorMap: Record<string, string> = {
    indigo: "#6366F1",
    blue: "#3B82F6",
    emerald: "#10B981",
    rose: "#F43F5E",
    amber: "#F59E0B",
    violet: "#8B5CF6",
    teal: "#14B8A6",
    fuchsia: "#D946EF",
    orange: "#F97316",
    sky: "#0EA5E9"
  };

  const accentHex = accentColorMap[accentColor] || "#6366F1";

  let fontRule = "";
  if (dyslexicFontType === "Lexend") {
    fontRule = `font-family: 'Lexend', sans-serif !important;`;
  } else if (dyslexicFontType === "Atkinson Hyperlegible") {
    fontRule = `font-family: 'Atkinson Hyperlegible', sans-serif !important;`;
  } else if (dyslexicFontType === "OpenDyslexic") {
    fontRule = `font-family: 'Atkinson Hyperlegible', cursive, sans-serif !important; letter-spacing: 0.05em !important;`;
  }

  // Find or create global style tag
  let styleTag = document.getElementById("global-accessibility-styles") as HTMLStyleElement;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "global-accessibility-styles";
    document.head.appendChild(styleTag);
  }

  // Glass background variables
  const glassOpacity = glassStrength / 100;
  const blurAmount = glassStrength > 0 ? (glassStrength / 10) : 0;

  // Render styles
  styleTag.innerHTML = `
    html, body {
      font-size: ${textSizeSlider}% !important;
    }
    body {
      filter: contrast(${100 + contrastSlider}%) !important;
      line-height: ${lineSpacing} !important;
    }
    ${fontRule ? `* { ${fontRule} }` : ""}
    
    /* Global Custom Big Tactile Cursor */
    ${cursorSize > 24 ? `
      * {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24" fill="black" stroke="white" stroke-width="2"><path d="M4.5 3V17L9 12.5L14 21L17.5 19L12.5 10.5L18 10L4.5 3Z"/></svg>'), auto !important;
      }
    ` : ""}

    /* Button resizing scale */
    button, .btn {
      transform: scale(${buttonScale});
      transition: transform 0.2s ease-in-out;
    }

    /* Global Accent overrides */
    .text-indigo-500, .text-indigo-600, .text-indigo-700 {
      color: ${accentHex} !important;
    }
    .bg-indigo-500, .bg-indigo-600 {
      background-color: ${accentHex} !important;
    }
    .border-indigo-500, .border-indigo-600 {
      border-color: ${accentHex} !important;
    }
    .bg-indigo-50 {
      background-color: ${accentHex}10 !important;
    }

    /* Glass Effect customization */
    .glass-effect {
      background-color: ${activeTheme === "Dark" ? `rgba(23, 27, 37, ${glassOpacity})` : `rgba(255, 255, 255, ${glassOpacity})`} !important;
      backdrop-filter: blur(${blurAmount}px) !important;
      -webkit-backdrop-filter: blur(${blurAmount}px) !important;
    }

    /* Smooth theme transitions */
    html, body, #root, .main-container, div, nav, header, aside, section, article, input, button, select, textarea, p, span, h1, h2, h3, h4, h5, h6, svg {
      transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Animation Intensity and Motion Reduction style classes */
    ${motionReduction > 50 || animations === "disabled" ? `
      * {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        animation-iteration-count: 1 !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
      }
    ` : ""}

    /* Density scaling layout overrides */
    ${density === "compact" ? `
      .p-6 { padding: 0.75rem !important; }
      .p-8 { padding: 1rem !important; }
      .gap-6 { gap: 0.75rem !important; }
      .gap-8 { gap: 1rem !important; }
    ` : ""}
    ${density === "expanded" ? `
      .p-6 { padding: 2rem !important; }
      .p-8 { padding: 2.5rem !important; }
      .gap-6 { gap: 2rem !important; }
      .gap-8 { gap: 2.5rem !important; }
    ` : ""}

    /* Dark Mode Theme Overrides */
    ${activeTheme === "Dark" ? `
      html, body, #root, .main-container, .bg-\\[\\#F7F8FA\\], .bg-\\[\\#f7f8fa\\], .bg-\\[\\#FAFAFA\\], .bg-\\[\\#fafafa\\] {
        background-color: #0F1117 !important;
        color: #F5F7FA !important;
      }
      .bg-white, .bg-neutral-50, .card, .panel, .bg-slate-50, .bg-zinc-50, .bg-neutral-50\\/50, .bg-white\\/70, .bg-white\\/95, .bg-white\\/80 {
        background-color: #171B25 !important;
        color: #F5F7FA !important;
        background-image: none !important;
      }
      .bg-gray-50, .bg-gray-50\\/50, .bg-gray-50\\/40, .bg-indigo-50\\/20, .bg-indigo-50\\/30, .bg-indigo-50\\/40, .bg-indigo-50\\/5, .dropdown-menu, .bg-neutral-100, .bg-slate-100, .bg-zinc-100, .bg-gray-100, .bg-gray-100\\/50, .bg-gray-100\\/40 {
        background-color: #202634 !important;
        color: #F5F7FA !important;
        background-image: none !important;
      }
      .bg-linear-to-br, .bg-gradient-to-br, .bg-linear-to-r, .bg-gradient-to-r, .bg-linear-to-tr, .bg-gradient-to-tr, .bg-linear-to-b, .bg-gradient-to-b {
        background-image: none !important;
        background-color: #171B25 !important;
      }
      .hover\\:bg-neutral-50\\/50:hover, .hover\\:bg-neutral-50:hover, .hover\\:bg-gray-50:hover, .hover\\:bg-gray-100:hover, .hover\\:bg-gray-200:hover, .hover\\:bg-slate-50:hover, .hover\\:bg-slate-100:hover, .hover\\:bg-neutral-100:hover, .hover\\:bg-gray-50\\/50:hover {
        background-color: #2A3040 !important;
      }
      .sidebar, .bg-\\[\\#131722\\] {
        background-color: #131722 !important;
      }
      .text-gray-900, .text-gray-800, .text-gray-700, .text-neutral-800, .text-neutral-700, .text-slate-800, .text-gray-950, .text-neutral-950, .text-slate-950 {
        color: #F5F7FA !important;
      }
      .text-gray-500, .text-gray-600, .text-neutral-500, .text-slate-600, .text-neutral-600 {
        color: #B0B7C3 !important;
      }
      .text-gray-400, .text-neutral-400, .text-slate-400 {
        color: #8C95A5 !important;
      }
      .border-gray-100, .border-gray-200, .border-gray-150, .border-gray-50, .border-neutral-100, .border-gray-300, .border-slate-100, .border-slate-200, .border-neutral-200, .border-slate-150, .border-gray-200\\/50 {
        border-color: #2A3040 !important;
      }
      input, select, textarea {
        background-color: #171B25 !important;
        color: #F5F7FA !important;
        border-color: #2A3040 !important;
      }
      input:focus, select:focus, textarea:focus {
        border-color: ${accentHex} !important;
        background-color: #202634 !important;
      }
      input::placeholder, textarea::placeholder {
        color: #626D7F !important;
      }
      .shadow-sm, .shadow-md, .shadow-lg, .shadow-2xs, .shadow-3xs, .shadow-xs, .shadow-sm {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
      }
      .bg-indigo-50 {
        background-color: rgba(99, 102, 241, 0.15) !important;
        color: #818cf8 !important;
      }
      /* Charts Styling Overrides */
      .recharts-cartesian-grid-horizontal line,
      .recharts-cartesian-grid-vertical line {
        stroke: #2A3040 !important;
        stroke-opacity: 0.8;
      }
      .recharts-text, .recharts-label {
        fill: #B0B7C3 !important;
      }
      .recharts-legend-item-text {
        color: #F5F7FA !important;
      }
      .recharts-tooltip-cursor {
        stroke: #2A3040 !important;
      }
      .recharts-default-tooltip {
        background-color: #171B25 !important;
        border-color: #2A3040 !important;
        color: #F5F7FA !important;
      }
    ` : `
      /* Light Mode Defaults explicitly set to ensure complete override of mixed themes */
      html, body, #root, .main-container {
        background-color: #F7F8FA !important;
        color: #111827 !important;
      }
      .bg-white, .card, .panel {
        background-color: #FFFFFF !important;
        color: #111827 !important;
      }
      .text-gray-900, .text-gray-800, .text-gray-700 {
        color: #111827 !important;
      }
      .text-gray-500, .text-gray-600 {
        color: #4B5563 !important;
      }
    `}
  `;

  if (activeTheme === "Dark") {
    document.documentElement.classList.add("dark");
    document.body.style.backgroundColor = "#0F1117";
    document.body.style.color = "#F5F7FA";
  } else {
    document.documentElement.classList.remove("dark");
    document.body.style.backgroundColor = "#F7F8FA";
    document.body.style.color = "#111827";
  }
}
