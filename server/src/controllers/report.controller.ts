import { Response } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { ClinicalReport } from '../models/ClinicalReport.model';
import { User } from '../models/User.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';

// REQ 4.3: Upload Report (Civilian or Doctor)
export const uploadReport = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { civilianId, reportTitle, notes, reportDate } = req.body;
    const uploaderId = req.user?.userId;
    const uploaderRole = req.user?.role;

    if (!uploaderId || !uploaderRole) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No report file uploaded.' });
      return;
    }

    // Determine target civilian:
    // If student uploads, target is self.
    // If doctor uploads, target is provided civilianId.
    const targetCivilianId = uploaderRole === 'civilian' ? uploaderId : civilianId;
    if (!targetCivilianId) {
      res.status(400).json({ success: false, message: 'Civilian ID is required for clinician upload.' });
      return;
    }

    const civilian = await User.findById(targetCivilianId);
    if (!civilian) {
      res.status(404).json({ success: false, message: 'Student record not found.' });
      return;
    }

    const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
    const fileUrl = `/uploads/reports/${file.filename}`;

    const report = await ClinicalReport.create({
      civilianId: new mongoose.Types.ObjectId(targetCivilianId),
      uploadedBy: new mongoose.Types.ObjectId(uploaderId),
      uploaderRole: uploaderRole === 'doctor' ? 'doctor' : 'civilian',
      reportTitle: reportTitle || file.originalname,
      fileUrl,
      fileType: ext,
      fileSize: file.size,
      reportDate: reportDate ? new Date(reportDate) : new Date(),
      notes,
    });

    // Audit Log
    AuditService.log({
      actorId: uploaderId,
      actorName: req.user?.universityId || 'Uploader',
      actorRole: uploaderRole as any,
      action: 'REPORT_UPLOADED',
      targetEntity: 'ClinicalReport',
      targetId: report._id.toString(),
      details: {
        reportTitle: report.reportTitle,
        fileType: report.fileType,
        patient: civilian.name,
      },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Clinical report uploaded and associated with patient record.',
      report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload clinical report.',
    });
  }
};

// REQ 4.3: View Reports List (REQ_01 & REQ_02)
export const getReports = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const { civilianId } = req.query as { civilianId?: string };

    const query: any = {};
    if (role === 'civilian') {
      // Civilian only views their own reports (REQ_01)
      query.civilianId = new mongoose.Types.ObjectId(userId);
    } else if (civilianId) {
      query.civilianId = new mongoose.Types.ObjectId(civilianId);
    }

    // REQ_02: Returns report title, date, and uploader (Civilian or Doctor)
    const reports = await ClinicalReport.find(query)
      .populate('uploadedBy', 'name universityId role')
      .sort({ reportDate: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve reports.',
    });
  }
};

// REQ 4.3: View or Download Selected Report (REQ_03)
export const downloadReport = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;

    const report = await ClinicalReport.findById(id);
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }

    // RBAC: Civilian can only download their own reports
    if (role === 'civilian' && report.civilianId.toString() !== userId) {
      res.status(403).json({ success: false, message: 'Unauthorized access to medical document.' });
      return;
    }

    const filename = path.basename(report.fileUrl);
    const filePath = path.join(process.cwd(), 'uploads', 'reports', filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'Document file missing on storage server.' });
      return;
    }

    // Audit Log
    AuditService.log({
      actorId: userId || 'unknown',
      actorName: req.user?.universityId || 'Downloader',
      actorRole: role as any,
      action: 'REPORT_DOWNLOADED',
      targetEntity: 'ClinicalReport',
      targetId: report._id.toString(),
      details: {
        reportTitle: report.reportTitle,
        fileType: report.fileType,
      },
      ipAddress: req.ip,
    });

    res.download(filePath, `${report.reportTitle}.${report.fileType}`);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to download report document.',
    });
  }
};
