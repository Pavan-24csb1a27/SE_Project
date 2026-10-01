import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import request from 'supertest';
import { createServer } from '../server';
import { User } from '../models/User.model';

const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/unihealth_admin_test';

async function runPhase5Verification() {
  console.log('================================================================');
  console.log('   UNIHEALTH PHASE 5: ADMINISTRATION, ANALYTICS & AUDIT TEST    ');
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

  let adminToken = '';
  let adminId = '';
  let doctorToken = '';
  let civilianToken = '';
  let studentUserId = '';

  try {
    // 1. Create Admin
    const adminRes = await request(app).post('/api/v1/auth/register').send({
      universityId: 'ADM-001',
      name: 'System Administrator',
      email: 'admin@unihealth.univ.edu',
      password: 'AdminPassword123!',
      role: 'admin',
    });
    adminToken = adminRes.body.token;
    adminId = adminRes.body.user.id;

    // 2. Create Doctor
    const docRes = await request(app).post('/api/v1/auth/register').send({
      universityId: 'DOC-501',
      name: 'Dr. Sarah Connor',
      email: 'sconnor@med.univ.edu',
      password: 'DoctorPassword123!',
      role: 'doctor',
      specialization: 'General Medicine',
    });
    doctorToken = docRes.body.token;

    // 3. Create Student / Civilian
    const civRes = await request(app).post('/api/v1/auth/register').send({
      universityId: 'STU-9901',
      name: 'Alex Mercer',
      email: 'amercer@univ.edu',
      password: 'StudentPassword123!',
      role: 'civilian',
      department: 'Biotechnology',
    });
    civilianToken = civRes.body.token;
    studentUserId = civRes.body.user.id;

    console.log('--- 1. RBAC SECURITY GUARDS ON ADMIN ENDPOINTS ---');
    // Test 1: Unauthenticated
    const res1 = await request(app).get('/api/v1/admin/analytics');
    assert('Unauthenticated access blocked (401 Unauthorized)', res1.status === 401);

    // Test 2: Civilian
    const res2 = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${civilianToken}`);
    assert('Civilian role blocked from admin analytics (403 Forbidden)', res2.status === 403);

    // Test 3: Doctor
    const res3 = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${doctorToken}`);
    assert('Doctor role blocked from admin analytics (403 Forbidden)', res3.status === 403);

    console.log('\n--- 2. OPERATIONAL ANALYTICS & AGGREGATIONS ---');
    // Test 4: Admin fetches analytics
    const res4 = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    assert('Admin receives 200 OK on analytics endpoint', res4.status === 200);
    assert('Analytics contains users distribution', res4.body.data?.users?.totalUsers >= 3);
    assert('Analytics counts admin, doctor, and civilian accounts',
      res4.body.data?.users?.admin === 1 &&
      res4.body.data?.users?.doctor === 1 &&
      res4.body.data?.users?.civilian === 1
    );
    assert('Analytics contains appointment & prescription summaries',
      res4.body.data?.appointments !== undefined &&
      res4.body.data?.prescriptions !== undefined
    );

    console.log('\n--- 3. USER MANAGEMENT & LIFECYCLE (ACTIVATE / SUSPEND) ---');
    // Test 8: Filter users by role
    const res5 = await request(app)
      .get('/api/v1/admin/users?role=civilian')
      .set('Authorization', `Bearer ${adminToken}`);
    assert('Admin filters user directory by role',
      res5.status === 200 && res5.body.data.length === 1 && res5.body.data[0].universityId === 'STU-9901'
    );

    // Test 9: Search users by keyword
    const res6 = await request(app)
      .get('/api/v1/admin/users?search=mercer')
      .set('Authorization', `Bearer ${adminToken}`);
    assert('Admin searches user directory by name keyword',
      res6.status === 200 && res6.body.data[0].name === 'Alex Mercer'
    );

    // Test 10: Admin deactivates (suspends) user
    const res7 = await request(app)
      .patch(`/api/v1/admin/users/${studentUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    assert('Admin deactivates student account (200 OK)', res7.status === 200 && res7.body.data.isActive === false);

    // Test 11: Suspended user cannot log in
    const res8 = await request(app).post('/api/v1/auth/login').send({
      identifier: 'STU-9901',
      password: 'StudentPassword123!',
    });
    assert('Suspended user login rejected with 403 Forbidden', res8.status === 403 && /deactivated/i.test(res8.body.message));

    // Test 12: Admin reactivates account
    const res9 = await request(app)
      .patch(`/api/v1/admin/users/${studentUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true });
    assert('Admin reactivates student account', res9.status === 200 && res9.body.data.isActive === true);

    // Test 13: Admin self-deactivation protection
    const res10 = await request(app)
      .patch(`/api/v1/admin/users/${adminId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    assert('Admin cannot deactivate own account (400 Bad Request)', res10.status === 400);

    console.log('\n--- 4. IMMUTABLE AUDIT TRAIL LOGGING ---');
    // Test 14: Retrieve audit logs
    const res11 = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);
    assert('Admin retrieves audit trail log entries', res11.status === 200 && res11.body.data.length > 0);

    // Test 15: Check presence of logged actions
    const hasStatusUpdateLog = res11.body.data.some((l: any) => l.action === 'USER_STATUS_UPDATE');
    assert('Audit trail recorded USER_STATUS_UPDATE event', hasStatusUpdateLog);

    // Test 16: Filter audit logs by action
    const res12 = await request(app)
      .get('/api/v1/admin/audit-logs?action=USER_STATUS_UPDATE')
      .set('Authorization', `Bearer ${adminToken}`);
    assert('Audit trail filter by action returns matching records',
      res12.status === 200 && res12.body.data.every((l: any) => l.action === 'USER_STATUS_UPDATE')
    );

  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await mongoose.connection.close();
  }

  console.log('\n================================================================');
  console.log(`   PHASE 5 TEST SUITE SUMMARY: ${passed}/${total} PASSING (${Math.round((passed / total) * 100)}%)       `);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase5Verification();
