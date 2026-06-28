import React, { createContext, useContext, useState, useEffect } from "react";

export type AppLanguage = "English" | "Hindi" | "Spanish" | "French" | "German" | "Japanese" | "Chinese";
export type AiLanguage = "English" | "Hindi" | "Spanish" | "French" | "German" | "Japanese" | "Chinese";
export type VoiceLanguage = "English" | "Hindi" | "Hinglish" | "Spanish" | "French" | "German";
export type ExplanationLevel = "Beginner" | "Student" | "Professional" | "Expert";

export interface AccessibilityConfig {
  largeText: boolean;
  dyslexiaFont: boolean;
  highContrast: boolean;
  textToSpeech: boolean;
}

export interface Holiday {
  date: string;
  name: string;
  description: string;
}

export interface AcademicCalendarItem {
  title: string;
  period: string;
  description: string;
}

export interface FestivalIntelligence {
  name: string;
  impact: string;
  advice: string;
}

interface CulturalConfig {
  dateFormat: string;
  timeFormat: string;
  startOfWeek: string;
  workSchedule: string;
  holidays: Holiday[];
}

export interface CountryConfig {
  flag: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
  startOfWeek: "Monday" | "Sunday" | "Saturday";
  timezone: string;
  workSchedule: string;
  holidays: Holiday[];
  academicCalendar: AcademicCalendarItem[];
  season: string;
  festivalIntelligence: FestivalIntelligence;
  productivitySuggestions: string[];
}

interface LocalizationContextType {
  appLanguage: AppLanguage;
  setAppLanguage: (lang: AppLanguage) => void;
  aiLanguage: AiLanguage;
  setAiLanguage: (lang: AiLanguage) => void;
  voiceLanguage: VoiceLanguage;
  setVoiceLanguage: (lang: VoiceLanguage) => void;
  explanationLevel: ExplanationLevel;
  setExplanationLevel: (level: ExplanationLevel) => void;
  translationEnabled: boolean;
  setTranslationEnabled: (enabled: boolean) => void;
  learningModeEnabled: boolean;
  setLearningModeEnabled: (enabled: boolean) => void;
  accessibility: AccessibilityConfig;
  setAccessibility: (config: Partial<AccessibilityConfig>) => void;
  t: (key: string) => string;
  formatDate: (date: string | Date | number) => string;
  formatTime: (date: string | Date | number) => string;
  culturalConfig: CulturalConfig;
  getTranslationOfText: (text: string, targetLang?: string) => Promise<string>;
  pronounceText: (text: string) => void;
  clockRotationTrigger: number;

  // Regional Intelligence variables
  country: string;
  setCountry: (country: string) => void;
  state: string;
  setState: (state: string) => void;
  district: string;
  setDistrict: (district: string) => void;
  city: string;
  setCity: (city: string) => void;
  postalCode: string;
  setPostalCode: (postalCode: string) => void;
  latitude: string;
  setLatitude: (latitude: string) => void;
  longitude: string;
  setLongitude: (longitude: string) => void;
  timezone: string;
  setTimezone: (timezone: string) => void;
  dateFormat: string;
  setDateFormat: (format: string) => void;
  timeFormat: "12h" | "24h";
  setTimeFormat: (format: "12h" | "24h") => void;
  startOfWeek: "Monday" | "Sunday" | "Saturday";
  setStartOfWeek: (day: "Monday" | "Sunday" | "Saturday") => void;
  workSchedule: string;
  setWorkSchedule: (schedule: string) => void;
  academicCalendar: AcademicCalendarItem[];
  season: string;
  festivalIntelligence: FestivalIntelligence | null;
  productivitySuggestions: string[];
  calendarSynced: boolean;
  setCalendarSynced: (synced: boolean) => void;

  // Travel Mode & Time Zone Intelligence
  isTravelMode: boolean;
  travelModeType: "temporary" | "permanent" | "none";
  homeCountry: string;
  setHomeCountry: (country: string) => void;
  currentLocalCountry: string;
  setCurrentLocalCountry: (country: string) => void;
  travelProductivityMode: "airport" | "hotel" | "business" | "vacation" | "study_abroad" | "normal";
  setTravelProductivityMode: (mode: "airport" | "hotel" | "business" | "vacation" | "study_abroad" | "normal") => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  travelNotification: { show: boolean; detectedCountry: string; detectedTimezone: string; detectedCity: string } | null;
  setTravelNotification: (notification: { show: boolean; detectedCountry: string; detectedTimezone: string; detectedCity: string } | null) => void;
  handleTravelDecision: (decision: "temporary" | "permanent" | "keep") => void;
  simulateTravel: (targetCountry: string) => void;
  convertDeadlineDisplay: (deadlineStr: string) => { originalTime: string; localTime: string; isDifferentZone: boolean };
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

const translations: Record<AppLanguage, Record<string, string>> = {
  English: {
    // Navigation
    "nav.cockpit": "Productivity Cockpit",
    "nav.planner": "Milestone Planner",
    "nav.focus": "Focus & Calendar",
    "nav.scanner": "Document Scanner",
    "nav.voice": "Voice Chief-Of-Staff",
    "nav.habits": "Habits & Goals",
    "nav.collaboration": "Collaboration Space",
    "nav.localization": "Multilingual Hub",
    
    // Header
    "head.systems": "Systems Controls",
    "head.mantra": "Mantra",
    "head.rescue": "Rescue Mode",
    "head.rescue.desc": "Activate to compress timelines, prioritize deliverables, and trigger emergency sprints.",
    "head.rescue.btn.on": "Mute Rescue Shrouds",
    "head.rescue.btn.off": "Deploy Emergency Triage",
    
    // Cockpit / Dashboard
    "dash.title": "Productivity Cockpit",
    "dash.subtitle": "Autonomous Multi-Track Pacing Engine",
    "dash.active_milestones": "Active Milestones",
    "dash.critical_bottlenecks": "Critical Bottlenecks",
    "dash.weekly_hours": "Paced Workload Hours",
    "dash.risk_probability": "Risk Probability Overview",
    "dash.add_milestone": "Add Critical Milestone",
    "dash.input_title": "Milestone / Deliverable Title",
    "dash.input_deadline": "Target Submission Deadline",
    "dash.input_notes": "Context / Rubric constraints",
    "dash.btn_analyze": "Run AI Risk Assessment",
    "dash.no_tasks": "No active pacing tracks on deck.",
    "dash.risk_index": "Urgent Risk Index",
    "dash.time_runway": "Pacing Runway",
    "dash.actionable_step": "Immediate Rescue Step",
    "dash.completion_prob": "Success Probability",
    
    // Planner
    "plan.title": "Milestone Planner",
    "plan.subtitle": "Dynamic Chronological Sequence & Critical Path",
    "plan.simulate_delay": "Simulate Milestone Delay",
    "plan.trigger_replanning": "Trigger AI Replanning",
    "plan.pacing_chart": "Pacing Velocity Vector",
    "plan.status_done": "COMPLETED",
    "plan.status_pending": "PENDING",
    "plan.status_delayed": "DELAYED",
    "plan.milestones": "Chronological Milestones",
    
    // Focus Tab
    "focus.title": "Focus & Calendar Sync",
    "focus.subtitle": "Attention Budget & Micro-Sprint Controls",
    "focus.timer_header": "Sprint Timer",
    "focus.start": "Initiate Sprint",
    "focus.pause": "Pause focus Block",
    "focus.mute_system": "Activate Silent Attention Shield",
    "focus.duration": "Shield Duration",
    "focus.level": "AI Pacing Personality",
    "focus.level.silent": "Silent Partner",
    "focus.level.balanced": "Balanced Advisor",
    "focus.level.coach": "Motivator Pro",
    "focus.level.rescue": "Extreme Rescue Coordinator",
    
    // Scanner
    "scan.title": "Multilingual Document Intelligence",
    "scan.subtitle": "Scan Syllabus, Briefs & Rubrics across 7+ Languages",
    "scan.drag_drop": "Drag & Drop PDF or Syllabus here",
    "scan.or_click": "or browse local storage",
    "scan.paste": "Paste syllabus content text directly",
    "scan.analyze": "Extract Deadlines & Translate",
    "scan.processing": "Running OCR, translating & scheduling...",
    "scan.flashcards": "Smart Flashcards",
    "scan.summary": "High-Yield Summary",
    "scan.quiz": "Practice Quiz",
    
    // Voice
    "voice.title": "Voice Chief-of-Staff",
    "voice.subtitle": "Speech-to-Text & Smart Pronunciation Companion",
    "voice.mic_start": "Initiate Voice Session",
    "voice.mic_stop": "Conclude Voice Session",
    "voice.suggestions": "Spoken Directives:",
    "voice.speak_hinglish": "You can speak to me in English, Hindi, Hinglish, Spanish, French, or German.",
    
    // Habits
    "habits.title": "Habits & Goals Tracker",
    "habits.subtitle": "Long-Term Cognitive Conditioning & Progress Vector",
    
    // General / Status / Modes
    "mode.learning": "Language Learning Mode",
    "mode.translate_all": "Translate Everything (Translate Everything)",
    "mode.sim_level": "Complexity Level",
    "status.pacing": "PACING ACTIVE",
    "status.shield": "SHIELD ENGAGED",
    "status.safe": "SAFE ZONE",
    "status.risk": "ELEVATED DELAY",
    "status.critical": "CRITICAL RISK",
    "status.free_blocks": "Free Blocks",
    "status.slots": "Slots Optimized",
    "status.focus_session": "Focus Session",
  },
  Hindi: {
    // Navigation
    "nav.cockpit": "उत्पादकता कॉकपिट",
    "nav.planner": "मील का पत्थर योजनाकार",
    "nav.focus": "फोकस और कैलेंडर",
    "nav.scanner": "दस्तावेज़ स्कैनर",
    "nav.voice": "आवाज चीफ-ऑफ-स्टाफ",
    "nav.habits": "आदतें और लक्ष्य",
    "nav.collaboration": "सहयोग स्थान",
    "nav.localization": "बहुभाषी हब",
    
    // Header
    "head.systems": "सिस्टम नियंत्रण",
    "head.mantra": "मंत्र",
    "head.rescue": "बचाव मोड",
    "head.rescue.desc": "समयसीमा को संकुचित करने, कार्यों को प्राथमिकता देने और आपातकालीन स्प्रिंट को सक्रिय करने के लिए चालू करें।",
    "head.rescue.btn.on": "बचाव अलार्म बंद करें",
    "head.rescue.btn.off": "आपातकालीन ट्राइएज तैनात करें",
    
    // Cockpit / Dashboard
    "dash.title": "उत्पादकता कॉकपिट",
    "dash.subtitle": "स्वायत्त मल्टी-ट्रैक पेसिंग इंजन",
    "dash.active_milestones": "सक्रिय मील के पत्थर",
    "dash.critical_bottlenecks": "महत्वपूर्ण बाधाएं",
    "dash.weekly_hours": "कार्यभार के घंटे",
    "dash.risk_probability": "जोखिम संभावना अवलोकन",
    "dash.add_milestone": "नया महत्वपूर्ण कार्य जोड़ें",
    "dash.input_title": "मील का पत्थर / कार्य का शीर्षक",
    "dash.input_deadline": "लक्षित जमा करने की समयसीमा",
    "dash.input_notes": "संदर्भ / नियम सीमाएं",
    "dash.btn_analyze": "AI जोखिम मूल्यांकन चलाएं",
    "dash.no_tasks": "डेस्क पर कोई सक्रिय ट्रैक नहीं है।",
    "dash.risk_index": "तत्काल जोखिम सूचकांक",
    "dash.time_runway": "पेसिंग रनवे",
    "dash.actionable_step": "तत्काल सुधारात्मक कदम",
    "dash.completion_prob": "सफलता की संभावना",
    
    // Planner
    "plan.title": "मील का पत्थर योजनाकार",
    "plan.subtitle": "गतिशील कालानुक्रमिक अनुक्रम और महत्वपूर्ण मार्ग",
    "plan.simulate_delay": "देरी का अनुकरण करें",
    "plan.trigger_replanning": "AI पुनर्रचना शुरू करें",
    "plan.pacing_chart": "पेसिंग वेग वेक्टर",
    "plan.status_done": "पूर्ण",
    "plan.status_pending": "लंबित",
    "plan.status_delayed": "विलंबित",
    "plan.milestones": "कालानुक्रमिक मील के पत्थर",
    
    // Focus Tab
    "focus.title": "फोकस और कैलेंडर सिंक",
    "focus.subtitle": "ध्यान बजट और माइक्रो-स्प्रिंट नियंत्रण",
    "focus.timer_header": "स्प्रिंट टाइमर",
    "focus.start": "स्प्रिंट शुरू करें",
    "focus.pause": "फोकस ब्लॉक रोकें",
    "focus.mute_system": "मौन ध्यान शील्ड सक्रिय करें",
    "focus.duration": "शील्ड अवधि",
    "focus.level": "AI पेसिंग व्यक्तित्व",
    "focus.level.silent": "मौन साथी",
    "focus.level.balanced": "संतुलित सलाहकार",
    "focus.level.coach": "मोटिवेटर प्रो",
    "focus.level.rescue": "चरम बचाव समन्वयक",
    
    // Scanner
    "scan.title": "बहुभाषी दस्तावेज़ इंटेलिजेंस",
    "scan.subtitle": "7+ भाषाओं में पाठ्यक्रम, संक्षिप्त विवरण और रुब्रिक्स स्कैन करें",
    "scan.drag_drop": "यहाँ पाठ्यक्रम या पीडीएफ खींचें और छोड़ें",
    "scan.or_click": "या स्थानीय फ़ाइलें ब्राउज़ करें",
    "scan.paste": "पाठ्यक्रम पाठ सीधे चिपकाएँ",
    "scan.analyze": "समयसीमा निकालें और अनुवाद करें",
    "scan.processing": "OCR चला रहे हैं, अनुवाद और शेड्यूलिंग जारी है...",
    "scan.flashcards": "स्मार्ट फ्लैशकार्ड",
    "scan.summary": "महत्वपूर्ण सारांश",
    "scan.quiz": "अभ्यास प्रश्नोत्तरी",
    
    // Voice
    "voice.title": "आवाज चीफ-ऑफ-स्टाफ",
    "voice.subtitle": "स्पीच-टू-टेक्स्ट और स्मार्ट उच्चारण साथी",
    "voice.mic_start": "आवाज सत्र शुरू करें",
    "voice.mic_stop": "आवाज सत्र समाप्त करें",
    "voice.suggestions": "बोले गए निर्देश:",
    "voice.speak_hinglish": "आप मुझसे अंग्रेजी, हिंदी, हिंग्लिश, स्पेनिश, फ्रेंच या जर्मन में बात कर सकते हैं।",
    
    // Habits
    "habits.title": "आदतें और लक्ष्य ट्रैकर",
    "habits.subtitle": "दीर्घकालिक संज्ञानात्मक अनुकूलन और प्रगति वेक्टर",
    
    // General / Status
    "mode.learning": "भाषा सीखने का मोड",
    "mode.translate_all": "सब कुछ अनुवाद करें",
    "mode.sim_level": "जटिलता का स्तर",
    "status.pacing": "पेसिंग सक्रिय",
    "status.shield": "शील्ड सक्रिय",
    "status.safe": "सुरक्षित क्षेत्र",
    "status.risk": "बढ़ी हुई देरी",
    "status.critical": "गंभीर जोखिम",
    "status.free_blocks": "मुक्त ब्लॉक",
    "status.slots": "इष्टतम स्लॉट",
    "status.focus_session": "फोकस सत्र",
  },
  Spanish: {
    "nav.cockpit": "Cabina de Productividad",
    "nav.planner": "Planificador de Hitos",
    "nav.focus": "Enfoque y Calendario",
    "nav.scanner": "Escáner de Documentos",
    "nav.voice": "Jefe de Gabinete de Voz",
    "nav.habits": "Hábitos y Metas",
    "nav.collaboration": "Espacio de Colaboración",
    "nav.localization": "Centro Multilingüe",
    
    "head.systems": "Controles de Sistemas",
    "head.mantra": "Mantra",
    "head.rescue": "Modo de Rescate",
    "head.rescue.desc": "Activa para comprimir plazos, priorizar entregas y activar sprints de emergencia.",
    "head.rescue.btn.on": "Silenciar Alertas de Rescate",
    "head.rescue.btn.off": "Desplegar Triaje de Emergencia",
    
    "dash.title": "Cabina de Productividad",
    "dash.subtitle": "Motor Autónomo de Ritmo Multitrayecto",
    "dash.active_milestones": "Hitos Activos",
    "dash.critical_bottlenecks": "Cuellos de Botella Críticos",
    "dash.weekly_hours": "Horas de Trabajo Programadas",
    "dash.risk_probability": "Descripción de Probabilidad de Riesgo",
    "dash.add_milestone": "Añadir Hito Crítico",
    "dash.input_title": "Título del Hito / Entregable",
    "dash.input_deadline": "Plazo Límite de Entrega",
    "dash.input_notes": "Contexto / Restricciones de rúbrica",
    "dash.btn_analyze": "Ejecutar Evaluación de Riesgo AI",
    "dash.no_tasks": "No hay proyectos activos en cubierta.",
    "dash.risk_index": "Índice de Riesgo Urgente",
    "dash.time_runway": "Pista de Ritmo",
    "dash.actionable_step": "Paso de Rescate Inmediato",
    "dash.completion_prob": "Probabilidad de Éxito",
    
    "plan.title": "Planificador de Hitos",
    "plan.subtitle": "Secuencia Cronológica Dinámica y Ruta Crítica",
    "plan.simulate_delay": "Simular Retraso de Hito",
    "plan.trigger_replanning": "Activar Replanteamiento AI",
    "plan.pacing_chart": "Vector de Velocidad de Ritmo",
    "plan.status_done": "COMPLETADO",
    "plan.status_pending": "PENDIENTE",
    "plan.status_delayed": "RETRASADO",
    "plan.milestones": "Hitos Cronológicos",
    
    "focus.title": "Sincronización de Enfoque y Calendario",
    "focus.subtitle": "Presupuesto de Atención y Controles de Micro-Sprint",
    "focus.timer_header": "Temporizador de Sprint",
    "focus.start": "Iniciar Sprint",
    "focus.pause": "Pausar Bloque de Enfoque",
    "focus.mute_system": "Activar Escudo de Atención Silencioso",
    "focus.duration": "Duración del Escudo",
    "focus.level": "Personalidad del Ritmo AI",
    "focus.level.silent": "Socio Silencioso",
    "focus.level.balanced": "Asesor Equilibrado",
    "focus.level.coach": "Motivador Pro",
    "focus.level.rescue": "Coordinador de Rescate Extremo",
    
    "scan.title": "Inteligencia Documental Multilingüe",
    "scan.subtitle": "Escanea Planes de Estudio, Resúmenes y Rúbricas en más de 7 Idiomas",
    "scan.drag_drop": "Arrastra y suelta el plan de estudio o PDF aquí",
    "scan.or_click": "o examina archivos locales",
    "scan.paste": "Pega el texto de instrucciones directamente",
    "scan.analyze": "Extraer Plazos y Traducir",
    "scan.processing": "Ejecutando OCR, traduciendo y programando...",
    "scan.flashcards": "Tarjetas Inteligentes",
    "scan.summary": "Resumen de Alto Rendimiento",
    "scan.quiz": "Cuestionario de Práctica",
    
    "voice.title": "Jefe de Gabinete de Voz",
    "voice.subtitle": "Conversión de Voz a Texto y Pronunciación Inteligente",
    "voice.mic_start": "Iniciar Sesión de Voz",
    "voice.mic_stop": "Finalizar Sesión de Voz",
    "voice.suggestions": "Directivas Habladas:",
    "voice.speak_hinglish": "Puedes hablarme en inglés, hindi, hinglish, español, francés o alemán.",
    
    "habits.title": "Rastreador de Hábitos y Metas",
    "habits.subtitle": "Acondicionamiento Cognitivo y Vector de Progreso",
    
    "mode.learning": "Modo de Aprendizaje de Idiomas",
    "mode.translate_all": "Traducir Todo",
    "mode.sim_level": "Nivel de Complejidad",
    "status.pacing": "RITMO ACTIVO",
    "status.shield": "ESCUDO ACTIVADO",
    "status.safe": "ZONA SEGURA",
    "status.risk": "RETRASO ELEVADO",
    "status.critical": "RIESGO CRÍTICO",
    "status.free_blocks": "Bloques Libres",
    "status.slots": "Slots Optimizados",
    "status.focus_session": "Sesión de Enfoque",
  },
  French: {
    "nav.cockpit": "Cockpit de Productivité",
    "nav.planner": "Planificateur de Jalons",
    "nav.focus": "Focus & Calendrier",
    "nav.scanner": "Scanner de Documents",
    "nav.voice": "Chef d'État-Major de la Voix",
    "nav.habits": "Habitudes et Objectifs",
    "nav.collaboration": "Espace de Collaboration",
    "nav.localization": "Centre Multilingue",
    
    "head.systems": "Contrôles Système",
    "head.mantra": "Mantra",
    "head.rescue": "Mode de Secours",
    "head.rescue.desc": "Activer pour compresser les délais, prioriser les livrables et lancer des sprints d'urgence.",
    "head.rescue.btn.on": "Désactiver les Alertes",
    "head.rescue.btn.off": "Déployer le Tri d'Urgence",
    
    "dash.title": "Cockpit de Productivité",
    "dash.subtitle": "Moteur Autonome de Cadencement Multi-Pistes",
    "dash.active_milestones": "Jalons Actifs",
    "dash.critical_bottlenecks": "Goulots d'Étranglement Critiques",
    "dash.weekly_hours": "Heures de Travail Prévues",
    "dash.risk_probability": "Aperçu de la Probabilité de Risque",
    "dash.add_milestone": "Ajouter un Jalon Critique",
    "dash.input_title": "Titre du Jalon / Livrable",
    "dash.input_deadline": "Date Limite de Soumission",
    "dash.input_notes": "Contexte / Contraintes de la rubrique",
    "dash.btn_analyze": "Lancer l'Évaluation des Risques AI",
    "dash.no_tasks": "Aucun projet actif sur le bureau.",
    "dash.risk_index": "Indice de Risque Urgent",
    "dash.time_runway": "Piste de Cadencement",
    "dash.actionable_step": "Mesure de Secours Immédiate",
    "dash.completion_prob": "Probabilité de Réussite",
    
    "plan.title": "Planificateur de Jalons",
    "plan.subtitle": "Séquence Chronologique Dynamique et Chemin Critique",
    "plan.simulate_delay": "Simuler un Retard de Jalon",
    "plan.trigger_replanning": "Déclencher la Replanification AI",
    "plan.pacing_chart": "Vecteur de Vitesse de Cadencement",
    "plan.status_done": "TERMINÉ",
    "plan.status_pending": "EN ATTENTE",
    "plan.status_delayed": "RETARDÉ",
    "plan.milestones": "Jalons Chronologiques",
    
    "focus.title": "Mise au Point & Synchro Calendrier",
    "focus.subtitle": "Budget d'Attention et Contrôles de Micro-Sprint",
    "focus.timer_header": "Minuteur de Sprint",
    "focus.start": "Lancer le Sprint",
    "focus.pause": "Pause",
    "focus.mute_system": "Activer le Bouclier d'Attention Silencieux",
    "focus.duration": "Durée du Bouclier",
    "focus.level": "Personnalité de Cadencement AI",
    "focus.level.silent": "Partenaire Silencieux",
    "focus.level.balanced": "Conseiller Équilibré",
    "focus.level.coach": "Motivateur Pro",
    "focus.level.rescue": "Coordonnateur de Secours Extrême",
    
    "scan.title": "Intelligence Documentaire Multilingue",
    "scan.subtitle": "Scannez vos Programmes, Briefings et Rubriques dans plus de 7 Langues",
    "scan.drag_drop": "Glissez-déposez le programme ou PDF ici",
    "scan.or_click": "ou parcourez les fichiers locaux",
    "scan.paste": "Collez le texte d'instructions directement",
    "scan.analyze": "Extraire les Échéances & Traduire",
    "scan.processing": "Exécution de l'OCR, traduction et planification...",
    "scan.flashcards": "Fiches de Révision",
    "scan.summary": "Synthèse de Haut Rendement",
    "scan.quiz": "Quiz d'Entraînement",
    
    "voice.title": "Chef de Cabinet de la Voix",
    "voice.subtitle": "Reconnaissance Vocale & Prononciation Forte",
    "voice.mic_start": "Démarrer la Session Vocale",
    "voice.mic_stop": "Arrêter la Session Vocale",
    "voice.suggestions": "Directives Orales :",
    "voice.speak_hinglish": "Vous pouvez me parler en anglais, hindi, hinglish, espagnol, français ou allemand.",
    
    "habits.title": "Suivi des Habitudes et Objectifs",
    "habits.subtitle": "Conditionnement Cognitif et Vecteur de Progrès",
    
    "mode.learning": "Mode d'Apprentissage de Langue",
    "mode.translate_all": "Tout Traduire",
    "mode.sim_level": "Niveau de Complexité",
    "status.pacing": "CADENCEMENT ACTIF",
    "status.shield": "BOUCLIER ACTIVÉ",
    "status.safe": "ZONE SÛRE",
    "status.risk": "RETARD MODÉRÉ",
    "status.critical": "RISQUE CRITIQUE",
    "status.free_blocks": "Blocs Libres",
    "status.slots": "Créneaux Optimisés",
    "status.focus_session": "Session de Focus",
  },
  German: {
    "nav.cockpit": "Produktivitäts-Cockpit",
    "nav.planner": "Meilenstein-Planer",
    "nav.focus": "Fokus & Kalender",
    "nav.scanner": "Dokumenten-Scanner",
    "nav.voice": "Stimme Stabschef",
    "nav.habits": "Gewohnheiten & Ziele",
    "nav.collaboration": "Kollaborations-Raum",
    "nav.localization": "Mehrsprachiges Hub",
    
    "head.systems": "Systemsteuerung",
    "head.mantra": "Mantra",
    "head.rescue": "Rettungsmodus",
    "head.rescue.desc": "Aktivieren, um Zeitpläne zu komprimieren, Aufgaben zu priorisieren und Notfall-Sprints auszulösen.",
    "head.rescue.btn.on": "Rettungsmodus stumm",
    "head.rescue.btn.off": "Notfall-Triage einsetzen",
    
    "dash.title": "Produktivitäts-Cockpit",
    "dash.subtitle": "Autonomes Multititel-Pacing-System",
    "dash.active_milestones": "Aktive Meilensteine",
    "dash.critical_bottlenecks": "Kritische Engpässe",
    "dash.weekly_hours": "Geplante Arbeitsstunden",
    "dash.risk_probability": "Risiko-Wahrscheinlichkeitsübersicht",
    "dash.add_milestone": "Kritischen Meilenstein hinzufügen",
    "dash.input_title": "Meilenstein / Abgabetitel",
    "dash.input_deadline": "Zielabgabetermin",
    "dash.input_notes": "Kontext / Bewertungskriterien",
    "dash.btn_analyze": "AI-Risikobewertung ausführen",
    "dash.no_tasks": "Keine aktiven Pacing-Tracks vorhanden.",
    "dash.risk_index": "Dringender Risikoindex",
    "dash.time_runway": "Pacing-Landebahn",
    "dash.actionable_step": "Sofortige Rettungsmaßnahme",
    "dash.completion_prob": "Erfolgswahrscheinlichkeit",
    
    "plan.title": "Meilenstein-Planer",
    "plan.subtitle": "Dynamische chronologische Abfolge & Kritischer Pfad",
    "plan.simulate_delay": "Meilenstein-Verzögerung simulieren",
    "plan.trigger_replanning": "AI-Neuplanung auslösen",
    "plan.pacing_chart": "Pacing-Geschwindigkeitsvektor",
    "plan.status_done": "ABGESCHLOSSEN",
    "plan.status_pending": "PENDENT",
    "plan.status_delayed": "VERZÖGERT",
    "plan.milestones": "Chronologische Meilensteine",
    
    "focus.title": "Fokus & Kalender-Synchronisation",
    "focus.subtitle": "Aufmerksamkeitsbudget und Mikro-Sprint-Steuerung",
    "focus.timer_header": "Sprint-Timer",
    "focus.start": "Sprint starten",
    "focus.pause": "Fokusblock pausieren",
    "focus.mute_system": "Aufmerksamkeitsschild aktivieren",
    "focus.duration": "Schilddauer",
    "focus.level": "AI-Pacing-Persönlichkeit",
    "focus.level.silent": "Stiller Partner",
    "focus.level.balanced": "Ausgeglichener Berater",
    "focus.level.coach": "Motivator Pro",
    "focus.level.rescue": "Extremer Rettungskoordinator",
    
    "scan.title": "Mehrsprachige Dokumenten-Intelligenz",
    "scan.subtitle": "Lehrpläne, Briefings und Bewertungsraster in über 7 Sprachen scannen",
    "scan.drag_drop": "Lehrplan oder PDF hierher ziehen",
    "scan.or_click": "oder im lokalen Speicher suchen",
    "scan.paste": "Anweisungen direkt als Text einfügen",
    "scan.analyze": "Fristen extrahieren & übersetzen",
    "scan.processing": "Führe OCR aus, übersetze und plane...",
    "scan.flashcards": "Smarte Karteikarten",
    "scan.summary": "Kernzusammenfassung",
    "scan.quiz": "Übungs-Quiz",
    
    "voice.title": "Stimmen-Stabschef",
    "voice.subtitle": "Spracherkennung & Intelligente Aussprache",
    "voice.mic_start": "Sprachsitzung starten",
    "voice.mic_stop": "Sprachsitzung beenden",
    "voice.suggestions": "Gesprochene Direktiven:",
    "voice.speak_hinglish": "Sie können auf Englisch, Hindi, Hinglish, Spanisch, Französisch oder Deutsch sprechen.",
    
    "habits.title": "Gewohnheits- & Ziele-Tracker",
    "habits.subtitle": "Langfristige kognitive Konditionierung & Fortschrittsvektor",
    
    "mode.learning": "Sprachlern-Modus",
    "mode.translate_all": "Alles Übersetzen",
    "mode.sim_level": "Komplexitätsgrad",
    "status.pacing": "PACING AKTIV",
    "status.shield": "SCHILD AKTIVIERT",
    "status.safe": "SICHERE ZONE",
    "status.risk": "ERHÖHTE VERZÖGERUNG",
    "status.critical": "KRITISCHES RISIKO",
    "status.free_blocks": "Freie Blöcke",
    "status.slots": "Slots Optimiert",
    "status.focus_session": "Fokus-Sitzung",
  },
  Japanese: {
    "nav.cockpit": "生産性コックピット",
    "nav.planner": "マイルストーンプランナー",
    "nav.focus": "フォーカスとカレンダー",
    "nav.scanner": "文書スキャナー",
    "nav.voice": "音声幕僚長",
    "nav.habits": "習慣と目標",
    "nav.collaboration": "コラボレーションスペース",
    "nav.localization": "多言語ハブ",
    
    "head.systems": "システム制御",
    "head.mantra": "マントラ",
    "head.rescue": "レスキューモード",
    "head.rescue.desc": "アクティブにしてスケジュールを圧縮、成果物を優先し、緊急スプリントを起動します。",
    "head.rescue.btn.on": "レスキューアラーム消音",
    "head.rescue.btn.off": "緊急トリアージを展開",
    
    "dash.title": "生産性コックピット",
    "dash.subtitle": "自律型マルチトラック・ペーシングエンジン",
    "dash.active_milestones": "アクティブなマイルストーン",
    "dash.critical_bottlenecks": "致命的なボトルネック",
    "dash.weekly_hours": "配分された作業時間",
    "dash.risk_probability": "リスク確率の概要",
    "dash.add_milestone": "重要なマイルストーンの追加",
    "dash.input_title": "マイルストーン / 成果物のタイトル",
    "dash.input_deadline": "目標提出期限",
    "dash.input_notes": "コンテキスト / ルーブリックの制約",
    "dash.btn_analyze": "AIリスク評価の実行",
    "dash.no_tasks": "現在アクティブなトラックはありません。",
    "dash.risk_index": "緊急リスク指数",
    "dash.time_runway": "ペーシング滑走路",
    "dash.actionable_step": "即時のレスキュー手段",
    "dash.completion_prob": "達成確率",
    
    "plan.title": "マイルストーンプランナー",
    "plan.subtitle": "動的な時系列シーケンスとクリティカルパス",
    "plan.simulate_delay": "マイルストーン遅延のシミュレート",
    "plan.trigger_replanning": "AI再計画のトリガー",
    "plan.pacing_chart": "ペーシング速度ベクトル",
    "plan.status_done": "完了",
    "plan.status_pending": "保留中",
    "plan.status_delayed": "遅延中",
    "plan.milestones": "時系列マイルストーン",
    
    "focus.title": "集中とカレンダーの同期",
    "focus.subtitle": "アテンションバジェットとマイクロスプリント制御",
    "focus.timer_header": "スプリントタイマー",
    "focus.start": "スプリント開始",
    "focus.pause": "集中ブロックの一時停止",
    "focus.mute_system": "サイレントアテンションシールド起動",
    "focus.duration": "シールド期間",
    "focus.level": "AIペーシングパーソナリティ",
    "focus.level.silent": "サイレントパートナー",
    "focus.level.balanced": "バランスのとれたアドバイザー",
    "focus.level.coach": "モチベータープロ",
    "focus.level.rescue": "極限レスキューコーディネーター",
    
    "scan.title": "多言語ドキュメントインテリジェンス",
    "scan.subtitle": "シラバス、ブリーフ、ルーブリックを7以上の言語でスキャン",
    "scan.drag_drop": "ここにシラバスまたはPDFをドラッグ＆ドロップ",
    "scan.or_click": "またはローカルファイルを参照",
    "scan.paste": "シラバスの指示テキストを直接貼り付け",
    "scan.analyze": "提出期限の抽出と翻訳",
    "scan.processing": "OCRを実行し、翻訳してスケジューリング中...",
    "scan.flashcards": "スマート単語帳",
    "scan.summary": "重要サマリー",
    "scan.quiz": "練習小テスト",
    
    "voice.title": "音声チーフオブスタッフ",
    "voice.subtitle": "音声認識とスマートな発音支援",
    "voice.mic_start": "音声セッション開始",
    "voice.mic_stop": "音声セッション終了",
    "voice.suggestions": "音声指示：",
    "voice.speak_hinglish": "英語、ヒンディー語、ヒングリッシュ、スペイン語、フランス語、ドイツ語でお話しいただけます。",
    
    "habits.title": "習慣と目標トラッカー",
    "habits.subtitle": "長期的な認知コンディショニングと進捗ベクトル",
    
    "mode.learning": "言語学習モード",
    "mode.translate_all": "すべて翻訳",
    "mode.sim_level": "難易度のレベル",
    "status.pacing": "ペース配分実行中",
    "status.shield": "シールド作動中",
    "status.safe": "安全ゾーン",
    "status.risk": "遅延懸念あり",
    "status.critical": "重大なリスク",
    "status.free_blocks": "空きブロック",
    "status.slots": "最適化された枠",
    "status.focus_session": "集中セッション",
  },
  Chinese: {
    "nav.cockpit": "生产力驾驶舱",
    "nav.planner": "里程碑规划器",
    "nav.focus": "专注与日历",
    "nav.scanner": "文档扫描仪",
    "nav.voice": "语音幕僚长",
    "nav.habits": "习惯与目标",
    "nav.collaboration": "协作空间",
    "nav.localization": "多语言中心",
    
    "head.systems": "系统控制",
    "head.mantra": "信条",
    "head.rescue": "抢救模式",
    "head.rescue.desc": "激活以压缩时间线，优先考虑交付物，并触发紧急冲刺。",
    "head.rescue.btn.on": "静音抢救警报",
    "head.rescue.btn.off": "部署紧急分类",
    
    "dash.title": "生产力驾驶舱",
    "dash.subtitle": "自主多轨道步调引擎",
    "dash.active_milestones": "活跃里程碑",
    "dash.critical_bottlenecks": "关键瓶颈",
    "dash.weekly_hours": "分配的工作时数",
    "dash.risk_probability": "风险概率概览",
    "dash.add_milestone": "添加关键里程碑",
    "dash.input_title": "里程碑 / 交付物名称",
    "dash.input_deadline": "目标提交截止日期",
    "dash.input_notes": "上下文 / 细则约束",
    "dash.btn_analyze": "运行 AI 风险评估",
    "dash.no_tasks": "当前无正在进行的步调轨道。",
    "dash.risk_index": "紧急风险指数",
    "dash.time_runway": "步调跑道",
    "dash.actionable_step": "即时抢救步骤",
    "dash.completion_prob": "成功概率",
    
    "plan.title": "里程碑规划器",
    "plan.subtitle": "动态按时间顺序排列的序列与关键路径",
    "plan.simulate_delay": "模拟里程碑延迟",
    "plan.trigger_replanning": "触发 AI 重新规划",
    "plan.pacing_chart": "步调速度矢量",
    "plan.status_done": "已完成",
    "plan.status_pending": "待处理",
    "plan.status_delayed": "已延迟",
    "plan.milestones": "时间顺序里程碑",
    
    "focus.title": "专注与日历同步",
    "focus.subtitle": "注意力预算与微冲刺控制",
    "focus.timer_header": "冲刺计时器",
    "focus.start": "开始冲刺",
    "focus.pause": "暂停专注区块",
    "focus.mute_system": "激活静音注意力护盾",
    "focus.duration": "护盾持续时间",
    "focus.level": "AI 步调个性",
    "focus.level.silent": "静音伙伴",
    "focus.level.balanced": "平衡顾问",
    "focus.level.coach": "专业激励者",
    "focus.level.rescue": "极端抢救协调员",
    
    "scan.title": "多语言文档智能",
    "scan.subtitle": "扫描支持 7+ 种语言的教学大纲、简报和细则",
    "scan.drag_drop": "拖放教学大纲或 PDF 至此",
    "scan.or_click": "或浏览本地存储",
    "scan.paste": "直接粘贴教学大纲文本内容",
    "scan.analyze": "提取截止日期并翻译",
    "scan.processing": "运行 OCR、翻译和日程安排中...",
    "scan.flashcards": "智能记忆卡",
    "scan.summary": "高产出摘要",
    "scan.quiz": "模拟测试",
    
    "voice.title": "语音参谋长",
    "voice.subtitle": "语音转文字与智能发音助手",
    "voice.mic_start": "启动语音会话",
    "voice.mic_stop": "结束语音会话",
    "voice.suggestions": "语音指令：",
    "voice.speak_hinglish": "您可以使用英语、印地语、混杂印地语、西班牙语、法语或德语与我交谈。",
    
    "habits.title": "习惯与目标追踪器",
    "habits.subtitle": "长期认知调节与进度矢量",
    
    "mode.learning": "语言学习模式",
    "mode.translate_all": "翻译所有内容",
    "mode.sim_level": "复杂度级别",
    "status.pacing": "步调进行中",
    "status.shield": "护盾已启用",
    "status.safe": "安全区域",
    "status.risk": "延迟增加",
    "status.critical": "严重风险",
    "status.free_blocks": "空闲区块",
    "status.slots": "已优化时段",
    "status.focus_session": "专注时间",
  }
};

export const countryConfigs: Record<string, CountryConfig> = {
  "India": {
    flag: "🇮🇳",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    startOfWeek: "Monday",
    timezone: "Asia/Kolkata",
    workSchedule: "Hybrid (Mon - Sat, 10 AM - 6 PM)",
    holidays: [
      { date: "01/26/2026", name: "Republic Day", description: "National celebration of the Constitution." },
      { date: "03/03/2026", name: "Holi Festival", description: "Festival of colors and spring transition." },
      { date: "08/15/2026", name: "Independence Day", description: "Commemoration of nationhood." },
      { date: "10/02/2026", name: "Gandhi Jayanti", description: "Honoring Mahatma Gandhi's birth." },
      { date: "11/08/2026", name: "Diwali Festival of Lights", description: "Triumph of light over darkness; high festive period." },
      { date: "12/25/2026", name: "Christmas Day", description: "Winter public holiday." }
    ],
    academicCalendar: [
      { title: "Admission Window", period: "May - July", description: "Intense document screening and enrollments." },
      { title: "Semester Start", period: "July - August", description: "Curriculum kick-offs and pacing setups." },
      { title: "Exam Period", period: "November - December", description: "High stress end-semester evaluations." },
      { title: "Placement Season", period: "October - January", description: "Corporate hiring rounds and interview sprints." }
    ],
    season: "Monsoon Season - Moderate to heavy rainfall. High humidity may shift energy patterns.",
    festivalIntelligence: {
      name: "Diwali Festivities",
      impact: "High distraction & family events. Local markets crowded.",
      advice: "AI suggests completing all heavy analytical reports before Diwali week. Compress your schedule by 2 days."
    },
    productivitySuggestions: [
      "Diwali is approaching. Finish your assignments early to secure a stress-free celebration.",
      "Prepare for the heavy monsoon humidity. Plan indoor intense blocks between 2 PM and 5 PM.",
      "Align schedules with colleagues in standard IST who observe a six-day alternate week."
    ]
  },
  "United States": {
    flag: "🇺🇸",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    startOfWeek: "Sunday",
    timezone: "America/New_York",
    workSchedule: "Standard Office (Mon - Fri, 9 AM - 5 PM)",
    holidays: [
      { date: "05/25/2026", name: "Memorial Day", description: "Remembering fallen military personnel." },
      { date: "07/04/2026", name: "Independence Day", description: "Federal holiday celebrating independence." },
      { date: "09/07/2026", name: "Labor Day", description: "Honoring workforce contributions." },
      { date: "11/26/2026", name: "Thanksgiving Day", description: "Traditional day of gratitude and family dinners." },
      { date: "12/25/2026", name: "Christmas Day", description: "Winter festive holiday." }
    ],
    academicCalendar: [
      { title: "Semester Start", period: "August - September", description: "Fall term begins." },
      { title: "Holiday Breaks", period: "November (Thanksgiving) & December", description: "Campus closures and winter pause." },
      { title: "Exam Period", period: "December & May", description: "Finals and grading deadlines." }
    ],
    season: "Summer / Autumn transition. Mild weather ideal for outdoor pacing blocks.",
    festivalIntelligence: {
      name: "Thanksgiving & Christmas",
      impact: "Extended travel, closed institutions, family reunions.",
      advice: "AI recommends wrapping up grading rubrics and reports before Wednesday afternoon of Thanksgiving week."
    },
    productivitySuggestions: [
      "Thanksgiving break begins next week. Complete your critical project milestones before Wednesday.",
      "Take advantage of the standard EST working window to coordinate with cross-continental teams.",
      "Plan a 2-hour quiet study block on Sunday evening to prepare for the upcoming sprint."
    ]
  },
  "United Kingdom": {
    flag: "🇬🇧",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    startOfWeek: "Monday",
    timezone: "Europe/London",
    workSchedule: "Flexible Office (Mon - Fri, 8:30 AM - 5 PM)",
    holidays: [
      { date: "04/06/2026", name: "Easter Monday", description: "Spring Bank Holiday." },
      { date: "05/04/2026", name: "Early May Bank Holiday", description: "Spring national holiday." },
      { date: "08/31/2026", name: "Summer Bank Holiday", description: "End of summer public holiday." },
      { date: "12/25/2026", name: "Christmas Day", description: "National festive holiday." },
      { date: "12/26/2026", name: "Boxing Day", description: "Post-Christmas national holiday." }
    ],
    academicCalendar: [
      { title: "Autumn Term Start", period: "September", description: "Michaelmas term begins." },
      { title: "Spring Term Start", period: "January", description: "Lent term begins." },
      { title: "Exam Period", period: "May - June", description: "Traditional summer finals." }
    ],
    season: "Unpredictable British Summer. Frequent showers mean planning adaptable schedules.",
    festivalIntelligence: {
      name: "Christmas & Boxing Day",
      impact: "High high-street rush. Trains and public transit running on highly limited schedules.",
      advice: "AI suggests front-loading reports before Boxing Day travel disruptions start."
    },
    productivitySuggestions: [
      "Utilize the upcoming summer bank holiday to recharge; schedule ahead to avoid weekend leakage.",
      "Observe GMT working hours. Plan asynchronous work for late afternoon collaborations."
    ]
  },
  "Japan": {
    flag: "🇯🇵",
    dateFormat: "YYYY/MM/DD",
    timeFormat: "24h",
    startOfWeek: "Monday",
    timezone: "Asia/Tokyo",
    workSchedule: "Standard Japanese Office (Mon - Fri, 9 AM - 6 PM)",
    holidays: [
      { date: "01/01/2026", name: "Ganjitsu (New Year)", description: "Most important traditional festival period." },
      { date: "04/29/2026", name: "Showa Day", description: "Start of Golden Week." },
      { date: "05/03/2026", name: "Constitution Memorial Day", description: "Golden Week celebration." },
      { date: "07/20/2026", name: "Marine Day (Umi no Hi)", description: "Giving thanks to the ocean." },
      { date: "09/21/2026", name: "Respect for the Aged Day", description: "Honoring senior citizens." }
    ],
    academicCalendar: [
      { title: "School Year Start", period: "April", description: "Traditional Japanese academic year begins." },
      { title: "Admission Sprints", period: "January - March", description: "Entrance exam high-intensity period." },
      { title: "Summer Breaks", period: "July - August", description: "Long recess with independent research pacing." }
    ],
    season: "Early Summer (Tsuyu rainy season). Humid conditions are best handled with deep-focus indoor tasks.",
    festivalIntelligence: {
      name: "Golden Week & Obon",
      impact: "Mass countrywide vacations, closed corporate offices.",
      advice: "AI shifts all deadlines out of the 3-day Golden Week block. Enjoy your break guilt-free!"
    },
    productivitySuggestions: [
      "Golden week starts in three days. Shift your active milestones to finish early.",
      "Plan around Obon family gatherings by locking down heavy study items before mid-August.",
      "Ensure high compliance with punctuality buffers; Japanese business sprints value structured margins."
    ]
  },
  "Germany": {
    flag: "🇩🇪",
    dateFormat: "DD.MM.YYYY",
    timeFormat: "24h",
    startOfWeek: "Monday",
    timezone: "Europe/Berlin",
    workSchedule: "Focused Workday (Mon - Fri, 8 AM - 4:30 PM)",
    holidays: [
      { date: "04/06/2026", name: "Ostermontag (Easter)", description: "Spring Monday holiday." },
      { date: "05/01/2026", name: "Tag der Arbeit", description: "International Workers' Day." },
      { date: "10/03/2026", name: "Tag der Deutschen Einheit", description: "German Unity Day." },
      { date: "12/25/2026", name: "Erster Weihnachtstag", description: "Christmas Day." },
      { date: "12/26/2026", name: "Zweiter Weihnachtstag", description: "Boxing Day / St. Stephen's." }
    ],
    academicCalendar: [
      { title: "Wintersemester", period: "October - March", description: "Standard university lectures." },
      { title: "Sommersemester", period: "April - September", description: "Summer university lecture series." },
      { title: "Prüfungsphase", period: "February & July", description: "Concentrated exam weeks." }
    ],
    season: "Warm European Summer. Long daylight hours let you shift focused deep blocks into cooler mornings.",
    festivalIntelligence: {
      name: "Christmas Market Season",
      impact: "High evening social activity. Quiet work focus is high during the day.",
      advice: "AI recommends maintaining rigid 'Feierabend' (evening shutdown) by completing tasks before 5 PM."
    },
    productivitySuggestions: [
      "German Unity Day is approaching. Plan a clean schedule to avoid carryover tasks during the weekend.",
      "Leverage Feierabend focus: complete high-concentration tasks early in the morning.",
      "German standards emphasize high autonomy. Break your milestones into granular daily tickets."
    ]
  },
  "Canada": {
    flag: "🇨🇦",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "12h",
    startOfWeek: "Sunday",
    timezone: "America/Toronto",
    workSchedule: "Standard Corporate (Mon - Fri, 9 AM - 5 PM)",
    holidays: [
      { date: "07/01/2026", name: "Canada Day", description: "Celebrating confederation." },
      { date: "09/07/2026", name: "Labor Day", description: "Honoring workforce efforts." },
      { date: "10/12/2026", name: "Thanksgiving", description: "Harvest gratitude." }
    ],
    academicCalendar: [
      { title: "Fall Semester", period: "September - December", description: "Autumn lecture blocks." },
      { title: "Winter Semester", period: "January - April", description: "Winter lectures and exams." },
      { title: "Summer Term", period: "May - August", description: "Optional research or summer classes." }
    ],
    season: "Vast Northern Climate. Adapt your focus blocks to daylight shifts as autumn rolls in.",
    festivalIntelligence: {
      name: "Thanksgiving",
      impact: "High family social focus. Offices and universities are closed.",
      advice: "AI recommends rescheduling deadlines around Thanksgiving Monday to prevent stressful overlaps."
    },
    productivitySuggestions: [
      "Prepare for academic terms starting in September; plan milestones in advance.",
      "Canada Day is a public holiday; adjust milestone buffers to account for team absences.",
      "Timezone overlap: sync meetings with teams in EST, PST, or MST to respect local schedules."
    ]
  },
  "Australia": {
    flag: "🇦🇺",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    startOfWeek: "Monday",
    timezone: "Australia/Sydney",
    workSchedule: "Standard Office (Mon - Fri, 8:30 AM - 5:00 PM)",
    holidays: [
      { date: "01/26/2026", name: "Australia Day", description: "Official national day." },
      { date: "04/25/2026", name: "ANZAC Day", description: "National day of remembrance." },
      { date: "12/25/2026", name: "Christmas Day", description: "Winter-summer public holiday." },
      { date: "12/26/2026", name: "Boxing Day", description: "Post-Christmas public holiday." }
    ],
    academicCalendar: [
      { title: "Semester 1", period: "February - June", description: "Autumn lecture series." },
      { title: "Semester 2", period: "July - November", description: "Spring lecture series." }
    ],
    season: "Southern Hemisphere Climate. Enjoy mild winter days with early sunsets, adjusting focus schedules.",
    festivalIntelligence: {
      name: "Boxing Day Test & Beach Season",
      impact: "High outdoor/recreational focus. High daylight activity.",
      advice: "AI suggests early morning focus slots to enjoy warm beach afternoons."
    },
    productivitySuggestions: [
      "Australian teams prefer early starts (8:30 AM); adjust communication slots.",
      "Check regional holidays like Queen's/King's Birthday which vary by territory."
    ]
  }
};

// Helper function to detect country from locale and timezone
const getDetectedCountry = (): string => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes("Kolkata") || tz.includes("Calcutta")) return "India";
    if (tz.includes("New_York") || tz.includes("Chicago") || tz.includes("Los_Angeles") || tz.includes("Denver") || tz.includes("Anchorage") || tz.includes("Honolulu")) return "United States";
    if (tz.includes("London")) return "United Kingdom";
    if (tz.includes("Tokyo")) return "Japan";
    if (tz.includes("Berlin") || tz.includes("Munich") || tz.includes("Frankfurt")) return "Germany";
    if (tz.includes("Toronto") || tz.includes("Vancouver") || tz.includes("Montreal") || tz.includes("Winnipeg")) return "Canada";
    if (tz.includes("Sydney") || tz.includes("Melbourne") || tz.includes("Brisbane") || tz.includes("Adelaide") || tz.includes("Perth") || tz.includes("Australia")) return "Australia";
    if (tz.includes("Singapore")) return "Singapore";
    if (tz.includes("Paris")) return "France";
  } catch (e) {}

  try {
    const locale = navigator.language;
    if (locale.includes("IN")) return "India";
    if (locale.includes("GB")) return "United Kingdom";
    if (locale.includes("JP")) return "Japan";
    if (locale.includes("DE")) return "Germany";
    if (locale.includes("CA")) return "Canada";
    if (locale.includes("AU")) return "Australia";
    if (locale.includes("SG")) return "Singapore";
    if (locale.includes("FR")) return "France";
    if (locale.includes("US")) return "United States";
  } catch (e) {}

  return "United States";
};

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appLanguage, setAppLanguageInternal] = useState<AppLanguage>("English");
  const [aiLanguage, setAiLanguage] = useState<AppLanguage>("English");
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>("English");
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>("Student");
  const [translationEnabled, setTranslationEnabled] = useState<boolean>(false);
  const [learningModeEnabled, setLearningModeEnabled] = useState<boolean>(false);
  const [clockRotationTrigger, setClockRotationTrigger] = useState<number>(0);

  // Dynamic Regional Intelligence Hub States
  const [country, setCountryInternal] = useState<string>("United States");
  const [state, setStateInternal] = useState<string>("");
  const [district, setDistrictInternal] = useState<string>("");
  const [city, setCityInternal] = useState<string>("");
  const [postalCode, setPostalCodeInternal] = useState<string>("");
  const [latitude, setLatitudeInternal] = useState<string>("");
  const [longitude, setLongitudeInternal] = useState<string>("");
  const [timezone, setTimezoneInternal] = useState<string>("America/New_York");
  const [dateFormat, setDateFormatInternal] = useState<string>("MM/DD/YYYY");
  const [timeFormat, setTimeFormatInternal] = useState<"12h" | "24h">("12h");
  const [startOfWeek, setStartOfWeekInternal] = useState<"Monday" | "Sunday" | "Saturday">("Sunday");
  const [workSchedule, setWorkScheduleInternal] = useState<string>("Standard Office (Mon - Fri, 9 AM - 5 PM)");
  const [calendarSynced, setCalendarSyncedInternal] = useState<boolean>(false);

  // Travel Mode & Time Zone Intelligence States
  const [travelModeType, setTravelModeType] = useState<"temporary" | "permanent" | "none">("none");
  const [homeCountry, setHomeCountryInternal] = useState<string>("United States");
  const [currentLocalCountry, setCurrentLocalCountryInternal] = useState<string>("United States");
  const [travelProductivityMode, setTravelProductivityModeInternal] = useState<"airport" | "hotel" | "business" | "vacation" | "study_abroad" | "normal">("normal");
  const [isOffline, setIsOfflineInternal] = useState<boolean>(false);
  const [travelNotification, setTravelNotification] = useState<{ show: boolean; detectedCountry: string; detectedTimezone: string; detectedCity: string } | null>(null);

  const isTravelMode = travelModeType === "temporary";
  
  const [accessibility, setAccessibilityState] = useState<AccessibilityConfig>({
    largeText: false,
    dyslexiaFont: false,
    highContrast: false,
    textToSpeech: false,
  });

  // Load persistence from localstorage
  useEffect(() => {
    const appLang = localStorage.getItem("saver_app_lang") as AppLanguage;
    const aiLang = localStorage.getItem("saver_ai_lang") as AppLanguage;
    const voiceLang = localStorage.getItem("saver_voice_lang") as VoiceLanguage;
    const expLvl = localStorage.getItem("saver_exp_lvl") as ExplanationLevel;
    const transOn = localStorage.getItem("saver_trans_all") === "true";
    const learnOn = localStorage.getItem("saver_learn_mode") === "true";
    const access = localStorage.getItem("saver_accessibility");

    const savedCountry = localStorage.getItem("saver_country");
    const savedState = localStorage.getItem("saver_state");
    const savedDistrict = localStorage.getItem("saver_district");
    const savedCity = localStorage.getItem("saver_city");
    const savedPostalCode = localStorage.getItem("saver_postal_code");
    const savedLatitude = localStorage.getItem("saver_latitude");
    const savedLongitude = localStorage.getItem("saver_longitude");
    const savedTimezone = localStorage.getItem("saver_timezone");
    const savedDateFormat = localStorage.getItem("saver_date_format");
    const savedTimeFormat = localStorage.getItem("saver_time_format") as "12h" | "24h";
    const savedStartOfWeek = localStorage.getItem("saver_start_of_week") as "Monday" | "Sunday" | "Saturday";
    const savedWorkSchedule = localStorage.getItem("saver_work_schedule");
    const savedCalSynced = localStorage.getItem("saver_cal_synced") === "true";

    let finalCountry = savedCountry;
    if (!finalCountry) {
      finalCountry = getDetectedCountry();
      localStorage.setItem("saver_country", finalCountry);
    }
    setCountryInternal(finalCountry);
    setStateInternal(savedState || "");
    setDistrictInternal(savedDistrict || "");
    setCityInternal(savedCity || "");
    setPostalCodeInternal(savedPostalCode || "");
    setLatitudeInternal(savedLatitude || "");
    setLongitudeInternal(savedLongitude || "");

    const defaultConfig = countryConfigs[finalCountry] || countryConfigs["United States"];

    setTimezoneInternal(savedTimezone || defaultConfig.timezone);
    setDateFormatInternal(savedDateFormat || defaultConfig.dateFormat);
    setTimeFormatInternal(savedTimeFormat || defaultConfig.timeFormat);
    setStartOfWeekInternal(savedStartOfWeek || defaultConfig.startOfWeek);
    setWorkScheduleInternal(savedWorkSchedule || defaultConfig.workSchedule);
    setCalendarSyncedInternal(savedCalSynced);

    // Load Travel States
    const savedTravelType = localStorage.getItem("saver_travel_mode_type") as "temporary" | "permanent" | "none";
    const savedHomeCountry = localStorage.getItem("saver_home_country");
    const savedLocalCountry = localStorage.getItem("saver_current_local_country");
    const savedTravelProd = localStorage.getItem("saver_travel_productivity_mode") as any;
    const savedOffline = localStorage.getItem("saver_is_offline") === "true";

    setTravelModeType(savedTravelType || "none");
    setHomeCountryInternal(savedHomeCountry || finalCountry);
    setCurrentLocalCountryInternal(savedLocalCountry || finalCountry);
    setTravelProductivityModeInternal(savedTravelProd || "normal");
    setIsOfflineInternal(savedOffline);

    // Auto travel detection
    const browserCountry = getDetectedCountry();
    if (browserCountry !== finalCountry && (!savedTravelType || savedTravelType === "none")) {
      const cityMap: Record<string, string> = {
        "India": "New Delhi",
        "United States": "New York",
        "United Kingdom": "London",
        "Japan": "Tokyo",
        "Germany": "Berlin",
        "Canada": "Toronto"
      };
      const cityName = cityMap[browserCountry] || "Unknown City";
      const config = countryConfigs[browserCountry] || countryConfigs["United States"];
      
      // Auto-trigger the Travel Mode Detected prompt
      setTimeout(() => {
        setTravelNotification({
          show: true,
          detectedCountry: browserCountry,
          detectedTimezone: config.timezone,
          detectedCity: `${cityName}, ${browserCountry}`
        });
      }, 1500);
    }

    if (appLang && translations[appLang]) setAppLanguageInternal(appLang);
    if (aiLang && translations[aiLang]) setAiLanguage(aiLang);
    if (voiceLang) setVoiceLanguage(voiceLang);
    if (expLvl) setExplanationLevel(expLvl);
    setTranslationEnabled(transOn);
    setLearningModeEnabled(learnOn);
    if (access) {
      try {
        setAccessibilityState(JSON.parse(access));
      } catch (e) {}
    }
  }, []);

  const setCountry = (newCountry: string) => {
    setCountryInternal(newCountry);
    localStorage.setItem("saver_country", newCountry);

    const config = countryConfigs[newCountry];
    if (config) {
      setTimezoneInternal(config.timezone);
      localStorage.setItem("saver_timezone", config.timezone);

      setDateFormatInternal(config.dateFormat);
      localStorage.setItem("saver_date_format", config.dateFormat);

      setTimeFormatInternal(config.timeFormat);
      localStorage.setItem("saver_time_format", config.timeFormat);

      setStartOfWeekInternal(config.startOfWeek);
      localStorage.setItem("saver_start_of_week", config.startOfWeek);

      setWorkScheduleInternal(config.workSchedule);
      localStorage.setItem("saver_work_schedule", config.workSchedule);
    }

    setClockRotationTrigger(prev => prev + 1);

    if (accessibility.textToSpeech) {
      pronounceText(`Region adapted to ${newCountry}. Workspace layout synchronized.`);
    }
  };

  const setState = (newState: string) => {
    setStateInternal(newState);
    localStorage.setItem("saver_state", newState);
  };
  const setDistrict = (newDistrict: string) => {
    setDistrictInternal(newDistrict);
    localStorage.setItem("saver_district", newDistrict);
  };
  const setCity = (newCity: string) => {
    setCityInternal(newCity);
    localStorage.setItem("saver_city", newCity);
  };
  const setPostalCode = (newPostalCode: string) => {
    setPostalCodeInternal(newPostalCode);
    localStorage.setItem("saver_postal_code", newPostalCode);
  };
  const setLatitude = (newLat: string) => {
    setLatitudeInternal(newLat);
    localStorage.setItem("saver_latitude", newLat);
  };
  const setLongitude = (newLong: string) => {
    setLongitudeInternal(newLong);
    localStorage.setItem("saver_longitude", newLong);
  };

  const setHomeCountry = (newHome: string) => {
    setHomeCountryInternal(newHome);
    localStorage.setItem("saver_home_country", newHome);
  };

  const setCurrentLocalCountry = (newLocal: string) => {
    setCurrentLocalCountryInternal(newLocal);
    localStorage.setItem("saver_current_local_country", newLocal);
  };

  const setTravelProductivityMode = (mode: "airport" | "hotel" | "business" | "vacation" | "study_abroad" | "normal") => {
    setTravelProductivityModeInternal(mode);
    localStorage.setItem("saver_travel_productivity_mode", mode);
  };

  const setIsOffline = (offline: boolean) => {
    setIsOfflineInternal(offline);
    localStorage.setItem("saver_is_offline", String(offline));
  };

  const handleTravelDecision = (decision: "temporary" | "permanent" | "keep") => {
    if (!travelNotification) return;

    const target = travelNotification.detectedCountry;
    
    if (decision === "temporary") {
      setTravelModeType("temporary");
      localStorage.setItem("saver_travel_mode_type", "temporary");
      
      const prevCountry = country;
      setHomeCountryInternal(prevCountry);
      localStorage.setItem("saver_home_country", prevCountry);
      
      setCurrentLocalCountryInternal(target);
      localStorage.setItem("saver_current_local_country", target);

      setCountry(target);
    } else if (decision === "permanent") {
      setTravelModeType("none");
      localStorage.setItem("saver_travel_mode_type", "none");
      
      setHomeCountryInternal(target);
      localStorage.setItem("saver_home_country", target);
      
      setCurrentLocalCountryInternal(target);
      localStorage.setItem("saver_current_local_country", target);
      
      setCountry(target);
    } else {
      setTravelModeType("none");
      localStorage.setItem("saver_travel_mode_type", "none");
    }

    setTravelNotification(null);
    setClockRotationTrigger(prev => prev + 1);
  };

  const simulateTravel = (targetCountry: string) => {
    const cityMap: Record<string, string> = {
      "India": "New Delhi",
      "United States": "New York",
      "United Kingdom": "London",
      "Japan": "Tokyo",
      "Germany": "Berlin",
      "Canada": "Toronto"
    };
    const cityName = cityMap[targetCountry] || "Unknown City";
    const config = countryConfigs[targetCountry] || countryConfigs["United States"];
    
    setTravelNotification({
      show: true,
      detectedCountry: targetCountry,
      detectedTimezone: config.timezone,
      detectedCity: `${cityName}, ${targetCountry}`
    });
  };

  const convertDeadlineDisplay = (deadlineStr: string) => {
    try {
      const date = new Date(deadlineStr);
      if (isNaN(date.getTime())) return { originalTime: deadlineStr, localTime: deadlineStr, isDifferentZone: false };

      const homeConfig = countryConfigs[homeCountry] || countryConfigs["United States"];
      const localConfig = countryConfigs[country] || countryConfigs["United States"];

      const homeTz = homeConfig.timezone;
      const localTz = localConfig.timezone;

      if (homeTz === localTz) {
        return {
          originalTime: formatTime(date),
          localTime: formatTime(date),
          isDifferentZone: false
        };
      }

      const homeTimeStr = date.toLocaleTimeString("en-US", {
        timeZone: homeTz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: timeFormat === "12h"
      });

      const localTimeStr = date.toLocaleTimeString("en-US", {
        timeZone: localTz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: timeFormat === "12h"
      });

      const getTzAbbr = (tz: string) => {
        if (tz.includes("Kolkata")) return "IST";
        if (tz.includes("New_York")) return "EDT";
        if (tz.includes("London")) return "BST";
        if (tz.includes("Tokyo")) return "JST";
        if (tz.includes("Berlin")) return "CEST";
        if (tz.includes("Toronto")) return "EDT";
        return tz.split("/").pop() || tz;
      };

      return {
        originalTime: `${homeTimeStr} ${getTzAbbr(homeTz)}`,
        localTime: `${localTimeStr} ${getTzAbbr(localTz)}`,
        isDifferentZone: true
      };
    } catch (e) {
      return { originalTime: deadlineStr, localTime: deadlineStr, isDifferentZone: false };
    }
  };

  const setTimezone = (tz: string) => {
    setTimezoneInternal(tz);
    localStorage.setItem("saver_timezone", tz);
  };

  const setDateFormat = (format: string) => {
    setDateFormatInternal(format);
    localStorage.setItem("saver_date_format", format);
  };

  const setTimeFormat = (format: "12h" | "24h") => {
    setTimeFormatInternal(format);
    localStorage.setItem("saver_time_format", format);
    setClockRotationTrigger(prev => prev + 1);
  };

  const setStartOfWeek = (day: "Monday" | "Sunday" | "Saturday") => {
    setStartOfWeekInternal(day);
    localStorage.setItem("saver_start_of_week", day);
  };

  const setWorkSchedule = (schedule: string) => {
    setWorkScheduleInternal(schedule);
    localStorage.setItem("saver_work_schedule", schedule);
  };

  const setCalendarSynced = (synced: boolean) => {
    setCalendarSyncedInternal(synced);
    localStorage.setItem("saver_cal_synced", String(synced));
  };

  const setAppLanguage = (lang: AppLanguage) => {
    setAppLanguageInternal(lang);
    localStorage.setItem("saver_app_lang", lang);
    // Smoothly rotate clock trigger
    setClockRotationTrigger(prev => prev + 1);

    // Speak native welcome when App Language changes and TTS is enabled
    if (accessibility.textToSpeech) {
      const phrases: Record<AppLanguage, string> = {
        English: "App language switched to English.",
        Hindi: "ऐप की भाषा हिंदी में बदल दी गई है।",
        Spanish: "Idioma de la aplicación cambiado a español.",
        French: "Langue de l'application changée en français.",
        German: "App-Sprache auf Deutsch umgestellt.",
        Japanese: "アプリの言語が日本語に切り替わりました。",
        Chinese: "应用语言已切换为中文。"
      };
      pronounceText(phrases[lang]);
    }
  };

  const setAccessibility = (config: Partial<AccessibilityConfig>) => {
    setAccessibilityState(prev => {
      const updated = { ...prev, ...config };
      localStorage.setItem("saver_accessibility", JSON.stringify(updated));
      return updated;
    });
  };

  // Trigger local state updates for lists when options are modified
  useEffect(() => {
    localStorage.setItem("saver_ai_lang", aiLanguage);
  }, [aiLanguage]);

  useEffect(() => {
    localStorage.setItem("saver_voice_lang", voiceLanguage);
  }, [voiceLanguage]);

  useEffect(() => {
    localStorage.setItem("saver_exp_lvl", explanationLevel);
  }, [explanationLevel]);

  useEffect(() => {
    localStorage.setItem("saver_trans_all", String(translationEnabled));
  }, [translationEnabled]);

  useEffect(() => {
    localStorage.setItem("saver_learn_mode", String(learningModeEnabled));
  }, [learningModeEnabled]);

  // Translate simple key
  const t = (key: string): string => {
    const dict = translations[appLanguage] || translations["English"];
    return dict[key] || translations["English"][key] || key;
  };

  // Format Date based on culture
  const formatDate = (dateInput: string | Date | number): string => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    if (dateFormat === "DD/MM/YYYY") {
      return `${day}/${month}/${year}`;
    } else if (dateFormat === "YYYY/MM/DD") {
      return `${year}/${month}/${day}`;
    } else if (dateFormat === "DD.MM.YYYY") {
      return `${day}.${month}.${year}`;
    } else if (dateFormat === "YYYY-MM-DD") {
      return `${year}-${month}-${day}`;
    } else {
      return `${month}/${day}/${year}`;
    }
  };

  // Format Time
  const formatTime = (dateInput: string | Date | number): string => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    if (timeFormat === "12h") {
      let hours = d.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes} ${ampm}`;
    } else {
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    }
  };

  const currentConfig = countryConfigs[country] || countryConfigs["United States"];

  const culturalConfig = {
    dateFormat,
    timeFormat,
    startOfWeek,
    workSchedule,
    holidays: currentConfig.holidays
  };

  const academicCalendar = currentConfig.academicCalendar;
  const season = currentConfig.season;
  const festivalIntelligence = currentConfig.festivalIntelligence;
  const productivitySuggestions = currentConfig.productivitySuggestions;

  // Real-time server/client proxy translation
  const getTranslationOfText = async (text: string, targetLang?: string): Promise<string> => {
    const target = targetLang || appLanguage;
    if (target === "English" && !translationEnabled) return text;

    try {
      const response = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage: target })
      });
      const data = await response.json();
      return data.translatedText || text;
    } catch (e) {
      console.error("Translation failed:", e);
      return text;
    }
  };

  // Text to Speech
  const pronounceText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Select appropriate voice based on appLanguage or voice language
      const voices = window.speechSynthesis.getVoices();
      let langCode = "en-US";
      
      if (appLanguage === "Hindi" || voiceLanguage === "Hindi") langCode = "hi-IN";
      else if (appLanguage === "Spanish" || voiceLanguage === "Spanish") langCode = "es-ES";
      else if (appLanguage === "French" || voiceLanguage === "French") langCode = "fr-FR";
      else if (appLanguage === "German" || voiceLanguage === "German") langCode = "de-DE";
      else if (appLanguage === "Japanese") langCode = "ja-JP";
      else if (appLanguage === "Chinese") langCode = "zh-CN";

      utterance.lang = langCode;
      
      // Smart Pronunciation adjustments
      if (text.toLowerCase().includes("nitesh")) {
        // Correct pronunciation phonetics for name Nitesh
        utterance.rate = 0.9;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <LocalizationContext.Provider value={{
      appLanguage,
      setAppLanguage,
      aiLanguage,
      setAiLanguage,
      voiceLanguage,
      setVoiceLanguage,
      explanationLevel,
      setExplanationLevel,
      translationEnabled,
      setTranslationEnabled,
      learningModeEnabled,
      setLearningModeEnabled,
      accessibility,
      setAccessibility,
      t,
      formatDate,
      formatTime,
      culturalConfig,
      getTranslationOfText,
      pronounceText,
      clockRotationTrigger,

      // Regional states
      country,
      setCountry,
      state,
      setState,
      district,
      setDistrict,
      city,
      setCity,
      postalCode,
      setPostalCode,
      latitude,
      setLatitude,
      longitude,
      setLongitude,
      timezone,
      setTimezone,
      dateFormat,
      setDateFormat,
      timeFormat,
      setTimeFormat,
      startOfWeek,
      setStartOfWeek,
      workSchedule,
      setWorkSchedule,
      academicCalendar,
      season,
      festivalIntelligence,
      productivitySuggestions,
      calendarSynced,
      setCalendarSynced,

      // Travel Mode & Time Zone Intelligence
      isTravelMode,
      travelModeType,
      homeCountry,
      setHomeCountry,
      currentLocalCountry,
      setCurrentLocalCountry,
      travelProductivityMode,
      setTravelProductivityMode,
      isOffline,
      setIsOffline,
      travelNotification,
      setTravelNotification,
      handleTravelDecision,
      simulateTravel,
      convertDeadlineDisplay
    }}>
      <div className={`
        ${accessibility.largeText ? "text-lg md:text-xl lg:text-2xl" : ""}
        ${accessibility.dyslexiaFont ? "font-[OpenDyslexic] tracking-wide" : ""}
        ${accessibility.highContrast ? "contrast-125 saturate-120 filter" : ""}
      `}>
        {children}
      </div>
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within a LocalizationProvider");
  }
  return context;
};
