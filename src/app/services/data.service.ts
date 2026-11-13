import { Injectable, signal, computed, inject } from '@angular/core';
import { Specialist, Child, SessionRecord, SystemSettings, AttendanceStatus } from '../models';
import { getTodayString, formatArabicDate } from '../utils/arabic-utils';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly toast = inject(ToastService);

  private readonly SPECIALISTS_KEY = 'zowad_specialists_v1';
  private readonly CHILDREN_KEY = 'zowad_children_v1';
  private readonly SESSIONS_KEY = 'zowad_sessions_v1';
  private readonly SETTINGS_KEY = 'zowad_settings_v1';

  // State Signals - Empty by default (No hardcoded dummy data)
  readonly specialists = signal<Specialist[]>([]);
  readonly children = signal<Child[]>([]);
  readonly sessions = signal<SessionRecord[]>([]);
  readonly settings = signal<SystemSettings>({
    enablePriceCalculation: false,
    defaultSessionPrice: 0,
    theme: 'light'
  });

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const storedSpecialists = localStorage.getItem(this.SPECIALISTS_KEY);
      const storedChildren = localStorage.getItem(this.CHILDREN_KEY);
      const storedSessions = localStorage.getItem(this.SESSIONS_KEY);
      const storedSettings = localStorage.getItem(this.SETTINGS_KEY);

      if (storedSpecialists) {
        this.specialists.set(JSON.parse(storedSpecialists));
      }
      if (storedChildren) {
        this.children.set(JSON.parse(storedChildren));
      }
      if (storedSessions) {
        this.sessions.set(JSON.parse(storedSessions));
      }
      if (storedSettings) {
        this.settings.set(JSON.parse(storedSettings));
      }
    } catch {
      // Keep clean empty state on storage parse failure
    }
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.SPECIALISTS_KEY, JSON.stringify(this.specialists()));
      localStorage.setItem(this.CHILDREN_KEY, JSON.stringify(this.children()));
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(this.sessions()));
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings()));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  // Specialist Actions
  addSpecialist(name: string, specialty: string, phone: string, createdAt?: string): Specialist {
    const newSpecialist: Specialist = {
      id: 'spec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      specialty: specialty.trim(),
      phone: phone.trim(),
      password: '',
      isPasswordSet: false,
      createdAt: createdAt && createdAt.trim() ? createdAt.trim() : getTodayString()
    };

    this.specialists.update(list => [...list, newSpecialist]);
    this.persist();
    this.toast.showSuccess(`تمت إضافة الأخصائي (${newSpecialist.name})`);
    return newSpecialist;
  }

  updateSpecialist(updated: Specialist): void {
    this.specialists.update(list => list.map(s => s.id === updated.id ? updated : s));
    this.persist();
    this.toast.showSuccess('تم التحديث');
  }

  deleteSpecialist(id: string): void {
    const spec = this.specialists().find(s => s.id === id);
    if (!spec) return;

    this.specialists.update(list => list.filter(s => s.id !== id));
    this.persist();
    this.toast.showInfo('تم الحذف');
  }

  // Children Actions
  addChild(childData: Omit<Child, 'id' | 'createdAt'>): Child {
    const newChild: Child = {
      ...childData,
      id: 'child-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: getTodayString()
    };

    this.children.update(list => [...list, newChild]);
    this.persist();
    this.toast.showSuccess(`تمت إضافة الطفل (${newChild.name})`);
    return newChild;
  }

  addChildrenGroup(childrenList: Omit<Child, 'id' | 'createdAt'>[]): Child[] {
    if (!childrenList || childrenList.length === 0) return [];

    const now = Date.now();
    const today = getTodayString();
    const newChildren: Child[] = childrenList.map((item, index) => ({
      ...item,
      id: 'child-' + (now + index),
      createdAt: today
    }));

    this.children.update(list => [...list, ...newChildren]);
    this.persist();
    this.toast.showSuccess(`تمت إضافة ${newChildren.length} أطفال`);
    return newChildren;
  }

  updateChild(updated: Child): void {
    this.children.update(list => list.map(c => c.id === updated.id ? updated : c));
    this.persist();
    this.toast.showSuccess('تم التحديث');
  }

  deleteChild(id: string): void {
    const child = this.children().find(c => c.id === id);
    if (!child) return;

    this.children.update(list => list.filter(c => c.id !== id));
    this.sessions.update(list => list.filter(s => s.childId !== id));
    this.persist();
    this.toast.showInfo('تم الحذف');
  }

  // Attendance & Session Recording (Strictly Attended or Absent)
  recordAttendance(
    childId: string,
    specialistId: string,
    date: string,
    status: AttendanceStatus,
    price?: number,
    notes?: string
  ): SessionRecord {
    const child = this.children().find(c => c.id === childId);
    const effectivePrice = price !== undefined
      ? price
      : (this.settings().enablePriceCalculation && this.settings().defaultSessionPrice > 0
        ? this.settings().defaultSessionPrice
        : 0);

    const existingIndex = this.sessions().findIndex(s => s.childId === childId && s.date === date);

    let recordedSession: SessionRecord;

    if (existingIndex >= 0) {
      const existing = this.sessions()[existingIndex];
      recordedSession = {
        ...existing,
        status,
        specialistId,
        price: effectivePrice,
        notes: notes !== undefined ? notes : existing.notes
      };

      const updated = [...this.sessions()];
      updated[existingIndex] = recordedSession;
      this.sessions.set(updated);
    } else {
      recordedSession = {
        id: 'sess-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        childId,
        specialistId,
        date,
        status,
        price: effectivePrice,
        notes: notes || '',
        createdAt: getTodayString()
      };
      this.sessions.update(list => [...list, recordedSession]);
    }

    this.persist();

    const childName = child ? child.name : 'الطفل';
    const arabicFormatted = formatArabicDate(date);
    if (status === 'attended') {
      this.toast.showSuccess(
        `تم تسجيل حضور الطفل "${childName}" بتاريخ ${date} (${arabicFormatted}) بنجاح`,
        'تسجيل الحضور',
        date
      );
    } else {
      this.toast.showError(
        `تم تسجيل غياب الطفل "${childName}" بتاريخ ${date} (${arabicFormatted})`,
        'تسجيل غياب'
      );
    }

    return recordedSession;
  }

  // Settings & Session Calculation Toggle
  setPriceCalculationEnabled(enabled: boolean): void {
    this.settings.update(s => ({ ...s, enablePriceCalculation: enabled }));
    this.persist();
    if (enabled) {
      this.toast.showSuccess('تم تفعيل حساب الجلسات');
    } else {
      this.toast.showInfo('تم إيقاف حساب الجلسات');
    }
  }

  setDefaultSessionPrice(price: number | null | undefined): void {
    const num = Number(price);
    const validPrice = isNaN(num) || num < 0 ? 0 : num;
    this.settings.update(s => ({ ...s, defaultSessionPrice: validPrice }));
    this.persist();
  }

  // Computed queries & helpers
  getChildById(id: string): Child | undefined {
    return this.children().find(c => c.id === id);
  }

  getSpecialistById(id: string): Specialist | undefined {
    return this.specialists().find(s => s.id === id);
  }

  getSessionForChildAndDate(childId: string, date: string): SessionRecord | undefined {
    return this.sessions().find(s => s.childId === childId && s.date === date);
  }

  getTodaySessionForChild(childId: string): SessionRecord | undefined {
    return this.getSessionForChildAndDate(childId, getTodayString());
  }

  getSessionsForChild(childId: string): SessionRecord[] {
    return this.sessions()
      .filter(s => s.childId === childId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  getSessionsForDate(date: string): SessionRecord[] {
    return this.sessions().filter(s => s.date === date);
  }

  // System stats computation
  readonly totalChildrenCount = computed(() => this.children().length);

  readonly totalAttendedSessions = computed(() =>
    this.sessions().filter(s => s.status === 'attended').length
  );

  readonly todaySessions = computed(() => {
    const today = getTodayString();
    return this.sessions().filter(s => s.date === today && s.status === 'attended');
  });

  readonly totalCalculatedEarnings = computed(() => {
    const defaultPrice = this.settings().defaultSessionPrice;
    return this.totalAttendedSessions() * defaultPrice;
  });
}
