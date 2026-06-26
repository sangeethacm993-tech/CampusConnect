/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Complaint, ComplaintStatus, ComplaintUrgency } from "../types";
import { 
  Briefcase, Clock, Calendar, CheckCircle2, AlertCircle, ChevronUp, ChevronDown, 
  Send, Sparkles, Image, Check, HeartHandshake, Star, Upload, Trash2
} from "lucide-react";

interface StaffPortalProps {
  complaints: Complaint[];
  onUpdateStatus: (complaintId: string, status: ComplaintStatus, remarks: string, photo: string | null) => Promise<void>;
}

export default function StaffPortal({ complaints, onUpdateStatus }: StaffPortalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Status update states per complaint ID to avoid leakage
  const [remarks, setRemarks] = useState<{ [id: string]: string }>({});
  const [targetStatus, setTargetStatus] = useState<{ [id: string]: ComplaintStatus }>({});
  const [photo, setPhoto] = useState<{ [id: string]: string | null }>({});
  const [photoName, setPhotoName] = useState<{ [id: string]: string | null }>({});
  
  const [updating, setUpdating] = useState<{ [id: string]: boolean }>({});
  const [activeFilter, setActiveFilter] = useState<"assigned" | "done">("assigned");
  const fileInputRefs = useRef<{ [id: string]: HTMLInputElement | null }>({});

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert("Maximum upload size restricted to 8MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(prev => ({ ...prev, [id]: reader.result as string }));
        setPhotoName(prev => ({ ...prev, [id]: file.name }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = (id: string) => {
    setPhoto(prev => ({ ...prev, [id]: null }));
    setPhotoName(prev => ({ ...prev, [id]: null }));
    const ref = fileInputRefs.current[id];
    if (ref) ref.value = "";
  };

  const triggerUpload = (id: string) => {
    fileInputRefs.current[id]?.click();
  };

  const handleFormSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const comment = remarks[id] || "";
    const status = targetStatus[id] || "in-progress";
    const attachedPhoto = photo[id] || null;

    if (!comment.trim()) {
      alert("Please provide operational remarks explaining the current actions or resolution details.");
      return;
    }

    setUpdating(prev => ({ ...prev, [id]: true }));
    try {
      await onUpdateStatus(id, status, comment.trim(), attachedPhoto);
      // Clean state for this expanded card
      setRemarks(prev => ({ ...prev, [id]: "" }));
      setPhoto(prev => ({ ...prev, [id]: null }));
      setPhotoName(prev => ({ ...prev, [id]: null }));
      setExpandedId(null); // collapse card
    } catch (err: any) {
      alert(err.message || "Failed to update complaint status. Please review parameters and retry.");
    } finally {
      setUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  const getUrgencyBadge = (urgency: ComplaintUrgency) => {
    switch (urgency) {
      case "high":
        return <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">High</span>;
      case "medium":
        return <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">Medium</span>;
      default:
        return <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">Low</span>;
    }
  };

  // Visibility filters
  // Assigned: pending or in-progress
  // Done: resolved
  const activeComplaints = complaints.filter(c => activeFilter === "assigned" ? c.status !== "resolved" : c.status === "resolved");

  return (
    <div className="space-y-6" id="staff-portal-root">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-start gap-4">
        <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl shadow-xs shrink-0">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 leading-snug tracking-tight">
            Campus Staff Engineering Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            As assigned Campus Operator/Staff, inspect allocated tickets, submit diagnostic progress photographs, write professional remarks, and resolve issues within the specified priority timeframe.
          </p>
        </div>
      </div>

      {/* filter switch */}
      <div className="flex border-b border-slate-100 bg-white p-1 rounded-xl shadow-xs gap-2">
        <button
          onClick={() => setActiveFilter("assigned")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
            activeFilter === "assigned"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
          id="tab-staff-assigned"
        >
          <Clock className="w-4 h-4" />
          Allocated Operations ({complaints.filter(c => c.status !== "resolved").length})
        </button>
        <button
          onClick={() => setActiveFilter("done")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
            activeFilter === "done"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
          id="tab-staff-resolved"
        >
          <CheckCircle2 className="w-4 h-4" />
          Historic Resolved ({complaints.filter(c => c.status === "resolved").length})
        </button>
      </div>

      {activeComplaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center text-slate-400 font-sans shadow-xs mt-4" id="staff-empty-state">
          <HeartHandshake className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold">Workspace is pristine!</p>
          <p className="text-xs mt-1">No operational tickets fall into this category at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4" id="staff-complaint-deck">
          {activeComplaints.map((comp) => {
            const isExpanded = expandedId === comp.id;
            const currentStatus = comp.status;

            return (
              <div 
                key={comp.id}
                className={`bg-white rounded-2xl border transition-all duration-200 ${
                  isExpanded ? "border-slate-350 ring-1 ring-slate-250 shadow-md" : "border-slate-100 hover:border-slate-200 hover:shadow-xs"
                }`}
                id={`staff-card-complaint-${comp.id}`}
              >
                {/* Summary bar */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : comp.id)}
                  className="p-5 sm:p-6 flex items-start gap-4 cursor-pointer select-none"
                >
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap gap-2 items-center text-xs">
                      {comp.anonymous ? (
                        <span className="font-mono text-[10px] uppercase font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-sm flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                          ANONYMOUS TICKET: {comp.anonymousId}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] uppercase font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-sm">
                          ID: {comp.id}
                        </span>
                      )}
                      <span className="font-semibold text-slate-600 bg-stone-100 px-2 py-0.5 rounded">
                        {comp.category}
                      </span>
                      {getUrgencyBadge(comp.urgency)}
                      <span className="text-slate-400 font-mono text-[11px]">
                        Due in {comp.dueInDays} days
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-800 tracking-tight leading-snug truncate">
                      {comp.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-xs font-mono">
                      <span>Lodge Student: <strong className={comp.anonymous ? "text-violet-600 font-bold bg-violet-50 px-1.5 py-0.2 rounded" : "text-slate-600 font-semibold"}>{comp.studentName}</strong></span>
                      {!comp.anonymous && (
                        <span>Dept: <strong className="text-slate-600 font-semibold">{comp.studentDepartment}</strong></span>
                      )}
                      <span>Lodged: {new Date(comp.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="text-slate-400 p-1 bg-slate-50 rounded-lg hover:text-slate-700 shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {/* Expanded control panel */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 sm:p-6 bg-slate-50/45 rounded-b-2xl space-y-6">
                    
                    {/* Diagnostic Narrative details */}
                    <div>
                      <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Reported Student Narrative
                      </span>
                      <p className="text-sm p-4 bg-white border border-slate-100 rounded-xl leading-relaxed text-slate-700">
                        {comp.description}
                      </p>
                    </div>

                    {/* Original Student image proof if any */}
                    {comp.image && (
                      <div>
                        <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Original Photo Proof Shared
                        </span>
                        <a href={comp.image} target="_blank" rel="noreferrer" className="inline-block group">
                          <img
                            src={comp.image}
                            alt="Student attached evidence"
                            className="max-h-48 rounded-xl object-contain border border-slate-200 group-hover:opacity-95 transition-all shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      </div>
                    )}

                    {/* Gemini AI Core Assistance Box */}
                    {comp.aiSummary && (
                      <div className="bg-gradient-to-tr from-indigo-50/50 to-violet-50/50 border border-indigo-100/50 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-1 text-violet-700 text-xs font-bold uppercase tracking-wider font-mono">
                          <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                          Gemini Executive Briefing
                        </div>
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-700">AI Synopses:</span> {comp.aiSummary}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                          AI SUGGESTED CLASSIFICATION: {comp.aiCategorySuggestion || "N/A"}
                        </p>
                      </div>
                    )}

                    {/* Historic Resolution Log */}
                    <div className="space-y-3">
                      <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Operational Log History
                      </span>
                      
                      <div className="space-y-4 relative pl-4 border-l border-slate-200">
                        <div className="relative">
                          <div className="absolute -left-[20.5px] top-1 w-3 h-3 rounded-full bg-slate-400 border border-white" />
                          <div className="text-xs">
                            <span className="font-semibold text-slate-700">Ticket Lodged</span>
                            <span className="text-slate-400 font-mono ml-2">{new Date(comp.createdAt).toLocaleString()}</span>
                          </div>
                        </div>

                        {comp.updates.map((up) => (
                          <div key={up.id} className="relative">
                            <div className="absolute -left-[20.5px] top-1 w-3 h-3 rounded-full bg-indigo-500 border border-white" />
                            <div className="text-xs">
                              <span className="font-bold text-slate-700">{up.updaterName}</span>
                              <span className="text-slate-400 font-mono ml-2">{new Date(up.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 bg-white border border-slate-100 rounded-lg p-3">
                              {up.remarks}
                            </p>
                            {up.photo && (
                              <img 
                                src={up.photo} 
                                alt="Update attachment" 
                                className="max-h-24 object-contain rounded-lg mt-1.5 border border-slate-100"
                                referrerPolicy="no-referrer"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Submissions of resolved feedback rating */}
                    {comp.feedback && (
                      <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-2">
                        <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          Student Performance Evaluation
                        </span>
                        <div className="flex items-center gap-1 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < (comp.feedback?.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                          ))}
                          <span className="text-xs font-semibold text-slate-500 font-mono ml-1.5">{comp.feedback.rating}/5.0</span>
                        </div>
                        {comp.feedback.comment && (
                          <p className="text-xs text-slate-500 italic">
                            &ldquo;{comp.feedback.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action form (Disabled once Resolve) */}
                    {currentStatus !== "resolved" ? (
                      <form onSubmit={(e) => handleFormSubmit(e, comp.id)} className="bg-white border border-slate-100 shadow-sm p-5 rounded-2xl space-y-4">
                        <h4 className="font-bold text-sm text-slate-800 leading-none">
                          Append Field Progress Note
                        </h4>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Status state transition
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setTargetStatus(prev => ({ ...prev, [comp.id]: "in-progress" }))}
                              className={`flex-1 py-2 px-3 border rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                (targetStatus[comp.id] || "in-progress") === "in-progress"
                                  ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Retain In-Progress
                            </button>
                            <button
                              type="button"
                              onClick={() => setTargetStatus(prev => ({ ...prev, [comp.id]: "resolved" }))}
                              className={`flex-1 py-2 px-3 border rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                (targetStatus[comp.id] || "in-progress") === "resolved"
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Mark Resolved ✅
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Field Remarks / Action Descriptions
                          </label>
                          <textarea
                            placeholder="Explain exactly what operations you completed: e.g., Inspected electric lines, replaced fuse cartridge wire, restored router firmware..."
                            value={remarks[comp.id] || ""}
                            onChange={(e) => setRemarks(prev => ({ ...prev, [comp.id]: e.target.value }))}
                            className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:border-slate-850 outline-hidden h-24"
                            maxLength={500}
                            required
                          />
                        </div>

                        {/* Progress Camera upload */}
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Attach Progress Photo (Optional proof)
                          </label>
                          <div className="flex gap-2 items-center">
                            <button
                              type="button"
                              onClick={() => triggerUpload(comp.id)}
                              className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 shrink-0"
                            >
                              <Upload className="w-3.5 h-3.5 text-slate-400" />
                              Browse Proof Photo
                            </button>
                            <input
                              type="file"
                              ref={(el) => { fileInputRefs.current[comp.id] = el; }}
                              onChange={(e) => handlePhotoUpload(e, comp.id)}
                              accept="image/*"
                              className="hidden"
                            />
                            {photo[comp.id] ? (
                              <div className="flex items-center gap-1.5 text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-200 max-w-xs truncate">
                                <span className="truncate">{photoName[comp.id] || "attached.png"}</span>
                                <button type="button" onClick={() => clearPhoto(comp.id)} className="text-rose-600 hover:text-rose-800">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No progress photo attached</span>
                            )}
                          </div>
                          {photo[comp.id] && (
                            <img
                              src={photo[comp.id]!}
                              alt="Staff progress snapshot preview"
                              className="mt-3 max-h-32 object-contain rounded-lg border border-slate-150"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={updating[comp.id]}
                            className={`w-full py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              updating[comp.id]
                                ? "bg-slate-400 cursor-not-allowed"
                                : "bg-slate-900 hover:bg-slate-800 active:scale-[0.99] shadow-sm"
                            }`}
                          >
                            {updating[comp.id] ? (
                              <>
                                <Clock className="w-4 h-4 animate-spin" /> Publishing Remarks...
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" /> Publish Action Update Log
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold" id="ticket-resolved-block">
                        <Check className="w-4 h-4 shrink-0 bg-emerald-500 text-white rounded-full p-0.5" />
                        This ticket is marked Resolved. Reverting or modifying of resolved records can only be authorized by admins.
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
