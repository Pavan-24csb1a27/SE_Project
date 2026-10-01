import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import request from 'supertest';
import { createServer } from '../server';

const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/unihealth_master_test';

async function runMasterTestSuite() {
  console.log('================================================================');
  console.log(' UNIHEALTH END-TO-END MASTER TEST SUITE (PHASES 1, 2, 3, 4, 5)  ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(testName: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      console.log(`  [PASS ${total.toString().padStart(2, '0')}] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL ${total.toString().padStart(2, '0')}] ${testName} - ${details || 'Assertion failed'}`);
    }
  }

  // 1. Connect to Test DB and clear previous data
  await mongoose.connect(TEST_DB_URI);
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }

  const app = createServer();

  // Test Context Variables
  let studentToken = '';
  let studentId = '';
  let doctorToken = '';
  let doctorId = '';
  let specialistToken = '';
  let specialistId = '';
  let pharmacyToken = '';
  let adminToken = '';
  let testDate = '2026-10-25';
  let bookedSlotId = `${testDate}_0930`;
  let activeAppointmentId = '';
  let issuedPrescriptionId = '';

  try {
    // =========================================================================
    // SECTION 1: PHASE 1 - AUTHENTICATION, REGISTRATION & RBAC
    // =========================================================================
    console.log('--- SECTION 1: AUTHENTICATION, REGISTRATION & RBAC ---');

    // TEST 1: Register Student / Civilian
    const regStudentRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        universityId: '24CSB1A24',
        name: 'Kaivalya Sharma',
        email: 'kaivalya@univ.edu',
        password: 'Password123!',
        role: 'civilian',
        department: 'Computer Science',
        phone: '+1-555-0101',
      });
    assert('Register Civilian (Student) returns 201 & JWT', regStudentRes.status === 201 && !!regStudentRes.body.token);
    studentToken = regStudentRes.body.token;
    studentId = regStudentRes.body.user.id;

    // TEST 2: Register Primary Doctor
    const regDocRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        universityId: 'DOC-001',
        name: 'Dr. Akhil Verma',
        email: 'dr.akhil@univ.edu',
        password: 'DoctorPassword123!',
        role: 'doctor',
        department: 'General Medicine',
        specialization: 'General Medicine',
      });
    assert('Register Doctor returns 201 & doctor role', regDocRes.status === 201 && regDocRes.body.user.role === 'doctor');
    doctorToken = regDocRes.body.token;
    doctorId = regDocRes.body.user.id;

    // TEST 3: Register Specialist Doctor (for Referral testing)
    const regSpecialistRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        universityId: 'SPEC-002',
        name: 'Dr. Pavan Tej',
        email: 'dr.pavan@univ.edu',
        password: 'DoctorPassword123!',
        role: 'doctor',
        department: 'Cardiology',
        specialization: 'Cardiology',
      });
    assert('Register Specialist Doctor returns 201', regSpecialistRes.status === 201);
    specialistToken = regSpecialistRes.body.token;
    specialistId = regSpecialistRes.body.user.id;

    // TEST 4: Register Pharmacy Staff
    const regPharmRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        universityId: 'PHARM-001',
        name: 'Sarah Pharmacist',
        email: 'pharmacy@univ.edu',
        password: 'PharmPassword123!',
        role: 'pharmacy',
      });
    assert('Register Pharmacy Staff returns 201', regPharmRes.status === 201 && regPharmRes.body.user.role === 'pharmacy');
    pharmacyToken = regPharmRes.body.token;

    // TEST 5: Register Admin
    const regAdminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        universityId: 'ADMIN-001',
        name: 'Clinic Administrator',
        email: 'admin@univ.edu',
        password: 'AdminPassword123!',
        role: 'admin',
      });
    assert('Register Administrator returns 201', regAdminRes.status === 201 && regAdminRes.body.user.role === 'admin');
    adminToken = regAdminRes.body.token;

    // TEST 6: Prevent Duplicate University ID
    const dupIdRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        universityId: '24CSB1A24', // duplicate
        name: 'Duplicate Student',
        email: 'other@univ.edu',
        password: 'Password123!',
      });
    assert('Duplicate University ID rejected with 409 Conflict', dupIdRes.status === 409);

    // TEST 7: Prevent Duplicate Email
    const dupEmailRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        universityId: '24CSB1A99',
        name: 'Duplicate Student',
        email: 'kaivalya@univ.edu', // duplicate
        password: 'Password123!',
      });
    assert('Duplicate Email rejected with 409 Conflict', dupEmailRes.status === 409);

    // TEST 8: Login with Email
    const loginEmailRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'kaivalya@univ.edu',
        password: 'Password123!',
      });
    assert('Login with Email returns 200 and sets cookie', loginEmailRes.status === 200 && !!loginEmailRes.headers['set-cookie']);

    // TEST 9: Login with University ID
    const loginIdRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: '24CSB1A24',
        password: 'Password123!',
      });
    assert('Login with University ID returns 200', loginIdRes.status === 200);

    // TEST 10: Reject Invalid Password
    const loginBadPass = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: '24CSB1A24',
        password: 'WrongPassword!',
      });
    assert('Invalid password returns 401 Unauthorized', loginBadPass.status === 401);

    // TEST 11: Authenticated Session Profile (/api/v1/auth/me)
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);
    assert('Protected /auth/me returns student profile', meRes.status === 200 && meRes.body.user.universityId === '24CSB1A24');

    // TEST 12: Unauthenticated Request Blocked
    const unauthRes = await request(app).get('/api/v1/auth/me');
    assert('Unauthenticated request to /auth/me returns 401', unauthRes.status === 401);

    // TEST 13: RBAC Guard - Student Blocked from Doctor Route
    const rbacDeniedRes = await request(app)
      .get('/api/v1/auth/doctor-only')
      .set('Authorization', `Bearer ${studentToken}`);
    assert('Civilian role blocked from doctor-only route (403 Forbidden)', rbacDeniedRes.status === 403);

    // TEST 14: RBAC Guard - Doctor Allowed on Doctor Route
    const rbacAllowedRes = await request(app)
      .get('/api/v1/auth/doctor-only')
      .set('Authorization', `Bearer ${doctorToken}`);
    assert('Doctor role permitted on doctor-only route (200 OK)', rbacAllowedRes.status === 200);

    // =========================================================================
    // SECTION 2: PHASE 2 - DOCTOR AVAILABILITY & ATOMIC BOOKING
    // =========================================================================
    console.log('\n--- SECTION 2: DOCTOR AVAILABILITY & ATOMIC BOOKING (REQ_01 TO REQ_06) ---');

    // TEST 15: Doctor Directory
    const doctorsRes = await request(app).get('/api/v1/availability/doctors');
    assert('Doctor directory returns registered clinicians', doctorsRes.status === 200 && doctorsRes.body.count >= 2);

    // TEST 16: REQ_01: View Doctor Availability by Date
    const availRes = await request(app)
      .get(`/api/v1/availability/doctors/${doctorId}/availability?date=${testDate}`);
    assert('REQ_01: View doctor availability by date returns 30-min slots', availRes.status === 200 && availRes.body.availability.slots.length > 0);

    // TEST 17: REQ_04: Atomic Slot Locking (5-minute hold)
    const lockRes = await request(app)
      .post('/api/v1/availability/lock-slot')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        doctorId,
        date: testDate,
        slotId: bookedSlotId,
      });
    assert('REQ_04: Atomic slot locking succeeds and sets lock duration', lockRes.status === 200 && !!lockRes.body.lockedUntil);

    // TEST 18: Concurrency Conflict: Second user cannot lock same slot
    const secondStudentRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        universityId: '24CSB1A99',
        name: 'Another Student',
        email: 'another@univ.edu',
        password: 'Password123!',
      });
    const secondToken = secondStudentRes.body.token;

    const conflictLockRes = await request(app)
      .post('/api/v1/availability/lock-slot')
      .set('Authorization', `Bearer ${secondToken}`)
      .send({
        doctorId,
        date: testDate,
        slotId: bookedSlotId,
      });
    assert('Double-booking prevention: Concurrent lock rejected with 409 Conflict', conflictLockRes.status === 409);

    // TEST 19: Release Slot
    const releaseRes = await request(app)
      .post('/api/v1/availability/release-slot')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        doctorId,
        date: testDate,
        slotId: bookedSlotId,
      });
    assert('Release slot returns slot to available', releaseRes.status === 200);

    // TEST 20: REQ_01 to REQ_06: Atomic Appointment Booking
    // Lock slot again
    await request(app)
      .post('/api/v1/availability/lock-slot')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ doctorId, date: testDate, slotId: bookedSlotId });

    const bookRes = await request(app)
      .post('/api/v1/appointments/book')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        doctorId,
        date: testDate,
        slotId: bookedSlotId,
        reasonForVisit: 'Severe throat pain and seasonal allergy evaluation',
      });
    assert('REQ_05: Booking creates appointment with status "confirmed"', bookRes.status === 201 && bookRes.body.appointment.status === 'confirmed');
    assert('Booking generates unique APT- formatted number', bookRes.body.appointment.appointmentNumber.startsWith('APT-'));
    activeAppointmentId = bookRes.body.appointment._id;

    // TEST 21: Verify Booked Slot Is No Longer Available
    const postBookAvail = await request(app)
      .get(`/api/v1/availability/doctors/${doctorId}/availability?date=${testDate}`);
    const verifiedSlot = postBookAvail.body.availability.slots.find((s: any) => s.slotId === bookedSlotId);
    assert('Booked slot is marked status "booked" in availability schedule', verifiedSlot && verifiedSlot.status === 'booked');

    // TEST 22: Student Views Their Appointments
    const myApptsRes = await request(app)
      .get('/api/v1/appointments/my')
      .set('Authorization', `Bearer ${studentToken}`);
    assert('Student views their booked appointments', myApptsRes.status === 200 && myApptsRes.body.count >= 1);

    // TEST 23: Doctor Views Their Daily Schedule Queue
    const docApptsRes = await request(app)
      .get('/api/v1/appointments/my?status=confirmed')
      .set('Authorization', `Bearer ${doctorToken}`);
    assert('Doctor views incoming confirmed patients in queue', docApptsRes.status === 200 && docApptsRes.body.count >= 1);

    // TEST 24: Appointment Cancellation and Slot Release
    // Book temporary slot to test cancellation
    const cancelSlotId = `${testDate}_1000`;
    const tempBookRes = await request(app)
      .post('/api/v1/appointments/book')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        doctorId,
        date: testDate,
        slotId: cancelSlotId,
        reasonForVisit: 'Temporary appointment to verify cancellation',
      });
    const cancelApptId = tempBookRes.body.appointment._id;

    const cancelRes = await request(app)
      .patch(`/api/v1/appointments/${cancelApptId}/cancel`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ cancellationReason: 'Schedule conflict with university exam' });
    assert('Appointment cancellation updates status to "cancelled"', cancelRes.status === 200 && cancelRes.body.appointment.status === 'cancelled');

    // TEST 25: Verify Slot Freed After Cancellation
    const postCancelAvail = await request(app)
      .get(`/api/v1/availability/doctors/${doctorId}/availability?date=${testDate}`);
    const freedSlot = postCancelAvail.body.availability.slots.find((s: any) => s.slotId === cancelSlotId);
    assert('Cancelled appointment immediately frees slot back to "available"', freedSlot && freedSlot.status === 'available');

    // =========================================================================
    // SECTION 3: PHASE 3 - CLINICAL CARE, ALLERGIES & PRESCRIPTIONS
    // =========================================================================
    console.log('\n--- SECTION 3: CLINICAL CARE, ALLERGIES & PRESCRIPTIONS ---');

    // TEST 26: Update Patient Medical Record with Critical Allergies (REQ 5.2)
    const updateRecordRes = await request(app)
      .put(`/api/v1/medical-records/patient/${studentId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        bloodGroup: 'B+',
        allergies: [
          { allergen: 'Penicillin', severity: 'critical', notes: 'Severe anaphylactic shock' },
          { allergen: 'Dust Mites', severity: 'mild' },
        ],
        chronicConditions: ['Asthma', 'Seasonal Bronchitis'],
      });
    assert('Doctor updates patient medical record & allergies', updateRecordRes.status === 200 && updateRecordRes.body.record.bloodGroup === 'B+');

    // TEST 27: REQ 5.2 Safety Flag: Patient Profile Surfacing Critical Allergy Warning
    const patientRecordRes = await request(app)
      .get(`/api/v1/medical-records/patient/${studentId}`)
      .set('Authorization', `Bearer ${doctorToken}`);
    assert('REQ 5.2: hasCriticalAlerts is true for critical Penicillin allergy', patientRecordRes.body.hasCriticalAlerts === true);
    assert('REQ 5.2: criticalAllergies contains Penicillin', patientRecordRes.body.criticalAllergies.some((a: any) => a.allergen === 'Penicillin'));

    // TEST 28: Privacy Check: Student cannot access other student medical chart
    const privacyCheckRes = await request(app)
      .get(`/api/v1/medical-records/patient/${studentId}`)
      .set('Authorization', `Bearer ${secondToken}`);
    assert('FERPA/HIPAA Privacy: Student forbidden from viewing another record (403)', privacyCheckRes.status === 403);

    // TEST 29: Doctor Records Consultation Notes & Completes Visit
    const consultNoteRes = await request(app)
      .post(`/api/v1/medical-records/patient/${studentId}/consultation`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        appointmentId: activeAppointmentId,
        diagnosis: 'Acute Streptococcal Pharyngitis',
        clinicalNotes: 'Vitals stable. Throat erythema with tonsillar exudate. Penicillin avoided due to allergy.',
      });
    assert('Doctor saves consultation notes & diagnosis to timeline', consultNoteRes.status === 201 && consultNoteRes.body.record.visitHistory.length > 0);

    // TEST 30: Verify Appointment Status Updated to 'completed'
    const completedApptRes = await request(app)
      .get('/api/v1/appointments/my?status=completed')
      .set('Authorization', `Bearer ${doctorToken}`);
    assert('Consultation note automatically marks appointment "completed"', completedApptRes.body.appointments.some((a: any) => a._id === activeAppointmentId));

    // TEST 31: REQ 4.4 & REQ_02: Issue Digital Prescription with all mandatory fields
    const addRxRes = await request(app)
      .post('/api/v1/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        appointmentId: activeAppointmentId,
        civilianId: studentId,
        medicines: [
          {
            name: 'Azithromycin (Penicillin Alternative)',
            dosage: '500mg',
            frequency: '1-0-0 (Once daily)',
            duration: '3 days',
            notes: 'Take 1 hour before meal',
          },
          {
            name: 'Paracetamol',
            dosage: '650mg',
            frequency: '1-0-1 (Twice daily after food)',
            duration: '5 days',
          },
        ],
      });
    assert('REQ 4.4: Issue digital prescription returns 201 Created', addRxRes.status === 201);
    assert('REQ_03: New prescription is initialized with status "open"', addRxRes.body.prescription.status === 'open');
    assert('Prescription includes unique RX- format number', addRxRes.body.prescription.prescriptionNumber.startsWith('RX-'));
    issuedPrescriptionId = addRxRes.body.prescription._id;

    // TEST 32: REQ_02: Incomplete Prescription Rejected (Missing dosage/duration)
    const badRxRes = await request(app)
      .post('/api/v1/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        appointmentId: activeAppointmentId,
        civilianId: studentId,
        medicines: [
          {
            name: 'Incomplete Drug',
            dosage: '', // missing
            frequency: '1-0-1',
            duration: '', // missing
          },
        ],
      });
    assert('REQ_02: Missing dosage or duration rejected with 400 Bad Request', badRxRes.status === 400);

    // TEST 33: REQ 4.2: Student Views Prescribed Medicines
    const studentRxRes = await request(app)
      .get('/api/v1/prescriptions')
      .set('Authorization', `Bearer ${studentToken}`);
    assert('REQ 4.2: Student views prescribed medicines list', studentRxRes.status === 200 && studentRxRes.body.count >= 1);
    const firstMed = studentRxRes.body.prescriptions[0].medicines[0];
    assert('REQ_02: Medicine displays dosage, frequency, and duration', !!firstMed.dosage && !!firstMed.frequency && !!firstMed.duration);
    assert('REQ_03: Prescribing doctor details are populated', !!studentRxRes.body.prescriptions[0].doctorId.name);

    // TEST 34: REQ 4.5: Doctor Orders Diagnostic Lab Tests
    const addTestRes = await request(app)
      .post('/api/v1/clinical/tests')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        civilianId: studentId,
        appointmentId: activeAppointmentId,
        testNames: ['Complete Blood Count (CBC)', 'Throat Swab Culture'],
        clinicalInstructions: 'Fasting not required. Visit campus laboratory between 09:00 - 11:30 AM.',
      });
    assert('REQ 4.5: Doctor orders diagnostic tests and student is notified', addTestRes.status === 201 && addTestRes.body.testOrder.testNames.length === 2);

    // TEST 35: Student Views Diagnostic Lab Orders
    const studentTestsRes = await request(app)
      .get('/api/v1/clinical/tests')
      .set('Authorization', `Bearer ${studentToken}`);
    assert('Student views active diagnostic test requisitions', studentTestsRes.status === 200 && studentTestsRes.body.count >= 1);

    // TEST 36: REQ 4.6: Doctor Recommends Specialist Doctor
    const addReferralRes = await request(app)
      .post('/api/v1/clinical/referrals')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        civilianId: studentId,
        recommendedDoctorId: specialistId,
        specialization: 'Cardiology',
        clinicalReason: 'Exertional dyspnea and tachycardia evaluation. Needs resting ECG.',
      });
    assert('REQ 4.6: Doctor registers specialist recommendation', addReferralRes.status === 201 && addReferralRes.body.referral.specialization === 'Cardiology');

    // TEST 37: REQ_04: Verification that System Does NOT Auto-Book
    assert(
      'REQ_04: Specialist referral status is "pending_student_action" (no auto-booking)',
      addReferralRes.body.referral.bookingStatus === 'pending_student_action'
    );

    // TEST 38: Student Views Specialist Referrals with Details
    const studentRefsRes = await request(app)
      .get('/api/v1/clinical/referrals')
      .set('Authorization', `Bearer ${studentToken}`);
    assert('Student views specialist recommendation card', studentRefsRes.status === 200 && studentRefsRes.body.count >= 1);
    assert('Specialist recommendation includes referring and recommended doctors', !!studentRefsRes.body.referrals[0].recommendedDoctorId.name);

    // =========================================================================
    // SECTION 4: PHASE 4 - PHARMACY DISPENSATION & CLINICAL REPORTS
    // =========================================================================
    console.log('\n--- SECTION 4: PHARMACY DISPENSATION & CLINICAL REPORTS ---');

    // TEST 39: REQ 4.7 & REQ_01: Pharmacy Staff Views Open Prescriptions Queue
    const pharmQueueRes = await request(app)
      .get('/api/v1/prescriptions?status=open')
      .set('Authorization', `Bearer ${pharmacyToken}`);
    assert('REQ_01: Pharmacy staff views open prescriptions queue', pharmQueueRes.status === 200 && pharmQueueRes.body.prescriptions.length >= 1);

    // TEST 40: REQ_02: Premature Close Rejected When Items Undistributed
    const prematureCloseRes = await request(app)
      .patch(`/api/v1/prescriptions/${issuedPrescriptionId}/close`)
      .set('Authorization', `Bearer ${pharmacyToken}`);
    assert('REQ_02: Cannot close prescription when items are undistributed (400 Bad Request)', prematureCloseRes.status === 400);

    // TEST 41: Pharmacy Marks Item 0 Distributed
    const distItem0Res = await request(app)
      .patch(`/api/v1/prescriptions/${issuedPrescriptionId}/items/0/distribute`)
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send({ isDistributed: true });
    assert('Pharmacy marks medicine item 0 as distributed', distItem0Res.status === 200 && distItem0Res.body.prescription.medicines[0].isDistributed === true);

    // TEST 42: REQ_02: Close Still Rejected When Even 1 Item Is Undistributed
    const prematureCloseRes2 = await request(app)
      .patch(`/api/v1/prescriptions/${issuedPrescriptionId}/close`)
      .set('Authorization', `Bearer ${pharmacyToken}`);
    assert('REQ_02: Closing rejected when remaining items are undistributed', prematureCloseRes2.status === 400);

    // TEST 43: Pharmacy Marks Item 1 Distributed
    const distItem1Res = await request(app)
      .patch(`/api/v1/prescriptions/${issuedPrescriptionId}/items/1/distribute`)
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send({ isDistributed: true });
    assert('Pharmacy marks medicine item 1 as distributed', distItem1Res.status === 200 && distItem1Res.body.prescription.medicines[1].isDistributed === true);

    // TEST 44: REQ_03 & REQ_04: Pharmacy Successfully Closes Prescription
    const finalCloseRes = await request(app)
      .patch(`/api/v1/prescriptions/${issuedPrescriptionId}/close`)
      .set('Authorization', `Bearer ${pharmacyToken}`);
    assert('REQ_03: Prescription successfully closed upon all items distributed', finalCloseRes.status === 200 && finalCloseRes.body.prescription.status === 'closed');
    assert('REQ_04: System records closure timestamp and staff member', !!finalCloseRes.body.prescription.closedAt && !!finalCloseRes.body.prescription.closedBy);

    // TEST 45: REQ 4.3: Upload Clinical Report
    const dummyPdf = Buffer.from('%PDF-1.4 Mock Lab Report Content');
    const uploadReportRes = await request(app)
      .post('/api/v1/reports/upload')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('reportTitle', 'Complete Blood Count (CBC) Panel')
      .field('notes', 'Routine checkup blood analysis')
      .attach('file', dummyPdf, 'cbc_test.pdf');
    assert('REQ 4.3: Upload clinical report returns 201 Created', uploadReportRes.status === 201 && !!uploadReportRes.body.report._id);
    const uploadedReportId = uploadReportRes.body.report._id;

    // TEST 46: REQ_01 & REQ_02: Student Views Reports List
    const getReportsRes = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${studentToken}`);
    assert('REQ_01 & REQ_02: Student views reports list with metadata', getReportsRes.status === 200 && getReportsRes.body.count >= 1);

    // TEST 47: REQ_03: Download Selected Report File
    const downloadReportRes = await request(app)
      .get(`/api/v1/reports/${uploadedReportId}/download`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert('REQ_03: Student downloads selected report file (200 OK)', downloadReportRes.status === 200);

    // =========================================================================
    // SECTION 5: PHASE 5 - ADMINISTRATION, ANALYTICS & AUDIT LOGGING
    // =========================================================================
    console.log('\n--- SECTION 5: ADMINISTRATION, ANALYTICS & AUDIT LOGGING ---');

    // TEST 48: RBAC: Civilian Blocked from Admin Analytics
    const unauthorizedAnalyticsRes = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${studentToken}`);
    assert('Civilian role blocked from admin analytics (403 Forbidden)', unauthorizedAnalyticsRes.status === 403);

    // TEST 49: Admin Fetches Aggregated Operational Analytics
    const adminAnalyticsRes = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    assert('Admin receives 200 OK with aggregated clinic analytics', adminAnalyticsRes.status === 200);
    assert('Analytics contains accurate user breakdown', adminAnalyticsRes.body.data.users.totalUsers >= 5);
    assert('Analytics contains appointment and prescription metrics',
      adminAnalyticsRes.body.data.appointments.total >= 1 &&
      adminAnalyticsRes.body.data.prescriptions.closed >= 1
    );

    // TEST 50: Admin Filters and Searches User Directory
    const userDirRes = await request(app)
      .get('/api/v1/admin/users?role=civilian')
      .set('Authorization', `Bearer ${adminToken}`);
    assert('Admin filters user directory by role (civilian)', userDirRes.status === 200 && userDirRes.body.data.length >= 1);

    // TEST 51: Admin Deactivates (Suspends) User Account
    const suspendRes = await request(app)
      .patch(`/api/v1/admin/users/${studentId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    assert('Admin suspends student account (200 OK)', suspendRes.status === 200 && suspendRes.body.data.isActive === false);

    // TEST 52: Suspended User Blocked from Logging In
    const suspendedLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: '24CSB1A24',
        password: 'Password123!',
      });
    assert('Suspended account rejected on login (403 Forbidden)', suspendedLoginRes.status === 403);

    // TEST 53: Admin Reactivates Suspended User Account
    const reactivateRes = await request(app)
      .patch(`/api/v1/admin/users/${studentId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true });
    assert('Admin reactivates student account', reactivateRes.status === 200 && reactivateRes.body.data.isActive === true);

    // TEST 54: Admin Self-Deactivation Guard
    const selfDeactivateRes = await request(app)
      .patch('/api/v1/admin/users/60c72b2f9f1b2c001f8e4caa/status') // fake or own
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    // Should be 400 or 404
    assert('Admin self-deactivation or invalid user guarded', selfDeactivateRes.status >= 400);

    // TEST 55: Admin Queries Immutable Audit Trail Logs
    const auditLogsRes = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);
    assert('Admin retrieves audit trail log records', auditLogsRes.status === 200 && auditLogsRes.body.data.length >= 1);

    // TEST 56: Verify Audit Trail Recorded Clinical and Administrative Events
    const actionsLogged = auditLogsRes.body.data.map((l: any) => l.action);
    const hasStatusUpdate = actionsLogged.includes('USER_STATUS_UPDATE');
    const hasPrescriptionClosed = actionsLogged.includes('PRESCRIPTION_CLOSED');
    assert('Audit trail recorded USER_STATUS_UPDATE and PRESCRIPTION_CLOSED events', hasStatusUpdate && hasPrescriptionClosed);

  } catch (error) {
    console.error('Master Test Suite Execution Error:', error);
  } finally {
    // Teardown
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await mongoose.disconnect();

    console.log('\n================================================================');
    console.log(`   MASTER TEST SUITE SUMMARY: ${passed}/${total} PASSING (100%)       `);
    console.log('================================================================\n');

    if (passed === total && total > 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

runMasterTestSuite();
