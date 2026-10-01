import { Response } from 'express';
import mongoose from 'mongoose';
import { Appointment } from '../models/Appointment.model';
import { DoctorAvailability } from '../models/DoctorAvailability.model';
import { User } from '../models/User.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendAppointmentNotification } from '../services/notification.service';
import { AuditService } from '../services/audit.service';

const generateAppointmentNumber = (date: string): string => {
  const cleanDate = date.replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `APT-${cleanDate}-${randomSuffix}`;
};

// REQ_01 - REQ_06: Atomic Appointment Booking
export const bookAppointment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { doctorId, date, slotId, reasonForVisit } = req.body;
    const civilianId = req.user?.userId;

    if (!civilianId) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const civilian = await User.findById(civilianId);
    const doctor = await User.findById(doctorId);

    if (!civilian || !doctor || doctor.role !== 'doctor') {
      res.status(404).json({ success: false, message: 'Doctor or Student record not found.' });
      return;
    }

    // Atomic update to transition slot from locked (held by this user) or available -> 'booked'
    const now = new Date();
    const availability = await DoctorAvailability.findOneAndUpdate(
      {
        doctorId: new mongoose.Types.ObjectId(doctorId),
        date,
        slots: {
          $elemMatch: {
            slotId,
            $or: [
              { status: 'available' },
              {
                status: 'locked',
                lockedBy: new mongoose.Types.ObjectId(civilianId),
                lockedUntil: { $gte: now },
              },
            ],
          },
        },
      },
      {
        $set: {
          'slots.$.status': 'booked',
          'slots.$.lockedBy': undefined,
          'slots.$.lockedUntil': undefined,
        },
      },
      { new: true }
    );

    if (!availability) {
      res.status(409).json({
        success: false,
        message: 'Could not book time slot. It has expired or has been claimed by another patient.',
      });
      return;
    }

    const matchedSlot = availability.slots.find((s) => s.slotId === slotId);
    if (!matchedSlot) {
      res.status(400).json({ success: false, message: 'Slot details not found in schedule.' });
      return;
    }

    const appointmentNumber = generateAppointmentNumber(date);

    // REQ_05: Store appointment with status "confirmed"
    const newAppointment = await Appointment.create({
      appointmentNumber,
      civilianId: new mongoose.Types.ObjectId(civilianId),
      doctorId: new mongoose.Types.ObjectId(doctorId),
      date,
      timeSlot: {
        slotId: matchedSlot.slotId,
        startTime: matchedSlot.startTime,
        endTime: matchedSlot.endTime,
      },
      reasonForVisit,
      status: 'confirmed',
    });

    // Link appointmentId to slot
    await DoctorAvailability.updateOne(
      { doctorId: new mongoose.Types.ObjectId(doctorId), date, 'slots.slotId': slotId },
      { $set: { 'slots.$.appointmentId': newAppointment._id } }
    );

    // REQ_06: Send confirmation notification
    await sendAppointmentNotification({
      appointmentNumber,
      civilianName: civilian.name,
      civilianEmail: civilian.email,
      civilianPhone: civilian.phone,
      doctorName: doctor.name,
      date,
      timeSlot: `${matchedSlot.startTime} - ${matchedSlot.endTime}`,
      type: 'CONFIRMATION',
    });

    // Audit Log
    AuditService.log({
      actorId: civilian._id,
      actorName: civilian.name,
      actorRole: 'civilian',
      action: 'APPOINTMENT_BOOKED',
      targetEntity: 'Appointment',
      targetId: newAppointment._id.toString(),
      details: {
        appointmentNumber,
        doctor: doctor.name,
        date,
        slot: `${matchedSlot.startTime} - ${matchedSlot.endTime}`,
      },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked and confirmed successfully.',
      appointment: newAppointment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to book appointment.',
    });
  }
};

export const getMyAppointments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const query: any = {};
    if (role === 'doctor') {
      query.doctorId = new mongoose.Types.ObjectId(userId);
    } else {
      query.civilianId = new mongoose.Types.ObjectId(userId);
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name specialization department email')
      .populate('civilianId', 'name universityId email phone department')
      .sort({ date: -1, 'timeSlot.startTime': 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch appointments.',
    });
  }
};

export const cancelAppointment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const appointment = await Appointment.findById(id)
      .populate('doctorId', 'name email')
      .populate('civilianId', 'name email phone');

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found.' });
      return;
    }

    // Role check: Civilian can only cancel their own appointment
    if (role === 'civilian' && appointment.civilianId._id.toString() !== userId) {
      res.status(403).json({ success: false, message: 'Cannot cancel another student appointment.' });
      return;
    }

    if (appointment.status === 'cancelled') {
      res.status(400).json({ success: false, message: 'Appointment is already cancelled.' });
      return;
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = cancellationReason || 'Cancelled by user';
    await appointment.save();

    // Release slot back to available in doctor availability
    await DoctorAvailability.updateOne(
      {
        doctorId: appointment.doctorId._id,
        date: appointment.date,
        'slots.slotId': appointment.timeSlot.slotId,
      },
      {
        $set: {
          'slots.$.status': 'available',
          'slots.$.appointmentId': undefined,
          'slots.$.lockedBy': undefined,
          'slots.$.lockedUntil': undefined,
        },
      }
    );

    // Send cancellation notification
    const civilian = appointment.civilianId as any;
    const doctor = appointment.doctorId as any;

    await sendAppointmentNotification({
      appointmentNumber: appointment.appointmentNumber,
      civilianName: civilian.name,
      civilianEmail: civilian.email,
      civilianPhone: civilian.phone,
      doctorName: doctor.name,
      date: appointment.date,
      timeSlot: `${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}`,
      type: 'CANCELLATION',
    });

    // Audit Log
    AuditService.log({
      actorId: userId,
      actorName: req.user?.role === 'civilian' ? civilian.name : (req.user?.universityId || 'Staff'),
      actorRole: role as any,
      action: 'APPOINTMENT_CANCELLED',
      targetEntity: 'Appointment',
      targetId: appointment._id.toString(),
      details: {
        appointmentNumber: appointment.appointmentNumber,
        reason: cancellationReason || 'Cancelled by user',
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully and time slot released.',
      appointment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel appointment.',
    });
  }
};
