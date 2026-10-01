export interface ClinicalReport {
  _id: string;
  civilianId: string;
  uploadedBy: {
    _id: string;
    name: string;
    universityId: string;
    role: 'civilian' | 'doctor';
  };
  uploaderRole: 'civilian' | 'doctor';
  reportTitle: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  reportDate: string;
  notes?: string;
  createdAt: string;
}
