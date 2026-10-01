import dotenv from 'dotenv';
dotenv.config();

import { addPrescriptionSchema } from '../validators/prescription.validator';
import { addDiagnosticTestSchema, addReferralSchema } from '../validators/clinical.validator';
import { updateMedicalRecordSchema } from '../validators/medicalRecord.validator';

async function runPhase3Verification() {
  console.log('====================================================');
  console.log('   UniHealth Phase 3: Clinical Care Test Suite     ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(testName: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details || 'Assertion failed'}`);
    }
  }

  // 1. Critical Allergy & Condition Validation (REQ 5.2)
  console.log('--- 1. Allergy & Medical Record Schema (REQ 5.2) ---');
  const validRecordUpdate = {
    body: {
      bloodGroup: 'O+',
      allergies: [
        { allergen: 'Penicillin', severity: 'critical', notes: 'Severe anaphylactic shock' },
        { allergen: 'Peanuts', severity: 'moderate' },
      ],
      chronicConditions: ['Asthma'],
    },
  };
  const recordResult = await updateMedicalRecordSchema.safeParseAsync(validRecordUpdate);
  assert('Valid allergy and medical profile passes schema', recordResult.success === true);

  const invalidBloodGroup = {
    body: {
      bloodGroup: 'X-Invalid',
      allergies: [],
    },
  };
  const invalidBgResult = await updateMedicalRecordSchema.safeParseAsync(invalidBloodGroup);
  assert('Invalid blood group is rejected', invalidBgResult.success === false);

  // 2. Prescription Validation (REQ 4.4 & REQ_02)
  console.log('\n--- 2. Digital Prescription Validation (REQ 4.4, REQ_02) ---');
  const validPrescription = {
    body: {
      appointmentId: '65f1234567890abcdef12345',
      civilianId: '65f1234567890abcdef67890',
      medicines: [
        {
          name: 'Amoxicillin',
          dosage: '500mg',
          frequency: '1-0-1 (Twice daily)',
          duration: '5 days',
          notes: 'Take after meals',
        },
        {
          name: 'Paracetamol',
          dosage: '650mg',
          frequency: '1-0-0 (SOS for fever)',
          duration: '3 days',
        },
      ],
    },
  };
  const rxResult = await addPrescriptionSchema.safeParseAsync(validPrescription);
  assert('Valid prescription with all mandatory drug fields passes schema', rxResult.success === true);

  // REQ_02: Test missing dosage or duration
  const invalidPrescriptionIncomplete = {
    body: {
      appointmentId: '65f1234567890abcdef12345',
      civilianId: '65f1234567890abcdef67890',
      medicines: [
        {
          name: 'Amoxicillin',
          dosage: '', // empty dosage
          frequency: '1-0-1',
          duration: '5 days',
        },
      ],
    },
  };
  const rxIncompleteResult = await addPrescriptionSchema.safeParseAsync(invalidPrescriptionIncomplete);
  assert('Prescription with missing dosage rejected per REQ_02', rxIncompleteResult.success === false);

  const emptyMedsPrescription = {
    body: {
      appointmentId: '65f1234567890abcdef12345',
      civilianId: '65f1234567890abcdef67890',
      medicines: [], // empty array
    },
  };
  const rxEmptyResult = await addPrescriptionSchema.safeParseAsync(emptyMedsPrescription);
  assert('Prescription with empty medicines array rejected', rxEmptyResult.success === false);

  // 3. Diagnostic Test Validation (REQ 4.5)
  console.log('\n--- 3. Diagnostic Lab Orders (REQ 4.5) ---');
  const validTestOrder = {
    body: {
      civilianId: '65f1234567890abcdef67890',
      appointmentId: '65f1234567890abcdef12345',
      testNames: ['Complete Blood Count (CBC)', 'Erythrocyte Sedimentation Rate (ESR)'],
      clinicalInstructions: 'Fasting blood sample required before 10:00 AM.',
    },
  };
  const testResult = await addDiagnosticTestSchema.safeParseAsync(validTestOrder);
  assert('Valid diagnostic test order passes schema', testResult.success === true);

  const invalidTestEmpty = {
    body: {
      civilianId: '65f1234567890abcdef67890',
      testNames: [],
      clinicalInstructions: 'Fasting required',
    },
  };
  const testEmptyResult = await addDiagnosticTestSchema.safeParseAsync(invalidTestEmpty);
  assert('Empty diagnostic test list rejected', testEmptyResult.success === false);

  // 4. Specialist Doctor Referral (REQ 4.6)
  console.log('\n--- 4. Specialist Doctor Referral (REQ 4.6) ---');
  const validReferral = {
    body: {
      civilianId: '65f1234567890abcdef67890',
      recommendedDoctorId: '65f1234567890abcdef99999',
      specialization: 'Cardiology',
      clinicalReason: 'Recurrent palpitation episodes during moderate exercise. Needs ECG evaluation.',
    },
  };
  const referralResult = await addReferralSchema.safeParseAsync(validReferral);
  assert('Valid specialist referral passes schema', referralResult.success === true);

  const shortReasonReferral = {
    body: {
      civilianId: '65f1234567890abcdef67890',
      recommendedDoctorId: '65f1234567890abcdef99999',
      specialization: 'Cardiology',
      clinicalReason: 'ECG', // too short (<5 chars)
    },
  };
  const shortReasonResult = await addReferralSchema.safeParseAsync(shortReasonReferral);
  assert('Specialist referral with insufficient reason rejected', shortReasonResult.success === false);

  console.log('\n====================================================');
  console.log(`Phase 3 Tests Completed: ${passed}/${total} Passed.`);
  console.log('====================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase3Verification();
