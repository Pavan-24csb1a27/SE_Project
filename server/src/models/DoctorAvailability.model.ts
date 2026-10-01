import mongoose, { Document, Model, Schema } from 'mongoose';

export type SlotStatus = 'available' | 'locked' | 'booked';

export interface ISlot {
  slotId: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "09:30"
  status: SlotStatus;
  lockedBy?: mongoose.Types.ObjectId;
  lockedUntil?: Date;
  appointmentId?: mongoose.Types.ObjectId;
}

export interface IDoctorAvailability extends Document {
  doctorId: mongoose.Types.ObjectId;
  date: string; // "YYYY-MM-DD"
  slots: ISlot[];
  createdAt: Date;
  updatedAt: Date;
}

const slotSchema = new Schema<ISlot>(
  {
    slotId: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['available', 'locked', 'booked'],
      default: 'available',
    },
    lockedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lockedUntil: { type: Date },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
  },
  { _id: false }
);

const doctorAvailabilitySchema = new Schema<IDoctorAvailability>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format YYYY-MM-DD'],
    },
    slots: [slotSchema],
  },
  {
    timestamps: true,
  }
);

// Unique compound index: one availability document per doctor per date
doctorAvailabilitySchema.index({ doctorId: 1, date: 1 }, { unique: true });

export const DoctorAvailability: Model<IDoctorAvailability> =
  mongoose.model<IDoctorAvailability>('DoctorAvailability', doctorAvailabilitySchema);
