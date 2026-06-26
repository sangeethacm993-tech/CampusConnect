/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { User, Complaint, SystemStats, UserRole, ComplaintStatus } from "./types";
import Navbar from "./components/Navbar";
import StudentPortal from "./components/StudentPortal";
import StaffPortal from "./components/StaffPortal";
import AdminPortal from "./components/AdminPortal";
import { 
  Building, Shield, GraduationCap, Briefcase, Key, Mail, User as UserIcon, 
  Sparkles, Library, AlertCircle, CheckCircle, ArrowRight, EyeOff, Cpu, Activity, Bell, Lock
} from "lucide-react";

export default function App() {
  // Session authentication states
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Authentication screen states
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  
  // Login Form drafts
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Register Form drafts
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerDepartment, setRegisterDepartment] = useState("Computer Science");

  // Operational Lists and statistical states
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [adminStats, setAdminStats] = useState<SystemStats | null>(null);
  const [staffList, setStaffList] = useState<{ id: string; name: string; department: string; email: string }[]>([]);

  // Page interaction trackers
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  const departments = [
    "Computer Science",
    "Electronics & Communication",
    "Mechanical & Civil",
    "Estate & Maintenance",
    "Administration Office",
    "Student Welfare & Housing",
    "Business Management",
    "Anti Ragging Committee Head",
    "Women's Grievance Cell Coordinator",
    "Discipline Committee Head",
    "Discipline Committee Member",
    "Student Counseling Coordinator",
    "NSS Program Officer",
    "NCC Officer",
    "Cultural Coordinator",
    "Sports Coordinator",
    "Scholarship Coordinator"
  ];

  // Load token on startup
  useEffect(() => {
    const savedToken = localStorage.getItem("instiresolve_session_token");
    if (savedToken) {
      setToken(savedToken);
      fetchProfile(savedToken);
    } else {
      setIsInitializing(false);
    }
  }, []);

  // Fetch student/staff/admin complaints feed once user is validated
  useEffect(() => {
    if (user && token) {
      fetchComplaintsFeed();
      if (user.role === "admin") {
        fetchAdminDatabaseMetas();
      }
    }
  }, [user, token]);

  const fetchProfile = async (sessionToken: string) => {
    try {
      const res = await fetch("/api/auth/profile", {
        headers: {
          "Authorization": `Bearer ${sessionToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // stale session
        handleLogout();
      }
    } catch (e) {
      console.error("Diagnostic network profile fail:", e);
    } finally {
      setIsInitializing(false);
    }
  };

  const fetchComplaintsFeed = async () => {
    if (!token) return;
    setIsLoadingFeed(true);
    try {
      const res = await fetch("/api/complaints", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const list = await res.json();
        setComplaints(list);
      }
    } catch (error) {
      console.error("Failed to load complaints queue stream:", error);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const fetchAdminDatabaseMetas = async () => {
    if (!token) return;
    try {
      // 1. fetch statistics
      const statsRes = await fetch("/api/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const s = await statsRes.json();
        setAdminStats(s);
      }

      // 2. Fetch staff members
      const staffRes = await fetch("/api/staff", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (staffRes.ok) {
        const sl = await staffRes.json();
        setStaffList(sl);
      }
    } catch (e) {
      console.error("Failed to grab administrative structures payload:", e);
    }
  };

  // Auth Operations
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!email.trim() || !password) {
      setAuthError("Email coordinates and password details are required.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password, role: selectedRole })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication rejected.");
      }

      localStorage.setItem("instiresolve_session_token", data.token);
      setToken(data.token);
      setUser(data.user);
      setAuthSuccess(`Authorized! Welcome back as ${selectedRole}.`);
      setPassword("");
    } catch (err: any) {
      setAuthError(err.message || "An unexpected network disruption occurred.");
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (selectedRole === "admin") {
      setAuthError("For safety reasons, administrative accounts cannot be registered via public forms. Contact campus directory.");
      return;
    }

    if (!registerName.trim() || !registerEmail.trim() || !registerPassword) {
      setAuthError("All credentials are required to activate student/staff case-records.");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName.trim(),
          email: registerEmail.toLowerCase().trim(),
          password: registerPassword,
          role: selectedRole,
          department: registerDepartment
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration rejected.");
      }

      localStorage.setItem("instiresolve_session_token", data.token);
      setToken(data.token);
      setUser(data.user);
      setAuthSuccess(`Account customized successfully! Logged in as ${data.user.name}.`);
      
      // reset forms
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred during signup.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("instiresolve_session_token");
    setToken(null);
    setUser(null);
    setComplaints([]);
    setAdminStats(null);
    setStaffList([]);
    setAuthError(null);
    setAuthSuccess(null);
  };

  // Student Complaint Submissions dispatcher
  const handleStudentFormSubmit = async (form: {
    title: string;
    description: string;
    category: string;
    dueInDays: number;
    image: string | null;
    anonymous: boolean;
  }) => {
    if (!token) return;
    const res = await fetch("/api/complaints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to create dispute.");
    }
    // refresh complaint stream
    fetchComplaintsFeed();
  };

  // Student Rating feedback submission
  const handleStudentFeedbackSubmit = async (complaintId: string, feedback: { rating: number; comment: string }) => {
    if (!token) return;
    const res = await fetch(`/api/complaints/${complaintId}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(feedback)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to submit rating.");
    }
    // update state in real-time
    setComplaints(prev => prev.map(c => c.id === complaintId ? data : c));
  };

  // Staff Progress Notes Updates
  const handleStaffUpdateStatus = async (complaintId: string, status: ComplaintStatus, remarks: string, photo: string | null) => {
    if (!token) return;
    const res = await fetch(`/api/complaints/${complaintId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status, remarks, photo })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to append update remarks.");
    }
    // update local complaints state array
    setComplaints(prev => prev.map(c => c.id === complaintId ? data : c));
  };

  // Admin Allocations Action Dispatcher
  const handleAdminAssignStaff = async (complaintId: string, staffId: string) => {
    if (!token) return;
    const res = await fetch(`/api/complaints/${complaintId}/assign`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ staffId })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to dispatch staff.");
    }
    // update statistics and state arrays
    setComplaints(prev => prev.map(c => c.id === complaintId ? data : c));
    fetchAdminDatabaseMetas();
  };

  // Admin manually invoking Gemini analysis audit on demand
  const handleAdminTriggerAiReview = async (complaintId: string) => {
    if (!token) return;
    const res = await fetch(`/api/complaints/${complaintId}/ai-review`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "AI service not reachable.");
    }
    setComplaints(prev => prev.map(c => c.id === complaintId ? data : c));
    fetchAdminDatabaseMetas();
  };

  // Admin Direct Override
  const handleAdminDirectOverride = async (complaintId: string, status: ComplaintStatus, remarks: string) => {
    if (!token) return;
    const res = await fetch(`/api/complaints/${complaintId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status, remarks })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Override update failed.");
    }
    setComplaints(prev => prev.map(c => c.id === complaintId ? data : c));
    fetchAdminDatabaseMetas();
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400" id="initializing-screen">
        <div className="flex flex-col items-center gap-4">
          <Library className="w-10 h-10 text-indigo-600 animate-bounce" />
          <div className="text-sm font-semibold tracking-wide font-mono text-slate-900 uppercase">
            Loading CampusConnect Core...
          </div>
          <div className="w-24 bg-slate-200 h-1 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full w-1/3 animate-ping" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-slate-800" id="applet-viewport">
      {/* Dynamic Header */}
      <Navbar user={user} onLogout={handleLogout} />

      {user ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="authorized-app-frame">
          
          {user.role === "student" && (
            <StudentPortal
              complaints={complaints}
              onSubmitComplaint={handleStudentFormSubmit}
              onSubmitFeedback={handleStudentFeedbackSubmit}
            />
          )}

          {user.role === "staff" && (
            <StaffPortal
              complaints={complaints}
              onUpdateStatus={handleStaffUpdateStatus}
            />
          )}

          {user.role === "admin" && (
            <AdminPortal
              stats={adminStats}
              complaints={complaints}
              staffList={staffList}
              onAssignStaff={handleAdminAssignStaff}
              onTriggerAiReview={handleAdminTriggerAiReview}
              onAdminUpdateStatus={handleAdminDirectOverride}
              onRefreshStats={fetchAdminDatabaseMetas}
            />
          )}

        </main>
      ) : (
        /* Login Screen */
        <div className="flex-1 flex flex-col lg:flex-row min-h-screen text-slate-100 bg-[#0F172A]" id="unauthorized-app-gate">
          
          {/* Left Hero Graphic Section (45% Width on Desktop) */}
          <div className="w-full lg:w-[45%] bg-slate-950 flex flex-col justify-between p-8 sm:p-12 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/50">
            {/* Ambient visual backdrops & subtle glowing gradient blobs */}
            <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-violet-600/10 to-transparent pointer-events-none" />
            <div className="absolute -left-40 top-1/4 w-96 h-96 rounded-full bg-[#6D28D9]/15 blur-3xl animate-glow pointer-events-none" />
            <div className="absolute -right-40 bottom-1/4 w-120 h-120 rounded-full bg-[#8B5CF6]/10 blur-3xl animate-glow pointer-events-none" style={{ animationDelay: '-3s' }} />

            {/* Top Brand Logo */}
            <div className="flex items-center space-x-3 relative z-10">
              <div className="bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] p-2.5 rounded-xl shadow-lg shadow-violet-500/20 border border-violet-400/20">
                <Building className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-2xl tracking-normal text-white">
                CampusConnect
              </span>
            </div>

            {/* Central Titles & SVG Illustration */}
            <div className="space-y-6 my-auto relative z-10 py-10">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-mono font-medium text-violet-300">
                <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                Smart Complaint Tracking System
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                  CampusConnect
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] rounded-full" />
              </div>

              <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
                Every Voice Matters. Every Concern Counts. Connect in real-time, route tickets automatically, and trigger instant updates.
              </p>

              {/* Modern SVG Illustration - showing students networks, campus systems and AI categorization */}
              <div className="w-full h-52 flex items-center justify-center relative py-2" id="hero-illustration-svg">
                <svg viewBox="0 0 400 200" className="w-full max-w-sm h-full animate-float" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
                    </pattern>
                    <linearGradient id="glowOverlay" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <rect width="400" height="200" fill="url(#gridPattern)" rx="16" />

                  {/* Interconnected tracer paths */}
                  <path d="M 60 100 Q 130 30, 200 100 T 340 100" stroke="rgba(139, 92, 246, 0.25)" strokeWidth="2" strokeDasharray="5 5">
                    <animate attributeName="stroke-dashoffset" values="50;0" dur="4s" repeatCount="indefinite" />
                  </path>
                  <path d="M 60 100 Q 130 170, 200 100 T 340 100" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1.5">
                    <animate attributeName="stroke-dashoffset" values="0;50" dur="5s" repeatCount="indefinite" />
                  </path>

                  {/* Central Campus server hub */}
                  <g transform="translate(200, 100)">
                    <circle r="26" fill="url(#glowOverlay)" stroke="#8B5CF6" strokeWidth="1.5" className="animate-pulse" />
                    <rect x="-14" y="-14" width="28" height="28" rx="6" fill="#1E1B4B" stroke="#A78BFA" strokeWidth="1.5" />
                    <path d="M -6 -4 L 6 -4 M -6 1 L 6 1 M -6 6 L 2 6" stroke="#C084FC" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="6" cy="6" r="1.5" fill="#22C55E">
                      <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </g>

                  {/* Nodes for departments */}
                  <g transform="translate(80, 60)">
                    <circle r="16" fill="#0B0F19" stroke="#8B5CF6" strokeWidth="1.5" />
                    <text x="0" y="4" fontSize="10" textAnchor="middle" fill="#A78BFA">🔧</text>
                    <circle cx="10" cy="-10" r="5" fill="#22C55E" />
                    <text x="10" y="-8" fontSize="6" fontWeight="bold" textAnchor="middle" fill="white">✓</text>
                  </g>

                  <g transform="translate(320, 60)">
                    <circle r="16" fill="#0B0F19" stroke="#6366F1" strokeWidth="1.5" />
                    <text x="0" y="4" fontSize="10" textAnchor="middle" fill="#818CF8">🏠</text>
                  </g>

                  <g transform="translate(90, 140)">
                    <circle r="16" fill="#0B0F19" stroke="#4F46E5" strokeWidth="1.5" />
                    <text x="0" y="4" fontSize="10" textAnchor="middle">🎓</text>
                  </g>

                  <g transform="translate(310, 140)">
                    <circle r="16" fill="#1E1B4B" stroke="#A78BFA" strokeWidth="2" />
                    <text x="0" y="4" fontSize="10" textAnchor="middle">✨</text>
                    <circle cx="0" cy="0" r="16" fill="none" stroke="#C084FC" strokeWidth="1" opacity="0.4">
                      <animate attributeName="r" values="16;22;16" dur="3.5s" repeatCount="indefinite" />
                    </circle>
                  </g>

                  {/* Label annotations */}
                  <text x="80" y="90" fontSize="8" fontWeight="bold" fill="#64748B" textAnchor="middle">Facilities</text>
                  <text x="320" y="90" fontSize="8" fontWeight="bold" fill="#64748B" textAnchor="middle">Hostels</text>
                  <text x="90" y="170" fontSize="8" fontWeight="bold" fill="#64748B" textAnchor="middle">Academic</text>
                  <text x="310" y="170" fontSize="8" fontWeight="bold" fill="#64748B" textAnchor="middle">Grievance AI</text>
                </svg>
              </div>

              {/* Responsive Feature Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3" id="feature-cards-grid">
                <div className="p-3 bg-white/5 border border-white/8 rounded-xl flex items-center gap-2.5 hover:bg-white/10 transition-all duration-300">
                  <div className="p-1.5 bg-violet-500/20 rounded-lg text-violet-300">
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">Anonymous Reporting</span>
                </div>
                
                <div className="p-3 bg-white/5 border border-white/8 rounded-xl flex items-center gap-2.5 hover:bg-white/10 transition-all duration-300">
                  <div className="p-1.5 bg-sky-500/20 rounded-lg text-sky-300">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">AI Complaint Sort</span>
                </div>

                <div className="p-3 bg-white/5 border border-white/8 rounded-xl flex items-center gap-2.5 hover:bg-white/10 transition-all duration-300">
                  <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">Real-time Tracking</span>
                </div>

                <div className="p-3 bg-white/5 border border-white/8 rounded-xl flex items-center gap-2.5 hover:bg-white/10 transition-all duration-300">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-300">
                    <Building className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">Dept-wise Resolution</span>
                </div>

                <div className="p-3 bg-white/5 border border-white/8 rounded-xl flex items-center gap-2.5 hover:bg-white/10 transition-all duration-300">
                  <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-300">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">Secure Student/Staff Portal</span>
                </div>

                <div className="p-3 bg-white/5 border border-white/8 rounded-xl flex items-center gap-2.5 hover:bg-white/10 transition-all duration-300">
                  <div className="p-1.5 bg-rose-500/20 rounded-lg text-rose-350">
                    <Bell className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">Instant Notifications</span>
                </div>
              </div>
            </div>

            {/* Bottom Footer block */}
            <div className="border-t border-slate-800/60 pt-6 mt-6 flex items-center justify-between text-xs text-slate-500 relative z-10 font-mono">
              <span>Verified Ledger</span>
              <span>© {new Date().getFullYear()} CampusConnect</span>
            </div>
          </div>

          {/* Right Form Auth controls (55% Width on Desktop) */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12 relative bg-[#F8FAFC] lg:w-[55%]">
            <div className="w-full max-w-lg glass-panel p-8 sm:p-10 rounded-[24px] border border-white shadow-2xl shadow-slate-200/60 relative z-10 space-y-7 transition-all duration-300 hover:shadow-violet-200/40">
              
              {/* Heading Title Block */}
              <div className="space-y-2 text-center">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {authMode === "login" ? "Sign in to CampusConnect" : "Register on CampusConnect"}
                </h1>
                <p className="text-sm text-slate-500">
                  {authMode === "login" 
                    ? "Access your campus complaint management portal securely." 
                    : "Configure credentials to activate your student or staff account."}
                </p>
              </div>

              {/* Role toggles mapped with Emojis as requested */}
              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest text-center sm:text-left">
                  SELECT DESIGNATED ROLE
                </label>
                <div className="grid grid-cols-3 gap-3" id="role-auth-selector">
                  <button
                    type="button"
                    onClick={() => { setSelectedRole("student"); setAuthError(null); }}
                    className={`py-3.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-2 border-2 ${
                      selectedRole === "student"
                        ? "border-[#6D28D9] bg-violet-50 text-[#6D28D9] scale-102 shadow-xs"
                        : "border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    id="role-select-student"
                  >
                    <span className="text-xl">🎓</span>
                    <span>Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedRole("staff"); setAuthError(null); }}
                    className={`py-3.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-2 border-2 ${
                      selectedRole === "staff"
                        ? "border-[#6D28D9] bg-violet-50 text-[#6D28D9] scale-102 shadow-xs"
                        : "border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    id="role-select-staff"
                  >
                    <span className="text-xl">👨‍🏫</span>
                    <span>Staff Member</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedRole("admin"); setAuthError(null); }}
                    className={`py-3.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-2 border-2 ${
                      selectedRole === "admin"
                        ? "border-[#6D28D9] bg-violet-50 text-[#6D28D9] scale-102 shadow-xs"
                        : "border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    id="role-select-admin"
                  >
                    <span className="text-xl">🛡️</span>
                    <span>Administrator</span>
                  </button>
                </div>
              </div>

              {/* Seeded Testing Credentials helpful helper */}
              <div className="p-3.5 bg-violet-50/50 border border-violet-100 rounded-xl text-xs space-y-1" id="credentials-seeder-badge">
                <div className="font-mono font-bold text-[#6D28D9] uppercase tracking-wide flex items-center gap-1.5 mb-1 bg-violet-100/50 w-fit px-2 py-0.5 rounded">
                  <Key className="w-3.5 h-3.5" />
                  Testing Credentials
                </div>
                {selectedRole === "student" && (
                  <p className="text-slate-600">
                    Use <strong className="text-slate-800 font-mono select-all">amit.patel@student.edu</strong> with password: <strong className="text-slate-850 font-mono select-all">password123</strong>
                  </p>
                )}
                {selectedRole === "staff" && (
                  <p className="text-slate-600">
                    Use <strong className="text-slate-800 font-mono select-all">maintenance@campus.edu</strong> with password: <strong className="text-slate-850 font-mono select-all">password123</strong>
                  </p>
                )}
                {selectedRole === "admin" && (
                  <p className="text-slate-600">
                    Use <strong className="text-slate-800 font-mono select-all">admin@campus.edu</strong> with password: <strong className="text-slate-850 font-mono select-all">secure_admin_password</strong>
                  </p>
                )}
              </div>

              {/* Error/Success Notifications */}
              {authError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100/80 text-rose-700 rounded-xl text-xs flex items-start gap-2" id="auth-error-banner">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="font-semibold">{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100/80 text-emerald-700 rounded-xl text-xs flex items-start gap-2" id="auth-success-banner">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-semibold">{authSuccess}</span>
                </div>
              )}

              {/* Form elements switcher */}
              {authMode === "login" ? (
                <form onSubmit={handleLoginSubmit} className="space-y-5" id="login-form-element">
                  
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Campus Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                        <Mail className="w-4.5 h-4.5" />
                      </span>
                      <input
                        type="email"
                        placeholder="username@student.edu"
                        value={email}
                        required
                        id="login-email-input"
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 focus:border-[#6D28D9] focus:ring-2 focus:ring-[#8B5CF6]/15 outline-none text-sm text-slate-800 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Password Key
                      </label>
                    </span>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                        <Lock className="w-4.5 h-4.5" />
                      </span>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        required
                        id="login-password-input"
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 focus:border-[#6D28D9] focus:ring-2 focus:ring-[#8B5CF6]/15 outline-none text-sm text-slate-800 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-login-submit"
                    className="w-full py-3.5 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] hover:from-[#5B21B6] hover:to-[#7C3AED] text-white font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-violet-600/10 hover:shadow-lg hover:shadow-violet-600/20 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </button>

                  {/* registration helper switch */}
                  {selectedRole !== "admin" && (
                    <p className="text-xs text-center text-slate-400 pt-2 font-medium">
                      New to CampusConnect?{" "}
                      <button
                        type="button"
                        id="btn-auth-switch-register"
                        onClick={() => { setAuthMode("register"); setAuthError(null); }}
                        className="text-[#6D28D9] font-bold hover:underline"
                      >
                        Register New Account
                      </button>
                    </p>
                  )}

                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4" id="register-form-element">
                  
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                        <UserIcon className="w-4.5 h-4.5" />
                      </span>
                      <input
                        type="text"
                        placeholder="e.g., Amit Patel"
                        value={registerName}
                        required
                        id="register-name-input"
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 focus:border-[#6D28D9] focus:ring-2 focus:ring-[#8B5CF6]/15 outline-none text-sm text-slate-800 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Institutional Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                        <Mail className="w-4.5 h-4.5" />
                      </span>
                      <input
                        type="email"
                        placeholder="username@student.edu"
                        value={registerEmail}
                        required
                        id="register-email-input"
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 focus:border-[#6D28D9] focus:ring-2 focus:ring-[#8B5CF6]/15 outline-none text-sm text-slate-800 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Campus Faculty / Department
                    </label>
                    <div className="relative">
                      <select
                        value={registerDepartment}
                        id="register-dept-select"
                        onChange={(e) => setRegisterDepartment(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#6D28D9] focus:ring-2 focus:ring-[#8B5CF6]/15 text-slate-700 font-medium transition-all appearance-none cursor-pointer"
                      >
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      <span className="absolute inset-y-0 right-4 flex items-center text-slate-400 pointer-events-none text-xs">▼</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Nominate Account Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                        <Lock className="w-4.5 h-4.5" />
                      </span>
                      <input
                        type="password"
                        placeholder="Minimum 6 secure characters..."
                        value={registerPassword}
                        minLength={6}
                        required
                        id="register-password-input"
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 focus:border-[#6D28D9] focus:ring-2 focus:ring-[#8B5CF6]/15 outline-none text-sm text-slate-800 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-register-submit"
                    className="w-full py-3.5 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] hover:from-[#5B21B6] hover:to-[#7C3AED] text-white font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-violet-600/10 hover:shadow-lg hover:shadow-violet-600/20 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                  >
                    <span>Register New Account</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </button>

                  <p className="text-xs text-center text-slate-400 pt-2 font-medium">
                    Already registered?{" "}
                    <button
                      type="button"
                      id="btn-auth-switch-login"
                      onClick={() => { setAuthMode("login"); setAuthError(null); }}
                      className="text-[#6D28D9] font-bold hover:underline"
                    >
                      Retrieve Existing Login
                    </button>
                  </p>

                </form>
              )}

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
