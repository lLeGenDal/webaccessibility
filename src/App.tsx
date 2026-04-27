import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, User, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, db, OperationType, handleFirestoreError } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy } from "firebase/firestore";
import { LayoutDashboard, Globe, ClipboardCheck, Settings, LogOut, LogIn, Menu, X, Plus, ChevronRight, AlertCircle, CheckCircle2, Info, GitCompare, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";

// Types
import { Site, Audit, Issue, UserProfile } from "./types";

// Components
import Dashboard from "./components/Dashboard";
import SiteList from "./components/SiteList";
import AuditForm from "./components/AuditForm";
import AuditResults from "./components/AuditResults";
import AuditCompare from "./components/AuditCompare";
import ManualReview from "./components/ManualReview";

import AuditList from "./components/AuditList";
import Methodology from "./components/Methodology";
import { migrateFromFirebase } from "./services/migrationService";

// Auth Context
export const MOCK_AUTH = false; // Set to false to enable real Firebase Auth

interface AuthContextType {
  user: User | null | any;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (MOCK_AUTH) {
      const mockUser = {
        uid: "mock-user-123",
        email: "demo@qazaqaccess.kz",
        displayName: "Демо Пользователь",
        photoURL: null,
      };
      const mockProfile: UserProfile = {
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName,
        role: "admin",
      };
      setUser(mockUser as any);
      setProfile(mockProfile);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "",
            role: "user",
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    if (MOCK_AUTH) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    if (MOCK_AUTH) {
      alert("В демо-режиме выход отключен");
      return;
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Error Boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Что-то пошло не так</h1>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || "Произошла непредвиденная ошибка."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Перезагрузить приложение
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const NavItem = ({ to, icon: Icon, label, active }: { to: string; icon: any; label: string; active?: boolean }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative",
      active 
        ? "nav-item-active text-white" 
        : "text-[#A6AFC9] hover:bg-[#232A42] hover:text-white"
    )}
  >
    {active && (
      <motion.div 
        layoutId="nav-glow"
        className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-2xl -z-10"
      />
    )}
    <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", active ? "text-indigo-400" : "text-[#707AA1] group-hover:text-indigo-300")} />
    <span className="text-sm font-medium tracking-wide">{label}</span>
  </Link>
);

const Sidebar = () => {
  const location = useLocation();
  const { logout, profile } = useAuth();

  return (
    <aside className="w-72 glass-sidebar flex flex-col h-screen sticky top-0 overflow-hidden">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
            <Globe className="text-white w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-white leading-tight">Qazaq<span className="text-indigo-400">Access</span></span>
            {MOCK_AUTH && <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Core v2.0</span>}
          </div>
        </div>

        <nav className="space-y-2">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === "/"} />
          <NavItem to="/sites" icon={Globe} label="Organizations" active={location.pathname === "/sites"} />
          <NavItem to="/audits" icon={BarChart3} label="Audit Logs" active={location.pathname === "/audits"} />
          <NavItem to="/audit/new" icon={ClipboardCheck} label="Start Audit" active={location.pathname === "/audit/new"} />
          <NavItem to="/compare" icon={GitCompare} label="Compare Results" active={location.pathname === "/compare"} />
          <NavItem to="/settings" icon={Settings} label="System Config" active={location.pathname === "/settings"} />
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-[#22293F]">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-75 blur group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative w-10 h-10 rounded-full bg-[#161B31] flex items-center justify-center text-indigo-400 font-bold border border-[#2D3558]">
              {profile?.displayName?.charAt(0) || "U"}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{profile?.displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-xs text-[#707AA1] font-medium uppercase tracking-wider">{profile?.role}</p>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-5 py-4 text-[#707AA1] hover:bg-[#EE4444]/10 hover:text-[#EE4444] rounded-2xl transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

const MainContent = () => {
  const { user, loading, login } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      migrateFromFirebase(user.uid);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D111D]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full" />
          </div>
          <p className="text-indigo-400 text-sm font-bold uppercase tracking-[0.3em] animate-pulse">Initializing System</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D111D] p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-card p-12 text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.3)] mx-auto mb-10 overflow-hidden relative group">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Globe className="text-white w-12 h-12" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Qazaq<span className="text-indigo-400">Access</span></h1>
          <p className="text-[#707AA1] mb-12 leading-relaxed font-medium">
            Next-gen accessibility audit platform for Kazakhstani digital ecosystem. 
            Automated WCAG 2.2 analysis & reporting.
          </p>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all duration-300 shadow-[0_5px_20px_rgba(79,70,229,0.3)] active:scale-95 group"
          >
            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            Continue with Google
          </button>
          <div className="mt-12 flex items-center justify-center gap-2">
            <span className="w-8 h-px bg-[#22293F]"></span>
            <span className="text-[10px] text-[#4F5A85] uppercase tracking-[0.4em] font-black">Secure Entry</span>
            <span className="w-8 h-px bg-[#22293F]"></span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0D111D]">
      <Sidebar />
      <main className="flex-1 p-10 h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sites" element={<SiteList />} />
            <Route path="/audits" element={<AuditList />} />
            <Route path="/audit/new" element={<AuditForm />} />
            <Route path="/audit/:id" element={<AuditResults />} />
            <Route path="/audit/:auditId/manual" element={<ManualReview />} />
            <Route path="/compare" element={<AuditCompare />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="/settings" element={<div className="glass-card p-10 text-center text-[#707AA1] font-bold uppercase tracking-widest">Configuration module encrypted</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
};


export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <MainContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
