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
  scheduleDays?: string[]; // e.g. ['السبت', 'الإثنين', 'الأربعاء']
  sessionDurationMinutes?: number; // مدة الجلسة بالدقائق مثلاً 45
  defaultStartTime?: string;       // وقت البدء المعتاد بصيغة "10:00"
  defaultEndTime?: string;         // وقت الانتهاء المعتاد بصيغة "10:45"
  notes?: string;
  createdAt: string;
}

export type AttendanceStatus = 'attended' | 'cancelled' | 'absent';

export function isBillableSessionStatus(status: AttendanceStatus): boolean {
  return status === 'attended' || status === 'absent';
}

export interface SessionRecord {
  id: string;
  childId: string;
  specialistId: string;
  date: string; // format YYYY-MM-DD
  status: AttendanceStatus;
  price?: number;
  startTime?: string;       // وقت بدء الجلسة بصيغة "10:00"
  endTime?: string;         // وقت انتهاء الجلسة بصيغة "10:45"
  durationMinutes?: number; // مدة الجلسة بالدقائق
  isCover?: boolean;
  coveredSpecialistName?: string;
  coveredSpecialistId?: string;
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
