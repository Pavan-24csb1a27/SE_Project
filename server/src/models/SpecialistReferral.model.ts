import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISpecialistReferral extends Document {
  civilianId: mongoose.Types.ObjectId;
  referringDoctorId: mongoose.Types.ObjectId;
  recommendedDoctorId: mongoose.Types.ObjectId;
  specialization: string;
  clinicalReason: string;
  bookingStatus: 'pending_student_action' | 'booked';
  createdAt: Date;
  updatedAt: Date;
}

const specialistReferralSchema = new Schema<ISpecialistReferral>(
  {
    civilianId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referringDoctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recommendedDoctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    clinicalReason: {
      type: String,
      required: true,
      trim: true,
    },
    bookingStatus: {
      type: String,
      enum: ['pending_student_action', 'booked'],
      default: 'pending_student_action',
    },
  },
  {
    timestamps: true,
  }
);

export const SpecialistReferral: Model<ISpecialistReferral> =
  mongoose.model<ISpecialistReferral>('SpecialistReferral', specialistReferralSchema);
