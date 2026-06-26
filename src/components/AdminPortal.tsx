/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Complaint, SystemStats, ComplaintStatus, ComplaintUrgency, User } from "../types";
import { 
  Building, Shield, Activity, Users, FileCheck, CheckCircle2, AlertTriangle, 
  Search, UserPlus, Sparkles, ChevronDown, ChevronUp, Image, Star, RefreshCw, BarChart3, Clock, Calendar
} from "lucide-react";

interface AdminPortalProps {
  stats: SystemStats | null;
  complaints: Complaint[];
  staffList: { id: string; name: string; department: string; email: string }[];
  onAssignStaff: (complaintId: string, staffId: string) => Promise<void>;
  onTriggerAiReview: (complaintId: string) => Promise<void>;
  onAdminUpdateStatus: (complaintId: string, status: ComplaintStatus, remarks: string) => Promise<void>;
  onRefreshStats: () => void;
}

export default function AdminPortal({
  stats,
  complaints,
  staffList,
  onAssignStaff,
  onTriggerAiReview,
  onAdminUpdateStatus,
  onRefreshStats,
}: AdminPortalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  // Allocation/remarks states per complaint card
  const [allotStaffId, setAllotStaffId] = useState<{ [id: string]: string }>({});
  const [remarksInput, setRemarksInput] = useState<{ [id: string]: string }>({});
  const [isAllotting, setIsAllotting] = useState<{ [id: string]: boolean }>({});
  const [isReviewing, setIsReviewing] = useState<{ [id: string]: boolean }>({});

  const categories = [
    "Facilities", 
    "Academic Office", 
    "Information Technology", 
    "Estate & Maintenance", 
    "Student Housing", 
    "Other"
  ];

  // Allocation triggers
  const handleAllotAction = async (complaintId: string) => {
    const staffId = allotStaffId[complaintId];
    if (!staffId) {
      alert("Please select a valid coordinator from the list of registered campus staff.");
      return;
    }
    setIsAllotting(prev => ({ ...prev, [complaintId]: true }));
    try {
      await onAssignStaff(complaintId, staffId);
      alert(`Ticket assigned successfully! Handed over to selected staff operator.`);
    } catch (err: any) {
      alert(err.message || "Failed to assign staff.");
    } finally {
      setIsAllotting(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  // AI manual trigger
  const handleAiTriggerAction = async (complaintId: string) => {
    setIsReviewing(prev => ({ ...prev, [complaintId]: true }));
    try {
      await onTriggerAiReview(complaintId);
      alert("Completed! Gemini has completed re-evaluation of this campus complaint.");
    } catch (err: any) {
      alert(err.message || "Failed to trigger AI re-evaluation.");
    } finally {
      setIsReviewing(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  const handleAdminUpdateStatusAction = async (complaintId: string, statusInput: ComplaintStatus) => {
    const r = remarksInput[complaintId] || "";
    if (!r.trim()) {
      alert("Admin remarks explaining the state transition are required for audited state tracking.");
      return;
    }
    try {
      await onAdminUpdateStatus(complaintId, statusInput, r.trim());
      setRemarksInput(prev => ({ ...prev, [complaintId]: "" }));
      alert("Status updated successfully by admin override.");
    } catch (err: any) {
      alert(err.message || "Status update failed.");
    }
  };

  // Search filter matching
  let filteredList = complaints.filter((c) => {
    // Search constraints
    const matchSearch = 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.anonymousId && c.anonymousId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (!c.anonymous && c.studentName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Dropdown filters
    const matchCategory = categoryFilter === "all" || c.category === categoryFilter;
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchUrgency = urgencyFilter === "all" || c.urgency === urgencyFilter;

    return matchSearch && matchCategory && matchStatus && matchUrgency;
  });

  const getStatusIndicator = (status: ComplaintStatus) => {
    switch (status) {
      case "pending":
        return <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono border border-amber-200">Pending</span>;
      case "in-progress":
        return <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono border border-sky-200">In Operations</span>;
      case "resolved":
        return <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono border border-emerald-200">Resolved</span>;
    }
  };

  const getUrgencyIndicator = (urgency: ComplaintUrgency) => {
    switch (urgency) {
      case "high":
        return <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 border border-rose-100 rounded font-bold uppercase tracking-wider font-mono">High Priority</span>;
      case "medium":
        return <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 border border-amber-100 rounded font-bold uppercase tracking-wider font-mono">Medium</span>;
      default:
        return <span className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 border border-slate-100 rounded font-bold uppercase tracking-wider font-mono">Low</span>;
    }
  };

  return (
    <div className="space-y-8" id="admin-portal-root">
      
      {/* Top Title Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl shadow-xs">
            <Shield className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              Supervisorial Dashboard Override
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Admin clearance level. Track live queue resolution speeds and dispatch staff.
            </p>
          </div>
        </div>
        <button
          onClick={onRefreshStats}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Synchronize Stats
        </button>
      </div>

      {/* Dynamic numerical statistical decks */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="admin-stats-deck">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Cumulative Queue
            </span>
            <div className="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">
              {stats.total}
            </div>
            <div className="text-[10px] text-slate-400">Total tickets registered</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Active Pending
            </span>
            <div className="text-2xl font-extrabold text-amber-600 tracking-tight font-sans">
              {stats.pending}
            </div>
            <div className="text-[10px] text-slate-400">Unallocated reviews</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Resolution Rate
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight font-sans">
              {stats.total > 0 ? `${Math.round((stats.resolved / stats.total) * 100)}%` : "100%"}
            </div>
            <div className="text-[10px] text-slate-400">Cleared {stats.resolved} of {stats.total}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Satisfaction Score
            </span>
            <div className="text-2xl font-extrabold text-indigo-700 tracking-tight font-sans flex items-center gap-1">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400 shrink-0" />
              {stats.avgRating} <span className="text-xs text-slate-400">/ 5.0</span>
            </div>
            <div className="text-[10px] text-slate-400">Quality evaluation metric</div>
          </div>
        </div>
      )}

      {/* Vector Visualization charts */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="admin-charts-grid">
          {/* Bar Chart representing Complaint distribution across Categories */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5 mb-4 border-b border-slate-50 pb-2">
              <BarChart3 className="w-4 h-4 text-slate-500" />
              Disputes Folder Classification Distribution
            </h3>

            <div className="space-y-3.5">
              {Object.keys(stats.categories).length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center italic">No folder items yet logged.</div>
              ) : (
                Object.entries(stats.categories).map(([cat, count]) => {
                  const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">{cat}</span>
                        <span className="font-mono text-slate-400 font-bold">{count} ({Math.round(percent)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SVG representation for priority distributions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5 mb-4 border-b border-slate-50 pb-2">
              <Activity className="w-4 h-4 text-slate-500" />
              Priority Severity Mix Analytics
            </h3>

            <div className="flex items-center justify-around py-2 gap-4">
              <div className="flex flex-col items-center">
                <div className="text-xs font-mono font-bold text-rose-650 bg-rose-50 border border-rose-150 px-3 py-1.5 rounded-xl text-center">
                  <span className="block text-2xl font-extrabold">{stats.urgency.high}</span>
                  High Severities
                </div>
                <span className="text-[10px] text-slate-400 mt-1">24H SLAs</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-xs font-mono font-bold text-amber-650 bg-amber-50 border border-amber-150 px-3 py-1.5 rounded-xl text-center">
                  <span className="block text-2xl font-extrabold">{stats.urgency.medium}</span>
                  Moderate Issues
                </div>
                <span className="text-[10px] text-slate-400 mt-1">48H SLAs</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-xs font-mono font-bold text-slate-650 bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl text-center">
                  <span className="block text-2xl font-extrabold">{stats.urgency.low}</span>
                  Standard Lows
                </div>
                <span className="text-[10px] text-slate-400 mt-1">72H SLAs</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2.5 text-xs text-slate-500">
              <Clock className="w-4.5 h-4.5 text-indigo-500" />
              <span>Historical average resolution time across the campus: <strong>{stats.avgResolutionTimeHours} Hours</strong>.</span>
            </div>
          </div>
        </div>
      )}

      {/* Database Queue Operations Tracker with filters */}
      <div className="bg-white rounded-2xl border border-slate-100" id="admin-operations-tracker">
        
        {/* Tracker Toolbar Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-bold text-base text-slate-800 tracking-tight">
              Institutional Complaint Dispatch System
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Filtered matches: <strong>{filteredList.length}</strong> of {complaints.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative md:col-span-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search ticket ID, title, description or student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-250 focus:border-slate-800 outline-hidden rounded-xl text-xs"
                id="search-admin-operations"
              />
            </div>

            {/* Folder Select */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-slate-250 bg-white rounded-xl text-xs outline-hidden focus:border-slate-800"
              id="category-admin-filter"
            >
              <option value="all">All Folders</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-250 bg-white rounded-xl text-xs outline-hidden focus:border-slate-800"
              id="status-admin-filter"
            >
              <option value="all">All States</option>
              <option value="pending">Pending Review</option>
              <option value="in-progress">In Operations</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Complaints Accordion rows */}
        <div className="divide-y divide-slate-100" id="admin-complaints-list">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic text-xs">
              No matching records conform to the active search filters. Try loosening parameters.
            </div>
          ) : (
            filteredList.map((comp) => {
              const isExpanded = expandedId === comp.id;

              return (
                <div key={comp.id} className={`transition-all ${isExpanded ? "bg-slate-50/25" : ""}`} id={`admin-row-complaint-${comp.id}`}>
                  
                  {/* Summary row */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : comp.id)}
                    className="p-5 flex items-start gap-4 cursor-pointer hover:bg-slate-50/30 transition-all select-none"
                  >
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {comp.anonymous ? (
                          <span className="font-mono text-[9px] uppercase font-bold text-violet-700 bg-violet-50 border border-violet-100 px-1.5 py-0.2 rounded flex items-center gap-0.5 shrink-0">
                            <span className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                            ANONYMOUS TICKET: {comp.anonymousId}
                          </span>
                        ) : (
                          <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                            ID: {comp.id}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-600 bg-stone-150 px-2 py-0.2 rounded-sm max-w-[120px] truncate">
                          {comp.category}
                        </span>
                        {getUrgencyIndicator(comp.urgency)}
                        {getStatusIndicator(comp.status)}
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm leading-tight tracking-tight">
                        {comp.title}
                      </h4>

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400 font-mono">
                        <span>Lodge: <strong className={comp.anonymous ? "text-violet-600 font-bold bg-violet-50 px-1 py-0.1 rounded" : "text-slate-600"}>{comp.studentName}</strong></span>
                        {!comp.anonymous && (
                          <span>Dept: <strong className="text-slate-600 font-semibold">{comp.studentDepartment}</strong></span>
                        )}
                        <span>Assignee: <strong className="text-slate-600">{comp.assignedStaffName || "UNALLOCATED"}</strong></span>
                        <span>Lodged: {new Date(comp.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="text-slate-400 shrink-0 p-1 bg-slate-100 rounded-lg">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Operational control workspace */}
                  {isExpanded && (
                    <div className="px-5 pb-6 pt-2 bg-slate-50/50 rounded-b-xl border-t border-slate-50 space-y-5">
                      
                      {/* Description Narrative details */}
                      <div>
                        <span className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Complainant Narrative
                        </span>
                        <p className="text-xs p-3.5 bg-white border border-slate-100 rounded-lg text-slate-700 leading-relaxed font-sans shadow-2xs">
                          {comp.description}
                        </p>
                      </div>

                      {/* Photo attached of the issues */}
                      {comp.image && (
                        <div>
                          <span className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Attached Photo Evidence
                          </span>
                          <a href={comp.image} target="_blank" rel="noreferrer" className="inline-block group">
                            <img
                              src={comp.image}
                              alt="Complaint proof"
                              className="max-h-36 rounded-lg object-contain border border-slate-150 group-hover:opacity-95 transition-all shadow-3xs"
                              referrerPolicy="no-referrer"
                            />
                          </a>
                        </div>
                      )}

                      {/* Gemini Assistant Panel with Trigger override */}
                      <div className="bg-gradient-to-tr from-indigo-50/70 to-violet-50/70 border border-indigo-150/60 p-4 rounded-xl space-y-3 shadow-3xs">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-violet-700 uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                            Gemini AI Intelligent Decision Brief
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleAiTriggerAction(comp.id)}
                            disabled={isReviewing[comp.id]}
                            className="bg-white/80 hover:bg-white text-violet-700 border border-indigo-200 hover:border-indigo-300 font-semibold text-[10px] px-2.5 py-1 rounded-md transition-colors flex items-center justify-center gap-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${isReviewing[comp.id] ? "animate-spin" : ""}`} />
                            {isReviewing[comp.id] ? "Evaluating..." : "Manual AI Re-Review"}
                          </button>
                        </div>

                        {comp.aiSummary ? (
                          <div className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
                            <p>
                              <strong className="text-slate-700">Concise Core Issue:</strong> {comp.aiSummary}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] font-mono">
                              <span>Folder Suggestion: <strong className="text-indigo-700 font-bold bg-white px-2 py-0.5 border border-indigo-100 rounded">{comp.aiCategorySuggestion}</strong></span>
                              <span>Severity Recommendation: <strong className="text-rose-700 font-bold bg-white px-2 py-0.5 border border-rose-100 rounded capitalize">{comp.aiUrgencyRating}</strong></span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-violet-400 italic leading-none">
                            AI assist isn't populated or key is unconfigured. Select a manual override above to synthesize.
                          </p>
                        )}
                      </div>

                      {/* Historic update timeline logs */}
                      {comp.updates.length > 0 && (
                        <div className="space-y-2">
                          <span className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                            Audited Operational Updates Timeline
                          </span>
                          <div className="space-y-3.5 relative pl-3.5 border-l border-slate-200 font-sans">
                            {comp.updates.map((up) => (
                              <div key={up.id} className="text-xs relative">
                                <div className="absolute -left-[19.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-350 border border-white" />
                                <div className="font-semibold text-slate-700">
                                  {up.updaterName} 
                                  <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-1 rounded-sm ml-1 capitalize">{up.updaterRole}</span>
                                  <span className="text-slate-400 font-mono text-[10px] ml-2">{new Date(up.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-slate-500 mt-0.5 italic">&ldquo;{up.remarks}&rdquo;</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* STUDENT FEEDBACK RATINGS IF APPLIED */}
                      {comp.feedback && (
                        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1">
                          <span className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                            Student Resolution Feedback Review
                          </span>
                          <div className="flex items-center gap-1 text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < (comp.feedback?.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                            ))}
                            <span className="text-slate-400 font-mono text-xs ml-1 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.2">{comp.feedback.rating} / 5 Stars</span>
                          </div>
                          <p className="text-xs text-slate-600 italic">
                            &ldquo;{comp.feedback.comment}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* DUAL ACTION OPTIONS FOR DISPATCH OR MANUAL OVERRIDES */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1.5">
                        
                        {/* Dispatch Allocator */}
                        <div className="bg-white p-4.5 rounded-xl border border-slate-150 space-y-3.5">
                          <div>
                            <span className="font-bold text-xs text-slate-800 tracking-tight block">
                              Allocate Case Operator (Dispatch)
                            </span>
                            <span className="text-[10px] text-slate-400">Dispatch the complaint ticket tracking to standard staff pipeline.</span>
                          </div>

                          <div className="space-y-2.5">
                            <select
                              value={allotStaffId[comp.id] || ""}
                              onChange={(e) => setAllotStaffId(prev => ({ ...prev, [comp.id]: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-250 bg-white rounded-lg text-xs outline-hidden focus:border-slate-800"
                            >
                              <option value="">Select Coordinator Staff...</option>
                              {staffList.map((st) => (
                                <option key={st.id} value={st.id}>
                                  {st.name} - {st.department}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleAllotAction(comp.id)}
                              disabled={isAllotting[comp.id]}
                              className="w-full py-2 bg-slate-900 border border-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              {isAllotting[comp.id] ? "Allotting..." : "Assign & Notify Staff"}
                            </button>
                          </div>
                        </div>

                        {/* Direct Override Panel */}
                        <div className="bg-white p-4.5 rounded-xl border border-slate-150 space-y-3.5">
                          <div>
                            <span className="font-bold text-xs text-slate-800 tracking-tight block">
                              Supervisor Status Override
                            </span>
                            <span className="text-[10px] text-slate-400">Directly transition the state bypass or close audit issues.</span>
                          </div>

                          <div className="space-y-3">
                            <textarea
                              placeholder="Supervisorial override audit comments..."
                              value={remarksInput[comp.id] || ""}
                              onChange={(e) => setRemarksInput(prev => ({ ...prev, [comp.id]: e.target.value }))}
                              className="w-full text-xs p-2 rounded border border-slate-250 h-10 resize-none"
                              maxLength={300}
                            />
                            
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleAdminUpdateStatusAction(comp.id, "in-progress")}
                                className="flex-1 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 text-[10px] font-bold rounded-lg hover:bg-blue-100/50 transition-colors"
                              >
                                State In-Progress
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdminUpdateStatusAction(comp.id, "resolved")}
                                className="flex-1 py-1.5 border border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px] font-bold rounded-lg hover:bg-emerald-100/50 transition-colors"
                              >
                                State Resolved ✅
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
