import mongoose, { Document, Model, Schema } from 'mongoose';

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled' | 'no-show';

export interface IAppointment extends Document {
  appointmentNumber: string;
  civilianId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  date: string;
  timeSlot: {
    slotId: string;
    startTime: string;
    endTime: string;
  };
  reasonForVisit: string;
  status: AppointmentStatus;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    appointmentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    civilianId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
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
    timeSlot: {
      slotId: { type: String, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
    reasonForVisit: {
      type: String,
      required: [true, 'Please provide reason for visit'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'confirmed',
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({ civilianId: 1, date: -1 });
appointmentSchema.index({ doctorId: 1, date: 1 });

export const Appointment: Model<IAppointment> =
  mongoose.model<IAppointment>('Appointment', appointmentSchema);
