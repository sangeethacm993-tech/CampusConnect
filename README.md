# CampusConnect: Smart Complaint Tracking System

## 📌 Overview
CampusConnect: Smart Complaint Tracking System is a full-stack web application designed to streamline complaint management in educational institutions. The platform enables students to submit complaints, staff to resolve issues, and administrators to manage and monitor the entire workflow efficiently using a role-based system.

---

## ✨ Features

### 🔐 Authentication & Authorization
- Role-Based Access Control (Student, Staff, Admin)
- JWT-based secure login system
- Password encryption using bcrypt
- Protected routes based on user roles

### 📝 Complaint Management
- Submit complaints with title, description, category, urgency, and images
- Track complaint status (pending → in-progress → resolved)
- Upload evidence images using Multer

### 👥 Staff Module
- View assigned complaints
- Update progress with remarks and photos
- Change complaint status

### 👨‍💼 Admin Dashboard
- View all complaints
- Assign complaints to staff
- Monitor system statistics
- Manage users

### 💬 Feedback System
- Rating system for resolved complaints
- User comments and feedback tracking

### 📧 Notifications
- Email alerts using Nodemailer
- Notifications for complaint updates and resolution

---

## 🛠 Tech Stack

### Frontend
- React
- React Router DOM
- Axios
- Bootstrap
- JWT Decode

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs

### Tools
- Multer (file uploads)
- Nodemailer (emails)
- Socket.io (real-time updates)
- dotenv
- CORS

---

## 🏗 Architecture

Frontend (React) → Backend (Express API) → MongoDB Database  
Authentication handled using JWT tokens  
File uploads handled using Multer  
Emails sent using Nodemailer  

---

## 🚀 Installation

### 1. Clone Repository
```bash
git clone https://github.com/your-username/campusconnect.git
cd campusconnect

2. Install Dependencies
Backend:
-cd server
-npm install

Frontend:
-cd client
-npm install

3. Setup Environment Variables
Create .env file inside server folder:

MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
PORT=5000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ADMIN_EMAIL=admin@campus.edu
ADMIN_PASSWORD=admin123

4. Run Project
Backend:
-cd server
-npm start

Frontend:
-cd client
-npm start

👩‍💻 Contributors
CampusConnect: Smart Complaint Tracking System was developed as a collaborative academic project.
Sangeetha C M 
Shakshi Kumari
Saanvee Pothuri

🔮 Future Improvements
Mobile app version
AI-based complaint categorization
Advanced analytics dashboard
Push notifications
Live chat support

📄 License
This project is for academic and learning purposes.

