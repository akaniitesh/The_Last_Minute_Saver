import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  Layers, 
  Flame, 
  ShieldAlert, 
  Volume2, 
  Lock, 
  ChevronDown, 
  Search, 
  Bookmark, 
  Compass, 
  Calendar, 
  Map, 
  Mic, 
  FileText, 
  Heart, 
  Tv, 
  Activity, 
  Check, 
  Plus, 
  Users, 
  ArrowRight,
  Info,
  ExternalLink,
  Smartphone,
  Eye,
  Settings,
  X
} from "lucide-react";

interface GuidanceTabProps {
  onNavigateToTab: (tab: "dashboard" | "productivity_cockpit" | "planner" | "focus" | "scanner" | "voice" | "habits" | "collaboration" | "languages" | "settings" | "smart_map" | "medicine", initialQuery?: string) => void;
}

export default function GuidanceTab({ onNavigateToTab }: GuidanceTabProps) {
  // --- STATE ---
  const [activeSection, setActiveSection] = useState<string>("all");
  
  // Section 1: Checklist State
  const [checklist, setChecklist] = useState([
    { id: "create_task", label: "Create your first task in the Cockpit", completed: true },
    { id: "upload_doc", label: "Upload a syllabus or brief in the Document Scanner", completed: false },
    { id: "connect_cal", label: "Set up a study focus block in the Calendar", completed: false },
    { id: "set_location", label: "Add a study location coordinates in Smart Maps", completed: false },
    { id: "train_milo", label: "Introduce yourself verbally to Milo Voice Staff", completed: false },
    { id: "enable_notif", label: "Review and toggle personalized system notifications", completed: true },
  ]);

  // Section 3: Feature Walkthrough Modal
  const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null);

  // Section 4: Productivity Blog States
  const [blogSearch, setBlogSearch] = useState("");
  const [selectedBlogCategory, setSelectedBlogCategory] = useState("All");
  const [bookmarkedArticles, setBookmarkedArticles] = useState<string[]>([]);

  // Section 5: Interactive Accessibility States (Demonstration)
  const [largeTextDemo, setLargeTextDemo] = useState(false);
  const [highContrastDemo, setHighContrastDemo] = useState(false);

  // Section 6: FAQ Accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // --- DATA ---
  const blogArticles = [
    {
      id: "procrastination",
      title: "How to Beat Grade-Threatening Procrastination",
      category: "Mindset",
      readTime: "6 min read",
      summary: "Practical strategy to bypass immediate cognitive friction and execute your core assignments under heavy pressure.",
      content: "When deadlines loom, the brain registers high-urgency tasks as friction, triggering a procrastination feedback loop. To beat this, bypass the entire planning phase and execute an aggressive '15-minute raw start block'. Commit to writing terrible draft lines, and do not self-edit. Once the cognitive block decays, transition into standardized Pomodoro sprints. Combine this with Milo's Voice Chief to auto-schedule your next milestone.",
      image: "🎯"
    },
    {
      id: "timeblock",
      title: "The Fine Art of Cognitive Time Blocking",
      category: "Productivity",
      readTime: "5 min read",
      summary: "Defragment your calendar by establishing strict, isolated focus channels instead of multitasking.",
      content: "Multitasking is a myth that costs up to 40% of your cognitive capacity in task-switching overhead. Time blocking solves this by partitioning your calendar into unified, single-purpose slots. For instance, reserve 09:00 AM - 11:00 AM solely for heavy writing, followed by a hard break. Use Milo's Voice Engine to verbalize: 'Milo, block 2 hours for CS102 tomorrow morning' to automatically reserve these shields.",
      image: "⏱️"
    },
    {
      id: "deepwork",
      title: "Establishing Deep Work Shields",
      category: "Focus",
      readTime: "8 min read",
      summary: "Create an impenetrable focus chamber using ambient loops, physical breaks, and mute shields.",
      content: "Deep work represents the state of distraction-free cognitive focus where difficult concepts are synthesized. To enter this state, configure a low-stimulation physical workspace, put your devices on strict DND mode, and stream rhythmic focus sound loops. The Medicine & Focus tab provides custom pacing tools designed to synchronize with deep work blocks. Aim for 90-minute blocks with 10-minute transition buffers.",
      image: "🛡️"
    },
    {
      id: "deadlines",
      title: "Predictive Deadline Risk Mitigation",
      category: "AI Scheduling",
      readTime: "7 min read",
      summary: "How to interpret delay likelihoods and apply emergency timeline compression protocols.",
      content: "Traditional calendars only display dates, neglecting realistic capacity constraints. True deadline intelligence assesses overlap densities, personal fatigue parameters, and historical duration records. When Milo flags a task with high delay risks, activate 'Rescue Mode' on your cockpit. This auto-compresses auxiliary tasks, allowing you to devote maximum energy to securing the critical path before timeline decay sets in.",
      image: "📈"
    },
    {
      id: "accessibility_tips",
      title: "Vocal and Inclusive AI Accessibility Rules",
      category: "Accessibility",
      readTime: "5 min read",
      summary: "Maximize your productivity utilizing full voice interactions, keyboard commands, and high contrast grids.",
      content: "Inclusive software ensures every student operates at peak performance, regardless of situational constraints. Learn to navigate the dashboard using standard keyboard tab structures, and toggle Voice Speech outputs to hear Milo recite your daily priority breakdown. If you suffer from eye strain, activate high-contrast modes to minimize low-frequency screen flicker and optimize text legibility.",
      image: "♿"
    }
  ];

  const featuredTutorials = [
    {
      id: "scanner",
      title: "Document Scanner AI",
      badge: "OCR Engine",
      time: "2 min learn",
      desc: "Instantly parse complex syllabi, project PDFs, or task briefs to pull out deadlines automatically.",
      walkthrough: [
        "Navigate to the Document Scanner workspace.",
        "Drop your syllabus text, exam brief, or PDF text into the scanner input console.",
        "Milo's OCR engine extracts key dates, grade weights, and learning guidelines.",
        "Confirm the extracted parameters and add them directly to your Milestones timeline with 1 click."
      ],
      tab: "scanner" as const,
      color: "from-amber-500/10 to-amber-600/5 text-amber-700 border-amber-100"
    },
    {
      id: "medicine",
      title: "Medicine Planner",
      badge: "Clinical Track",
      time: "3 min learn",
      desc: "Manage and align critical medication schedules alongside intensive academic focus blocks.",
      walkthrough: [
        "Go to the Medicine & Health workspace.",
        "Log your prescription name, timing requirements, and focus impact.",
        "The scheduler creates customized dosage reminders that avoid overlapping with heavy deep-work exam blocks.",
        "Track adherence scores to understand how physical health metrics influence cognitive performance."
      ],
      tab: "medicine" as const,
      color: "from-rose-500/10 to-rose-600/5 text-rose-700 border-rose-100"
    },
    {
      id: "smart_maps",
      title: "Smart Map Planner",
      badge: "GPS Travel",
      time: "4 min learn",
      desc: "Plan travel routes to physical classrooms or testing centers with real-time transit and arrival calculations.",
      walkthrough: [
        "Open the Smart Map Planner workspace.",
        "Search your destination classroom, study cafe, or exam hall coordinates.",
        "The engine calculates active traffic parameters, weather context, and transit delays.",
        "Get a precise recommended departure alert ('Leave by 10:15 AM to arrive early') pushed directly to your timeline."
      ],
      tab: "smart_map" as const,
      color: "from-emerald-500/10 to-emerald-600/5 text-emerald-700 border-emerald-100"
    },
    {
      id: "voice",
      title: "Voice Chief of Staff",
      badge: "Milo AI Speech",
      time: "3 min learn",
      desc: "Talk directly to your voice chief to draft tasks, perform risk analysis, and generate schedules verbally.",
      walkthrough: [
        "Go to the Voice Chief of Staff tab.",
        "Click the center mic node and speak a command (e.g., 'Remind me to write my report tomorrow morning').",
        "Milo automatically transcribes your voice, parses deadlines, and injects tasks into your planner.",
        "The system reads back strategic advice using advanced high-fidelity TTS voice synthesizers."
      ],
      tab: "voice" as const,
      color: "from-indigo-500/10 to-indigo-600/5 text-indigo-700 border-indigo-100"
    }
  ];

  const faqs = [
    {
      q: "How does AI scheduling work?",
      a: "Our system combines priority rankings with cognitive density analysis. By reviewing your outstanding milestones and active travel times, it arranges task categories like 'Do Now' and 'Do Today' in real-time, preventing high-workload overlaps."
    },
    {
      q: "How are reminders and warnings generated?",
      a: "Milo monitors your deadlines hourly. If an assignment is due shortly and you haven't logged study hours, the system triggers custom predictive warnings and offers to auto-compress auxiliary blocks via 'Rescue Mode'."
    },
    {
      q: "Can Milo work offline?",
      a: "Yes! If our online Gemini API experiences rate limits or network issues, Milo activates a highly supportive local failsafe engine. This enables offline task creation, local speech translation, and instant priority triage."
    },
    {
      q: "How is my data stored?",
      a: "Your data is persisted securely inside a personal Google Cloud Firestore database synced directly to your account. Your credentials and custom entries are never exposed or used for general model training."
    },
    {
      q: "Can I share tasks with my team?",
      a: "Shared workspaces and real-time collaboration are coming in Version 2.0. To maintain database consistency and honor strict single-user workflows, Milo currently operates in personal productivity mode."
    }
  ];

  // --- ACTIONS ---
  const handleToggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const checklistProgress = useMemo(() => {
    const completed = checklist.filter(c => c.completed).length;
    return Math.round((completed / checklist.length) * 100);
  }, [checklist]);

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedArticles(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredArticles = useMemo(() => {
    return blogArticles.filter(art => {
      const matchSearch = art.title.toLowerCase().includes(blogSearch.toLowerCase()) || 
                          art.summary.toLowerCase().includes(blogSearch.toLowerCase()) ||
                          art.content.toLowerCase().includes(blogSearch.toLowerCase());
      const matchCat = selectedBlogCategory === "All" || art.category === selectedBlogCategory;
      return matchSearch && matchCat;
    });
  }, [blogSearch, selectedBlogCategory]);

  return (
    <div className={`space-y-8 animate-fade-in pb-12 font-sans ${largeTextDemo ? "text-lg" : "text-sm"} ${highContrastDemo ? "bg-black text-white" : ""}`}>
      
      {/* 1. HERO SECTION WITH gradient blob & floating particles */}
      <div className={`relative overflow-hidden border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm ${
        highContrastDemo ? "border-white bg-neutral-900 text-white" : "border-indigo-150/50 bg-linear-to-br from-indigo-50/50 via-white to-indigo-50/30"
      }`}>
        {/* Animated Background Blob */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-violet-300/20 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />

        <div className="relative z-10 max-w-xl space-y-4 text-center md:text-left">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
            highContrastDemo ? "bg-neutral-800 text-amber-400 border border-white" : "bg-indigo-50 border border-indigo-100 text-indigo-700"
          }`}>
            <BookOpen size={13} className="animate-pulse" />
            <span>LEARNING & ONBOARDING SYSTEM</span>
          </div>

          <h1 className="text-2xl md:text-3.5xl font-display font-bold text-gray-950 tracking-tight leading-tight">
            Meet Milo: Your Intelligent <span className="text-indigo-600 font-extrabold">Chief of Staff</span>
          </h1>

          <p className={`text-xs md:text-sm leading-relaxed ${highContrastDemo ? "text-gray-300" : "text-gray-600"}`}>
            Welcome to your digital Guidance workspace. Milo is built to act as an execution manager—analyzing schedules, navigating paths, extracting briefs, and keeping you organized verbally. Use this center to explore tutorial paths, study performance literature, or check our release roadmap.
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-2.5 pt-1.5">
            <button 
              onClick={() => {
                speakText("Welcome! I am Milo, your Voice Chief of Staff. Explore the Tutorials below to unlock my full potential.");
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Volume2 size={14} />
              <span>Hear Welcome Message</span>
            </button>
            <button 
              onClick={() => onNavigateToTab("voice")}
              className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-mono font-bold uppercase rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
            >
              <span>Vocal Cockpit</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Beautiful Floating Network Card (Visual illustration) */}
        <div className="relative z-10 w-full max-w-[280px] bg-white/70 backdrop-blur-md border border-indigo-100/80 rounded-2xl p-5 shadow-xs flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center gap-2 border-b border-indigo-50 pb-2.5">
            <Sparkles size={14} className="text-amber-500 animate-spin-slow" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-600">Milo Core System Status</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span>LOCAL RUNWAY</span>
              <span className="text-indigo-600 font-bold">STABLE</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full w-[85%] animate-pulse" />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span>ACCESSIBILITY OVERLAY</span>
              <span className={largeTextDemo || highContrastDemo ? "text-emerald-600 font-bold" : "text-gray-500"}>
                {largeTextDemo || highContrastDemo ? "ENGAGED" : "STANDARD"}
              </span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-300 ${largeTextDemo || highContrastDemo ? "bg-emerald-500 w-full" : "bg-gray-300 w-[40%]"}`} />
            </div>
          </div>

          <div className="pt-2 bg-indigo-50/40 rounded-xl p-2.5 border border-indigo-100/50 text-center">
            <span className="text-[9px] font-mono text-indigo-800 uppercase font-bold tracking-widest block">System Capabilities</span>
            <span className="text-[10px] text-gray-500 block mt-0.5 font-sans font-medium">Single-User Secured Database</span>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: "all", label: "All Workspace Guides" },
          { id: "checklist", label: "1. Getting Started Checklist" },
          { id: "milo", label: "2. How Milo Plans Your Work" },
          { id: "tutorials", label: "3. Interactive Tutorials" },
          { id: "blog", label: "4. Productivity Blog" },
          { id: "accessibility", label: "5. Accessibility" },
          { id: "faq", label: "6. Frequently Asked Questions" },
          { id: "roadmap", label: "7. Release Roadmap" },
          { id: "collab", label: "8. Collaboration Lock" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border cursor-pointer transition-all ${
              activeSection === tab.id
                ? "bg-black text-white border-black shadow-xs"
                : "bg-white border-gray-100 text-gray-500 hover:text-black hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- CONTENT WORKSPACE SECTIONS --- */}

      {/* Section 1: GETTING STARTED */}
      {(activeSection === "all" || activeSection === "checklist") && (
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h2 className="text-base font-display font-semibold tracking-tight text-gray-950">Getting Started Checklist</h2>
                <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Step-by-step Interactive onboarding</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-indigo-600 block">{checklistProgress}% Completed</span>
              <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1 ml-auto">
                <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${checklistProgress}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checklist.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleToggleChecklist(item.id)}
                className={`flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer transition-all select-none ${
                  item.completed 
                    ? "bg-indigo-50/20 border-indigo-150 text-gray-700" 
                    : "bg-gray-50/50 border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-black"
                }`}
              >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  item.completed ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-300"
                }`}>
                  {item.completed && <Check size={12} />}
                </div>
                <div className="space-y-0.5">
                  <span className={`text-xs font-sans font-medium leading-normal ${item.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {item.label}
                  </span>
                  <p className="text-[10px] text-gray-400 font-mono uppercase">
                    {item.completed ? "Task Achieved" : "Needs Implementation"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {checklistProgress === 100 && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl flex items-center gap-3"
            >
              <Sparkles size={18} className="text-emerald-600 animate-spin-slow shrink-0" />
              <div>
                <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider block">🎉 Onboarding Sequence Fully Calibrated!</span>
                <p className="text-[11px] text-emerald-700/90 leading-relaxed font-sans font-medium mt-0.5">
                  Outstanding! You've analyzed all starting points. Milo is ready to coordinate your schedule. Speak with Milo verbally or write down actions to secure your GPA path.
                </p>
              </div>
            </motion.div>
          )}
        </section>
      )}

      {/* Section 2: HOW MILO PLANS YOUR WORK */}
      {(activeSection === "all" || activeSection === "milo") && (
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-gray-50 pb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Compass size={16} />
            </div>
            <div>
              <h2 className="text-base font-display font-semibold tracking-tight text-gray-950">How Milo Plans Your Work</h2>
              <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Your core scheduling and prioritization engine explained</p>
            </div>
          </div>

          {/* Explanation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { title: "Task Prioritization", desc: "Milo automatically filters and categorizes your milestones into 'Do Now', 'Do Today', or 'Can Wait' classes by running predictive analysis on task weights, deadlines, and current loads." },
              { title: "Deadline Alignment", desc: "Approaching deadlines dynamically scale and elevate risk scores, pushing urgent work items to the top of your execution queue before deadline margins decay." },
              { title: "Focus Sessions Selection", desc: "Our planner identifies isolated focus windows to match your high-alert time zones, guarding dedicated blocks to shield you from cognitive multi-tasking." },
              { title: "Redistributing Missed Work", desc: "If active milestones pass their target buffer windows without completion, Milo's scheduler redistributes outstanding tasks across tomorrow's slots without timeline shock." },
              { title: "Recovery & Break Windows", desc: "Optimal cognitive study breaks, breathing intervals, and healthcare schedules are integrated directly into calendar grids to maintain physical and mental stability." }
            ].map((cap, idx) => (
              <div key={idx} className="bg-gray-50/50 border border-gray-150 p-4 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase block">0{idx + 1}. {cap.title}</span>
                  <p className="text-xs text-gray-600 leading-relaxed font-sans mt-2">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Voice Examples Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider">Try Speaking / Writing These Commands:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { text: "Hey Milo, plan my day", desc: "Generates an hour-by-hour calendar blueprint.", command: "Plan my day" },
                { text: "Navigate to the bank", desc: "Coordinates live mapping routing & alerts.", command: "Navigate to the bank" },
                { text: "Summarize this PDF", desc: "Extracts exam briefs and requirements.", command: "Summarize this PDF" },
                { text: "Add a task to study Chemistry tomorrow morning under Do Now category", desc: "Instantly parses, categorizes, and adds task.", command: "Add a task to study Chemistry tomorrow morning under Do Now category" }
              ].map((ex, idx) => (
                <div key={idx} className="bg-white border border-gray-150 p-4 rounded-xl flex flex-col justify-between gap-3 shadow-2xs hover:border-indigo-400 transition-colors">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-gray-800 tracking-tight block">“{ex.text}”</span>
                    <p className="text-[11px] text-gray-500 font-sans leading-normal">{ex.desc}</p>
                  </div>
                  <button 
                    onClick={() => {
                      speakText(ex.text);
                      onNavigateToTab("voice", ex.command);
                    }}
                    className="w-full py-1.5 bg-gray-50 hover:bg-indigo-600 hover:text-white text-gray-700 text-[10px] font-mono font-bold uppercase border border-gray-200 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Try Verbal Command</span>
                    <ArrowRight size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 3: FEATURE TUTORIALS */}
      {(activeSection === "all" || activeSection === "tutorials") && (
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5 animate-fade-in">
          <div className="border-b border-gray-50 pb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Compass size={16} />
            </div>
            <div>
              <h2 className="text-base font-display font-semibold tracking-tight text-gray-950">Feature Tutorials</h2>
              <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Explore each dedicated modular system</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredTutorials.map((tut) => (
              <div 
                key={tut.id}
                className="bg-white border border-gray-150 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-2xs hover:shadow-xs hover:border-gray-300 transition-all text-left"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border bg-linear-to-r ${tut.color}`}>
                      {tut.badge}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{tut.time}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-display font-bold text-gray-900">{tut.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed font-sans">{tut.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedTutorial(tut.id)}
                    className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white text-[10px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Tv size={12} />
                    <span>Watch Walkthrough</span>
                  </button>
                  <button 
                    onClick={() => onNavigateToTab(tut.tab)}
                    className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[10px] font-mono font-bold uppercase border border-gray-200 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Launch Tool</span>
                    <ExternalLink size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Walkthrough Modal */}
          <AnimatePresence>
            {selectedTutorial && (() => {
              const tutData = featuredTutorials.find(t => t.id === selectedTutorial);
              if (!tutData) return null;
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white border border-gray-100 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative"
                  >
                    <button 
                      onClick={() => setSelectedTutorial(null)}
                      className="absolute top-4 right-4 p-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 cursor-pointer"
                    >
                      <X size={15} />
                    </button>

                    <div className="space-y-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border bg-linear-to-r ${tutData.color}`}>
                        {tutData.badge}
                      </span>
                      <h3 className="text-base font-display font-bold text-gray-950">Milo Walkthrough: {tutData.title}</h3>
                      <p className="text-xs text-gray-600 font-sans leading-relaxed">{tutData.desc}</p>
                      
                      <div className="space-y-3 pt-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 block border-b pb-1.5">Interactive Steps:</span>
                        <div className="space-y-2.5">
                          {tutData.walkthrough.map((step, idx) => (
                            <div key={idx} className="flex gap-3">
                              <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="text-xs text-gray-700 leading-relaxed font-sans">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedTutorial(null);
                            onNavigateToTab(tutData.tab);
                          }}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer text-center"
                        >
                          Launch Workspace Engine Now
                        </button>
                        <button 
                          onClick={() => setSelectedTutorial(null)}
                          className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-mono font-bold uppercase border border-gray-200 rounded-xl transition-all cursor-pointer text-center"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })()}
          </AnimatePresence>
        </section>
      )}

      {/* Section 4: PRODUCTIVITY BLOG */}
      {(activeSection === "all" || activeSection === "blog") && (
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-gray-50 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <BookOpen size={16} />
              </div>
              <div>
                <h2 className="text-base font-display font-semibold tracking-tight text-gray-950">Productivity Blog</h2>
                <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Literature to optimize your performance parameters</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-2.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search articles..."
                  value={blogSearch}
                  onChange={(e) => setBlogSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 focus:border-black rounded-lg text-xs placeholder-gray-400 focus:outline-none transition-all font-sans"
                />
              </div>

              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 p-1 rounded-lg">
                {["All", "Focus", "Mindset", "Productivity"].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedBlogCategory(cat)}
                    className={`px-2 py-1 text-[10px] font-mono font-bold rounded-md cursor-pointer transition-all ${
                      selectedBlogCategory === cat ? "bg-white text-black shadow-2xs border border-gray-150" : "text-gray-500 hover:text-black"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredArticles.map((art) => {
              const isBookmarked = bookmarkedArticles.includes(art.id);
              return (
                <div 
                  key={art.id}
                  className="bg-white border border-gray-150 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-2xs hover:shadow-xs transition-all text-left"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {art.category}
                      </span>
                      <button 
                        onClick={() => toggleBookmark(art.id)}
                        className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                          isBookmarked 
                            ? "bg-amber-50 border-amber-200 text-amber-600" 
                            : "bg-gray-50 border-gray-200 text-gray-400 hover:text-black hover:bg-gray-100"
                        }`}
                        title={isBookmarked ? "Remove Bookmark" : "Bookmark Article"}
                      >
                        <Bookmark size={12} className={isBookmarked ? "fill-amber-500" : ""} />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl shrink-0">{art.image}</span>
                        <h3 className="text-xs font-mono font-bold text-gray-950 truncate">{art.title}</h3>
                      </div>
                      <p className="text-[11px] text-gray-500 font-sans leading-relaxed line-clamp-3">{art.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <span className="text-[10px] text-gray-400 font-mono">{art.readTime}</span>
                    <button 
                      onClick={() => {
                        speakText(art.title + ". " + art.content);
                        alert(`📖 ${art.title}\n\n${art.content}`);
                      }}
                      className="px-3 py-1 bg-gray-50 hover:bg-black hover:text-white text-gray-700 text-[10px] font-mono font-bold uppercase rounded border border-gray-200 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>Read More</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredArticles.length === 0 && (
              <div className="col-span-full py-8 text-center bg-gray-50 border border-gray-150 rounded-2xl">
                <Info size={24} className="text-gray-400 mx-auto mb-2" />
                <span className="text-xs font-mono font-bold text-gray-500 block uppercase">No Matching Literature</span>
                <p className="text-[10px] text-gray-400 font-sans mt-0.5">Try searching for other key productivity keywords.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Section 5: ACCESSIBILITY GUIDE */}
      {(activeSection === "all" || activeSection === "accessibility") && (
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-gray-50 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <Activity size={16} />
              </div>
              <div>
                <h2 className="text-base font-display font-semibold tracking-tight text-gray-950">Accessibility Guide</h2>
                <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Inclusive software rules for peak student execution</p>
              </div>
            </div>

            {/* Quick Demo toggles */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setLargeTextDemo(!largeTextDemo)}
                className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                  largeTextDemo 
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm" 
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:text-black"
                }`}
              >
                {largeTextDemo ? "LARGE TEXT ON" : "TOGGLE LARGE TEXT"}
              </button>
              <button 
                onClick={() => setHighContrastDemo(!highContrastDemo)}
                className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                  highContrastDemo 
                    ? "bg-black text-amber-400 border-black shadow-sm" 
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:text-black"
                }`}
              >
                {highContrastDemo ? "HIGH CONTRAST ON" : "TOGGLE HIGH CONTRAST"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2 text-left bg-gray-50/50 border border-gray-100 p-4 rounded-xl">
              <span className="text-[10px] font-mono text-purple-600 font-bold uppercase block">🔊 Milo Voice Feedback</span>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                Every speech synthesis output is formatted strictly with semantic HTML to guarantee clear auditory translation for vision-impaired operators.
              </p>
            </div>
            <div className="space-y-2 text-left bg-gray-50/50 border border-gray-100 p-4 rounded-xl">
              <span className="text-[10px] font-mono text-purple-600 font-bold uppercase block">⌨️ Keyboard Navigation</span>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                You can fully navigate the vocal cockpit and schedule layouts utilizing standard <kbd className="bg-white border border-gray-200 px-1 py-0.5 rounded text-[10px] font-mono">Tab</kbd> and <kbd className="bg-white border border-gray-200 px-1 py-0.5 rounded text-[10px] font-mono">Enter</kbd> combinations.
              </p>
            </div>
            <div className="space-y-2 text-left bg-gray-50/50 border border-gray-100 p-4 rounded-xl">
              <span className="text-[10px] font-mono text-purple-600 font-bold uppercase block">🎨 Font & Contrast Scales</span>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                The UI utilizes standard Tailwind grid structures that support fluid browser magnification of up to 400% without structural layout fragmentation.
              </p>
            </div>
          </div>

          {/* Accessibility Shortcuts */}
          <div className="bg-purple-50/30 border border-purple-100/50 rounded-xl p-4 space-y-2">
            <span className="text-[9px] font-mono text-purple-800 uppercase font-bold tracking-widest block">Core Accessibility Shortcuts (Click to execute)</span>
            <div className="flex flex-wrap gap-2.5">
              {[
                { label: "Mute Speech Synth", action: () => speakText("") },
                { label: "Read Active Deadlines", action: () => speakText("You have three upcoming task deadlines this week. Make sure to review your scanner briefs.") },
                { label: "Activate High Contrast Mode", action: () => setHighContrastDemo(prev => !prev) }
              ].map((sc, idx) => (
                <button
                  key={idx}
                  onClick={sc.action}
                  className="px-3 py-1.5 bg-white hover:bg-purple-100 text-purple-700 text-[10px] font-mono font-bold uppercase border border-purple-150 rounded-lg shadow-2xs cursor-pointer transition-all"
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 6: FREQUENTLY ASKED QUESTIONS */}
      {(activeSection === "all" || activeSection === "faq") && (
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5 animate-fade-in">
          <div className="border-b border-gray-50 pb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
              <HelpCircle size={16} />
            </div>
            <div>
              <h2 className="text-base font-display font-semibold tracking-tight text-gray-950">Frequently Asked Questions</h2>
              <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Answers to mechanical queries</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-gray-50/40 border border-gray-150/75 rounded-xl overflow-hidden transition-all text-left"
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-gray-50"
                  >
                    <span className="text-xs font-mono font-bold text-gray-950">{faq.q}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 border-t border-gray-50 pt-2.5 text-xs text-gray-600 font-sans leading-relaxed"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 7: RELEASE ROADMAP */}
      {(activeSection === "all" || activeSection === "roadmap") && (
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-gray-50 pb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Layers size={16} />
            </div>
            <div>
              <h2 className="text-base font-display font-semibold tracking-tight text-gray-950">Release Roadmap</h2>
              <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Timeline of our mechanical evolution</p>
            </div>
          </div>

          <div className="relative border-l-2 border-gray-100 pl-6 ml-3 space-y-6 text-left">
            {[
              { 
                v: "Version 1.0 (Released)", 
                status: "✔ Released", 
                statusColor: "bg-emerald-50 border-emerald-150 text-emerald-700",
                desc: "Personal execution dashboard. Fully realized local database, interactive map planner, clinical medicine logs, syllabus analyzer OCR, and multi-turn vocal chief-of-staff." 
              },
              { 
                v: "Version 1.5 (In Development)", 
                status: "🚧 In Development", 
                statusColor: "bg-amber-50 border-amber-150 text-amber-700",
                desc: "Local PDF rendering improvements, native audio-input filters for better transcription precision in loud environments, and localized notification cooldown triggers." 
              },
              { 
                v: "Version 2.0 (Coming Soon)", 
                status: "🔒 Coming Soon", 
                statusColor: "bg-blue-50 border-blue-150 text-blue-700",
                desc: "Comprehensive database architecture upgrade to support multi-user team workspaces, shared milestone planners, and live audio team meetings." 
              },
              { 
                v: "Version 3.0 (Coming Soon)", 
                status: "🔒 Coming Soon", 
                statusColor: "bg-purple-50 border-purple-150 text-purple-700",
                desc: "Predictive collaboration scheduling. High-fidelity calendar defragmentation loops optimized for multi-person schedules across varying global time zones." 
              }
            ].map((node, idx) => (
              <div key={idx} className="relative">
                {/* Timeline Node Dot */}
                <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border border-white shadow-xs" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-900">{node.v}</span>
                    <span className={`px-2 py-0.25 rounded border text-[8px] font-mono font-bold uppercase tracking-wide ${node.statusColor}`}>
                      {node.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed font-sans">{node.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 8: COMING SOON / COLLABORATION LOCK */}
      {(activeSection === "all" || activeSection === "collab") && (
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-gray-50 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-linear-to-r from-indigo-500/10 to-indigo-600/5 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
              <div>
                <h2 className="text-base font-display font-semibold tracking-tight text-gray-950">Coming Soon: Collaboration Suite</h2>
                <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Secure Multi-User Team Workspaces</p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-50 border border-indigo-150 text-indigo-700">
              COMING IN VERSION 2.0
            </span>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed font-sans text-left">
            We operate under strict database single-user principles to ensure zero data pollution or unrequested simulated workloads. Until we deploy full relational multi-user frameworks in Version 2.0, all collaboration components are safely offline to protect your private data structure. Here is what we are building for you:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Users, title: "🌍 Real-Time Collaboration", desc: "Co-author group milestones, assign tasks, and track individual progress pipelines." },
              { icon: Layers, title: "👥 Shared Workspace", desc: "A unified cockpit for teams to consolidate syllabus briefs and class calendars." },
              { icon: Mic, title: "📞 Voice Meetings", desc: "Concentric voice hubs integrated directly with Milo's audio transcription engine." },
              { icon: BookOpen, title: "💬 Team Chat", desc: "Contextual channels tied directly to high-risk project deliverables." },
              { icon: Activity, title: "📊 Team Analytics", desc: "Predictive workload charts mapping each teammate's hourly capacity." },
              { icon: Settings, title: "🔄 Live Sync", desc: "Seamless database synchronization across mobile devices and browser tabs." }
            ].map((card, idx) => {
              const IconComp = card.icon;
              return (
                <div 
                  key={idx}
                  className="bg-gray-50/40 border border-gray-150/75 rounded-xl p-4.5 flex flex-col justify-between gap-3 text-left relative overflow-hidden"
                >
                  {/* Lock Watermark Icon */}
                  <div className="absolute right-3 top-3 text-gray-200/50">
                    <Lock size={16} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 rounded text-gray-500 shrink-0">
                        <IconComp size={14} />
                      </div>
                      <h3 className="text-xs font-mono font-bold text-gray-900">{card.title}</h3>
                    </div>
                    <p className="text-[11px] text-gray-500 font-sans leading-normal">{card.desc}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[9px] font-mono text-gray-400 border-t border-gray-50">
                    <span>STATUS: IN PLANNING</span>
                    <span className="font-bold text-gray-500">LOCK 🔒</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Waitlist Call-to-Action */}
          <div className="bg-indigo-50/20 border border-indigo-150 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <span className="text-xs font-mono font-bold text-indigo-800 uppercase tracking-wider block">Join the Version 2.0 Collaboration Waitlist</span>
              <p className="text-[11px] text-indigo-700/90 leading-relaxed font-sans font-medium mt-0.5">
                Be the first to access our secure multi-user capabilities. Get notified when testing gates open.
              </p>
            </div>
            <button 
              onClick={() => {
                alert("Thank you! You have been successfully added to the Version 2.0 Collaboration Waitlist.");
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase rounded-lg transition-all shadow-sm shrink-0 cursor-pointer"
            >
              Join waitlist
            </button>
          </div>
        </section>
      )}

    </div>
  );
}
