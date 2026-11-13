export interface Specialist {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  password?: string;
  isPasswordSet: boolean;
  createdAt: string;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  guardianName: string;
  guardianPhone: string;
  specialistId: string;
  sessionPrice?: number;
  notes?: string;
  createdAt: string;
}

export type AttendanceStatus = 'attended' | 'absent';

export interface SessionRecord {
  id: string;
  childId: string;
  specialistId: string;
  date: string; // format YYYY-MM-DD
  status: AttendanceStatus;
  price?: number;
  notes?: string;
  createdAt: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: 'admin' | 'specialist';
  specialty?: string;
  phone?: string;
}

export interface SystemSettings {
  enablePriceCalculation: boolean;
  defaultSessionPrice: number;
  theme: 'light' | 'dark';
}
