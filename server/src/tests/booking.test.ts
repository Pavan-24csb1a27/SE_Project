import dotenv from 'dotenv';
dotenv.config();

import { generateTimeSlots } from '../services/schedule.service';
import { lockSlotSchema, bookAppointmentSchema } from '../validators/appointment.validator';
import { sendAppointmentNotification } from '../services/notification.service';

async function runPhase2Verification() {
  console.log('====================================================');
  console.log('   UniHealth Phase 2: Booking & Availability Tests ');
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

  // 1. Time Slot Generator Test
  console.log('--- 1. Discrete Time Slot Generator ---');
  const date = '2026-10-15';
  const slots = generateTimeSlots(date, 9, 13, 30); // 9:00 to 13:00, 30 min slots = 8 slots

  assert('Generates expected number of 30-min slots', slots.length === 8);
  assert('First slot starts at 09:00', slots[0].startTime === '09:00' && slots[0].endTime === '09:30');
  assert('Last slot ends at 13:00', slots[7].startTime === '12:30' && slots[7].endTime === '13:00');
  assert('All initial slots marked available', slots.every((s) => s.status === 'available'));
  assert('Unique slotIds formatted properly', slots[0].slotId === '2026-10-15_0900');

  // 2. Lock Slot Validation Schema (REQ_04)
  console.log('\n--- 2. Lock Slot Validation (Zod) ---');
  const validLock = {
    body: {
      doctorId: '65f1234567890abcdef12345',
      date: '2026-10-15',
      slotId: '2026-10-15_0900',
    },
  };
  const lockResult = await lockSlotSchema.safeParseAsync(validLock);
  assert('Valid lock request payload passes schema', lockResult.success === true);

  const invalidDateFormat = {
    body: {
      doctorId: '65f1234567890abcdef12345',
      date: '15-10-2026', // invalid format
      slotId: '2026-10-15_0900',
    },
  };
  const invalidDateResult = await lockSlotSchema.safeParseAsync(invalidDateFormat);
  assert('Invalid date format is rejected by Zod', invalidDateResult.success === false);

  // 3. Book Appointment Validation Schema (REQ_01 - REQ_05)
  console.log('\n--- 3. Book Appointment Validation (Zod) ---');
  const validBooking = {
    body: {
      doctorId: '65f1234567890abcdef12345',
      date: '2026-10-15',
      slotId: '2026-10-15_0900',
      reasonForVisit: 'Persistent headache and seasonal allergy symptoms',
    },
  };
  const bookResult = await bookAppointmentSchema.safeParseAsync(validBooking);
  assert('Valid booking request passes schema', bookResult.success === true);

  const missingReason = {
    body: {
      doctorId: '65f1234567890abcdef12345',
      date: '2026-10-15',
      slotId: '2026-10-15_0900',
      reasonForVisit: '',
    },
  };
  const missingReasonResult = await bookAppointmentSchema.safeParseAsync(missingReason);
  assert('Empty reason for visit rejected by Zod', missingReasonResult.success === false);

  // 4. Notification Service Test (REQ_06)
  console.log('\n--- 4. Notification Dispatch Service (REQ_06) ---');
  const notifResult = await sendAppointmentNotification({
    appointmentNumber: 'APT-20261015-1234',
    civilianName: 'Kaivalya',
    civilianEmail: 'kaivalya@univ.edu',
    civilianPhone: '+1-555-0199',
    doctorName: 'Akhil',
    date: '2026-10-15',
    timeSlot: '09:00 - 09:30',
    type: 'CONFIRMATION',
  });
  assert('Notification dispatched and returns messageId', notifResult.success === true && !!notifResult.messageId);

  console.log('\n====================================================');
  console.log(`Phase 2 Tests Completed: ${passed}/${total} Passed.`);
  console.log('====================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase2Verification();
