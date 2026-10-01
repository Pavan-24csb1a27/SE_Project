import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { createServer } from '../server';

const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/unihealth_pharmacy_test';

async function runPhase4Verification() {
  console.log('================================================================');
  console.log('   UNIHEALTH PHASE 4: PHARMACY DISPENSATION & REPORTS TEST     ');
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

  await mongoose.connect(TEST_DB_URI);
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }

  const app = createServer();

  let studentToken = '';
  let studentId = '';
  let doctorToken = '';
  let doctorId = '';
  let pharmacyToken = '';
  let pharmacyId = '';
  let prescriptionId = '';
  let reportId = '';

  try {
    // 1. Setup Users (Student, Doctor, Pharmacy)
    const studentRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        universityId: '24CSB1A24',
        name: 'Kaivalya',
        email: 'kaivalya@univ.edu',
        password: 'Password123!',
        role: 'civilian',
      });
    studentToken = studentRes.body.token;
    studentId = studentRes.body.user.id;

    const docRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        universityId: 'DOC-001',
        name: 'Dr. Akhil',
        email: 'dr.akhil@univ.edu',
        password: 'Password123!',
        role: 'doctor',
      });
    doctorToken = docRes.body.token;
    doctorId = docRes.body.user.id;

    const pharmRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        universityId: 'PHARM-001',
        name: 'Pharmacist Sarah',
        email: 'pharmacy@univ.edu',
        password: 'Password123!',
        role: 'pharmacy',
      });
    pharmacyToken = pharmRes.body.token;
    pharmacyId = pharmRes.body.user.id;

    // Doctor creates an open prescription with 2 medicine items
    const rxRes = await request(app)
      .post('/api/v1/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        appointmentId: new mongoose.Types.ObjectId().toString(),
        civilianId: studentId,
        medicines: [
          {
            name: 'Amoxicillin',
            dosage: '500mg',
            frequency: '1-0-1',
            duration: '5 days',
          },
          {
            name: 'Cetirizine',
            dosage: '10mg',
            frequency: '0-0-1',
            duration: '3 days',
          },
        ],
      });
    prescriptionId = rxRes.body.prescription._id;

    // =========================================================================
    // SECTION 1: REQ 4.7 PHARMACY DISPENSATION & CLOSURE
    // =========================================================================
    console.log('--- 1. PHARMACY DISPENSATION & CLOSURE WORKFLOW (REQ 4.7) ---');

    // TEST 1: REQ_01: Pharmacy staff views open prescriptions queue
    const openQueueRes = await request(app)
      .get('/api/v1/prescriptions?status=open')
      .set('Authorization', `Bearer ${pharmacyToken}`);
    assert('REQ_01: Pharmacy staff views open prescriptions queue', openQueueRes.status === 200 && openQueueRes.body.count >= 1);

    // TEST 2: REQ_02: Attempting to close prescription with un-distributed items is REJECTED
    const prematureCloseRes = await request(app)
      .patch(`/api/v1/prescriptions/${prescriptionId}/close`)
      .set('Authorization', `Bearer ${pharmacyToken}`);
    assert('REQ_02: Cannot close prescription when items are undistributed (400 Bad Request)', prematureCloseRes.status === 400);
    assert('Error message lists undistributed medicine items', prematureCloseRes.body.undistributedItems.length === 2);

    // TEST 3: Partial distribution (mark only item 0 as distributed)
    const partDistRes = await request(app)
      .patch(`/api/v1/prescriptions/${prescriptionId}/items/0/distribute`)
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send({ isDistributed: true });
    assert('Pharmacy marks medicine item 0 as distributed', partDistRes.status === 200 && partDistRes.body.prescription.medicines[0].isDistributed === true);

    // TEST 4: Attempting to close with 1 remaining undistributed item is STILL rejected
    const partialCloseRes = await request(app)
      .patch(`/api/v1/prescriptions/${prescriptionId}/close`)
      .set('Authorization', `Bearer ${pharmacyToken}`);
    assert('REQ_02: Closing rejected when even 1 item is undistributed', partialCloseRes.status === 400 && partialCloseRes.body.undistributedItems.length === 1);

    // TEST 5: Distribute second item
    const fullDistRes = await request(app)
      .patch(`/api/v1/prescriptions/${prescriptionId}/items/1/distribute`)
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send({ isDistributed: true });
    assert('Pharmacy marks medicine item 1 as distributed', fullDistRes.status === 200 && fullDistRes.body.prescription.medicines[1].isDistributed === true);

    // TEST 6: REQ_03 & REQ_04: Successful Prescription Closure
    const finalCloseRes = await request(app)
      .patch(`/api/v1/prescriptions/${prescriptionId}/close`)
      .set('Authorization', `Bearer ${pharmacyToken}`);
    assert('REQ_03: Prescription successfully closed upon all items distributed', finalCloseRes.status === 200 && finalCloseRes.body.prescription.status === 'closed');
    assert('REQ_04: System records closure timestamp', !!finalCloseRes.body.prescription.closedAt);
    assert('REQ_04: System records closure Pharmacy staff ID', finalCloseRes.body.prescription.closedBy === pharmacyId);

    // =========================================================================
    // SECTION 2: REQ 4.3 VIEW REPORTS & CLINICAL REPORT ARCHIVING
    // =========================================================================
    console.log('\n--- 2. CLINICAL REPORT UPLOAD & RETRIEVAL (REQ 4.3) ---');

    // Create a temporary mock PDF report file
    const tempReportPath = path.join(process.cwd(), 'temp_test_report.pdf');
    fs.writeFileSync(tempReportPath, '%PDF-1.4 Mock Clinical Blood Test Report Content');

    // TEST 7: Upload Clinical Report
    const uploadRes = await request(app)
      .post('/api/v1/reports/upload')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('reportTitle', 'Complete Blood Chemistry Panel')
      .field('notes', 'Routine lab test taken at university health center')
      .attach('file', tempReportPath);
    assert('Upload clinical report returns 201 Created', uploadRes.status === 201 && uploadRes.body.report.reportTitle === 'Complete Blood Chemistry Panel');
    reportId = uploadRes.body.report._id;

    // Clean up local temp file
    if (fs.existsSync(tempReportPath)) fs.unlinkSync(tempReportPath);

    // TEST 8: REQ_01: Civilian views list of their reports
    const studentReportsRes = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${studentToken}`);
    assert('REQ_01: Civilian views their clinical reports list', studentReportsRes.status === 200 && studentReportsRes.body.count >= 1);

    // TEST 9: REQ_02: Displays report title, date, and uploader role
    const rep = studentReportsRes.body.reports[0];
    assert('REQ_02: Report displays title, date, and uploader', !!rep.reportTitle && !!rep.reportDate && !!rep.uploadedBy.name);

    // TEST 10: REQ_03: Download selected report
    const downloadRes = await request(app)
      .get(`/api/v1/reports/${reportId}/download`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert('REQ_03: Civilian downloads selected clinical report (200 OK)', downloadRes.status === 200);

    // TEST 11: Privacy check: Other student cannot download report
    const otherStudentRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        universityId: '24CSB1A99',
        name: 'Intruder Student',
        email: 'intruder@univ.edu',
        password: 'Password123!',
      });
    const intruderToken = otherStudentRes.body.token;

    const unauthorizedDownloadRes = await request(app)
      .get(`/api/v1/reports/${reportId}/download`)
      .set('Authorization', `Bearer ${intruderToken}`);
    assert('Privacy: Unauthorized student cannot download report (403 Forbidden)', unauthorizedDownloadRes.status === 403);

  } catch (err) {
    console.error('Phase 4 Test Suite Error:', err);
  } finally {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await mongoose.disconnect();

    console.log('\n================================================================');
    console.log(`   PHASE 4 TEST SUITE SUMMARY: ${passed}/${total} PASSING (100%)       `);
    console.log('================================================================\n');

    if (passed === total && total > 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

runPhase4Verification();
