import { Response } from 'express';
import mongoose from 'mongoose';
import { MedicalRecord } from '../models/MedicalRecord.model';
import { Appointment } from '../models/Appointment.model';
import { User } from '../models/User.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';

export const getPatientRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { civilianId } = req.params;
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;

    // RBAC: Civilian can only view their own record; Doctors and Admins can view any patient
    if (requesterRole === 'civilian' && requesterId !== civilianId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized. You may only view your own medical record.',
      });
      return;
    }

    const civilian = await User.findById(civilianId).select(
      'name universityId email phone department'
    );
    if (!civilian) {
      res.status(404).json({ success: false, message: 'Student / Civilian record not found.' });
      return;
    }

    let record = await MedicalRecord.findOne({
      civilianId: new mongoose.Types.ObjectId(civilianId),
    }).populate('visitHistory.doctorId', 'name specialization email');

    // Auto-initialize record if this is their first health center visit
    if (!record) {
      record = await MedicalRecord.create({
        civilianId: new mongoose.Types.ObjectId(civilianId),
        allergies: [],
        chronicConditions: [],
        visitHistory: [],
      });
    }

    // Safety Requirement REQ 5.2: Flag critical allergy alerts
    const criticalAllergies = record.allergies.filter((a) => a.severity === 'critical');
    const hasCriticalAlerts = criticalAllergies.length > 0 || record.chronicConditions.length > 0;

    // Audit log access if doctor or admin
    if (requesterRole !== 'civilian') {
      AuditService.log({
        actorId: requesterId || 'unknown',
        actorName: req.user?.universityId || 'Staff',
        actorRole: requesterRole as any,
        action: 'MEDICAL_RECORD_ACCESSED',
        targetEntity: 'MedicalRecord',
        targetId: record._id.toString(),
        details: { patient: civilian.name, universityId: civilian.universityId },
        ipAddress: req.ip,
      });
    }

    res.status(200).json({
      success: true,
      civilian,
      record,
      hasCriticalAlerts,
      criticalAllergies,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch medical record.',
    });
  }
};

export const updatePatientRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { civilianId } = req.params;
    const { bloodGroup, allergies, chronicConditions } = req.body;

    const updated = await MedicalRecord.findOneAndUpdate(
      { civilianId: new mongoose.Types.ObjectId(civilianId) },
      {
        $set: {
          ...(bloodGroup && { bloodGroup }),
          ...(allergies && { allergies }),
          ...(chronicConditions && { chronicConditions }),
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Patient profile and allergy history updated successfully.',
      record: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update medical record.',
    });
  }
};

export const addConsultationNote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { civilianId } = req.params;
    const { appointmentId, diagnosis, clinicalNotes } = req.body;
    const doctorId = req.user?.userId;

    if (!doctorId) {
      res.status(401).json({ success: false, message: 'Unauthenticated doctor.' });
      return;
    }

    const newHistoryItem = {
      doctorId: new mongoose.Types.ObjectId(doctorId),
      appointmentId: appointmentId ? new mongoose.Types.ObjectId(appointmentId) : undefined,
      date: new Date(),
      diagnosis,
      clinicalNotes,
    };

    const record = await MedicalRecord.findOneAndUpdate(
      { civilianId: new mongoose.Types.ObjectId(civilianId) },
      { $push: { visitHistory: newHistoryItem } },
      { new: true, upsert: true }
    ).populate('visitHistory.doctorId', 'name specialization');

    // If an appointment was linked, transition its status to 'completed'
    if (appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)) {
      await Appointment.findByIdAndUpdate(appointmentId, { status: 'completed' });
    }

    res.status(201).json({
      success: true,
      message: 'Consultation note appended to patient medical history.',
      record,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record consultation note.',
    });
  }
};
