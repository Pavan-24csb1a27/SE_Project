import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDiagnosticTest extends Document {
  civilianId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  testNames: string[];
  clinicalInstructions: string;
  status: 'recommended' | 'sample_collected' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const diagnosticTestSchema = new Schema<IDiagnosticTest>(
  {
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
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    testNames: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'Must recommend at least one diagnostic test.',
      },
    },
    clinicalInstructions: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['recommended', 'sample_collected', 'completed'],
      default: 'recommended',
    },
  },
  {
    timestamps: true,
  }
);

export const DiagnosticTest: Model<IDiagnosticTest> =
  mongoose.model<IDiagnosticTest>('DiagnosticTest', diagnosticTestSchema);
