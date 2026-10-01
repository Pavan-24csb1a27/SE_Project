import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { DoctorAvailability } from '../models/DoctorAvailability.model';
import { User } from '../models/User.model';
import { generateTimeSlots } from '../services/schedule.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// 5-minute slot lock expiration window
const LOCK_EXPIRATION_MS = 5 * 60 * 1000;

export const getDoctors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true })
      .select('name universityId specialization department email phone')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch doctors list.',
    });
  }
};

export const getDoctorAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query as { date: string };

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      res.status(400).json({ success: false, message: 'Invalid doctor ID.' });
      return;
    }

    let availability = await DoctorAvailability.findOne({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      date,
    });

    if (!availability) {
      // Auto-generate default working slots if not explicitly created yet
      const defaultSlots = generateTimeSlots(date);
      availability = await DoctorAvailability.create({
        doctorId: new mongoose.Types.ObjectId(doctorId),
        date,
        slots: defaultSlots,
      });
    } else {
      // Lazy cleanup: Check for expired locks and reset them to available
      const now = new Date();
      let hasExpired = false;

      availability.slots.forEach((slot) => {
        if (slot.status === 'locked' && slot.lockedUntil && slot.lockedUntil < now) {
          slot.status = 'available';
          slot.lockedBy = undefined;
          slot.lockedUntil = undefined;
          hasExpired = true;
        }
      });

      if (hasExpired) {
        await availability.save();
      }
    }

    res.status(200).json({
      success: true,
      availability,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve doctor availability.',
    });
  }
};

export const configureSchedule = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { doctorId, date, startHour, endHour } = req.body;

    // If caller is doctor, ensure they can only configure their own schedule
    if (req.user?.role === 'doctor' && req.user.userId !== doctorId) {
      res.status(403).json({
        success: false,
        message: 'Doctors can only configure their own availability schedule.',
      });
      return;
    }

    const generatedSlots = generateTimeSlots(date, startHour, endHour);

    const updated = await DoctorAvailability.findOneAndUpdate(
      { doctorId: new mongoose.Types.ObjectId(doctorId), date },
      { $set: { slots: generatedSlots } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Schedule configured for date ${date}.`,
      availability: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to configure doctor schedule.',
    });
  }
};

// REQ_04: Atomic slot locking to prevent double-booking
export const lockSlot = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { doctorId, date, slotId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const now = new Date();
    const lockedUntil = new Date(now.getTime() + LOCK_EXPIRATION_MS);

    // Atomically find slot that is 'available' OR whose lock has already expired
    const result = await DoctorAvailability.findOneAndUpdate(
      {
        doctorId: new mongoose.Types.ObjectId(doctorId),
        date,
        slots: {
          $elemMatch: {
            slotId,
            $or: [
              { status: 'available' },
              { status: 'locked', lockedUntil: { $lt: now } },
              { status: 'locked', lockedBy: new mongoose.Types.ObjectId(userId) }, // Re-lock by same user
            ],
          },
        },
      },
      {
        $set: {
          'slots.$.status': 'locked',
          'slots.$.lockedBy': new mongoose.Types.ObjectId(userId),
          'slots.$.lockedUntil': lockedUntil,
        },
      },
      { new: true }
    );

    if (!result) {
      res.status(409).json({
        success: false,
        message: 'Slot is no longer available. It is currently locked or booked by another student.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Slot held successfully for 5 minutes.',
      lockedUntil,
      slotId,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to lock time slot.',
    });
  }
};

export const releaseSlot = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { doctorId, date, slotId } = req.body;
    const userId = req.user?.userId;

    await DoctorAvailability.findOneAndUpdate(
      {
        doctorId: new mongoose.Types.ObjectId(doctorId),
        date,
        slots: {
          $elemMatch: {
            slotId,
            status: 'locked',
            lockedBy: new mongoose.Types.ObjectId(userId),
          },
        },
      },
      {
        $set: {
          'slots.$.status': 'available',
          'slots.$.lockedBy': undefined,
          'slots.$.lockedUntil': undefined,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Slot released successfully.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to release slot.',
    });
  }
};
