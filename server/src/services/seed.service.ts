import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User.model';
import { DoctorAvailability } from '../models/DoctorAvailability.model';
import { generateTimeSlots } from './schedule.service';

export const autoSeedDemoData = async (): Promise<void> => {
  try {
    const existingDoctors = await User.countDocuments({ role: 'doctor' });
    if (existingDoctors > 0) {
      // Ensure existing doctors have availability for today and the upcoming week
      await ensureDoctorAvailability();
      return;
    }

    console.log('[Seed Service] No clinicians detected. Auto-seeding initial staff and demo schedules...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    // 1. Primary Doctor (General Medicine)
    const doctor = await User.create({
      universityId: 'DOC101',
      name: 'Dr. Akhil Verma',
      email: 'doctor@univ.edu',
      passwordHash,
      role: 'doctor',
      specialization: 'General Medicine',
      department: 'Campus Health Center',
      phone: '+1-555-0102',
      isActive: true,
    });

    // 2. Specialist Doctor (Cardiology)
    const specialist = await User.create({
      universityId: 'DOC102',
      name: 'Dr. Pavan Tej',
      email: 'specialist@univ.edu',
      passwordHash,
      role: 'doctor',
      specialization: 'Cardiology',
      department: 'Specialist Clinic',
      phone: '+1-555-0103',
      isActive: true,
    });

    // 3. Pharmacy Staff
    await User.create({
      universityId: 'PHARM01',
      name: 'Pharmacist Sarah Jenkins',
      email: 'pharmacy@univ.edu',
      passwordHash,
      role: 'pharmacy',
      department: 'Main Dispensary',
      phone: '+1-555-0104',
      isActive: true,
    });

    // 4. Clinic Administrator
    await User.create({
      universityId: 'ADMIN01',
      name: 'Administrator Roy Patel',
      email: 'admin@univ.edu',
      passwordHash,
      role: 'admin',
      department: 'Health Administration',
      phone: '+1-555-0105',
      isActive: true,
    });

    // 5. Demo Student
    await User.create({
      universityId: '24CSB1A27',
      name: 'Kaivalya Sharma',
      email: 'student@univ.edu',
      passwordHash,
      role: 'civilian',
      department: 'Computer Science & Engineering',
      phone: '+1-555-0101',
      isActive: true,
    });

    // Generate schedules for doctors for the next 7 days
    const doctors = [doctor, specialist];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const dateStr = targetDate.toISOString().split('T')[0];

      for (const doc of doctors) {
        const slots = generateTimeSlots(dateStr, 9, 17, 30);
        await DoctorAvailability.findOneAndUpdate(
          {
            doctorId: doc._id,
            date: dateStr,
          },
          {
            doctorId: doc._id,
            date: dateStr,
            slots,
          },
          { upsert: true, new: true }
        );
      }
    }

    console.log('[Seed Service] Successfully initialized default doctors, pharmacy staff, and 7-day consultation slots.');
  } catch (error) {
    console.error('[Seed Service] Error during auto-seeding:', error);
  }
};

/**
 * Ensures all registered doctors have open slots for today and the next 7 days
 */
export const ensureDoctorAvailability = async (): Promise<void> => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true });
    if (doctors.length === 0) return;

    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const dateStr = targetDate.toISOString().split('T')[0];

      for (const doc of doctors) {
        const existing = await DoctorAvailability.findOne({
          doctorId: doc._id,
          date: dateStr,
        });

        if (!existing) {
          const slots = generateTimeSlots(dateStr, 9, 17, 30);
          await DoctorAvailability.create({
            doctorId: doc._id,
            date: dateStr,
            slots,
          });
        }
      }
    }
  } catch (error) {
    console.error('[Seed Service] Error verifying doctor availability:', error);
  }
};
