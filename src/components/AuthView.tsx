import React, { useState } from "react";
import { useAuth, OnboardingStep } from "../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Github,
  Chrome
} from "lucide-react";

export const AuthView: React.FC<{ onAuthSuccess: () => void }> = ({ onAuthSuccess }) => {
  const {
    loginWithGoogle,
    loginWithGithub,
    loginWithMicrosoft,
    loginWithEmail,
    signUpWithEmail,
    resetPassword,
    loginAsGuest,
    onboardingStep,
    startOnboardingAnimation
  } = useAuth();

  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGuestLogin = () => {
    try {
      loginAsGuest();
      startOnboardingAnimation(onAuthSuccess);
    } catch (err: any) {
      setError(err.message || "Failed to initialize guest sandbox.");
    }
  };

  // Password strength check
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: "Enter a password", color: "bg-gray-200" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score, text: "Weak", color: "bg-red-500" };
    if (score <= 4) return { score, text: "Medium", color: "bg-amber-500" };
    return { score, text: "Strong", color: "bg-emerald-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
        startOnboardingAnimation(onAuthSuccess);
      } else if (mode === "signup") {
        if (!name.trim()) {
          throw new Error("Full name is required");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long");
        }
        await signUpWithEmail(name, email, password);
        setInfo("Verification email sent! Check your inbox.");
        // We can transition to onboarding anyway or prompt verification first.
        // Let's start the onboarding animation for delightful UX!
        startOnboardingAnimation(onAuthSuccess);
      } else if (mode === "forgot") {
        await resetPassword(email);
        setInfo("Password reset link sent! Check your email.");
        setMode("login");
      }
    } catch (err: any) {
      console.warn("API Error:", err);
      let errMsg = "An unexpected error occurred.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        errMsg = "Incorrect email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        errMsg = "This email is already in use.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "The password is too weak.";
      } else if (err.code === "auth/user-not-found") {
        errMsg = "No user found with this email.";
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github" | "microsoft") => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (provider === "google") {
        await loginWithGoogle();
      } else if (provider === "github") {
        await loginWithGithub();
      } else if (provider === "microsoft") {
        await loginWithMicrosoft();
      }
      startOnboardingAnimation(onAuthSuccess);
    } catch (err: any) {
      setError(err.message || `${provider} authentication failed.`);
      setLoading(false);
    }
  };

  // Onboarding Screen Progress
  if (onboardingStep !== "idle" && onboardingStep !== "completed") {
    const steps: { key: OnboardingStep; label: string }[] = [
      { key: "account_connected", label: "Account Connected" },
      { key: "calendar_connected", label: "Calendar Connected" },
      { key: "ai_workspace_created", label: "AI Workspace Created" },
      { key: "ready_to_plan", label: "Ready to Plan Your Tasks" }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === onboardingStep);

    return (
      <div id="auth-onboarding-container" className="fixed inset-0 bg-neutral-950/90 backdrop-blur-xl flex flex-col items-center justify-center z-50 text-white font-sans p-6 overflow-hidden">
        
        {/* Deep Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />

        <div className="w-full max-w-md bg-neutral-900/60 border border-neutral-800/80 p-8 rounded-3xl shadow-2xl backdrop-blur-md relative overflow-hidden text-center space-y-8">
          
          {/* Logo / Icon Header */}
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 mx-auto">
            <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-mono font-bold uppercase tracking-wider text-neutral-100">Synchronizing Workspace</h2>
            <p className="text-xs text-neutral-400">Initializing study agent parameters and calendar hooks...</p>
          </div>

          {/* Checklist of Steps */}
          <div className="space-y-4 text-left max-w-xs mx-auto py-2">
            {steps.map((step, idx) => {
              const isDone = currentStepIndex >= idx;
              const isCurrent = onboardingStep === step.key;

              return (
                <div 
                  key={step.key} 
                  className={`flex items-center gap-3.5 transition-all duration-300 ${
                    isDone ? "text-neutral-100 font-medium" : "text-neutral-500"
                  }`}
                >
                  <div className="shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <div className={`w-5 h-5 rounded-full border ${
                        isCurrent ? "border-indigo-400 border-t-transparent animate-spin" : "border-neutral-700"
                      }`} />
                    )}
                  </div>
                  <span className="text-xs font-mono tracking-wide uppercase">{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Pulse progress line */}
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              className="bg-emerald-400 h-full"
              initial={{ width: "0%" }}
              animate={{ 
                width: `${((currentStepIndex + 1) / steps.length) * 100}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="auth-main-wrapper" className="min-h-screen bg-gray-50 flex flex-col items-center justify-center relative p-4 sm:p-6 overflow-hidden">
      
      {/* Background Subtle Clock Animation & Glass Circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] opacity-[0.06] pointer-events-none select-none">
        <div className="w-full h-full rounded-full border-[10px] border-dashed border-black/20 animate-[spin_120s_linear_infinite] flex items-center justify-center">
          <div className="w-[85%] h-[85%] rounded-full border-4 border-dashed border-black/10 animate-[spin_60s_linear_infinite_reverse] flex items-center justify-center">
            <div className="w-[50%] h-[50%] rounded-full border-2 border-black/15 flex items-center justify-center">
              <Clock className="w-12 h-12 text-black" />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Blur Backdrops */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Premium Glassmorphism Container */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/60 p-6 sm:p-8 rounded-3xl shadow-2xl relative">
        
        {/* Banner Title */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-950 text-white rounded-full text-[10px] font-mono uppercase tracking-wider font-bold mb-1">
            <Clock size={11} className="animate-pulse" />
            <span>TaskSync AI Workroom</span>
          </div>
          <h1 className="text-2xl font-mono tracking-tight font-black text-neutral-900 uppercase">
            {mode === "login" ? "Productivity Cockpit" : mode === "signup" ? "Create Workspace" : "Reset Portal"}
          </h1>
          <p className="text-xs text-gray-500 font-sans leading-relaxed">
            {mode === "login" ? "Unlock personalized schedules, document intelligence, & real-time focus mechanics." : 
             mode === "signup" ? "Fast-track onboarding with zero friction to immediately organize workflow." :
             "Verify your credentials and restore access immediately."}
          </p>
        </div>

        {/* Feedback Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3 bg-red-50 border border-red-150 rounded-xl text-xs text-red-600 flex items-start gap-2.5 mb-5 font-sans"
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed flex-1">{error}</span>
            </motion.div>
          )}

          {info && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl text-xs text-indigo-600 flex items-start gap-2.5 mb-5 font-sans"
            >
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed flex-1">{info}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OAuth Authentication Panel */}
        <div className="space-y-3">
          {/* PRIMARY CALL-TO-ACTION (Google Sign-In) */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleOAuth("google")}
            className="w-full bg-neutral-950 hover:bg-neutral-900 disabled:opacity-50 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-md shadow-black/5 hover:translate-y-[-1px] active:translate-y-0"
          >
            <Chrome size={16} className="text-emerald-400 shrink-0" />
            <span>Continue with Google</span>
          </button>

          {/* Secondary Providers */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleOAuth("github")}
              className="bg-white hover:bg-gray-50 border border-gray-200 disabled:opacity-50 text-gray-700 font-sans text-[11px] font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Github size={14} className="text-black shrink-0" />
              <span className="truncate">GitHub</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleOAuth("microsoft")}
              className="bg-white hover:bg-gray-50 border border-gray-200 disabled:opacity-50 text-gray-700 font-sans text-[11px] font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 23 23">
                <path fill="#f35325" d="M0 0h11v11H0z" />
                <path fill="#81bc06" d="M12 0h11v11H12z" />
                <path fill="#05a6f0" d="M0 12h11v11H0z" />
                <path fill="#ffba08" d="M12 12h11v11H12z" />
              </svg>
              <span className="truncate">Microsoft</span>
            </button>
          </div>

          {/* Guest Mode Option */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGuestLogin}
            className="w-full bg-indigo-50/50 hover:bg-indigo-100/50 border border-indigo-100 text-indigo-700 hover:text-indigo-900 font-sans text-[11px] font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <Sparkles size={13} className="text-indigo-500 shrink-0" />
            <span>Access Instant Guest Sandbox</span>
          </button>
        </div>

        {/* Custom Form Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-[1px] bg-gray-200" />
          <span className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest px-4">OR EMAIL</span>
          <div className="flex-1 h-[1px] bg-gray-200" />
        </div>

        {/* Email Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === "signup" && (
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wide block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nitesh Kumar"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 hover:border-gray-300 focus:border-black rounded-xl text-xs bg-white/50 focus:bg-white focus:outline-none transition-all font-sans"
                />
              </div>
            </div>
          )}

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wide block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 hover:border-gray-300 focus:border-black rounded-xl text-xs bg-white/50 focus:bg-white focus:outline-none transition-all font-sans"
              />
            </div>
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wide block">Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-[10px] font-mono font-bold text-indigo-600 hover:text-black cursor-pointer uppercase tracking-wider"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 hover:border-gray-300 focus:border-black rounded-xl text-xs bg-white/50 focus:bg-white focus:outline-none transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Password Strength Indicator for Sign Up */}
              {mode === "signup" && password && (
                <div className="pt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 uppercase">
                    <span>Complexity</span>
                    <span className="font-bold">{passwordStrength.text}</span>
                  </div>
                  <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 hover:bg-black disabled:opacity-50 text-white font-sans text-xs font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === "login" ? "Sign In to Cockpit" : mode === "signup" ? "Bootstrap AI Workspace" : "Send Reset Protocol"}
                </span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="text-center pt-6 border-t border-gray-100 mt-6 text-xs text-gray-500 font-sans">
          {mode === "login" ? (
            <>
              Don't have an account yet?{" "}
              <button
                onClick={() => setMode("signup")}
                className="font-bold text-neutral-900 hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </>
          ) : mode === "signup" ? (
            <>
              Already registered?{" "}
              <button
                onClick={() => setMode("login")}
                className="font-bold text-neutral-900 hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </>
          ) : (
            <button
              onClick={() => setMode("login")}
              className="font-bold text-neutral-900 hover:underline cursor-pointer"
            >
              Back to Sign In
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
