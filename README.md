# UniHealth — Integrated University Health Center Portal

UniHealth is a centralized, role-based healthcare management web platform built for campus health centers. It addresses walk-in congestion, paper chart delays, and overlooked allergies during consultations.

For complete architectural diagrams, database schemas, and end-to-end feature pipelines, see:  
📘 **[`UNIHEALTH_SYSTEM_ARCHITECTURE.md`](./UNIHEALTH_SYSTEM_ARCHITECTURE.md)**

---

## 🚀 Implemented Phases

### Phase 1: Core Foundation & Security (Completed)
- **Backend:** Node.js, Express.js, TypeScript, Mongoose ODM, Zod.
- **Authentication:** JWT tokens issued on login, stored in HTTP-only cookies with Bearer fallback.
- **Security & Password Hashing:** Bcrypt with 10 salt rounds.
- **RBAC Middleware:** Enforcing roles (`civilian`, `doctor`, `pharmacy`, `admin`).
- **Tests:** 11/11 tests passing (`npm run test:auth`).

### Phase 2: Doctor Availability & Atomic Slot Booking (Completed)
- **Availability Engine:** Discrete 30-minute time slot generation (e.g., 09:00 - 17:00, lunch break handled).
- **Concurrency & Double-Booking Guard (`REQ_04`):**
  - Atomic conditional locking (`DoctorAvailability.findOneAndUpdate` with filter `{ status: "available" }`).
  - 5-minute checkout lock window with automatic lazy expiration cleanup.
- **Booking Flow (`REQ_01`–`REQ_06`):**
  - Date-based availability search by doctor.
  - Appointment creation with status `"confirmed"` and human-readable appointment number (`APT-YYYYMMDD-XXXX`).
  - Asynchronous email/SMS notification dispatch (`notification.service.ts`).
  - Appointment cancellation endpoint with automatic time slot release.
- **Frontend UI:**
  - `SlotPicker.tsx`: Real-time color-coded time slot grid (Available, Held for 5m, Booked).
  - `BookAppointmentPage.tsx`: Full booking flow with symptoms input and confirmation screen.
  - `MyAppointmentsPage.tsx`: Student appointment manager with filter tabs and cancellation prompt.
  - `DoctorSchedulePage.tsx`: Clinician working hours and shift configuration portal.
- **Tests:** 10/10 tests passing (`npm --prefix server run test:booking`).

---

## 📋 Next Phases Roadmap
- **Phase 3:** Patient Medical Records, Point-of-Care Allergy Banners (`REQ 5.2`), Digital Prescriptions (`REQ 4.4`), Diagnostic Lab Orders (`REQ 4.5`), & Specialist Doctor Referrals (`REQ 4.6`).
- **Phase 4:** Pharmacy Dispensation Tracking, Prescription Closure Guard (`REQ 4.7`), & S3/Cloudinary Clinical Reports (`REQ 4.3`).
- **Phase 5:** Admin System Analytics, Audit Trail Logging & Compliance.

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
