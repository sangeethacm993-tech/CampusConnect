/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Complaint, ComplaintStatus, ComplaintUrgency } from "../types";
import { 
  PlusCircle, FileText, Send, Calendar, AlertCircle, Sparkles, 
  CheckCircle, Clock, CheckCircle2, ChevronDown, ChevronUp, Image, Star, Upload, Trash2, HelpCircle
} from "lucide-react";

interface StudentPortalProps {
  complaints: Complaint[];
  onSubmitComplaint: (formData: {
    title: string;
    description: string;
    category: string;
    dueInDays: number;
    image: string | null;
    anonymous: boolean;
  }) => Promise<void>;
  onSubmitFeedback: (complaintId: string, feedback: {
    rating: number;
    comment: string;
  }) => Promise<void>;
}

export default function StudentPortal({ 
  complaints, 
  onSubmitComplaint, 
  onSubmitFeedback 
}: StudentPortalProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"submit" | "my-list">("submit");
  
  // New complaint Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Facilities");
  const [dueInDays, setDueInDays] = useState(3); // default low urgency
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  
  // Form submission helpers
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // List search and filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedComplaintId, setExpandedComplaintId] = useState<string | null>(null);
  
  // Feedback draft states
  const [ratingDrafts, setRatingDrafts] = useState<{ [id: string]: number }>({});
  const [commentDrafts, setCommentDrafts] = useState<{ [id: string]: string }>({});
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<{ [id: string]: boolean }>({});

  const categories = [
    "Facilities", 
    "Academic Office", 
    "Information Technology", 
    "Estate & Maintenance", 
    "Student Housing", 
    "Other"
  ];

  // Map due days to helper badge UI
  const getUrgencyHelper = (days: number) => {
    if (days === 1) return { level: "high" as ComplaintUrgency, text: "High Priority (Resolves inside 24 hours for safety/critical issues)" };
    if (days === 2) return { level: "medium" as ComplaintUrgency, text: "Medium Priority (Resolves inside 48 hours for infrastructure/operations)" };
    return { level: "low" as ComplaintUrgency, text: "Low Priority (Resolves inside 3 days for general campus enhancements)" };
  };

  // Convert uploaded image to Base64 
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert("Maximum upload size restricted to 8MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setImageName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.indexOf("image/") === -1) {
        alert("Only image attachments are allowed as proof evidence.");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        alert("Maximum upload size restricted to 8MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setImageName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSearch = () => {
    fileInputRef.current?.click();
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImage(null);
    setImageName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Form submission dispatcher
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitSuccess(false);

    if (!title.trim()) {
      setFormError("A brief informative title is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Detailed description must be specified to explain the dispute.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitComplaint({
        title: title.trim(),
        description: description.trim(),
        category,
        dueInDays,
        image,
        anonymous
      });
      // clear forms
      setTitle("");
      setDescription("");
      setImage(null);
      setImageName(null);
      setCategory("Facilities");
      setDueInDays(3);
      setAnonymous(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
      setActiveTab("my-list"); // take student directly to their list for tracking
    } catch (err: any) {
      setFormError(err.message || "An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostFeedback = async (complaintId: string) => {
    const rating = ratingDrafts[complaintId] || 5;
    const comment = commentDrafts[complaintId] || "";

    setFeedbackSubmitting(prev => ({ ...prev, [complaintId]: true }));
    try {
      await onSubmitFeedback(complaintId, { rating, comment });
    } catch (err) {
      alert("Failed to record rating feedback. Please try again.");
    } finally {
      setFeedbackSubmitting(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider font-mono">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider font-mono">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            In Operations
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resolved
          </span>
        );
    }
  };

  const getUrgencyBadgeColor = (urgency: ComplaintUrgency) => {
    switch (urgency) {
      case "high": return "bg-rose-50 text-rose-700 border-rose-200";
      case "medium": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const filteredComplaints = statusFilter === "all" 
    ? complaints 
    : complaints.filter(c => c.status === statusFilter);

  return (
    <div id="student-portal-root">
      {/* Tab indicators */}
      <div className="flex border-b border-slate-100 mb-6 bg-white p-1 rounded-xl shadow-xs gap-2">
        <button
          onClick={() => setActiveTab("submit")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "submit"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
          id="tab-submit-complaint"
        >
          <PlusCircle className="w-4 h-4" />
          File New Complaint
        </button>
        <button
          onClick={() => setActiveTab("my-list")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "my-list"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
          id="tab-my-complaints"
        >
          <FileText className="w-4 h-4" />
          Track Submissions ({complaints.length})
        </button>
      </div>

      {activeTab === "submit" ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8" id="complaint-form-wrapper">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Lodge CampusConnect Complaint
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Submit campus issues with photographic evidence. Our AI classifies, summarizes, and assigns issues to designated staff automatically.
            </p>
          </div>

          {formError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-700 text-sm" id="form-error-banner">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-800">Please correct:</span> {formError}
              </div>
            </div>
          )}

          {submitSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 text-emerald-700 text-sm" id="form-success-banner">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-800">Success!</span> Your complaint was registered in the database, and is now being analyzed by AI for assignment.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" id="student-complaint-form">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Dispute Title
              </label>
              <input
                type="text"
                placeholder="e.g., Water cooler faucet snapped off on ground floor library"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-850 focus:ring-1 focus:ring-slate-850 outline-hidden transition-all text-sm placeholder:text-slate-350"
                maxLength={100}
                required
                id="input-complaint-title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Category Folder
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-850 outline-hidden transition-all text-sm bg-white"
                  id="select-complaint-category"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  Urgency Escalation
                  <span className="group relative cursor-help">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-350" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded bg-slate-900 text-white text-[10px] leading-tight font-normal opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-normal z-50">
                      Emergency fixes require 24H resolution. Standard problems clear in 3 days.
                    </span>
                  </span>
                </label>
                <select
                  value={dueInDays}
                  onChange={(e) => setDueInDays(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-850 outline-hidden transition-all text-sm bg-white font-mono"
                  id="select-complaint-urgency"
                >
                  <option value={3}>3 Days - Low (Default)</option>
                  <option value={2}>2 Days - Medium Priority</option>
                  <option value={1}>1 Day - High priority (Immediate action)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5 italic font-mono uppercase tracking-tight">
                  {getUrgencyHelper(dueInDays).text}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Elaborated Description
              </label>
              <textarea
                placeholder="Describe exactly what, where, and when the issue occurred. Include building names, rooms numbers, or specific safety risks..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-850 outline-hidden transition-all text-sm h-36 resize-y placeholder:text-slate-350"
                maxLength={1000}
                required
                id="textarea-complaint-description"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-mono">
                <span>Maximum 1000 characters description limit</span>
                <span>{description.length}/1000</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Photo Evidence Attachment (Optional)
              </label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileSearch}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-violet-500 bg-violet-50/50"
                    : image
                    ? "border-emerald-300 bg-emerald-50/10"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/40"
                }`}
                id="drag-drop-image-box"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="file-evidence-upload"
                />

                {image ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={image}
                      alt="Complaint attachment upload proof"
                      className="max-h-40 rounded-lg object-contain border border-emerald-100 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-semibold">
                      <span className="truncate max-w-xs">{imageName || "attachment.png"}</span>
                      <button
                        onClick={clearImage}
                        className="text-rose-600 hover:text-rose-800 shrink-0 p-0.5 ml-1"
                        title="Remove attached proof"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Upload className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">
                      Drag & Drop image here, or <span className="text-indigo-600">browse files</span>
                    </p>
                    <p className="text-xs">
                      Supports formats PNG, JPG, JPEG up to 8MB max size
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-start gap-3 bg-violet-50/25 border border-violet-100 p-4 rounded-xl" id="anonymous-toggle-wrapper">
              <div className="flex items-center h-5">
                <input
                  id="toggle-anonymous"
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </div>
              <div className="text-sm">
                <label htmlFor="toggle-anonymous" className="font-semibold text-slate-700 cursor-pointer select-none">
                  Submit Complaint Anonymously
                </label>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                  If selected, your personal identification details (Name, Roll, Email, Department, and User ID) will be completely hidden from staff and administrators. We will generate a unique tracking ID (e.g., ANON-000123) for you.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2 ${
                  isSubmitting
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 active:scale-[0.98] shadow-md shadow-slate-900/15"
                }`}
                id="btn-submit-dispute"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    Filing Dispute and Invoking AI...
                  </>
                ) : (
                  <>
                    <Send className="w-4.5 h-4.5" />
                    Submit Ticket & Trigger Auto-Workflow
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4" id="student-tracking-deck">
          {/* Filters card */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-wrap gap-2 items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Filter State
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { val: "all", label: "All Tickets" },
                { val: "pending", label: "Pending Review" },
                { val: "in-progress", label: "In Operations" },
                { val: "resolved", label: "Resolved" }
              ].map((btn) => (
                <button
                  key={btn.val}
                  onClick={() => setStatusFilter(btn.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    statusFilter === btn.val
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                  id={`filter-student-${btn.val}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400" id="no-complaints-box">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold">No tickets found for this query.</p>
              <p className="text-xs mt-1">If this is a new profile, try creating a new dispute in the submit tab.</p>
            </div>
          ) : (
            filteredComplaints.map((comp) => {
              const isExpanded = expandedComplaintId === comp.id;
              
              return (
                <div 
                  key={comp.id} 
                  className={`bg-white rounded-2xl border transition-all duration-200 ${
                    isExpanded ? "border-slate-350 ring-1 ring-slate-250 shadow-md" : "border-slate-100 hover:border-slate-200 hover:shadow-xs"
                  }`}
                  id={`card-complaint-${comp.id}`}
                >
                  {/* Card head summary */}
                  <div 
                    onClick={() => setExpandedComplaintId(isExpanded ? null : comp.id)}
                    className="p-5 sm:p-6 flex items-start gap-4 cursor-pointer select-none"
                  >
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center">
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
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                          {comp.category}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-sm font-bold uppercase tracking-tight ${getUrgencyBadgeColor(comp.urgency)}`}>
                          Urgency: {comp.urgency}
                        </span>
                        {getStatusBadge(comp.status)}
                      </div>

                      <h3 className="font-bold text-base text-slate-800 leading-snug tracking-tight truncate">
                        {comp.title}
                      </h3>
                      
                      <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Lodged: {new Date(comp.createdAt).toLocaleDateString()} at {new Date(comp.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>

                    <div className="text-slate-400 p-1 bg-slate-50 rounded-lg hover:text-slate-700 shrink-0">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Expanded Detail Workspace */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-5 sm:p-6 bg-slate-50/45 rounded-b-2xl space-y-6">
                      
                      {/* Description */}
                      <div>
                        <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Detailed Student Narrative
                        </span>
                        <p className="text-sm text-slate-700 leading-relaxed font-sans bg-white p-4 rounded-xl border border-slate-100">
                          {comp.description}
                        </p>
                      </div>

                      {/* Attached Proof Image if any */}
                      {comp.image && (
                        <div>
                          <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Provided Photo Evidence Proof
                          </span>
                          <a 
                            href={comp.image} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-block group"
                            title="Inspect image in raw window"
                          >
                            <img
                              src={comp.image}
                              alt="Captured attachment evidence"
                              className="max-h-60 rounded-xl object-contain border border-slate-200 group-hover:opacity-95 transition-all shadow-xs"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 italic">
                              <Image className="w-3 h-3" /> Click image to inspect full size
                            </span>
                          </a>
                        </div>
                      )}

                      {/* AI-Assistant Smart Section */}
                      <div className="bg-gradient-to-tr from-indigo-50/60 to-violet-50/60 rounded-xl p-4 border border-indigo-100/60 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
                          <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                          AI Smart Analysis Summary
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {comp.aiSummary ? (
                            <>
                              <span className="font-semibold text-slate-700">Concise Issue:</span> {comp.aiSummary}
                            </>
                          ) : (
                            <span className="italic text-slate-400">Gemini background analysis is active for this ticket. Refreshes momentarily...</span>
                          )}
                        </p>
                        {comp.aiCategorySuggestion && (
                          <div className="flex flex-wrap items-center gap-3 text-xs mt-1.5 font-mono">
                            <span className="text-slate-500 text-[11px] uppercase font-semibold">AI Routing Recommendation:</span>
                            <span className="px-2 py-0.5 rounded-md bg-white border border-indigo-150 text-indigo-700 text-[11px] font-semibold">
                              {comp.aiCategorySuggestion}
                            </span>
                            {comp.aiUrgencyRating && (
                              <span className="px-2 py-0.5 rounded-md bg-white border border-rose-150 text-rose-700 text-[11px] font-semibold capitalize">
                                AI Urgency: {comp.aiUrgencyRating}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Operational Timeline / Remarks Log */}
                      <div className="space-y-3">
                        <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          Official Resolution Timeline
                        </span>

                        <div className="space-y-4 relative pl-4 border-l border-slate-200">
                          {/* Entry item */}
                          <div className="relative">
                            <div className="absolute -left-[20.5px] top-1 w-3 h-3 rounded-full bg-slate-350 border-2 border-white" />
                            <div className="text-xs">
                              <span className="font-bold text-slate-700">Ticket Created & Registered</span>
                              <span className="text-slate-400 font-mono ml-2">
                                {new Date(comp.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Status set to <span className="font-mono text-amber-600 font-semibold p-0.5 rounded">Pending</span>. Routed to Admin Dashboard for allocation.
                            </p>
                          </div>

                          {/* Dynamic timeline logs */}
                          {comp.updates.map((up) => (
                            <div key={up.id} className="relative">
                              <div className="absolute -left-[20.5px] top-1 w-3 h-3 rounded-full bg-violet-600 border-2 border-white" />
                              <div className="text-xs">
                                <span className="font-bold text-slate-700">{up.updaterName}</span>
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] capitalize ml-1.5">
                                  {up.updaterRole}
                                </span>
                                <span className="text-slate-400 font-mono ml-2">
                                  {new Date(up.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1 bg-white p-2.5 rounded-lg border border-slate-100 relative">
                                <span className="font-semibold block mb-0.5 text-slate-400 font-mono text-[9px] uppercase">OPERATIONAL REMARKS:</span>
                                {up.remarks}
                              </p>
                              {up.photo && (
                                <div className="mt-1.5">
                                  <img
                                    src={up.photo}
                                    alt="Progress proof"
                                    className="max-h-24 rounded-lg object-contain border border-slate-200"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                            </div>
                          ))}

                          {comp.status === "resolved" && (
                            <div className="relative">
                              <div className="absolute -left-[20.5px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                              <div className="text-xs">
                                <span className="font-bold text-emerald-700 flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 shrink-0" /> Target Resolved
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Feedback Rating - Student Action when Ticket is Resolved */}
                      {comp.status === "resolved" && (
                        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs transition-all">
                          {comp.feedback ? (
                            <div className="space-y-2">
                              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                                Your Shared Performance review
                              </div>
                              <div className="flex items-center gap-1 text-amber-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-4 h-4 ${i < (comp.feedback?.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
                                  />
                                ))}
                                <span className="text-xs font-semibold text-slate-500 font-mono ml-1.5 bg-slate-50 px-2 py-0.5 border border-slate-150 rounded">
                                  {comp.feedback.rating} / 5 Stars
                                </span>
                              </div>
                              {comp.feedback.comment && (
                                <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                                  &ldquo;{comp.feedback.comment}&rdquo;
                                </p>
                              )}
                              <span className="block text-[9px] text-slate-400 font-mono mt-1">
                                Feedback submitted: {new Date(comp.feedback.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div>
                                <span className="font-bold text-sm text-slate-800 tracking-tight block">
                                  Review Operational Performance
                                </span>
                                <p className="text-xs text-slate-400">
                                  We value your feedback. Let the institution know how fast or effective this complaint resolution was.
                                </p>
                              </div>

                              {/* Star picker */}
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                                  Resolution Quality Rating
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map((stars) => {
                                      const currentDraftRating = ratingDrafts[comp.id] || 5;
                                      return (
                                        <button
                                          key={stars}
                                          type="button"
                                          onClick={() => setRatingDrafts(prev => ({ ...prev, [comp.id]: stars }))}
                                          className="text-amber-400 hover:scale-115 transition-transform p-0.5"
                                          title={`Rate ${stars} Star`}
                                        >
                                          <Star className={`w-6 h-6 ${stars <= currentDraftRating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <span className="text-xs font-semibold font-mono bg-amber-50 text-amber-700 px-2.5 py-1 border border-amber-100 rounded-md">
                                    {(ratingDrafts[comp.id] || 5)} Stars
                                  </span>
                                </div>
                              </div>

                              {/* Review Comment text */}
                              <div>
                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                  Optional Operational Remarks
                                </span>
                                <textarea
                                  placeholder="What would you say about the speed or approach of the assigned staff? Any further comments?"
                                  value={commentDrafts[comp.id] || ""}
                                  onChange={(e) => setCommentDrafts(prev => ({ ...prev, [comp.id]: e.target.value }))}
                                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:border-slate-850 outline-hidden h-20 resize-none"
                                  maxLength={300}
                                />
                              </div>

                              <div>
                                <button
                                  type="button"
                                  disabled={feedbackSubmitting[comp.id]}
                                  onClick={() => handlePostFeedback(comp.id)}
                                  className="px-4 py-2 bg-slate-900 border border-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                                >
                                  {feedbackSubmitting[comp.id] ? (
                                    <>
                                      <Clock className="w-3.5 h-3.5 animate-spin" /> Recording...
                                    </>
                                  ) : (
                                    <>
                                      Submit Performance Review
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
