export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  academicYear?: string;
  photoBase64?: string;
  phone?: string;
  notes?: string;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  location: string;
  address?: string;
  contactPerson: string;
  prospectingSent?: boolean;
  prospectingYears?: string;
  acceptedYears?: string;
  rejectedYears?: string;
  inactiveEmail?: boolean;
  phone?: string;
}

export interface Teacher {
  id: string;
  name: string;
}

export type PlacementStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Placement {
  id: string;
  studentId: string;
  companyId: string;
  hours: number;
  startDate: string; // ISO string format YYYY-MM-DD
  endDate: string; // ISO string format YYYY-MM-DD
  status: PlacementStatus;
  academicYear?: string;
  startEmailSent?: boolean;
  endEmailSent?: boolean;
  teacherId?: string;
  anexoA1?: string;
  anexoA2?: string;
  anexoA3?: string;
  allSigned?: boolean;
  a3EmailSent?: boolean;
  a2Signed?: boolean;
  a3Signed?: boolean;
}
