import { Response } from 'express';
import mongoose from 'mongoose';
import { DiagnosticTest } from '../models/DiagnosticTest.model';
import { SpecialistReferral } from '../models/SpecialistReferral.model';
import { User } from '../models/User.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendAppointmentNotification } from '../services/notification.service';

// REQ 4.5: Add Tests (Doctor)
export const addDiagnosticTest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { civilianId, appointmentId, testNames, clinicalInstructions } = req.body;
    const doctorId = req.user?.userId;

    if (!doctorId) {
      res.status(401).json({ success: false, message: 'Unauthenticated doctor.' });
      return;
    }

    const civilian = await User.findById(civilianId);
    const doctor = await User.findById(doctorId);

    if (!civilian || !doctor) {
      res.status(404).json({ success: false, message: 'Civilian or Doctor not found.' });
      return;
    }

    const testOrder = await DiagnosticTest.create({
      civilianId: new mongoose.Types.ObjectId(civilianId),
      doctorId: new mongoose.Types.ObjectId(doctorId),
      appointmentId: appointmentId ? new mongoose.Types.ObjectId(appointmentId) : undefined,
      testNames,
      clinicalInstructions,
      status: 'recommended',
    });

    // REQ_03: Notify Civilian of the recommended test(s)
    await sendAppointmentNotification({
      appointmentNumber: `TEST-${testOrder._id.toString().slice(-6).toUpperCase()}`,
      civilianName: civilian.name,
      civilianEmail: civilian.email,
      doctorName: doctor.name,
      date: new Date().toISOString().split('T')[0],
      timeSlot: testNames.join(', '),
      type: 'CONFIRMATION',
    });

    res.status(201).json({
      success: true,
      message: 'Diagnostic test order saved and student notified.',
      testOrder,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to order diagnostic test.',
    });
  }
};

export const getDiagnosticTests = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const { civilianId } = req.query as { civilianId?: string };

    const query: any = {};
    if (role === 'civilian') {
      query.civilianId = new mongoose.Types.ObjectId(userId);
    } else if (civilianId) {
      query.civilianId = new mongoose.Types.ObjectId(civilianId);
    }

    const tests = await DiagnosticTest.find(query)
      .populate('doctorId', 'name specialization email')
      .populate('civilianId', 'name universityId email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tests.length,
      tests,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch diagnostic tests.',
    });
  }
};

// REQ 4.6: Recommend Specialist Doctors (Doctor)
export const addReferral = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { civilianId, recommendedDoctorId, specialization, clinicalReason } = req.body;
    const referringDoctorId = req.user?.userId;

    if (!referringDoctorId) {
      res.status(401).json({ success: false, message: 'Unauthenticated doctor.' });
      return;
    }

    const civilian = await User.findById(civilianId);
    const referringDoctor = await User.findById(referringDoctorId);
    const specialist = await User.findById(recommendedDoctorId);

    if (!civilian || !referringDoctor || !specialist) {
      res.status(404).json({ success: false, message: 'Patient, referring doctor or specialist not found.' });
      return;
    }

    // REQ_02 & REQ_04: Save referral without auto-booking
    const referral = await SpecialistReferral.create({
      civilianId: new mongoose.Types.ObjectId(civilianId),
      referringDoctorId: new mongoose.Types.ObjectId(referringDoctorId),
      recommendedDoctorId: new mongoose.Types.ObjectId(recommendedDoctorId),
      specialization,
      clinicalReason,
      bookingStatus: 'pending_student_action',
    });

    // REQ_03: Notify the Civilian of recommended specialist
    await sendAppointmentNotification({
      appointmentNumber: `REF-${referral._id.toString().slice(-6).toUpperCase()}`,
      civilianName: civilian.name,
      civilianEmail: civilian.email,
      doctorName: specialist.name,
      date: 'Pending Student Booking',
      timeSlot: specialization,
      type: 'CONFIRMATION',
    });

    res.status(201).json({
      success: true,
      message: 'Specialist referral registered and student notified. Student will book consultation manually.',
      referral,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit specialist referral.',
    });
  }
};

export const getReferrals = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const { civilianId } = req.query as { civilianId?: string };

    const query: any = {};
    if (role === 'civilian') {
      query.civilianId = new mongoose.Types.ObjectId(userId);
    } else if (civilianId) {
      query.civilianId = new mongoose.Types.ObjectId(civilianId);
    }

    const referrals = await SpecialistReferral.find(query)
      .populate('referringDoctorId', 'name specialization')
      .populate('recommendedDoctorId', 'name specialization email department')
      .populate('civilianId', 'name universityId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: referrals.length,
      referrals,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve referrals.',
    });
  }
};
