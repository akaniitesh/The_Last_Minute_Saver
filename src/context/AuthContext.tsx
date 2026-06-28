import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  googleProvider,
  githubProvider,
  microsoftProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  FirebaseUser
} from "../lib/firebase";

export type OnboardingStep = 
  | "idle"
  | "account_connected"
  | "calendar_connected"
  | "ai_workspace_created"
  | "ready_to_plan"
  | "completed";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  onboardingStep: OnboardingStep;
  startOnboardingAnimation: (callback: () => void) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("idle");

  useEffect(() => {
    // Check if guest was active previously
    const savedGuest = localStorage.getItem("auth_guest_user");
    if (savedGuest) {
      setUser(JSON.parse(savedGuest));
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const startOnboardingAnimation = (callback: () => void) => {
    setOnboardingStep("account_connected");
    
    setTimeout(() => {
      setOnboardingStep("calendar_connected");
      
      setTimeout(() => {
        setOnboardingStep("ai_workspace_created");
        
        setTimeout(() => {
          setOnboardingStep("ready_to_plan");
          
          setTimeout(() => {
            setOnboardingStep("completed");
            callback();
          }, 1200);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google login failed", error);
      setLoading(false);
      throw error;
    }
  };

  const loginWithGithub = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (error) {
      console.error("GitHub login failed", error);
      setLoading(false);
      throw error;
    }
  };

  const loginWithMicrosoft = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, microsoftProvider);
    } catch (error) {
      console.error("Microsoft login failed", error);
      setLoading(false);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Email login failed", error);
      setLoading(false);
      throw error;
    }
  };

  const signUpWithEmail = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update profile with Display Name
      await updateProfile(userCredential.user, { displayName: name });
      // Send email verification
      await sendEmailVerification(userCredential.user);
    } catch (error) {
      console.error("Email sign up failed", error);
      setLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password reset failed", error);
      throw error;
    }
  };

  const loginAsGuest = () => {
    const guestUser = {
      uid: "guest-user-session",
      displayName: "Guest Commander",
      email: "guest@tasksync.local",
      photoURL: null,
      emailVerified: true
    };
    localStorage.setItem("auth_guest_user", JSON.stringify(guestUser));
    setUser(guestUser as any);
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem("auth_guest_user");
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        onboardingStep,
        startOnboardingAnimation,
        loginWithGoogle,
        loginWithGithub,
        loginWithMicrosoft,
        loginWithEmail,
        signUpWithEmail,
        resetPassword,
        loginAsGuest,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
