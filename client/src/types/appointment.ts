export type SlotStatus = 'available' | 'locked' | 'booked';
export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled' | 'no-show';

export interface Doctor {
  _id: string;
  name: string;
  universityId: string;
  specialization?: string;
  department?: string;
  email: string;
  phone?: string;
}

export interface Slot {
  slotId: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  lockedUntil?: string;
  appointmentId?: string;
}

export interface DoctorAvailability {
  _id: string;
  doctorId: string;
  date: string;
  slots: Slot[];
}

export interface Appointment {
  _id: string;
  appointmentNumber: string;
  civilianId: {
    _id: string;
    name: string;
    universityId: string;
    email: string;
    phone?: string;
    department?: string;
  };
  doctorId: {
    _id: string;
    name: string;
    specialization?: string;
    department?: string;
    email: string;
  };
  date: string;
  timeSlot: {
    slotId: string;
    startTime: string;
    endTime: string;
  };
  reasonForVisit: string;
  status: AppointmentStatus;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LockSlotDTO {
  doctorId: string;
  date: string;
  slotId: string;
}

export interface BookAppointmentDTO {
  doctorId: string;
  date: string;
  slotId: string;
  reasonForVisit: string;
}
