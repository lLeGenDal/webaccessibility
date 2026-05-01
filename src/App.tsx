import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Globe, ClipboardCheck, Settings, LogOut, LogIn, Menu, X, Plus, ChevronRight, AlertCircle, CheckCircle2, Info, GitCompare, BarChart3, UserPlus, Shield } from "lucide-react";
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

// Auth
import { authService } from "./services/authService";

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const userData = await authService.getMe();
      if (userData) {
        setUser(userData);
        setProfile({
          uid: userData.id,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role
        });
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    setProfile({
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName,
        role: data.user.role
    });
  };

  const register = async (email: string, password: string, displayName: string) => {
    const data = await authService.register(email, password, displayName);
    setUser(data.user);
    setProfile({
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName,
        role: data.user.role
    });
  };

  const logout = async () => {
    authService.logout();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout }}>
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

const LoginForm = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D111D] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card p-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.3)] mb-6">
            <Shield className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Qazaq<span className="text-indigo-400">Access</span>
          </h1>
          <p className="text-[#707AA1] mt-2 text-sm font-medium">Neural Compliance Infrastructure</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#5C6689] uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#161B31] border border-[#2D3558] text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#5C6689] uppercase tracking-widest ml-1">Email Protocol</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#161B31] border border-[#2D3558] text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:border-indigo-500 transition-all font-medium"
              placeholder="access@domain.kz"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#5C6689] uppercase tracking-widest ml-1">Security Key</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#161B31] border border-[#2D3558] text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:border-indigo-500 transition-all font-medium"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-[0_5px_20px_rgba(79,70,229,0.3)] active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isRegister ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                {isRegister ? "Initialize Account" : "Access Console"}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center px-4">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs font-bold text-[#707AA1] hover:text-indigo-400 transition-colors uppercase tracking-widest"
          >
            {isRegister ? "Already Have Access? Log In" : "Need New Clearance? Register"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const MainContent = () => {
  const { user, loading } = useAuth();

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
    return <LoginForm />;
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
