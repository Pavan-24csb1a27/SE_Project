import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { reportApi } from '../../api/report.api';
import type { ClinicalReport } from '../../types/report';
import {
  FileText,
  Upload,
  Download,
  Calendar,
  User,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export const MyReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ClinicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);
      const res = await reportApi.getReports();
      setReports(res.reports);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to load clinical reports.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!reportTitle) {
        setReportTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setStatusMsg({ type: 'error', text: 'Please select a file to upload.' });
      return;
    }

    try {
      setUploading(true);
      setStatusMsg(null);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('reportTitle', reportTitle.trim() || selectedFile.name);
      formData.append('notes', reportNotes.trim());

      await reportApi.uploadReport(formData);

      setStatusMsg({
        type: 'success',
        text: 'Clinical report uploaded successfully and attached to your medical record.',
      });

      setShowUploadModal(false);
      setSelectedFile(null);
      setReportTitle('');
      setReportNotes('');
      fetchReports();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to upload report.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/student"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Student Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Clinical Reports & Documents</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View, upload, and download diagnostic lab reports, clinical scans, and test results (SRS REQ 4.3)
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition"
        >
          <Upload className="h-4 w-4" />
          Upload New Report
        </button>
      </div>

      {statusMsg && (
        <div
          className={`mb-6 flex items-center gap-2.5 rounded-lg border p-3.5 text-xs ${
            statusMsg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Reports Table (REQ_01 & REQ_02) */}
      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            Loading clinical reports...
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Clinical Reports Found</h3>
          <p className="mt-1 text-xs text-slate-500">
            You do not have any uploaded lab reports or diagnostic documents on file.
          </p>
          <div className="mt-4">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Document Now
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-left">
              <tr>
                <th className="py-3 px-4">Report Title</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Uploaded By (REQ_02)</th>
                <th className="py-3 px-4">Format / Size</th>
                <th className="py-3 px-4 text-right">Action (REQ_03)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((rep) => (
                <tr key={rep._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span>{rep.reportTitle}</span>
                    </div>
                    {rep.notes && (
                      <span className="block text-[11px] font-normal text-slate-500 ml-6 mt-0.5">
                        {rep.notes}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(rep.reportDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        rep.uploaderRole === 'doctor'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      <User className="h-3 w-3" />
                      {rep.uploaderRole === 'doctor' ? 'Clinician' : 'Student'} (
                      {rep.uploadedBy?.name || 'Self'})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono uppercase whitespace-nowrap">
                    {rep.fileType} • {(rep.fileSize / 1024).toFixed(0)} KB
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {/* REQ_03: Download or View Selected Report */}
                    <a
                      href={reportApi.getDownloadUrl(rep._id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="h-4 w-4 text-indigo-600" />
                Upload Clinical Lab Document
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Report Title *
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Complete Blood Count, Chest X-Ray"
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Select Document File (PDF, PNG, JPEG - Max 10MB) *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-400 transition cursor-pointer text-center"
                >
                  <FileText className="h-8 w-8 text-indigo-600 mb-2" />
                  <span className="text-xs font-bold text-slate-700">
                    {selectedFile ? selectedFile.name : 'Click to select file'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(0)} KB`
                      : 'Accepts PDF, JPEG, PNG'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Clinical Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Additional context, referring lab, or observations..."
                  className="block w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  <span>Upload & Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
