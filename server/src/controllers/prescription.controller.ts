import { Response } from 'express';
import mongoose from 'mongoose';
import { Prescription } from '../models/Prescription.model';
import { User } from '../models/User.model';
import { Appointment } from '../models/Appointment.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendAppointmentNotification } from '../services/notification.service';
import { AuditService } from '../services/audit.service';

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

    // Audit Log
    AuditService.log({
      actorId: doctor._id,
      actorName: doctor.name,
      actorRole: 'doctor',
      action: 'PRESCRIPTION_CREATED',
      targetEntity: 'Prescription',
      targetId: prescription._id.toString(),
      details: {
        prescriptionNumber,
        civilian: civilian.name,
        medicinesCount: medicines.length,
      },
      ipAddress: req.ip,
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

// REQ 4.7: Update single medicine dispensation status (Pharmacy Staff)
export const updateItemDistribution = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id, itemIndex } = req.params;
    const { isDistributed } = req.body;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      res.status(404).json({ success: false, message: 'Prescription not found.' });
      return;
    }

    const idx = parseInt(itemIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= prescription.medicines.length) {
      res.status(400).json({ success: false, message: 'Invalid medicine item index.' });
      return;
    }

    prescription.medicines[idx].isDistributed = isDistributed;
    await prescription.save();

    // Audit Log
    AuditService.log({
      actorId: req.user?.userId || 'unknown',
      actorName: req.user?.universityId || 'Pharmacy Staff',
      actorRole: req.user?.role as any || 'pharmacy',
      action: 'PRESCRIPTION_ITEM_DISTRIBUTED',
      targetEntity: 'Prescription',
      targetId: prescription._id.toString(),
      details: {
        prescriptionNumber: prescription.prescriptionNumber,
        medicine: prescription.medicines[idx].name,
        isDistributed,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Medicine ${prescription.medicines[idx].name} marked as ${
        isDistributed ? 'distributed' : 'undistributed'
      }.`,
      prescription,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update medicine distribution status.',
    });
  }
};

// REQ 4.7: Close Prescription (Pharmacy Staff)
// REQ_02: The system shall only allow a prescription to be closed once all medicine items are marked as distributed.
// REQ_03: The system shall update the prescription status to "closed" upon confirmation.
// REQ_04: The system shall record the closure date and the Pharmacy staff member who closed the prescription.
export const closePrescription = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const pharmacyStaffId = req.user?.userId;

    const prescription = await Prescription.findById(id).populate(
      'civilianId',
      'name email phone'
    );

    if (!prescription) {
      res.status(404).json({ success: false, message: 'Prescription not found.' });
      return;
    }

    if (prescription.status === 'closed') {
      res.status(400).json({ success: false, message: 'Prescription is already closed.' });
      return;
    }

    // REQ_02 Check: All medicines must be marked distributed
    const undistributed = prescription.medicines.filter((m) => !m.isDistributed);
    if (undistributed.length > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot close prescription. ${undistributed.length} medicine item(s) are still undistributed. All items must be verified before closure (SRS REQ_02).`,
        undistributedItems: undistributed.map((m) => m.name),
      });
      return;
    }

    // REQ_03 & REQ_04: Update status to "closed", record closure date & pharmacy staff
    prescription.status = 'closed';
    prescription.closedAt = new Date();
    prescription.closedBy = new mongoose.Types.ObjectId(pharmacyStaffId);
    await prescription.save();

    console.log(
      `[Pharmacy] ✅ Prescription ${prescription.prescriptionNumber} officially closed by Staff ${pharmacyStaffId} on ${prescription.closedAt.toISOString()}`
    );

    // Audit Log
    AuditService.log({
      actorId: pharmacyStaffId || 'unknown',
      actorName: req.user?.universityId || 'Pharmacy Staff',
      actorRole: req.user?.role as any || 'pharmacy',
      action: 'PRESCRIPTION_CLOSED',
      targetEntity: 'Prescription',
      targetId: prescription._id.toString(),
      details: {
        prescriptionNumber: prescription.prescriptionNumber,
        civilian: (prescription.civilianId as any)?.name,
        closedAt: prescription.closedAt,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Prescription marked as closed and archived.',
      prescription,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to close prescription.',
    });
  }
};

