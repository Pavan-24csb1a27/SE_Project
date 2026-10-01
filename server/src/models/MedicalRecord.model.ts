import mongoose, { Document, Model, Schema } from 'mongoose';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type AllergySeverity = 'mild' | 'moderate' | 'critical';

export interface IAllergy {
  allergen: string;
  severity: AllergySeverity;
  notes?: string;
}

export interface IVisitHistoryItem {
  appointmentId?: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  date: Date;
  diagnosis: string;
  clinicalNotes: string;
}

export interface IMedicalRecord extends Document {
  civilianId: mongoose.Types.ObjectId;
  bloodGroup?: BloodGroup;
  allergies: IAllergy[];
  chronicConditions: string[];
  visitHistory: IVisitHistoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const allergySchema = new Schema<IAllergy>(
  {
    allergen: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'critical'],
      required: true,
      default: 'moderate',
    },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const visitHistorySchema = new Schema<IVisitHistoryItem>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    diagnosis: { type: String, required: true, trim: true },
    clinicalNotes: { type: String, required: true, trim: true },
  },
  { _id: true }
);

const medicalRecordSchema = new Schema<IMedicalRecord>(
  {
    civilianId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    allergies: [allergySchema],
    chronicConditions: [{ type: String, trim: true }],
    visitHistory: [visitHistorySchema],
  },
  {
    timestamps: true,
  }
);

export const MedicalRecord: Model<IMedicalRecord> =
  mongoose.model<IMedicalRecord>('MedicalRecord', medicalRecordSchema);
