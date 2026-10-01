export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type AllergySeverity = 'mild' | 'moderate' | 'critical';

export interface Allergy {
  allergen: string;
  severity: AllergySeverity;
  notes?: string;
}

export interface VisitHistoryItem {
  _id?: string;
  appointmentId?: string;
  doctorId: {
    _id: string;
    name: string;
    specialization?: string;
    email?: string;
  };
  date: string;
  diagnosis: string;
  clinicalNotes: string;
}

export interface MedicalRecord {
  _id: string;
  civilianId: string;
  bloodGroup?: BloodGroup;
  allergies: Allergy[];
  chronicConditions: string[];
  visitHistory: VisitHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicineItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  isDistributed: boolean;
  notes?: string;
}

export interface Prescription {
  _id: string;
  prescriptionNumber: string;
  appointmentId: string;
  civilianId: {
    _id: string;
    name: string;
    universityId: string;
    email: string;
  };
  doctorId: {
    _id: string;
    name: string;
    specialization?: string;
    email?: string;
  };
  medicines: MedicineItem[];
  status: 'open' | 'closed';
  closedAt?: string;
  closedBy?: {
    _id: string;
    name: string;
    universityId: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosticTest {
  _id: string;
  civilianId: {
    _id: string;
    name: string;
    universityId: string;
  };
  doctorId: {
    _id: string;
    name: string;
    specialization?: string;
  };
  appointmentId?: string;
  testNames: string[];
  clinicalInstructions: string;
  status: 'recommended' | 'sample_collected' | 'completed';
  createdAt: string;
}

export interface SpecialistReferral {
  _id: string;
  civilianId: {
    _id: string;
    name: string;
    universityId: string;
  };
  referringDoctorId: {
    _id: string;
    name: string;
    specialization?: string;
  };
  recommendedDoctorId: {
    _id: string;
    name: string;
    specialization?: string;
    email?: string;
    department?: string;
  };
  specialization: string;
  clinicalReason: string;
  bookingStatus: 'pending_student_action' | 'booked';
  createdAt: string;
}

export interface AddPrescriptionDTO {
  appointmentId: string;
  civilianId: string;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
  }>;
}

export interface AddDiagnosticTestDTO {
  civilianId: string;
  appointmentId?: string;
  testNames: string[];
  clinicalInstructions: string;
}

export interface AddReferralDTO {
  civilianId: string;
  recommendedDoctorId: string;
  specialization: string;
  clinicalReason: string;
}
