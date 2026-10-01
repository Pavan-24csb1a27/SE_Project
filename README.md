# UniHealth — Integrated University Health Center Portal

UniHealth is a centralized, role-based healthcare management web platform built for campus health centers. It addresses walk-in congestion, paper chart delays, and overlooked allergies during consultations.

For complete architectural diagrams, database schemas, and end-to-end feature pipelines, see:  
📘 **[`UNIHEALTH_SYSTEM_ARCHITECTURE.md`](./UNIHEALTH_SYSTEM_ARCHITECTURE.md)**

---

## 🚀 Phase 1 Foundation: Implemented & Verified

### Backend (`/server`)
- **Technology:** Node.js, Express.js, TypeScript, Mongoose ODM, Zod.
- **Authentication:** JWT tokens issued upon login and stored in secure HTTP-only cookies (with Bearer token fallback).
- **Security & Password Hashing:** Bcrypt with 10 salt rounds.
- **Role-Based Access Control (RBAC):** Middleware protecting endpoints by role:
  - `civilian` (Students / University Members)
  - `doctor` (Clinicians / Medical Staff)
  - `pharmacy` (Pharmacists / Dispensary Staff)
  - `admin` (Clinic Administrators)
- **Input Validation:** Zod schemas for registration and login.
- **Error Handling:** Centralized Express error handler and security headers with Helmet.
- **Automated Verification:** 11/11 tests passing (`npm run test:auth`).

### Frontend (`/client`)
- **Technology:** React 18+ (Vite), TypeScript, Tailwind CSS, Lucide Icons, Zustand, React Router, TanStack Query.
- **Auth Store:** Zustand-powered authentication state synced with HTTP-only cookies and `/api/v1/auth/me`.
- **Protected Routing:** RBAC route guards (`ProtectedRoute`) that prevent unauthorized role access with clear 403 pages.
- **Pages & Dashboards:**
  - Landing / Hero Page (`/`)
  - Login Page (`/login`)
  - Student Registration Page (`/register`)
  - Civilian / Student Dashboard (`/student`)
  - Clinician / Doctor Dashboard with Critical Allergy Alert Banner (`/doctor`)
  - Pharmacy Dispensation Portal (`/pharmacy`)
  - Clinic Admin Operations Console (`/admin`)

---

## 🛠️ Quick Start

### 1. Prerequisites
- Node.js 20+ LTS
- MongoDB (Local instance or MongoDB Atlas URI)

### 2. Setup Environment Variables
In `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/unihealth
JWT_SECRET=unihealth_super_secret_jwt_key_dev_2026
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:5173
```

### 3. Run Development Servers
From the root directory:
```bash
# Terminal 1: Start Backend API (runs on http://localhost:5000)
npm run dev:server

# Terminal 2: Start Frontend Client (runs on http://localhost:5173)
npm run dev:client
```

### 4. Run Authentication Verification Tests
```bash
npm run test:auth
```

---

## 📋 Next Phases Roadmap
- **Phase 2:** Doctor Availability Schedules & Atomic Concurrency Slot Booking (`REQ_01`–`REQ_06`).
- **Phase 3:** Patient Medical Records, Point-of-Care Allergy Banners & Digital Prescriptions.
- **Phase 4:** Pharmacy Dispensation Tracking, Prescription Closure & S3/Cloudinary Reports.
- **Phase 5:** Admin System Analytics, Audit Trail Logging & Compliance.
