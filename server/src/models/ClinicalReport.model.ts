import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IClinicalReport extends Document {
  civilianId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  uploaderRole: 'civilian' | 'doctor';
  reportTitle: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  reportDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const clinicalReportSchema = new Schema<IClinicalReport>(
  {
    civilianId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploaderRole: {
      type: String,
      enum: ['civilian', 'doctor'],
      required: true,
    },
    reportTitle: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL or storage path is required'],
    },
    fileType: {
      type: String,
      required: true,
      default: 'pdf',
    },
    fileSize: {
      type: Number,
      required: true,
      default: 0,
    },
    reportDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

clinicalReportSchema.index({ civilianId: 1, reportDate: -1 });

export const ClinicalReport: Model<IClinicalReport> =
  mongoose.model<IClinicalReport>('ClinicalReport', clinicalReportSchema);
