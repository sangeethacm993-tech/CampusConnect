/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "student" | "staff" | "admin";
export type ComplaintStatus = "pending" | "in-progress" | "resolved";
export type ComplaintUrgency = "low" | "medium" | "high";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  createdAt: string;
}

export interface ComplaintUpdate {
  id: string;
  updaterName: string;
  updaterRole: UserRole;
  remarks: string;
  status: ComplaintStatus;
  photo: string | null; // Base64 or uploaded URL
  timestamp: string;
}

export interface Feedback {
  rating: number; // 1 to 5
  comment: string;
  submittedAt: string;
}

export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentDepartment: string;
  title: string;
  description: string;
  category: string;
  urgency: ComplaintUrgency;
  dueInDays: number;
  status: ComplaintStatus;
  assignedStaffId: string | null;
  assignedStaffName: string | null;
  createdAt: string;
  updatedAt: string;
  image: string | null; // Base64 data Uri of student's upload
  updates: ComplaintUpdate[];
  aiSummary: string | null;
  aiCategorySuggestion: string | null;
  aiUrgencyRating: string | null;
  feedback: Feedback | null;
  anonymous: boolean;
  anonymousId: string | null;
}

export interface SystemStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  avgResolutionTimeHours: number;
  categories: { [category: string]: number };
  urgency: { [urgency in ComplaintUrgency]: number };
  avgRating: number;
}
