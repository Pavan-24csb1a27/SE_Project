import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMedicineItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  isDistributed: boolean;
  notes?: string;
}

export interface IPrescription extends Document {
  prescriptionNumber: string;
  appointmentId: mongoose.Types.ObjectId;
  civilianId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  medicines: IMedicineItem[];
  status: 'open' | 'closed';
  closedAt?: Date;
  closedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const medicineItemSchema = new Schema<IMedicineItem>(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    isDistributed: { type: Boolean, default: false },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const prescriptionSchema = new Schema<IPrescription>(
  {
    prescriptionNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
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
    medicines: {
      type: [medicineItemSchema],
      required: true,
      validate: {
        validator: (v: IMedicineItem[]) => v.length > 0,
        message: 'A prescription must contain at least one medicine item.',
      },
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
    closedAt: { type: Date },
    closedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

prescriptionSchema.index({ status: 1, createdAt: -1 });

export const Prescription: Model<IPrescription> =
  mongoose.model<IPrescription>('Prescription', prescriptionSchema);
