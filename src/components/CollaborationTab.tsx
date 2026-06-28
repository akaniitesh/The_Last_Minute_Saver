import React, { useState, useEffect } from "react";
import { Task } from "../types";
import { 
  Users, 
  UserPlus, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Send, 
  FolderPlus, 
  UserCheck, 
  Share2, 
  MessageSquare,
  Sparkles,
  Zap,
  Bookmark,
  Globe,
  Moon,
  Sun,
  Calendar,
  AlertTriangle,
  Languages,
  BellRing,
  Activity,
  Check,
  RefreshCw,
  Sliders,
  User,
  MapPin,
  Sparkle
} from "lucide-react";
import { useLocalization, countryConfigs } from "../context/LocalizationContext";
import { motion, AnimatePresence } from "motion/react";

interface CollaborationTabProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  country: string;
  flag: string;
  timezone: string;
  workingHours: { start: number; end: number }; // 24h format
  language: string;
  nativeLanguage: string;
  holidays: Array<{ date: string; name: string; type: string }>;
  skills: string[];
  avatar: string;
  color: string;
  status: "working" | "lunch" | "sleeping" | "offline";
}

interface SharedProject {
  id: string;
  name: string;
  description: string;
  tasks: string[]; // task IDs
  members: string[]; // member IDs
  updates: Array<{
    id: string;
    sender: string;
    message: string;
    originalMessage?: string;
    timestamp: string;
    type: "system" | "message" | "completion" | "meeting" | "handover";
    translated?: boolean;
  }>;
}

export default function CollaborationTab({ tasks, onUpdateTask }: CollaborationTabProps) {
  const { 
    country, 
    setCountry, 
    timeFormat, 
    isOffline, 
    setIsOffline 
  } = useLocalization();

  // Active workspace language for simulation
  const [workspaceLanguage, setWorkspaceLanguage] = useState<string>("English");

  // Simulated timezone time tracking
  const [timeTick, setTimeTick] = useState(new Date());

  // Simulation of custom meeting planning
  const [selectedMeetingTeammates, setSelectedMeetingTeammates] = useState<string[]>(["m-1", "m-2", "m-3"]);
  const [meetingLengthMinutes, setMeetingLengthMinutes] = useState<number>(60);
  const [proposedLocalHour, setProposedLocalHour] = useState<number>(14); // 2:00 PM

  // Handover state machine for "Follow the Sun"
  const [handoverStep, setHandoverStep] = useState<"idle" | "india" | "germany" | "usa">("idle");
  const [handoverLogs, setHandoverLogs] = useState<string[]>([]);
  const [activeHandoverTask, setActiveHandoverTask] = useState<string>("");

  // Notification queue (respecting sleep/DND)
  const [notificationQueue, setNotificationQueue] = useState<Array<{
    id: string;
    message: string;
    recipient: string;
    recipientTime: string;
    status: "held" | "sent";
    scheduledFor: string;
  }>>([
    {
      id: "nq-1",
      message: "Please review the database schema migration scripts.",
      recipient: "Kenji Sato",
      recipientTime: "JST (Tokyo)",
      status: "held",
      scheduledFor: "9:00 AM Local Time"
    },
    {
      id: "nq-2",
      message: "Can you design the final slide deck outline?",
      recipient: "Alex Chen",
      recipientTime: "EDT (New York)",
      status: "held",
      scheduledFor: "9:00 AM Local Time"
    }
  ]);

  // Update clock ticks
  useEffect(() => {
    const timer = setInterval(() => setTimeTick(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Set up static Teammates database with localization parameters
  const [members, setMembers] = useState<TeamMember[]>([
    { 
      id: "m-1", 
      name: "You", 
      role: "Lead Project Coordinator", 
      country: country, 
      flag: countryConfigs[country]?.flag || "🇺🇸", 
      timezone: countryConfigs[country]?.timezone || "America/New_York", 
      workingHours: { start: 9, end: 17 }, 
      language: "English",
      nativeLanguage: "English",
      holidays: countryConfigs[country]?.holidays?.map(h => ({ ...h, type: "National" })) || [],
      skills: ["Coordination", "Integration", "Architecture"],
      avatar: "Y", 
      color: "bg-black",
      status: "working"
    },
    { 
      id: "m-2", 
      name: "Rahul Sharma", 
      role: "Backend Engineer", 
      country: "India", 
      flag: "🇮🇳", 
      timezone: "Asia/Kolkata", 
      workingHours: { start: 10, end: 18 }, 
      language: "Hindi",
      nativeLanguage: "Hindi",
      holidays: [
        { date: "11/08/2026", name: "Diwali Festival of Lights", type: "Festival" },
        { date: "08/15/2026", name: "Independence Day", type: "National" },
        { date: "01/26/2026", name: "Republic Day", type: "National" }
      ],
      skills: ["Database", "TypeScript", "Performance"],
      avatar: "RS", 
      color: "bg-orange-600",
      status: "working"
    },
    { 
      id: "m-3", 
      name: "Alex Chen", 
      role: "Product Manager", 
      country: "United States", 
      flag: "🇺🇸", 
      timezone: "America/New_York", 
      workingHours: { start: 9, end: 17 }, 
      language: "English",
      nativeLanguage: "English",
      holidays: [
        { date: "11/26/2026", name: "Thanksgiving Holiday", type: "National" },
        { date: "07/04/2026", name: "Independence Day", type: "National" }
      ],
      skills: ["Presentation", "Strategy", "User Testing"],
      avatar: "AC", 
      color: "bg-indigo-600",
      status: "working"
    },
    { 
      id: "m-4", 
      name: "Kenji Sato", 
      role: "Algorithm Lead", 
      country: "Japan", 
      flag: "🇯🇵", 
      timezone: "Asia/Tokyo", 
      workingHours: { start: 9, end: 18 }, 
      language: "Japanese",
      nativeLanguage: "Japanese",
      holidays: [
        { date: "05/03/2026", name: "Constitution Memorial Day", type: "National" },
        { date: "08/11/2026", name: "Mountain Day Holiday", type: "National" }
      ],
      skills: ["Algorithms", "Optimization", "AI Integration"],
      avatar: "KS", 
      color: "bg-rose-600",
      status: "sleeping"
    },
    { 
      id: "m-5", 
      name: "Emma Weber", 
      role: "QA Engineer", 
      country: "Germany", 
      flag: "🇩🇪", 
      timezone: "Europe/Berlin", 
      workingHours: { start: 9, end: 17 }, 
      language: "German",
      nativeLanguage: "German",
      holidays: [
        { date: "10/03/2026", name: "German Unity Day", type: "National" },
        { date: "12/25/2026", name: "Christmas Day", type: "National" }
      ],
      skills: ["Unit Testing", "Documentation", "QA Reviews"],
      avatar: "EW", 
      color: "bg-emerald-600",
      status: "offline"
    },
    { 
      id: "m-6", 
      name: "Sarah Miller", 
      role: "Technical Writer", 
      country: "Australia", 
      flag: "🇦🇺", 
      timezone: "Australia/Sydney", 
      workingHours: { start: 8.5, end: 17 }, 
      language: "English",
      nativeLanguage: "English",
      holidays: [
        { date: "01/26/2026", name: "Australia Day", type: "National" },
        { date: "04/25/2026", name: "ANZAC Day", type: "National" }
      ],
      skills: ["Editing", "Technical Writing", "Coordination"],
      avatar: "SM", 
      color: "bg-purple-600",
      status: "working"
    }
  ]);

  // Sync "You" teammate timezone details whenever active context country changes
  useEffect(() => {
    setMembers(prev => prev.map(m => {
      if (m.id === "m-1") {
        const currentConf = countryConfigs[country] || countryConfigs["United States"];
        return {
          ...m,
          country: country,
          flag: currentConf.flag,
          timezone: currentConf.timezone,
          holidays: currentConf.holidays?.map(h => ({ ...h, type: "National" })) || []
        };
      }
      return m;
    }));
  }, [country]);

  // Initial projects list with expanded simulated data
  const [projects, setProjects] = useState<SharedProject[]>([
    {
      id: "p-1",
      name: "Global Academic Research & Compilation",
      description: "Joint study and outline sharing for global industrial reform checkpoints across time zones.",
      tasks: ["seed-1"],
      members: ["m-1", "m-2", "m-3", "m-4", "m-5", "m-6"],
      updates: [
        { id: "u-1", sender: "Rahul Sharma", message: "Successfully pushed code structure templates to our repository.", originalMessage: "Successfully pushed code structure templates to our repository.", timestamp: "2 hours ago", type: "completion" },
        { id: "u-2", sender: "Emma Weber", message: "I will commence QA testing on the integration hooks tomorrow morning CET.", originalMessage: "Ich werde morgen früh CET mit den QA-Tests für die Integrations-Hooks beginnen.", timestamp: "1 hour ago", type: "message" },
        { id: "u-3", sender: "System", message: "Follow-The-Sun Handover checklist synchronized for timezone pipelines.", timestamp: "Just now", type: "system" }
      ]
    },
    {
      id: "p-2",
      name: "Global Presentation Launch Strategy",
      description: "Multi-regional slides assembly, reviews, and localized content delivery frameworks.",
      tasks: ["seed-2"],
      members: ["m-1", "m-3", "m-6"],
      updates: [
        { id: "u-4", sender: "Alex Chen", message: "Designed the initial project mockup templates for review.", originalMessage: "Designed the initial project mockup templates for review.", timestamp: "4 hours ago", type: "completion" },
        { id: "u-5", sender: "System", message: "Global presentation study group initialized.", timestamp: "3 hours ago", type: "system" }
      ]
    }
  ]);

  const [activeProjectId, setActiveProjectId] = useState<string>("p-1");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [selectedTasksForNewProj, setSelectedTasksForNewProj] = useState<string[]>([]);
  const [selectedMembersForNewProj, setSelectedMembersForNewProj] = useState<string[]>(["m-1"]);
  const [isCreatingProj, setIsCreatingProj] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Contributor");
  const [showInviteAlert, setShowInviteAlert] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  // Helper to resolve tasks in active project
  const projectTasks = tasks.filter(t => activeProject.tasks.includes(t.id));

  // Dynamic status evaluation based on collaborator timezones
  const getTeammateLocalHour = (timezone: string): number => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        hour: "numeric",
        hour12: false
      };
      const str = new Intl.DateTimeFormat("en-US", options).format(timeTick);
      return parseInt(str);
    } catch (e) {
      return 12;
    }
  };

  const getTeammateStatus = (m: TeamMember): "working" | "lunch" | "sleeping" | "offline" => {
    const localHour = getTeammateLocalHour(m.timezone);
    if (localHour >= 22 || localHour < 7) {
      return "sleeping";
    }
    if (localHour >= 12 && localHour < 13) {
      return "lunch";
    }
    if (localHour >= m.workingHours.start && localHour < m.workingHours.end) {
      return "working";
    }
    return "offline";
  };

  // Resolve team members with computed live status
  const liveMembers = members.map(m => ({
    ...m,
    status: getTeammateStatus(m)
  }));

  // Handle task delegation
  const handleDelegateTask = (taskId: string, memberId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const targetMember = members.find(m => m.id === memberId);
    if (!targetMember) return;

    const updatedNotes = `${task.notes || ""}\n[Delegated to: ${targetMember.name}]`.trim();
    
    const updatedTask: Task = {
      ...task,
      notes: updatedNotes,
      category: memberId === "m-1" ? "Do Now" : "Delegate",
      justification: `Task delegated to ${targetMember.name} (Timezone: ${targetMember.timezone}) for optimized regional productivity.`
    };
    onUpdateTask(updatedTask);

    const newUpdate = {
      id: `u-${Date.now()}`,
      sender: "System",
      message: `Task "${task.title}" was delegated to ${targetMember.name} (${targetMember.flag} ${targetMember.country}).`,
      timestamp: "Just now",
      type: "system" as const
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return { ...p, updates: [newUpdate, ...p.updates] };
      }
      return p;
    }));
  };

  // Translations dataset for simulation
  const translations: Record<string, Record<string, string>> = {
    "English": {
      "u-1": "Successfully pushed code structure templates to our repository.",
      "u-2": "I will commence QA testing on the integration hooks tomorrow morning CET.",
      "u-3": "Follow-The-Sun Handover checklist synchronized for timezone pipelines.",
      "u-4": "Designed the initial project mockup templates for review.",
      "u-5": "Global presentation study group initialized.",
      "coach-1": "Rahul Sharma (India) and Alex Chen (US) have a 3-hour overlap window starting soon. This is the best slot for live review sessions.",
      "coach-2": "Kenji Sato (Japan) is currently asleep. Direct messages will be queued for 9:00 AM JST.",
      "coach-3": "Emma Weber (Germany) has German Unity Day next week. Suggest scheduling reviews earlier."
    },
    "Hindi": {
      "u-1": "सफलतापूर्वक हमारे रिपॉजिटरी में कोड संरचना टेम्पलेट्स अपलोड कर दिए गए हैं।",
      "u-2": "मैं कल सुबह CET समय पर एकीकरण हुक पर QA परीक्षण शुरू करूंगी।",
      "u-3": "समय क्षेत्र पाइपलाइनों के लिए फॉलो-द-सन हैंडओवर चेकलिस्ट सिंक हो गई है।",
      "u-4": "समीक्षा के लिए प्रारंभिक परियोजना मॉकअप टेम्पलेट डिजाइन किए गए।",
      "u-5": "वैश्विक प्रस्तुति अध्ययन समूह आरंभ किया गया।",
      "coach-1": "राहुल शर्मा (भारत) और एलेक्स चेन (यूएस) के पास जल्द ही शुरू होने वाली 3 घंटे की ओवरलैप विंडो है। यह लाइव समीक्षा सत्रों के लिए सबसे अच्छा स्लॉट है।",
      "coach-2": "केन्जी सातो (जापान) इस समय सो रहे हैं। सीधे संदेश सुबह 9:00 बजे JST के लिए कतारबद्ध किए जाएंगे।",
      "coach-3": "एम्मा वेबर (जर्मनी) के पास अगले सप्ताह जर्मन एकता दिवस है। समीक्षाएं पहले ही निर्धारित करने का सुझाव दें।",
      "custom-input": "मैंने प्रोजेक्ट माइलस्टोन पूरे कर लिए हैं!"
    },
    "Japanese": {
      "u-1": "コード構造のテンプレートをリポジトリに正常にプッシュしました。",
      "u-2": "明日朝のCET（中央ヨーロッパ時間）に、統合フックの品質保証（QA）テストを開始します。",
      "u-3": "タイムゾーン・パイプライン向けの「フォロー・ザ・サン」引き継ぎリストが同期されました。",
      "u-4": "レビュー用に初期のプロジェクトモックアップテンプレートを設計しました。",
      "u-5": "グローバルプレゼンテーション研究グループが初期化されました。",
      "coach-1": "ラフル・シャルマ（インド）とアレックス・チェン（米国）は、間もなく3時間の重複可能時間（オーバーラップ）を迎えます。これはライブレビューセッションに最適な時間帯です。",
      "coach-2": "佐藤健二（日本）は現在就寝中です。ダイレクトメッセージは日本時間午前9時に送信予約されます。",
      "coach-3": "エマ・ウェーバー（ドイツ）は来週、ドイツ統一の日を迎えます。早めのレビュー調整を推奨します。",
      "custom-input": "プロジェクトのマイルストーンを完了しました！"
    },
    "German": {
      "u-1": "Code-Struktur-Vorlagen wurden erfolgreich in unser Repository übertragen.",
      "u-2": "Ich werde morgen früh CET mit den QA-Tests für die Integrations-Hooks beginnen.",
      "u-3": "Follow-The-Sun-Übergabeprotokoll für Zeitzonen-Pipelines synchronisiert.",
      "u-4": "Die ersten Projekt-Mockup-Vorlagen wurden zur Überprüfung entworfen.",
      "u-5": "Globale Präsentations-Studiengruppe initialisiert.",
      "coach-1": "Rahul Sharma (Indien) und Alex Chen (USA) haben bald ein 3-stündiges Überlappungsfenster. Dies ist der beste Slot für Live-Reviews.",
      "coach-2": "Kenji Sato (Japan) schläft derzeit. Direktnachrichten werden für 09:00 Uhr JST in die Warteschlange gestellt.",
      "coach-3": "Emma Weber (Deutschland) hat nächste Woche den Tag der Deutschen Einheit. Es wird empfohlen, Reviews früher zu planen.",
      "custom-input": "Ich habe die Projektmeilensteine abgeschlossen!"
    }
  };

  // Helper to translate stream items dynamically based on simulated UI language
  const getTranslatedText = (id: string, defaultText: string) => {
    return translations[workspaceLanguage]?.[id] || defaultText;
  };

  // Send Project message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const originalMsg = chatMessage;
    // Mock auto-translated output based on simulated language
    const translatedMsg = workspaceLanguage !== "English" 
      ? `[Translated to ${workspaceLanguage}] ${originalMsg}`
      : originalMsg;

    const newUpdate = {
      id: `u-${Date.now()}`,
      sender: "You (Lead)",
      message: translatedMsg,
      originalMessage: originalMsg,
      timestamp: "Just now",
      type: "message" as const,
      translated: workspaceLanguage !== "English"
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return { ...p, updates: [newUpdate, ...p.updates] };
      }
      return p;
    }));

    setChatMessage("");

    // Simulate notification boundary filter if recipient is offline/asleep
    liveMembers.forEach(m => {
      if (m.id !== "m-1") {
        const status = getTeammateStatus(m);
        if (status === "sleeping" || status === "offline") {
          const recHour = getTeammateLocalHour(m.timezone);
          const queueItem = {
            id: `nq-${Date.now()}-${m.id}`,
            message: originalMsg,
            recipient: m.name,
            recipientTime: `${m.timezone.split("/").pop()} (Local Hour: ${recHour}:00)`,
            status: "held" as const,
            scheduledFor: "9:00 AM Local Time"
          };
          setNotificationQueue(prev => [queueItem, ...prev]);
        }
      }
    });

    // Simulate collaborator feedback
    setTimeout(() => {
      const responseMessages = [
        "Sounds like an excellent plan! I am on it.",
        "Checking my availability calendar now to align focus slots.",
        "The project milestones look fully balanced for my local shift.",
        "Perfect. Will update my subtasks list once my shift starts."
      ];
      const randomResponse = responseMessages[Math.floor(Math.random() * responseMessages.length)];
      
      const activePeers = liveMembers.filter(m => m.id !== "m-1" && activeProject.members.includes(m.id) && m.status === "working");
      if (activePeers.length > 0) {
        const peer = activePeers[0];
        const peerUpdate = {
          id: `u-peer-${Date.now()}`,
          sender: peer.name,
          message: workspaceLanguage !== "English" 
            ? `[Auto-Translated] ${randomResponse}`
            : randomResponse,
          originalMessage: randomResponse,
          timestamp: "Just now",
          type: "message" as const,
          translated: true
        };
        setProjects(prev => prev.map(p => {
          if (p.id === activeProject.id) {
            return { ...p, updates: [peerUpdate, ...p.updates] };
          }
          return p;
        }));
      }
    }, 1500);
  };

  // Complete a project task sub-milestone
  const handleToggleSubtaskCollab = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks?.map(sub => {
      if (sub.id === subtaskId) {
        const nextState = !sub.completed;
        
        if (nextState) {
          const mCompUpdate = {
            id: `u-comp-${Date.now()}`,
            sender: "System",
            message: `Milestone checkpoint reached: "${sub.title}" marked COMPLETED.`,
            timestamp: "Just now",
            type: "completion" as const
          };
          setTimeout(() => {
            setProjects(prev => prev.map(p => {
              if (p.id === activeProject.id) {
                return { ...p, updates: [mCompUpdate, ...p.updates] };
              }
              return p;
            }));
          }, 100);
        }

        return { ...sub, completed: nextState };
      }
      return sub;
    });

    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  // Add Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProj: SharedProject = {
      id: `p-${Date.now()}`,
      name: newProjectName,
      description: newProjectDesc || "Collaborative multi-timezone study/work space.",
      tasks: selectedTasksForNewProj,
      members: selectedMembersForNewProj,
      updates: [
        { id: `u-init-${Date.now()}`, sender: "System", message: `Collaborative Space "${newProjectName}" spawned across time zones.`, timestamp: "Just now", type: "system" }
      ]
    };

    setProjects([...projects, newProj]);
    setActiveProjectId(newProj.id);
    setIsCreatingProj(false);
    setNewProjectName("");
    setNewProjectDesc("");
    setSelectedTasksForNewProj([]);
    setSelectedMembersForNewProj(["m-1"]);
  };

  const toggleTaskForNewProj = (taskId: string) => {
    setSelectedTasksForNewProj(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleMemberForNewProj = (memberId: string) => {
    setSelectedMembersForNewProj(prev => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  // Simulate peer invite
  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const nameFromEmail = inviteEmail.split("@")[0];
    const capitalized = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    
    // Choose country config for peer randomly
    const randomCountries = ["India", "Japan", "Germany", "United Kingdom", "Canada", "Australia"];
    const countryChosen = randomCountries[Math.floor(Math.random() * randomCountries.length)];
    const countryConf = countryConfigs[countryChosen] || countryConfigs["United States"];

    const newMember: TeamMember = {
      id: `m-${Date.now()}`,
      name: capitalized,
      role: inviteRole,
      country: countryChosen,
      flag: countryConf.flag,
      timezone: countryConf.timezone,
      workingHours: { start: 9, end: 17 },
      language: "English",
      nativeLanguage: "English",
      holidays: countryConf.holidays?.map(h => ({ ...h, type: "National" })) || [],
      skills: ["Collaboration", inviteRole],
      avatar: nameFromEmail.slice(0, 2).toUpperCase(),
      color: "bg-neutral-700",
      status: "working"
    };

    setMembers([...members, newMember]);
    
    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          members: [...p.members, newMember.id],
          updates: [{
            id: `u-join-${Date.now()}`,
            sender: "System",
            message: `${newMember.name} from ${newMember.country} (${newMember.timezone}) joined workspace.`,
            timestamp: "Just now",
            type: "system" as const
          }, ...p.updates]
        };
      }
      return p;
    }));

    setInviteEmail("");
    setShowInviteAlert(true);
    setTimeout(() => setShowInviteAlert(false), 3000);
  };

  // Dynamic Meeting score calculator
  const calculateMeetingScoreAndOverlap = () => {
    const selectedMembers = liveMembers.filter(m => selectedMeetingTeammates.includes(m.id));
    if (selectedMembers.length === 0) return { score: 0, reason: "No attendees selected", times: [] };

    let score = 100;
    const reasons: string[] = [];

    // Calculate overlap window based on UTC hours
    // We analyze hour index from 0 to 23 (UTC)
    const attendeeCount = selectedMembers.length;
    let bestUtchour = -1;
    let maxAttendeeOverlapCount = 0;

    const utcWorkingHourRanges = selectedMembers.map(m => {
      // Find timezone offset in hours
      let offsetHrs = 0;
      try {
        const homeDate = new Date();
        const localStr = homeDate.toLocaleString("en-US", { timeZone: m.timezone });
        const localDate = new Date(localStr);
        offsetHrs = (localDate.getTime() - homeDate.getTime()) / (1000 * 60 * 60);
      } catch (e) {}

      // Working hours locally converted to UTC index (0-23)
      const startUtc = (m.workingHours.start - offsetHrs + 24) % 24;
      const endUtc = (m.workingHours.end - offsetHrs + 24) % 24;
      return { startUtc, endUtc, name: m.name, timezone: m.timezone };
    });

    // Scan UTC hours to find best slot
    const hourlyAttendees = Array.from({ length: 24 }, (_, utcHour) => {
      let attendeesWorking = 0;
      selectedMembers.forEach((m, idx) => {
        const range = utcWorkingHourRanges[idx];
        const localHr = (utcHour + (m.workingHours.start - range.startUtc) + 24) % 24;
        
        // Teammate is awake and working (not sleeping or on lunch)
        if (localHr >= m.workingHours.start && localHr < m.workingHours.end && localHr !== 12) {
          attendeesWorking++;
        }
      });
      return { utcHour, attendeesWorking };
    });

    // Find hour with maximum overlap
    const bestHourData = [...hourlyAttendees].sort((a, b) => b.attendeesWorking - a.attendeesWorking)[0];
    const bestUtc = bestHourData.utcHour;

    // Evaluate Quality Score deductibles
    const hasHolidayConflicts = selectedMembers.some(m => {
      // Check if current date falls on participant's holidays
      return m.holidays.some(h => h.date.startsWith("06/25") || h.date.startsWith("11/26"));
    });

    if (hasHolidayConflicts) {
      score -= 25;
      reasons.push("Holiday overlap detected for active attendees");
    }

    const attendeeHours = selectedMembers.map(m => {
      const offsetRange = utcWorkingHourRanges.find(r => r.name === m.name);
      const localHr = Math.round((bestUtc + (m.workingHours.start - (offsetRange?.startUtc || 0)) + 24) % 24);
      const isAsleep = localHr >= 22 || localHr < 7;
      if (isAsleep) {
        score -= 20;
        reasons.push(`${m.name} is in sleeping hours (${localHr}:00)`);
      }
      return { name: m.name, country: m.country, localHr, flag: m.flag, timezone: m.timezone };
    });

    if (score < 30) score = 30;

    // Create readable times for recommended meet
    const recommendedTimesList = attendeeHours.map(ah => {
      const hrString = ah.localHr % 12 || 12;
      const ampm = ah.localHr >= 12 ? "PM" : "AM";
      const tzShort = ah.timezone.split("/").pop()?.replace("_", " ");
      return `${ah.flag} ${ah.name.split(" ")[0]}: ${hrString}:00 ${ampm} (${tzShort})`;
    });

    return {
      score,
      reasons: reasons.length > 0 ? reasons : ["Maximum regional overlap", "No public holidays", "Respects sleep & focus windows"],
      times: recommendedTimesList,
      bestUtc
    };
  };

  const meetingMetrics = calculateMeetingScoreAndOverlap();

  // Create proposed meeting card in stream
  const handleScheduleMeeting = () => {
    const meetId = `meet-${Date.now()}`;
    const newUpdate = {
      id: meetId,
      sender: "AI Coordinator (Recommended)",
      message: `📅 RECOMMENDED MEETING SCHEDULED: Quality Score: ${meetingMetrics.score}%
Overlap Schedule details:
${meetingMetrics.times.slice(0, 4).join("\n")}
Reasoning: ${meetingMetrics.reasons.join(", ")}`,
      timestamp: "Just now",
      type: "meeting" as const
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return { ...p, updates: [newUpdate, ...p.updates] };
      }
      return p;
    }));
  };

  // Trigger Follow-The-Sun Handover workflow
  const startFollowSunHandover = (taskId: string) => {
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setActiveHandoverTask(task.title);
    setHandoverStep("india");
    setHandoverLogs(["[03:58 UTC] Triggered Follow-the-Sun productivity pipeline."]);

    // Timers sequence
    setTimeout(() => {
      setHandoverStep("germany");
      setHandoverLogs(prev => [
        ...prev,
        `[04:00 UTC] 🇮🇳 India (Rahul Sharma) marked code templates complete and pushed changes.`,
        `[04:01 UTC] 🇩🇪 Germany (Emma Weber) shift started. QA verification package assigned automatically.`
      ]);
    }, 2000);

    setTimeout(() => {
      setHandoverStep("usa");
      setHandoverLogs(prev => [
        ...prev,
        `[04:03 UTC] 🇩🇪 Germany (Emma Weber) structural test cases completed.`,
        `[04:04 UTC] 🇺🇸 United States (You / Alex Chen) shift starts. Bundle package loaded on workspace dashboard.`
      ]);
    }, 4000);

    setTimeout(() => {
      setHandoverStep("idle");
      // Add a final handover system log
      const logUpdate = {
        id: `ho-log-${Date.now()}`,
        sender: "AI Handover Broker",
        message: `🤝 24h Productivity Cycle completed for task: "${task.title}". Passed successfully from India ➡️ Germany ➡️ USA with zero lag time.`,
        timestamp: "Just now",
        type: "handover" as const
      };

      setProjects(prev => prev.map(p => {
        if (p.id === activeProject.id) {
          return { ...p, updates: [logUpdate, ...p.updates] };
        }
        return p;
      }));

      // Update notes with follow the sun tag
      const updatedNotes = `${task.notes || ""}\n[Follow-the-Sun Cycle Completed]`.trim();
      onUpdateTask({ ...task, notes: updatedNotes });
    }, 6000);
  };

  // Convert deadline display specifically across countries
  const getDeadlineConversions = () => {
    // We assume deadline tomorrow at 9:00 PM IST (15:30 UTC)
    const baseUtcTime = new Date();
    baseUtcTime.setDate(baseUtcTime.getDate() + 1);
    baseUtcTime.setUTCHours(15, 30, 0, 0);

    return [
      { country: "India", time: "Tomorrow, 9:00 PM IST", flag: "🇮🇳", zone: "Asia/Kolkata" },
      { country: "United States", time: "Tomorrow, 11:30 AM EDT", flag: "🇺🇸", zone: "America/New_York" },
      { country: "Japan", time: "Day After, 1:00 AM JST", flag: "🇯🇵", zone: "Asia/Tokyo" },
      { country: "Germany", time: "Tomorrow, 5:30 PM CET", flag: "🇩🇪", zone: "Europe/Berlin" },
      { country: "Australia", time: "Day After, 1:30 AM AEST", flag: "🇦🇺", zone: "Australia/Sydney" }
    ];
  };

  const deadlineConversions = getDeadlineConversions();

  return (
    <div className="space-y-8 animate-fade-in text-gray-900">
      
      {/* HEADER SECTION WITH ACTIVE TIMEZONE SIMULATOR PREVIEWER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white border border-gray-150 p-6 rounded-3xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-[0.2em] text-indigo-600 font-bold uppercase bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Cross-Time Zone Suite
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <h2 className="text-xl md:text-2xl font-display font-semibold tracking-tight">Cross-Time Zone Collaboration Intelligence</h2>
          <p className="text-xs md:text-sm text-gray-500">
            Automatically resolve scheduling conflicts, translate communications, and coordinate task handovers globally.
          </p>
        </div>

        {/* TIME ZONE SIMULATOR */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2 max-w-md w-full">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block">🌍 Time Zone Simulator</span>
          <div className="flex items-center justify-between gap-1 border-b border-gray-200 pb-2 mb-2">
            <span className="text-[11px] text-gray-600">View entire workspace as:</span>
            <span className="text-[11px] font-mono font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-gray-150">
              {countryConfigs[country]?.flag} {country} Time
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { name: "India", flag: "🇮🇳" },
              { name: "United States", flag: "🇺🇸" },
              { name: "Japan", flag: "🇯🇵" },
              { name: "Germany", flag: "🇩🇪" },
              { name: "Australia", flag: "🇦🇺" }
            ].map((c) => (
              <button
                key={`sim-btn-${c.name}`}
                onClick={() => setCountry(c.name)}
                className={`py-1.5 px-1 text-[10px] font-mono font-bold rounded-xl border flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                  country === c.name
                    ? "bg-black border-black text-white shadow-xs"
                    : "bg-white border-gray-200 text-gray-600 hover:border-indigo-400"
                }`}
              >
                <span>{c.flag}</span>
                <span className="text-[9px] uppercase tracking-tighter truncate w-full text-center">{c.name.substring(0, 3)}</span>
              </button>
            ))}
          </div>
          <p className="text-[9px] text-gray-400 italic text-center">
            Instantly maps all system times, deadlines, meetings, and active team states.
          </p>
        </div>
      </div>

      {/* TEAM HEALTH DASHBOARD STATS BENTO-GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="bg-white border border-gray-150 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">👥 Team Health</span>
          <div className="mt-2.5 space-y-1">
            <span className="text-xl md:text-2xl font-display font-bold block text-gray-900">4 / 6</span>
            <span className="text-[10px] font-mono text-emerald-600 font-bold block">● Members Online</span>
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">🌐 Time Zones</span>
          <div className="mt-2.5 space-y-1">
            <span className="text-xl md:text-2xl font-display font-bold block text-gray-900">5 Regions</span>
            <span className="text-[10px] text-gray-500 font-mono block">Continuous Output</span>
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">⏱️ Next Overlap</span>
          <div className="mt-2.5 space-y-1">
            <span className="text-xl md:text-2xl font-display font-bold block text-indigo-600">2 Hours</span>
            <span className="text-[10px] text-gray-400 font-mono block">Daily live window</span>
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">🏝️ Team Holidays</span>
          <div className="mt-2.5 space-y-1">
            <span className="text-xl md:text-2xl font-display font-bold block text-amber-600">3 Upcoming</span>
            <span className="text-[10px] font-mono text-amber-700 block">Conflict checker ready</span>
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">💬 Avg Response</span>
          <div className="mt-2.5 space-y-1">
            <span className="text-xl md:text-2xl font-display font-bold block text-emerald-600">18 Mins</span>
            <span className="text-[10px] text-gray-400 font-mono block">Highly synchronized</span>
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">⚡ Project Risk</span>
          <div className="mt-2.5 space-y-1">
            <span className="text-xl md:text-2xl font-display font-bold block text-emerald-600">Low</span>
            <span className="text-[10px] text-gray-400 font-mono block">Zero deadline lag</span>
          </div>
        </div>

      </div>

      {/* CLOCK CENTERPIECE & GLOBAL TIMELINE AVAILABILITY VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Dynamic Global Collaboration Clock */}
        <div className="lg:col-span-5 bg-white border border-gray-150 p-6 rounded-3xl shadow-xs flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <span className="text-xs font-mono font-bold text-gray-500 uppercase flex items-center gap-1">
              <Clock size={13} className="text-indigo-600 animate-spin-slow" /> Global Collaboration Clock
            </span>
            <span className="text-[10px] font-mono text-gray-400 uppercase">Synchronized Orbit</span>
          </div>

          {/* Clock Dial Container */}
          <div className="relative w-[210px] h-[210px] flex items-center justify-center my-4">
            {/* Outer Dial Outline */}
            <div className="absolute inset-0 border border-neutral-100 rounded-full bg-neutral-50/20" />
            
            {/* Highlighted Overlap Segment segment (e.g. 14:00 to 18:00 UTC) */}
            <div className="absolute inset-[15px] border border-dashed border-indigo-200 rounded-full animate-pulse bg-indigo-50/15" />
            
            {/* Center Hub */}
            <div className="z-10 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-[10px] font-bold font-mono">
              24h
            </div>

            {/* Circular Grid Markers */}
            {[0, 4, 8, 12, 16, 20].map((hour) => {
              const angle = (hour / 24) * 360 - 90;
              const radius = 95;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              return (
                <div
                  key={`marker-${hour}`}
                  className="absolute text-[8px] font-mono text-gray-400 select-none pointer-events-none"
                  style={{
                    transform: `translate(${x}px, ${y}px)`
                  }}
                >
                  {hour}:00
                </div>
              );
            })}

            {/* Teammate Glowing Marker Points around Clock */}
            {liveMembers.map((m, idx) => {
              const localHour = getTeammateLocalHour(m.timezone);
              const angle = (localHour / 24) * 360 - 90;
              const radius = 70; // Position on middle perimeter ring
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;

              const isWorking = m.status === "working";
              const isSleeping = m.status === "sleeping";

              return (
                <motion.div
                  key={`clock-pt-${m.id}`}
                  className="absolute z-20 cursor-pointer"
                  whileHover={{ scale: 1.25 }}
                  style={{
                    transform: `translate(${x}px, ${y}px)`
                  }}
                >
                  <span className={`relative flex h-5 w-5 rounded-full ${m.color} text-white items-center justify-center text-[8px] font-bold shadow-md`}>
                    {m.avatar}
                    {/* Ring status glow */}
                    {isWorking && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                    {isSleeping && (
                      <span className="absolute -top-0.5 -right-0.5 text-[8px] bg-indigo-900 rounded-full px-0.5 text-white">🌙</span>
                    )}
                  </span>
                </motion.div>
              );
            })}
          </div>

          <div className="space-y-1 mt-3">
            <div className="flex items-center gap-1.5 justify-center text-xs text-gray-700 bg-gray-50 border border-gray-150 px-3 py-1 rounded-full">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-100 border border-indigo-400" />
              <span className="font-mono text-[10px] font-bold">Indigo Arc: Peak Overlap Window (1:30 PM - 5:00 PM local)</span>
            </div>
            <p className="text-[10px] text-gray-400 italic">
              Clock orbits continuously represent each colleague's current diurnal coordinates.
            </p>
          </div>
        </div>

        {/* Right Side: Global Availability Timeline Grid */}
        <div className="lg:col-span-7 bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-gray-500 uppercase block">Global Availability Timeline</span>
              <p className="text-[10px] text-gray-400">Continuous 24-hour horizontal teammate alignment schedule</p>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Working</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Break</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> Offline</span>
            </div>
          </div>

          {/* Timeline Grid */}
          <div className="overflow-x-auto space-y-3.5 pb-2">
            <div className="min-w-[580px] space-y-2.5">
              
              {/* Hour scale row */}
              <div className="flex items-center">
                <span className="w-28 text-[10px] font-mono font-bold uppercase text-gray-400 shrink-0">Member</span>
                <div className="flex-1 grid grid-cols-24 gap-0.5 text-[8px] font-mono text-gray-400 text-center">
                  {Array.from({ length: 24 }).map((_, hourIndex) => (
                    <span key={`lbl-hr-${hourIndex}`}>{hourIndex}</span>
                  ))}
                </div>
              </div>

              {/* Members rows */}
              {liveMembers.map((m) => {
                const currentLocalHour = getTeammateLocalHour(m.timezone);
                
                return (
                  <div key={`tm-row-${m.id}`} className="flex items-center">
                    {/* Bio Info Column */}
                    <div className="w-28 flex items-center gap-1.5 shrink-0 pr-2">
                      <span className="text-[11px] truncate font-medium text-gray-800">{m.name.split(" ")[0]}</span>
                      <span className="text-[10px] shrink-0 text-gray-400">{m.flag} {m.country.substring(0, 3).toUpperCase()}</span>
                    </div>

                    {/* Hourly Blocks */}
                    <div className="flex-1 grid grid-cols-24 gap-0.5 h-6">
                      {Array.from({ length: 24 }).map((_, hourIndex) => {
                        // Calculate teammate's local hour in this absolute/UTC column
                        let offsetHrs = 0;
                        try {
                          const base = new Date();
                          const local = new Date(base.toLocaleString("en-US", { timeZone: m.timezone }));
                          offsetHrs = (local.getTime() - base.getTime()) / (1000 * 60 * 60);
                        } catch (e) {}

                        const localHrForIndex = Math.round((hourIndex + offsetHrs + 24) % 24);
                        
                        let blockColor = "bg-red-100/50 hover:bg-red-200/50"; // Sleep
                        if (localHrForIndex >= m.workingHours.start && localHrForIndex < m.workingHours.end) {
                          blockColor = "bg-emerald-500/80 hover:bg-emerald-600";
                          if (localHrForIndex === 12) {
                            blockColor = "bg-amber-400"; // Lunch
                          }
                        }

                        const isCurrentCol = hourIndex === Math.round((new Date().getUTCHours() + 24) % 24);

                        return (
                          <div
                            key={`tm-cell-${m.id}-${hourIndex}`}
                            className={`rounded-sm transition-colors relative cursor-help ${blockColor} ${
                              isCurrentCol ? "ring-1 ring-black ring-offset-0.5" : ""
                            }`}
                            title={`${m.name}: Local Hour ${localHrForIndex}:00 (${blockColor.includes("emerald") ? "Working" : blockColor.includes("amber") ? "Lunch" : "Asleep"})`}
                          >
                            {isCurrentCol && (
                              <div className="absolute inset-0 bg-black/10 flex items-center justify-center text-[6px] font-bold text-white">📍</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-2xl flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                <Sparkle size={14} className="text-indigo-600" /> AI Overlap Assessment
              </span>
              <p className="text-[10px] text-indigo-700 leading-normal">
                ✨ **Continuous Synchronized Window Detected**: Complete working hour overlaps exist between **1:30 PM and 5:00 PM IST** (GMT+5:30) for India, Germany, and UK.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* TEAM MEMBERS DETECTED LIST WITH REGIONAL DATA */}
      <section className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-sm md:text-base font-mono font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
            <Users size={16} className="text-indigo-600" /> Detected Teammate Time Zone Registers
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Country registries, preferred operating windows, native speaking channels, and observed national holidays are resolved automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {liveMembers.map((m) => {
            const isWorking = m.status === "working";
            const isSleeping = m.status === "sleeping";
            const isLunch = m.status === "lunch";
            
            return (
              <div 
                key={`m-card-${m.id}`}
                className="bg-gray-50/50 border border-gray-200/60 rounded-2xl p-4.5 space-y-4 hover:border-indigo-400 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${m.color} text-white flex items-center justify-center font-mono font-bold text-xs shadow-inner`}>
                      {m.avatar}
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-gray-800">{m.name}</h4>
                      <p className="text-[10px] text-gray-400">{m.role}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase border ${
                    isWorking 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse" 
                      : isSleeping 
                      ? "bg-indigo-50 text-indigo-700 border-indigo-150"
                      : isLunch
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-gray-100 text-gray-500 border-gray-250"
                  }`}>
                    {m.status === "working" ? "● Working" : m.status === "sleeping" ? "💤 Sleeping" : m.status === "lunch" ? "🍲 Lunch" : "Offline"}
                  </span>
                </div>

                <div className="space-y-1.5 text-[10px] font-mono border-t border-gray-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">COUNTRY & ZONE:</span>
                    <span className="font-bold text-gray-700">{m.flag} {m.country} ({m.timezone.split("/").pop()})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">WORKING HOURS:</span>
                    <span className="text-gray-700">{m.workingHours.start}:00 - {m.workingHours.end}:00 Local</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">NATIVE LANGUAGE:</span>
                    <span className="text-gray-700">{m.nativeLanguage}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-400 shrink-0">NEXT PUBLIC HOLIDAY:</span>
                    <span className="text-right text-rose-600 font-bold max-w-[140px] truncate" title={m.holidays[0]?.name}>
                      {m.holidays[0] ? `🎉 ${m.holidays[0].name}` : "None Scheduled"}
                    </span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100/40">
                  {m.skills.map(s => (
                    <span key={`skill-${m.id}-${s}`} className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[9px] text-gray-500">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SMART MEETING PLANNER & HOLIDAY CONFLICT DETECTOR */}
      <section className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-0.5">
            <h3 className="text-sm md:text-base font-mono font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              <Calendar size={16} className="text-indigo-600" /> Dynamic Meeting Optimizer & Holiday Conflict Engine
            </h3>
            <p className="text-xs text-gray-400">AI evaluates attendee schedules, sleeping brackets, and observed holidays in real-time</p>
          </div>
          
          <button
            onClick={handleScheduleMeeting}
            disabled={meetingMetrics.score < 40}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            📅 Propose & Broadcast Meeting
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Attendee selectors & Length settings */}
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-3 bg-gray-50 border border-gray-200 p-4.5 rounded-2xl">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block">Select Required Participants</span>
              
              <div className="space-y-2">
                {liveMembers.map((m) => {
                  const isSelected = selectedMeetingTeammates.includes(m.id);
                  return (
                    <div 
                      key={`meet-sel-${m.id}`}
                      onClick={() => {
                        setSelectedMeetingTeammates(prev =>
                          prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]
                        );
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none ${
                        isSelected 
                          ? "bg-white border-indigo-600 text-gray-900 shadow-xs" 
                          : "bg-white border-gray-100 text-gray-400 hover:border-gray-250"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full ${m.color} text-white text-[8px] font-bold flex items-center justify-center`}>
                          {m.avatar}
                        </div>
                        <span className="text-xs font-mono font-bold">{m.name}</span>
                        <span className="text-[10px]">{m.flag} {m.country.substring(0, 3)}</span>
                      </div>
                      
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-200"
                      }`}>
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block">Meeting Duration</label>
                <select
                  value={meetingLengthMinutes}
                  onChange={(e) => setMeetingLengthMinutes(parseInt(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes (1h)</option>
                  <option value={90}>90 Minutes (1.5h)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block">Target Shift Interval</label>
                <div className="bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-700 text-center">
                  Recommended Best
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Score Breakdown & Localized Time Converter */}
          <div className="lg:col-span-7 bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
            
            {/* Score Radial or Gauge Header */}
            <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-gray-150 pb-4">
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" fill="transparent" stroke="#E5E7EB" strokeWidth="4" />
                  <circle 
                    cx="32" 
                    cy="32" 
                    r="28" 
                    fill="transparent" 
                    stroke={meetingMetrics.score >= 80 ? "#10B981" : meetingMetrics.score >= 60 ? "#F59E0B" : "#EF4444"} 
                    strokeWidth="4" 
                    strokeDasharray={176} 
                    strokeDashoffset={176 - (176 * meetingMetrics.score) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-sm font-mono font-bold">{meetingMetrics.score}%</span>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Meeting Quality Rating</span>
                <h4 className="text-xs font-mono font-bold text-gray-800">
                  {meetingMetrics.score >= 85 ? "🟢 Exceptional Scheduling Slot" : meetingMetrics.score >= 65 ? "🟡 Moderate Slot Overlap" : "🔴 Highly Discouraged"}
                </h4>
                <p className="text-[10px] text-gray-400">Computed via active teammate holiday tables, sleep constraints, and localized shift patterns.</p>
              </div>
            </div>

            {/* Local Times Conversions list */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block">Local Target Hours for Attendees</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {meetingMetrics.times.map((t, idx) => (
                  <div key={`meet-time-${idx}`} className="bg-white border border-gray-150 p-2.5 rounded-xl flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-gray-700">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conflict Warnings */}
            <div className="bg-white border border-gray-150 p-3.5 rounded-xl space-y-2">
              <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-widest block">Conflict Warnings & Justifications</span>
              <div className="space-y-1 text-[11px] font-mono">
                {meetingMetrics.reasons.map((r, idx) => {
                  const isConflict = r.includes("sleeping") || r.includes("Holiday") || r.includes("No attendee");
                  return (
                    <div key={`reason-${idx}`} className="flex items-center gap-1.5">
                      <span className={isConflict ? "text-rose-500 font-bold" : "text-emerald-600 font-bold"}>
                        {isConflict ? "⚠️" : "✓"}
                      </span>
                      <span className={isConflict ? "text-rose-950 font-bold" : "text-gray-600"}>{r}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* AUTOMATIC DEADLINE MULTI-TIMEZONE DISPLAY */}
      <section className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-sm md:text-base font-mono font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-indigo-600" /> Automatic Multi-Regional Deadline Resolver
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Milestones and final subtask deadlines are automatically calculated to display in each collaborator's local timezone. No manual math required.
          </p>
        </div>

        <div className="border border-gray-150 rounded-2xl overflow-hidden bg-gray-50/20">
          <div className="p-4 bg-gray-50 border-b border-gray-150 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-wider block">Target Deliverable Milestone</span>
              <h4 className="text-xs font-mono font-bold text-gray-800">🚀 Thesis Outline Draft Review Checkpoint (Final Sync)</h4>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[9px] font-mono text-gray-400">Observed Globally:</span>
              <span className="bg-black text-white text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-lg">
                July 25, 15:30 UTC
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-150">
            {deadlineConversions.map((dc) => (
              <div key={`dc-${dc.country}`} className="p-4 space-y-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-lg">{dc.flag}</span>
                  <span className="text-xs font-mono font-bold text-gray-800">{dc.country}</span>
                </div>
                <div className="bg-white border border-gray-150 p-2 rounded-xl text-center shadow-xs">
                  <span className="text-[11px] font-mono font-bold text-indigo-600 block">{dc.time.split(",")[0]}</span>
                  <span className="text-[10px] font-mono font-bold text-gray-500 block mt-0.5">{dc.time.split(",")[1]}</span>
                </div>
                <span className="text-[8px] font-mono text-gray-400 block uppercase tracking-wider">{dc.zone}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTELLIGENT WORK DISTRIBUTION & AI COLLABORATION COACH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Intelligent Work Distribution Panel */}
        <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider block">💡 AI Work Distributor</span>
            <h3 className="text-base font-display font-bold text-gray-900">Intelligent Regional Workload Allocations</h3>
            <p className="text-xs text-gray-500">AI aligns project tasks automatically with matching collaborator timezones, active availability, and skill profiles.</p>
          </div>

          <div className="space-y-3.5 my-4">
            {[
              { assign: "Alex Chen 🇺🇸", task: "Slide Deck Layout & Review", duration: "Has 6 active working hours remaining before review." },
              { assign: "Rahul Sharma 🇮🇳", task: "Sorting Algorithm Core Implementation", duration: "Skill Profile: Expert in TypeScript & DB logic." },
              { assign: "Emma Weber 🇩🇪", task: "Integration Checklist Validation", duration: "Perfect overlap window for morning reviews." }
            ].map((alloc, idx) => (
              <div key={`alloc-${idx}`} className="bg-gray-50 border border-gray-150 p-3 rounded-xl flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                  <User size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-gray-800">
                    Assign <span className="text-indigo-600 font-semibold">{alloc.assign}</span> to <span className="underline">{alloc.task}</span>
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">{alloc.duration}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-indigo-50/50 border border-indigo-150 p-3.5 rounded-xl">
            <span className="text-[10px] font-mono font-bold text-indigo-700 uppercase tracking-widest block">AI Allocation Reasoning</span>
            <p className="text-[10px] text-gray-600 mt-0.5">
              Colleagues are recommended solely because they possess the maximum overlap operating hours before the upcoming shared outline milestone, preventing communication bottlenecks.
            </p>
          </div>
        </div>

        {/* AI Collaboration Coach Panel */}
        <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider block">🛡️ AI Collaboration Coach</span>
            <h3 className="text-base font-display font-bold text-gray-900">Proactive Productivity Recommendations</h3>
            <p className="text-xs text-gray-500">Continuous background coaching to mitigate timezone delays and ensure balanced project schedules.</p>
          </div>

          <div className="space-y-3 my-4">
            <div className="bg-amber-50/40 border border-amber-200/80 p-3.5 rounded-xl flex items-start gap-3">
              <span className="text-base shrink-0">💡</span>
              <p className="text-xs text-amber-950 font-mono leading-relaxed">
                {getTranslatedText("coach-1", "Rahul Sharma (India) and Alex Chen (US) have a 3-hour overlap window starting soon. This is the best slot for live review sessions.")}
              </p>
            </div>

            <div className="bg-indigo-50/40 border border-indigo-200/80 p-3.5 rounded-xl flex items-start gap-3">
              <span className="text-base shrink-0">💡</span>
              <p className="text-xs text-indigo-950 font-mono leading-relaxed">
                {getTranslatedText("coach-2", "Kenji Sato (Japan) is currently asleep. Direct messages will be queued for 9:00 AM JST.")}
              </p>
            </div>

            <div className="bg-rose-50/40 border border-rose-200/80 p-3.5 rounded-xl flex items-start gap-3">
              <span className="text-base shrink-0">⚠️</span>
              <p className="text-xs text-rose-950 font-mono leading-relaxed font-bold">
                {getTranslatedText("coach-3", "Emma Weber (Germany) has German Unity Day next week. Suggest scheduling reviews earlier.")}
              </p>
            </div>
          </div>

          <p className="text-[9px] text-gray-400 italic text-center border-t border-gray-100 pt-3">
            AI updates advice dynamically based on simulator region configurations.
          </p>
        </div>

      </div>

      {/* SMART HANDOVER WORKFLOW ("FOLLOW THE SUN") */}
      <section className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-0.5">
            <h3 className="text-sm md:text-base font-mono font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              <RefreshCw size={16} className="text-indigo-600 animate-spin-slow" /> Smart Handover Pipeline ("Follow the Sun")
            </h3>
            <p className="text-xs text-gray-400">Eliminate manual handovers. Task files seamlessly transition globally across 24 hours.</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <select
              value={activeHandoverTask}
              onChange={(e) => setActiveHandoverTask(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
            >
              <option value="">Select Task to Hand Over</option>
              {projectTasks.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>

            <button
              onClick={() => startFollowSunHandover(activeHandoverTask)}
              disabled={!activeHandoverTask || handoverStep !== "idle"}
              className="px-4 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1"
            >
              🚀 Simulate Handover
            </button>
          </div>
        </div>

        {/* Handover Interactive Stepper Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              
              {/* Phase 1 */}
              <div className={`p-4 rounded-2xl border transition-all ${
                handoverStep === "india" 
                  ? "bg-orange-50 border-orange-500 shadow-md ring-2 ring-orange-500/20" 
                  : "bg-gray-50 border-gray-150 opacity-70"
              }`}>
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <span className="text-lg">🇮🇳</span>
                  <span className="text-xs font-mono font-bold text-gray-800">India Team (Rahul)</span>
                </div>
                <span className="text-[10px] bg-orange-600 text-white px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                  {handoverStep === "india" ? "ACTIVE SHIFT" : "COMPLETED"}
                </span>
                <p className="text-[10px] text-gray-500 font-mono mt-3">Pushes code repository, designs templates & triggers handover logs.</p>
              </div>

              {/* Phase 2 */}
              <div className={`p-4 rounded-2xl border transition-all ${
                handoverStep === "germany" 
                  ? "bg-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20" 
                  : "bg-gray-50 border-gray-150 opacity-70"
              }`}>
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <span className="text-lg">🇩🇪</span>
                  <span className="text-xs font-mono font-bold text-gray-800">Europe Team (Emma)</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${
                  handoverStep === "germany" ? "bg-emerald-600 text-white animate-pulse" : "bg-gray-200 text-gray-500"
                }`}>
                  {handoverStep === "germany" ? "ACTIVE SHIFT" : handoverStep === "india" ? "PENDING OVERFLOW" : "COMPLETED"}
                </span>
                <p className="text-[10px] text-gray-500 font-mono mt-3">Runs automated integration builds, unit test suites & verifies compliance.</p>
              </div>

              {/* Phase 3 */}
              <div className={`p-4 rounded-2xl border transition-all ${
                handoverStep === "usa" 
                  ? "bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500/20" 
                  : "bg-gray-50 border-gray-150 opacity-70"
              }`}>
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <span className="text-lg">🇺🇸</span>
                  <span className="text-xs font-mono font-bold text-gray-800">USA Team (Alex)</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${
                  handoverStep === "usa" ? "bg-indigo-600 text-white animate-pulse" : "bg-gray-200 text-gray-500"
                }`}>
                  {handoverStep === "usa" ? "ACTIVE SHIFT" : "PENDING OVERFLOW"}
                </span>
                <p className="text-[10px] text-gray-500 font-mono mt-3">Final production validation, client sign-offs & launch sequences.</p>
              </div>

            </div>
          </div>

          {/* Handover Logs Stream */}
          <div className="lg:col-span-4 bg-gray-50 border border-gray-150 p-4 rounded-2xl h-[130px] overflow-y-auto space-y-1.5 text-[9px] font-mono text-gray-600">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block border-b border-gray-200 pb-1 mb-2">Pipeline Telemetry Logs</span>
            {handoverLogs.length === 0 ? (
              <p className="text-gray-400 italic">No handover simulation running. Select a task and click "Simulate Handover" to begin.</p>
            ) : (
              handoverLogs.map((log, idx) => (
                <div key={`log-${idx}`} className="border-l-2 border-indigo-500 pl-2">
                  {log}
                </div>
              ))
            )}
          </div>

        </div>
      </section>

      {/* CHAT update STREAM WITH AUTOMATIC WORKSPACE TRANSLATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Projects side navigation */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-mono font-bold text-gray-500 uppercase flex items-center gap-1">
                <Bookmark size={13} className="text-indigo-600" /> Collaborations List
              </span>
              <button 
                onClick={() => setIsCreatingProj(!isCreatingProj)}
                className="text-[10px] font-mono font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <FolderPlus size={12} /> New Space
              </button>
            </div>

            <div className="space-y-2">
              {projects.map(p => {
                const isActive = p.id === activeProjectId;
                const pTasksCount = p.tasks.length;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveProjectId(p.id);
                      setIsCreatingProj(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none text-left overflow-hidden ${
                      isActive 
                        ? "bg-black border-black text-white shadow-xs" 
                        : "bg-gray-50 border-gray-100 hover:border-gray-250 text-gray-700"
                    }`}
                  >
                    <h4 className="text-xs font-mono font-bold break-words">{p.name}</h4>
                    <p className={`text-[10px] mt-1 line-clamp-2 leading-relaxed break-words ${isActive ? "text-gray-300" : "text-gray-400"}`}>
                      {p.description}
                    </p>
                    <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-gray-100/10 text-[9px] font-mono">
                      <span className="flex items-center gap-1 opacity-85">
                        <Users size={10} /> {p.members.length} Members
                      </span>
                      <span className="opacity-85">
                        {pTasksCount} {pTasksCount === 1 ? "Task" : "Tasks"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Invite Card */}
          <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-xs space-y-3.5">
            <span className="text-xs font-mono font-bold text-gray-500 uppercase block border-b border-gray-100 pb-2">
              Add New International Collaborator
            </span>
            
            <form onSubmit={handleInviteUser} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-mono tracking-wider text-gray-400 uppercase">Teammate Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@university.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-150 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-indigo-600 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-mono tracking-wider text-gray-400 uppercase">Teammate Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-150 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-600"
                >
                  <option value="Contributor">Contributor</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="QA Auditor">QA Auditor</option>
                  <option value="Research Writer">Research Writer</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white hover:opacity-90 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserPlus size={13} /> Synchronize & Invite
              </button>
              
              {showInviteAlert && (
                <span className="text-[9px] font-mono text-emerald-600 block text-center animate-fade-in font-bold">
                  ✓ Collaborator detected & integrated into regional workspace tables!
                </span>
              )}
            </form>
          </div>
        </div>

        {/* Right Side: Synergy Update stream & translation controls */}
        <div className="lg:col-span-8 space-y-4">
          
          {isCreatingProj ? (
            /* Creating Workspace Panel */
            <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-5 animate-fade-in text-left">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm font-mono font-bold text-gray-900 uppercase">Create New Collaborative Space</h3>
                <p className="text-[10px] text-gray-400 mt-1">Set up project boundaries, select shared tasks, and invite colleagues.</p>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS102 Software Team Project"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-black rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none transition-all font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-1">Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Coordinating coding sprints, unit testing checklists, and compilations."
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-black rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none transition-all font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-2">Select Active Tasks to Import</label>
                  {tasks.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">No current tasks on file to import. Add tasks in Productivity Cockpit first.</p>
                  ) : (
                    <div className="max-h-[140px] overflow-y-auto border border-gray-100 rounded-xl p-2.5 space-y-1.5 bg-gray-50">
                      {tasks.map(t => {
                        const selected = selectedTasksForNewProj.includes(t.id);
                        return (
                          <div 
                            key={t.id} 
                            onClick={() => toggleTaskForNewProj(t.id)}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer select-none transition-all ${
                              selected ? "bg-white border-black text-black font-medium" : "bg-white border-gray-100 text-gray-500 hover:border-indigo-400"
                            }`}
                          >
                            <span className="truncate max-w-[340px]">{t.title}</span>
                            <span className="text-[9px] font-mono">{selected ? "Selected" : "Include"}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-2">Add Teammates</label>
                  <div className="flex flex-wrap gap-2">
                    {members.map(m => {
                      const selected = selectedMembersForNewProj.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => toggleMemberForNewProj(m.id)}
                          className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold cursor-pointer transition-all select-none ${
                            selected 
                              ? "bg-black text-white border-black" 
                              : "bg-gray-50 text-gray-500 border-gray-150 hover:border-gray-200"
                          }`}
                        >
                          {m.name}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="submit"
                    className="flex-1 bg-black text-white hover:opacity-90 font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer"
                  >
                    Launch Space & Synchronize
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingProj(false)}
                    className="px-4 border border-gray-200 text-gray-500 hover:text-black hover:bg-gray-50 font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Active Project Details */
            <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-xs space-y-5 text-left">
              
              <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[9px] font-mono text-indigo-600 font-bold uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Synchronized Space</span>
                  <h3 className="text-base font-display font-bold text-gray-900 tracking-tight mt-1.5 break-words">{activeProject.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-xl break-words">{activeProject.description}</p>
                </div>
                
                <div className="text-right">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Team Progress</span>
                  {projectTasks.length > 0 ? (
                    (() => {
                      const totalSub = projectTasks.reduce((acc, t) => acc + (t.subtasks?.length || 0), 0);
                      const completedSub = projectTasks.reduce((acc, t) => acc + (t.subtasks?.filter(s => s.completed).length || 0), 0);
                      const percent = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;
                      return (
                        <div className="space-y-1 mt-1">
                          <span className="text-base font-mono font-bold text-indigo-600 block">{percent}%</span>
                          <span className="text-[9px] font-mono text-gray-400 block">{completedSub}/{totalSub} Deliverables Done</span>
                        </div>
                      );
                    })()
                  ) : (
                    <span className="text-xs font-mono text-gray-400 block mt-1">0% (No tasks)</span>
                  )}
                </div>
              </div>

              {/* Shared tasks and delegator board */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
                  <UserCheck size={13} className="text-indigo-600" /> Multi-Zone Tasks & Delegation Board
                </h4>

                {projectTasks.length === 0 ? (
                  <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400">
                    <p className="text-xs font-mono">No tasks active in this collaborative space.</p>
                    <p className="text-[10px] text-gray-400 mt-1">Click "New Space" or include tasks in outline list first.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {projectTasks.map(task => {
                      const delegatedMatch = task.notes?.match(/\[Delegated to: (.*?)\]/);
                      const delegatedName = delegatedMatch ? delegatedMatch[1] : null;
                      const activeDelMember = delegatedName ? members.find(m => m.name.includes(delegatedName) || delegatedName.includes(m.name)) : null;

                      return (
                        <div key={task.id} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h5 className="text-xs font-mono font-bold text-gray-800 break-words">{task.title}</h5>
                              <p className="text-[10px] text-gray-400 font-sans mt-0.5 line-clamp-2">
                                {task.notes?.replace(/\[Delegated to: .*?\]/, "").replace(/\[Follow-the-Sun Cycle Completed\]/, "").trim()}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {activeDelMember ? (
                                <div className="flex items-center gap-1.5 bg-white border border-gray-150 px-2.5 py-1 rounded-lg">
                                  <div className={`w-4 h-4 rounded-full ${activeDelMember.color} text-white flex items-center justify-center text-[8px] font-bold font-mono`}>
                                    {activeDelMember.avatar}
                                  </div>
                                  <span className="text-[9px] font-mono font-bold text-gray-700">{activeDelMember.name.split(" ")[0]}</span>
                                  <button 
                                    onClick={() => handleDelegateTask(task.id, "m-1")} 
                                    className="text-[9px] text-gray-400 hover:text-red-500 font-bold ml-1 cursor-pointer"
                                    title="Reassign"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <select
                                  onChange={(e) => handleDelegateTask(task.id, e.target.value)}
                                  defaultValue=""
                                  className="bg-white border border-gray-200 rounded-lg text-[9px] font-mono py-1 px-1.5 focus:outline-none focus:border-black cursor-pointer"
                                >
                                  <option value="" disabled>Delegate Task</option>
                                  {members.filter(m => activeProject.members.includes(m.id)).map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.flag} {m.country.substring(0, 3)})</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5 border-t border-gray-200/60 pt-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-mono uppercase text-gray-400 font-bold">Subtask Deliverables Tracker:</span>
                              {task.notes?.includes("Follow-the-Sun") && (
                                <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded">
                                  ⚡ FOLLOW THE SUN ACTIVE
                                </span>
                              )}
                            </div>
                            
                            {task.subtasks && task.subtasks.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {task.subtasks.map(sub => (
                                  <div 
                                    key={sub.id} 
                                    onClick={() => handleToggleSubtaskCollab(task.id, sub.id)}
                                    className="p-2 bg-white border border-gray-100 hover:border-gray-200 rounded-xl flex items-center justify-between gap-2 cursor-pointer select-none transition-all"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                        sub.completed ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-200"
                                      }`}>
                                        <CheckCircle2 size={10} strokeWidth={3} className={sub.completed ? "block" : "hidden"} />
                                      </div>
                                      <span className={`text-[10px] break-words line-clamp-2 ${sub.completed ? "text-gray-400 line-through" : "text-gray-700"}`}>
                                        {sub.title}
                                      </span>
                                    </div>
                                    <span className="text-[8px] font-mono text-gray-400 shrink-0">{sub.durationStr}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-gray-400 italic">No specific milestones assigned.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Collaborative Update Stream with translation panel */}
              <div className="border-t border-gray-100 pt-5 space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h4 className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-indigo-600" /> Regional Update Stream
                  </h4>

                  {/* translation selection widget */}
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-150 p-1 rounded-xl">
                    <span className="text-[9px] font-mono font-bold text-gray-400 px-1.5 flex items-center gap-1">
                      <Languages size={10} /> TRANSLATE FEED AS:
                    </span>
                    {["English", "Hindi", "Japanese", "German"].map((lang) => (
                      <button
                        key={`lang-sel-${lang}`}
                        onClick={() => setWorkspaceLanguage(lang)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-all ${
                          workspaceLanguage === lang
                            ? "bg-black text-white"
                            : "bg-white text-gray-600 hover:text-black border border-gray-100"
                        }`}
                      >
                        {lang === "English" ? "🇬🇧 EN" : lang === "Hindi" ? "🇮🇳 HI" : lang === "Japanese" ? "🇯🇵 JP" : "🇩🇪 DE"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat listing */}
                <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 h-[210px] overflow-y-auto space-y-3">
                  {activeProject.updates.map((up) => {
                    const translatedText = getTranslatedText(up.id, up.message);
                    const isTranslated = workspaceLanguage !== "English" && translations[workspaceLanguage]?.[up.id];

                    if (up.type === "system") {
                      return (
                        <div key={up.id} className="text-[9px] font-mono text-gray-400 bg-gray-100/50 border border-gray-100 rounded-lg p-2 text-center animate-fade-in break-words">
                          ⚙️ {getTranslatedText(up.id, up.message)} — <span className="italic">{up.timestamp}</span>
                        </div>
                      );
                    }
                    if (up.type === "completion") {
                      return (
                        <div key={up.id} className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-start gap-1.5 animate-fade-in break-words">
                          <span className="shrink-0">🎉</span>
                          <div className="space-y-0.5">
                            <p className="font-bold">{up.sender}</p>
                            <p>{translatedText}</p>
                            {isTranslated && (
                              <p className="text-[8px] text-emerald-600/70 italic mt-0.5">Original message in English preserved</p>
                            )}
                          </div>
                        </div>
                      );
                    }
                    if (up.type === "meeting") {
                      return (
                        <div key={up.id} className="bg-indigo-50 border border-indigo-150 rounded-xl p-3 space-y-2 text-xs font-mono animate-fade-in">
                          <div className="flex justify-between items-center border-b border-indigo-200 pb-1">
                            <span className="font-bold text-indigo-800">📅 Recommended Team Sync</span>
                            <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[8px] font-bold">96% MATCH</span>
                          </div>
                          <pre className="text-[10px] text-indigo-950 font-mono whitespace-pre-wrap font-bold leading-normal">{up.message}</pre>
                        </div>
                      );
                    }
                    if (up.type === "handover") {
                      return (
                        <div key={up.id} className="bg-amber-50 border border-amber-200 text-amber-950 rounded-xl p-3 text-xs font-mono animate-fade-in flex gap-2">
                          <span className="text-base shrink-0">🤝</span>
                          <div>
                            <span className="font-bold block text-amber-800">Active Handover Broadcast</span>
                            <p className="mt-1 font-bold leading-relaxed">{up.message}</p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={up.id} className="text-xs space-y-0.5 text-left animate-fade-in">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-gray-800">{up.sender}</span>
                          <span className="text-[8px] font-mono text-gray-400 shrink-0">{up.timestamp}</span>
                        </div>
                        <div className="pl-2.5 border-l-2 border-indigo-400/50 space-y-0.5 leading-relaxed font-sans text-gray-700 whitespace-normal">
                          <p className="font-medium text-gray-800">{translatedText}</p>
                          {up.originalMessage && workspaceLanguage !== "English" && (
                            <p className="text-[9px] text-gray-400 italic">Original: "{up.originalMessage}"</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chat entry form */}
                <form onSubmit={handleSendMessage} className="flex gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder={
                      workspaceLanguage === "Hindi" ? "संदेश लिखें..." :
                      workspaceLanguage === "Japanese" ? "メッセージを入力..." :
                      workspaceLanguage === "German" ? "Nachricht schreiben..." :
                      "Broadcast update, coordinate timelines, or tag teammate..."
                    }
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1 bg-white border border-gray-200 focus:border-black rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none transition-all font-sans"
                  />
                  <button
                    type="submit"
                    className="bg-black hover:opacity-90 text-white px-4 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Send size={13} />
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* LOCAL NOTIFICATION INTELLIGENCE & QUEUED MESSAGE ENGINE */}
      <section className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-sm md:text-base font-mono font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              <BellRing size={16} className="text-indigo-600" /> Local Notification Intelligence Hub (DND & Sleep Respect)
            </h3>
            <p className="text-xs text-gray-400">AI queues outbound pings dynamically to avoid waking colleagues during local sleeping or holiday slots.</p>
          </div>
          <span className="bg-indigo-50 border border-indigo-100 text-indigo-800 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold">
            🔒 SLEEP PROTECTION ENABLED
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Active Queued Notifications */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-gray-700 block uppercase">Outbound Queued Notifications (Held / Delayed)</span>
            
            {notificationQueue.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No notifications currently held in queue.</p>
            ) : (
              <div className="space-y-2.5">
                {notificationQueue.map((item) => (
                  <div key={item.id} className="bg-gray-50 border border-gray-200 p-3.5 rounded-2xl flex items-start justify-between gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-amber-150 border border-amber-300 text-amber-800 text-[8px] font-bold px-1.5 py-0.2 rounded uppercase">
                          ⏳ Held (Asleep)
                        </span>
                        <span className="font-bold text-gray-800">For: {item.recipient}</span>
                        <span className="text-[10px] text-gray-400">({item.recipientTime})</span>
                      </div>
                      <p className="text-gray-600 font-sans mt-1">"{item.message}"</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-bold text-indigo-600 block uppercase">Delivery Target:</span>
                      <span className="text-[10px] font-bold text-gray-700 block mt-0.5">{item.scheduledFor}</span>
                      <button
                        onClick={() => {
                          setNotificationQueue(prev => prev.filter(nq => nq.id !== item.id));
                          // Add completion notification inside stream
                          const sysUpdate = {
                            id: `u-forced-${Date.now()}`,
                            sender: "System Alert",
                            message: `🚀 Force-sent immediate notification block to ${item.recipient} (Bypassing local rest limits).`,
                            timestamp: "Just now",
                            type: "system" as const
                          };
                          setProjects(prev => prev.map(p => {
                            if (p.id === activeProject.id) {
                              return { ...p, updates: [sysUpdate, ...p.updates] };
                            }
                            return p;
                          }));
                        }}
                        className="mt-1.5 px-2 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-[8px] font-bold rounded text-gray-500 cursor-pointer"
                      >
                        ⚡ Force Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Delivery Rule Config */}
          <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4.5 space-y-3.5 text-xs font-mono">
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block">AI Delivery Rules Table</span>
            <p className="text-[11px] text-gray-500 font-sans leading-relaxed">
              When messages or checklist changes are triggered outside of a colleague's preferred timezone hours, AI resolves immediate delivery vs buffered queues.
            </p>
            
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                <span className="text-gray-600">🛌 Sleeping hours (10:00 PM - 7:00 AM local):</span>
                <span className="font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-gray-100">QUEUE TILL 9:00 AM</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                <span className="text-gray-600">🍲 Lunch break (12:00 PM - 1:00 PM local):</span>
                <span className="font-bold text-amber-700 bg-white px-2 py-0.5 rounded border border-gray-100">BUFFER FOR 1 HOUR</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                <span className="text-gray-600">🏖️ Holiday observed locally:</span>
                <span className="font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-gray-100">QUEUE TILL WORKDAY</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">📢 Direct Emergency Tags (@urgent):</span>
                <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-gray-100">IMMEDIATE FORCE DELIVERY</span>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
