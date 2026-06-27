# CampusConnect: Smart Complaint Tracking System

## 📌 Overview

CampusConnect: Smart Complaint Tracking System is a full-stack web application designed to streamline complaint management in educational institutions. The platform enables students to submit complaints, staff to resolve issues, and administrators to manage and monitor the entire workflow efficiently through a secure role-based access control system.

---

## ✨ Features

### 🔐 Authentication & Authorization

* Role-Based Access Control (Student, Staff, Admin)
* JWT-based secure authentication
* Password encryption using bcrypt
* Protected routes based on user roles

### 📝 Complaint Management

* Submit complaints with title, description, category, urgency, and supporting images
* Track complaint status (Pending → In Progress → Resolved)
* Upload evidence images using Multer

### 👥 Staff Module

* View assigned complaints
* Update complaint progress with remarks and images
* Change complaint status

### 👨‍💼 Admin Dashboard

* View all complaints
* Assign complaints to staff
* Monitor complaint statistics
* Manage users and complaint categories

### 💬 Feedback System

* Rating system for resolved complaints
* User comments and feedback tracking

### 📧 Notifications

* Email notifications using Nodemailer
* Complaint status update alerts

---

## 🛠 Tech Stack

### Frontend

* React
* React Router DOM
* Axios
* Bootstrap
* JWT Decode

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* bcryptjs

### Tools & Libraries

* Multer (File Uploads)
* Nodemailer (Email Service)
* Socket.io (Real-time Updates)
* dotenv
* CORS

---

## 🏗 System Architecture

Frontend (React) → Express.js REST API → MongoDB Database

* JWT for Authentication
* Multer for File Uploads
* Nodemailer for Email Notifications
* Socket.io for Real-time Communication

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sangeethacm993-tech/CampusConnect.git
cd CampusConnect
```

### 2. Install Dependencies

#### Backend

```bash
cd server
npm install
```

#### Frontend

```bash
cd client
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the **server** folder.

```env
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
PORT=5000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ADMIN_EMAIL=admin@campus.edu
ADMIN_PASSWORD=admin123
```

### 4. Run the Project

#### Backend

```bash
cd server
npm start
```

#### Frontend

```bash
cd client
npm start
```

---

## 📸 Screenshots

### Login Page
![Login Page](images/login.png)

### Student Dashboard
![Student Dashboard](images/student-dashboard.png)

### Staff Dashboard
![Staff Dashboard](images/staff-dashboard.png)

### Admin Dashboard
![Admin Dashboard](images/admin-dashboard.png)


## 👩‍💻 Contributors

CampusConnect: Smart Complaint Tracking System was developed as a collaborative academic project by:

* **Sangeetha C M**
* **Shakshi Kumari**
* **Saanvee Pothuri**

---

## 🔮 Future Improvements

* Mobile application
* AI-based complaint categorization
* Advanced analytics dashboard
* Push notifications
* Live chat support

---

## 📄 License

This project is developed for academic and learning purposes.
