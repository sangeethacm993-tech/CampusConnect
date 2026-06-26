/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { User, Complaint, ComplaintUpdate, Feedback, SystemStats, UserRole, ComplaintStatus, ComplaintUrgency } from "./src/types.js";

// Safe dirname setup for ES Modules and CommonJS bundles
const currentFilename = typeof import.meta !== "undefined" && import.meta.url
  ? fileURLToPath(import.meta.url)
  : (typeof __filename !== "undefined" ? __filename : "");
const currentDirname = typeof __dirname !== "undefined"
  ? __dirname
  : (currentFilename ? path.dirname(currentFilename) : process.cwd());

const app = express();
const PORT = 3000;

// Body parser with size limits for supporting attachments (images)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Local JSON File Database persistence path
const DB_FILE = path.join(process.cwd(), "database.json");

// Define schema for the database file
interface DatabaseSchema {
  users: User[];
  passwords: { [userId: string]: string }; // hashed passwords map
  complaints: Complaint[];
}

// SHA256 Password hasher helper
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Lazy initialization helper for Gemini
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (e) {
        console.error("Failed to initialize Gemini AI client:", e);
      }
    }
  }
  return aiClient;
}

// Low-risk in-memory database fallback to persist state or restore from DB_FILE
let dbState: DatabaseSchema = {
  users: [],
  passwords: {},
  complaints: []
};

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to database file:", error);
  }
}

function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      dbState = JSON.parse(data);
      // Migrate existing complaints to have anonymous fields if they don't have them
      if (dbState.complaints) {
        dbState.complaints = dbState.complaints.map(c => {
          const user = dbState.users?.find(u => u.id === c.studentId);
          return {
            ...c,
            studentDepartment: c.studentDepartment || user?.department || "Computer Science",
            anonymous: c.anonymous !== undefined ? c.anonymous : false,
            anonymousId: c.anonymousId !== undefined ? c.anonymousId : null
          };
        });
      }
    } catch (error) {
      console.error("Failed to read database file, utilizing in-memory state:", error);
    }
  } else {
    // If empty seed the initial schema with users and state for quick demo
    seedInitialData();
  }
}

function seedInitialData() {
  console.log("Seeding fresh data for Smart Campus Complaint System...");
  
  // Seed Users
  const adminId = "usr_admin_1";
  const staffMaintenanceId = "usr_staff_maintenance";
  const staffItId = "usr_staff_it";
  const student1Id = "usr_student_1";
  const student2Id = "usr_student_2";

  const adminUser: User = {
    id: adminId,
    name: "Dr. Arvind Shrivastava (Admin)",
    email: "admin@campus.edu",
    role: "admin",
    department: "Administration",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  const staffMaintenance: User = {
    id: staffMaintenanceId,
    name: "Rajesh Kumar (Maintenance)",
    email: "maintenance@campus.edu",
    role: "staff",
    department: "Estate & Maintenance",
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  };

  const staffIt: User = {
    id: staffItId,
    name: "Sanjay Sen (IT Department)",
    email: "it@campus.edu",
    role: "staff",
    department: "Information Technology",
    createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString()
  };

  const student1: User = {
    id: student1Id,
    name: "Amit Patel",
    email: "amit.patel@student.edu",
    role: "student",
    department: "Computer Science",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  };

  const student2: User = {
    id: student2Id,
    name: "Neha Sharma",
    email: "neha.sharma@student.edu",
    role: "student",
    department: "Electronics & Communication",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  };

  dbState.users = [adminUser, staffMaintenance, staffIt, student1, student2];

  // Set passwords as "password123" for students/staff, and "secure_admin_password" for admin
  dbState.passwords[adminId] = hashPassword("secure_admin_password");
  dbState.passwords[staffMaintenanceId] = hashPassword("password123");
  dbState.passwords[staffItId] = hashPassword("password123");
  dbState.passwords[student1Id] = hashPassword("password123");
  dbState.passwords[student2Id] = hashPassword("password123");

  // Create seed complaints
  const complaint1: Complaint = {
    id: "comp_1",
    studentId: student1Id,
    studentName: "Amit Patel",
    studentEmail: "amit.patel@student.edu",
    studentDepartment: "Computer Science",
    title: "Unstable Wi-Fi connectivity in Hostel Block C",
    description: "The primary Wi-Fi hotspot in Hostel Block C, 3rd floor, turns off and disconnects every 15 minutes. It is impossible to complete assignments or exams.",
    category: "Infrastructure",
    urgency: "high",
    dueInDays: 1,
    status: "in-progress",
    assignedStaffId: staffItId,
    assignedStaffName: "Sanjay Sen (IT Department)",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    image: null,
    updates: [
      {
        id: "up_1_1",
        updaterName: "Dr. Arvind Shrivastava (Admin)",
        updaterRole: "admin",
        remarks: "Assigned immediately to IT engineering. Wireless router inspection requested.",
        status: "in-progress",
        photo: null,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "up_1_2",
        updaterName: "Sanjay Sen (IT Department)",
        updaterRole: "staff",
        remarks: "Visited Block C C-312 hallway. Reconfigured the router channel to reduce noise interference. Monitoring current traffic levels.",
        status: "in-progress",
        photo: null,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      }
    ],
    aiSummary: "Periodic disconnection from primary Wi-Fi hotspot on the 3rd floor of Hostel Block C.",
    aiCategorySuggestion: "Information Technology",
    aiUrgencyRating: "high",
    feedback: null,
    anonymous: false,
    anonymousId: null
  };

  const complaint2: Complaint = {
    id: "comp_2",
    studentId: student2Id,
    studentName: "Neha Sharma",
    studentEmail: "neha.sharma@student.edu",
    studentDepartment: "Electronics & Communication",
    title: "Broken water cooler tap in Library foyer",
    description: "The right-side cold water tap on the library ground floor cooler is entirely snapped off, causing continuous leaking and pooling water on the floor, which is a slipping hazard.",
    category: "Facilities",
    urgency: "medium",
    dueInDays: 2,
    status: "resolved",
    assignedStaffId: staffMaintenanceId,
    assignedStaffName: "Rajesh Kumar (Maintenance)",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    image: null,
    updates: [
      {
        id: "up_2_1",
        updaterName: "Dr. Arvind Shrivastava (Admin)",
        updaterRole: "admin",
        remarks: "Complaint review completed. Handed over assignment to estate maintenance pipeline.",
        status: "in-progress",
        photo: null,
        timestamp: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "up_2_2",
        updaterName: "Rajesh Kumar (Maintenance)",
        updaterRole: "staff",
        remarks: "Replaced the faucet cartridge assembly and fixed a new heavy-duty metal press valve. Closed water supply leak effectively. Cleaned floor area.",
        status: "resolved",
        photo: null,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    aiSummary: "Broken water cooler tap causing leak and slipping hazard on ground floor library.",
    aiCategorySuggestion: "Facilities",
    aiUrgencyRating: "medium",
    feedback: {
      rating: 5,
      comment: "Fixed extremely fast! The new tap is far more solid too. Thank you!",
      submittedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
    },
    anonymous: false,
    anonymousId: null
  };

  const complaint3: Complaint = {
    id: "comp_3",
    studentId: student1Id,
    studentName: "Amit Patel",
    studentEmail: "amit.patel@student.edu",
    studentDepartment: "Computer Science",
    title: "Stray light flicker in Class Room EC-102",
    description: "The second row ceiling tube-light flickers intensely when switched on, causing eye strain and a migraine-trigger during afternoon lectures.",
    category: "Facilities",
    urgency: "low",
    dueInDays: 3,
    status: "pending",
    assignedStaffId: null,
    assignedStaffName: null,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    image: null,
    updates: [],
    aiSummary: "Ceiling lighting row flicker causing distraction and strain inside Class Room EC-102.",
    aiCategorySuggestion: "Facilities",
    aiUrgencyRating: "low",
    feedback: null,
    anonymous: false,
    anonymousId: null
  };

  dbState.complaints = [complaint1, complaint2, complaint3];
  saveDb();
}

// Load initial state
loadDb();

/**
 * AUTHENTICATION MIDDLEWARE
 * Standard simple security checks. In sandboxed systems, we extract authenticating headers
 * containing token info: `Bearer token_<userId>_<role>_session`
 */
function getAuthorizedUser(req: express.Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  if (!token.startsWith("token_") || !token.endsWith("_session")) {
    return null;
  }
  // Format is token_userId_role_session
  // Since userId can contain underscores (e.g. usr_student_1), but role does not,
  // we extract the center payload and split by the last underscore to get userId.
  const payload = token.substring(6, token.length - 8);
  const lastUnderscore = payload.lastIndexOf("_");
  if (lastUnderscore === -1) {
    return null;
  }
  const userId = payload.substring(0, lastUnderscore);
  const user = dbState.users.find((u) => u.id === userId);
  return user || null;
}

// Helper to sanitize student identification for anonymous complaints under staff/admin view
function sanitizeComplaint(c: Complaint, currentUserRole: UserRole): Complaint {
  if (c.anonymous && currentUserRole !== "student") {
    return {
      ...c,
      studentId: "ANONYMOUS",
      studentName: "Anonymous Student",
      studentEmail: "anonymous@student.edu",
      studentDepartment: "Anonymous Department"
    };
  }
  return c;
}

// Endpoint APIs

// 1. Auth Register Student / Staff
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email || !password || !role || !department) {
    return res.status(400).json({ error: "All registration fields are required." });
  }

  if (role !== "student" && role !== "staff") {
    return res.status(400).json({ error: "Invalid role specified." });
  }

  const existing = dbState.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Email address is already registered." });
  }

  const userId = `usr_${role}_${Date.now()}`;
  const newUser: User = {
    id: userId,
    name,
    email: email.toLowerCase(),
    role: role as UserRole,
    department,
    createdAt: new Date().toISOString(),
  };

  dbState.users.push(newUser);
  dbState.passwords[userId] = hashPassword(password);
  saveDb();

  const token = `token_${userId}_${role}_session`;
  res.status(201).json({ user: newUser, token });
});

// 2. Auth Login
app.post("/api/auth/login", (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Email, password, and identity role are required." });
  }

  const user = dbState.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.role === role
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials or matching identity role not found." });
  }

  const hashedInput = hashPassword(password);
  if (dbState.passwords[user.id] !== hashedInput) {
    return res.status(401).json({ error: "Incorrect password, access denied." });
  }

  const token = `token_${user.id}_${user.role}_session`;
  res.json({ user, token });
});

// 3. Get Auth User Profile
app.get("/api/auth/profile", (req, res) => {
  const currentUser = getAuthorizedUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: "Authorization token expired or invalid." });
  }
  res.json({ user: currentUser });
});

// 4. Create Student Complaint (With Smart Automatic AI Analysis in the background if possible)
app.post("/api/complaints", async (req, res) => {
  const currentUser = getAuthorizedUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: "Access denied. Student authorization required." });
  }
  if (currentUser.role !== "student") {
    return res.status(403).json({ error: "Only students are authorized to log new institutional feedback." });
  }

  const { title, description, category, dueInDays, image, anonymous } = req.body;
  if (!title || !description || !category) {
    return res.status(400).json({ error: "Complaint title, description, and target category are mandatory." });
  }

  const calculatedDays = Number(dueInDays) || 3;
  let defaultUrgency: ComplaintUrgency = "low";
  if (calculatedDays === 1) defaultUrgency = "high";
  else if (calculatedDays === 2) defaultUrgency = "medium";

  const complaintId = `comp_${Date.now()}`;
  
  const isAnonymous = !!anonymous;
  let anonId: string | null = null;
  if (isAnonymous) {
    const existingAnons = dbState.complaints.filter(c => c.anonymous && c.anonymousId);
    let maxNum = 0;
    existingAnons.forEach(ea => {
      if (ea.anonymousId && ea.anonymousId.startsWith("ANON-")) {
        const parts = ea.anonymousId.split("-");
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    anonId = `ANON-${String(nextNum).padStart(6, "0")}`;
  }

  const newComplaint: Complaint = {
    id: complaintId,
    studentId: currentUser.id,
    studentName: currentUser.name,
    studentEmail: currentUser.email,
    studentDepartment: currentUser.department,
    title,
    description,
    category,
    urgency: defaultUrgency,
    dueInDays: calculatedDays,
    status: "pending",
    assignedStaffId: null,
    assignedStaffName: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    image: image || null,
    updates: [],
    aiSummary: null,
    aiCategorySuggestion: null,
    aiUrgencyRating: null,
    feedback: null,
    anonymous: isAnonymous,
    anonymousId: anonId
  };

  dbState.complaints.push(newComplaint);
  saveDb();

  // Lazy asynchronous call to Gemini to inject smart analytics recommendations
  const ai = getGemini();
  if (ai) {
    // Run content analysis concurrently!
    (async () => {
      try {
        console.log(`Running smart Gemini categorization for complaint: ${complaintId}`);
        const promptText = `
Role: You are an intelligent virtual administrator for educational institutions.
Analyze the following student complaint and return a structured JSON response.

Title: "${title}"
Details: "${description}"
User Category Select: "${category}"

Provide:
1. "aiSummary": Short, single-sentence human-friendly summary (less than 15 words) that makes it fast for staff to scan.
2. "aiCategorySuggestion": A standard recommended department folder (choose from: "Facilities", "Academic Office", "Information Technology", "Estate & Maintenance", "Student Housing", "Other").
3. "aiUrgencyRating": Give a recommendation of 'low', 'medium', or 'high' based on urgency, health, or infrastructure breakdown risk. Mention reasoning.

Ensure you respond in valid clean JSON matching this format:
{
  "aiSummary": "...",
  "aiCategorySuggestion": "...",
  "aiUrgencyRating": "low" | "medium" | "high"
}
Do not use markdown wrappers, return only pure JSON.
`;
        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText,
          config: {
            responseMimeType: "application/json",
          }
        });
        
        if (aiResponse && aiResponse.text) {
          const parsed = JSON.parse(aiResponse.text.trim());
          const targetComp = dbState.complaints.find(c => c.id === complaintId);
          if (targetComp) {
            targetComp.aiSummary = parsed.aiSummary || null;
            targetComp.aiCategorySuggestion = parsed.aiCategorySuggestion || null;
            targetComp.aiUrgencyRating = parsed.aiUrgencyRating || null;
            saveDb();
            console.log(`Successfully appended Gemini smart analysis for complaint ${complaintId}`);
          }
        }
      } catch (err) {
        console.warn("Unable to enrich complaint with AI properties safely:", err);
      }
    })();
  } else {
    // Basic local fallback rules to guarantee 'smart' defaults
    newComplaint.aiSummary = `${title.slice(0, 50)}...`;
    newComplaint.aiCategorySuggestion = category;
    newComplaint.aiUrgencyRating = defaultUrgency;
    saveDb();
  }

  res.status(201).json(newComplaint);
});

// 5. Get Filterable Complaints List
app.get("/api/complaints", (req, res) => {
  const currentUser = getAuthorizedUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: "Access denied. Active session token required." });
  }

  let list = [...dbState.complaints];

  // Role-based visibility scoping
  if (currentUser.role === "student") {
    // Students can ONLY query their own submissions
    list = list.filter((c) => c.studentId === currentUser.id);
  } else if (currentUser.role === "staff") {
    // Staff can ONLY see complaints assigned to them
    list = list.filter((c) => c.assignedStaffId === currentUser.id);
  } else if (currentUser.role === "admin") {
    // Admins can see EVERYTHING
    // no-op filtering
  }

  // Filter Query parameters
  const { status, category, urgency, search } = req.query;

  if (status) {
    list = list.filter((c) => c.status === status);
  }
  if (category) {
    list = list.filter((c) => c.category.toLowerCase() === (category as string).toLowerCase());
  }
  if (urgency) {
    list = list.filter((c) => c.urgency === urgency);
  }
  if (search) {
    const term = (search as string).toLowerCase();
    list = list.filter(
      (c) => {
        const matchesBase = 
          c.title.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term) ||
          c.id.toLowerCase().includes(term) ||
          (c.anonymousId && c.anonymousId.toLowerCase().includes(term));
        
        if (c.anonymous && currentUser.role !== "student") {
          return matchesBase;
        } else {
          return matchesBase || c.studentName.toLowerCase().includes(term);
        }
      }
    );
  }

  // Sort by newest created first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const sanitizedList = list.map(c => sanitizeComplaint(c, currentUser.role));
  res.json(sanitizedList);
});

// 6. Get Single Complaint Details
app.get("/api/complaints/:id", (req, res) => {
  const currentUser = getAuthorizedUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: "Active session required." });
  }

  const { id } = req.params;
  const complaint = dbState.complaints.find((c) => c.id === id);

  if (!complaint) {
    return res.status(404).json({ error: "Requested complaint record not found." });
  }

  // Role-based security validation
  if (currentUser.role === "student" && complaint.studentId !== currentUser.id) {
    return res.status(403).json({ error: "Unprivileged request. Cannot inspect others' complaints." });
  }
  if (currentUser.role === "staff" && complaint.assignedStaffId !== currentUser.id) {
    return res.status(403).json({ error: "Unprivileged request. Complaint is not assigned to you." });
  }

  res.json(sanitizeComplaint(complaint, currentUser.role));
});

// 7. Admin Action: Assign Complaint to Staff
app.put("/api/complaints/:id/assign", (req, res) => {
  const currentUser = getAuthorizedUser(req);
  if (!currentUser || currentUser.role !== "admin") {
    return res.status(403).json({ error: "Privileged action. Administrator credentials required." });
  }

  const { id } = req.params;
  const { staffId } = req.body;

  if (!staffId) {
    return res.status(400).json({ error: "Target Staff member ID is required for assignment." });
  }

  const complaint = dbState.complaints.find((c) => c.id === id);
  if (!complaint) {
    return res.status(404).json({ error: "Complaint record missing." });
  }

  const staff = dbState.users.find((u) => u.id === staffId && u.role === "staff");
  if (!staff) {
    return res.status(404).json({ error: "Target Staff member not found or user is not listed as Staff." });
  }

  // Modify assignment
  complaint.assignedStaffId = staff.id;
  complaint.assignedStaffName = staff.name;
  complaint.status = "in-progress"; // auto transition to in-progress on assignment
  complaint.updatedAt = new Date().toISOString();

  // Push update transition
  const newUpdate: ComplaintUpdate = {
    id: `up_${Date.now()}`,
    updaterName: currentUser.name,
    updaterRole: "admin",
    remarks: `Reassigned for operations to: ${staff.name}`,
    status: "in-progress",
    photo: null,
    timestamp: new Date().toISOString()
  };

  complaint.updates.push(newUpdate);
  saveDb();

  res.json(sanitizeComplaint(complaint, currentUser.role));
});

// 8. Staff / Admin Action: Progress / Status Updates
app.put("/api/complaints/:id/status", (req, res) => {
  const currentUser = getAuthorizedUser(req);
  if (!currentUser || currentUser.role === "student") {
    return res.status(403).json({ error: "Only staff members or Administrators can update complaint status." });
  }

  const { id } = req.params;
  const { status, remarks, photo } = req.body;

  if (!status || !remarks) {
    return res.status(400).json({ error: "Updated state status and descriptive remarks are required." });
  }

  const complaint = dbState.complaints.find((c) => c.id === id);
  if (!complaint) {
    return res.status(404).json({ error: "Complaint record not found." });
  }

  // Staff can only update complaints assigned to them
  if (currentUser.role === "staff" && complaint.assignedStaffId !== currentUser.id) {
    return res.status(403).json({ error: "Unprivileged action. This ticket is assigned to another operator." });
  }

  // Terminal state protection: Once resolved, standard staff can't revert it unless admin overrides
  if (complaint.status === "resolved" && currentUser.role !== "admin") {
    return res.status(400).json({ error: "Ticket is already marked as Resolved. Contact the administration to reopen." });
  }

  // Proceed with status updates
  complaint.status = status as ComplaintStatus;
  complaint.updatedAt = new Date().toISOString();

  const newUpdate: ComplaintUpdate = {
    id: `up_${Date.now()}`,
    updaterName: currentUser.name,
    updaterRole: currentUser.role,
    remarks,
    status: status as ComplaintStatus,
    photo: photo || null,
    timestamp: new Date().toISOString()
  };

  complaint.updates.push(newUpdate);
  saveDb();

  res.json(sanitizeComplaint(complaint, currentUser.role));
});

// 9. Student Action: Submit Feedback / Rating on Resolved Complaint
app.post("/api/complaints/:id/feedback", (req, res) => {
  const currentUser = getAuthorizedUser(req);
  if (!currentUser || currentUser.role !== "student") {
    return res.status(403).json({ error: "Only students are authorized to rate resolutions." });
  }

  const { id } = req.params;
  const { rating, comment } = req.body;

  if (rating === undefined || rating === null) {
    return res.status(400).json({ error: "Feedback rating (1 to 5) is mandatory." });
  }

  const parsedRating = Number(rating);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ error: "Invalid rating value. Must be a digit ranging from 1 to 5." });
  }

  const complaint = dbState.complaints.find((c) => c.id === id);
  if (!complaint) {
    return res.status(404).json({ error: "Complaint record not found." });
  }

  if (complaint.studentId !== currentUser.id) {
    return res.status(403).json({ error: "Access denied. Cannot evaluate feedback submitted by another student." });
  }

  if (complaint.status !== "resolved") {
    return res.status(400).json({ error: "Ratings and performance reviews are only allowed on fully resolved tickets." });
  }

  const feedbackSubmitted: Feedback = {
    rating: parsedRating,
    comment: comment || "",
    submittedAt: new Date().toISOString()
  };

  complaint.feedback = feedbackSubmitted;
  complaint.updatedAt = new Date().toISOString();
  saveDb();

  res.json(sanitizeComplaint(complaint, currentUser.role));
});

// 10. Admin / Supervisor Action: Get System Staff member list
app.get("/api/staff", (req, res) => {
  const currentUser = getAuthorizedUser(req);
  if (!currentUser || currentUser.role !== "admin") {
    return res.status(403).json({ error: "Administrator rights required." });
  }

  const staffMembers = dbState.users
    .filter((u) => u.role === "staff")
    .map((u) => ({ id: u.id, name: u.name, department: u.department, email: u.email }));

  res.json(staffMembers);
});

// 11. System Statistics / Dynamic Analytics
app.get("/api/stats", (req, res) => {
  const currentUser = getAuthorizedUser(req);
  if (!currentUser || currentUser.role !== "admin") {
    return res.status(403).json({ error: "Access restricted. Administrator statistics view only." });
  }

  const complaints = dbState.complaints;

  const stats: SystemStats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    inProgress: complaints.filter((c) => c.status === "in-progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
    avgResolutionTimeHours: 0,
    categories: {},
    urgency: {
      low: complaints.filter((c) => c.urgency === "low").length,
      medium: complaints.filter((c) => c.urgency === "medium").length,
      high: complaints.filter((c) => c.urgency === "high").length,
    },
    avgRating: 0
  };

  // Compile Categories frequency counts
  complaints.forEach((c) => {
    stats.categories[c.category] = (stats.categories[c.category] || 0) + 1;
  });

  // Calculate Average rating on resolved complaints with feedback
  const feedbackList = complaints.filter((c) => c.feedback !== null);
  if (feedbackList.length > 0) {
    const totalRating = feedbackList.reduce((sum, c) => sum + (c.feedback?.rating || 0), 0);
    stats.avgRating = parseFloat((totalRating / feedbackList.length).toFixed(1));
  } else {
    stats.avgRating = 5.0; // pristine by default
  }

  // Calculate resolution times for resolved tickets (Mock historical times if newly generated, else live)
  const resolvedList = complaints.filter((c) => c.status === "resolved");
  if (resolvedList.length > 0) {
    let totalHours = 0;
    resolvedList.forEach((c) => {
      const created = new Date(c.createdAt).getTime();
      const updated = new Date(c.updatedAt).getTime();
      const differenceHours = (updated - created) / (1000 * 60 * 60);
      totalHours += Math.max(1, differenceHours); // minimum resolution anchor
    });
    stats.avgResolutionTimeHours = parseFloat((totalHours / resolvedList.length).toFixed(1));
  } else {
    stats.avgResolutionTimeHours = 36.5; // system benchmark fallback
  }

  res.json(stats);
});

// Trigger automatic manual re-evaluation on any complaint using Gemini
app.post("/api/complaints/:id/ai-review", async (req, res) => {
  const currentUser = getAuthorizedUser(req);
  if (!currentUser || currentUser.role !== "admin") {
    return res.status(403).json({ error: "Access allowed strictly to Administrators." });
  }

  const { id } = req.params;
  const complaint = dbState.complaints.find((c) => c.id === id);
  if (!complaint) {
    return res.status(404).json({ error: "Complaint metadata missing." });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(400).json({ error: "Gemini API Key is not configured on the server. Please add your key in the Secrets settings." });
  }

  try {
    const promptText = `
Role: You are an intelligent virtual administrator for educational institutions.
Analyze the following student complaint and return a structured JSON response.

Title: "${complaint.title}"
Details: "${complaint.description}"
User Category Select: "${complaint.category}"

Provide:
1. "aiSummary": Short, single-sentence human-friendly summary (less than 15 words) that makes it fast for staff to scan.
2. "aiCategorySuggestion": A standard recommended department folder (choose from: "Facilities", "Academic Office", "Information Technology", "Estate & Maintenance", "Student Housing", "Other").
3. "aiUrgencyRating": Give a recommendation of 'low', 'medium', or 'high' based on urgency, health, or infrastructure breakdown risk. Mention reasoning.

Ensure you respond in valid clean JSON matching this format:
{
  "aiSummary": "...",
  "aiCategorySuggestion": "...",
  "aiUrgencyRating": "low" | "medium" | "high"
}
Do not use markdown wrappers, return only pure JSON.
`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (aiResponse && aiResponse.text) {
      const parsed = JSON.parse(aiResponse.text.trim());
      complaint.aiSummary = parsed.aiSummary || null;
      complaint.aiCategorySuggestion = parsed.aiCategorySuggestion || null;
      complaint.aiUrgencyRating = parsed.aiUrgencyRating || null;
      complaint.updatedAt = new Date().toISOString();
      saveDb();
      return res.json(sanitizeComplaint(complaint, currentUser.role));
    } else {
      throw new Error("No response body produced by Gemini API.");
    }
  } catch (error) {
    console.error("Gemini manual review failed:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Configure Vite middleware or static delivery
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite middleware integration
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production compiled app serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Campus Backend Server running on http://localhost:${PORT}`);
  });
}

startServer();
