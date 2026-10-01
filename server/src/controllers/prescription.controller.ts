import { Response } from 'express';
import mongoose from 'mongoose';
import { Prescription } from '../models/Prescription.model';
import { User } from '../models/User.model';
import { Appointment } from '../models/Appointment.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendAppointmentNotification } from '../services/notification.service';

const generatePrescriptionNumber = (): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RX-${dateStr}-${rand}`;
};

// REQ 4.4: Add Prescription (Doctor)
export const addPrescription = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { appointmentId, civilianId, medicines } = req.body;
    const doctorId = req.user?.userId;

    if (!doctorId) {
      res.status(401).json({ success: false, message: 'Unauthenticated doctor.' });
      return;
    }

    const civilian = await User.findById(civilianId);
    const doctor = await User.findById(doctorId);

    if (!civilian || !doctor) {
      res.status(404).json({ success: false, message: 'Student or Doctor not found.' });
      return;
    }

    const prescriptionNumber = generatePrescriptionNumber();

    // REQ_03: Save prescription with status "open"
    const prescription = await Prescription.create({
      prescriptionNumber,
      appointmentId: new mongoose.Types.ObjectId(appointmentId),
      civilianId: new mongoose.Types.ObjectId(civilianId),
      doctorId: new mongoose.Types.ObjectId(doctorId),
      medicines: medicines.map((m: any) => ({
        ...m,
        isDistributed: false, // Default to undistributed
      })),
      status: 'open',
    });

    // REQ_04: Notify Pharmacy and Civilian
    console.log(`[Pharmacy Dispatch] 📦 New open prescription ${prescriptionNumber} alerted to Dispensary.`);

    const appointment = await Appointment.findById(appointmentId);
    await sendAppointmentNotification({
      appointmentNumber: appointment?.appointmentNumber || prescriptionNumber,
      civilianName: civilian.name,
      civilianEmail: civilian.email,
      doctorName: doctor.name,
      date: new Date().toISOString().split('T')[0],
      timeSlot: 'Prescription Available',
      type: 'CONFIRMATION',
    });

    res.status(201).json({
      success: true,
      message: 'Prescription created with status "open" and notified to pharmacy.',
      prescription,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to issue prescription.',
    });
  }
};

// REQ 4.2: View Prescriptions / Medicines
export const getPrescriptions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const { civilianId, status } = req.query as { civilianId?: string; status?: string };

    const query: any = {};

    if (role === 'civilian') {
      // Students can only view their own prescriptions
      query.civilianId = new mongoose.Types.ObjectId(userId);
    } else if (civilianId) {
      query.civilianId = new mongoose.Types.ObjectId(civilianId);
    }

    if (status) {
      query.status = status;
    }

    const prescriptions = await Prescription.find(query)
      .populate('doctorId', 'name specialization email')
      .populate('civilianId', 'name universityId email')
      .populate('closedBy', 'name universityId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      prescriptions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch prescriptions.',
    });
  }
};
