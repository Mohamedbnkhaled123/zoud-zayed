import { Injectable, signal, computed, inject } from '@angular/core';
import { CurrentUser, Specialist } from '../models';
import { DataService } from './data.service';
import { ToastService } from './toast.service';
import { areArabicNamesEqual, doesArabicNameMatch } from '../utils/arabic-utils';

export const ADMIN_PASSWORD = '01098898774';

export const ADMIN_USER: CurrentUser = {
  id: 'admin-1',
  name: 'أحمد خالد عبدالستار',
  role: 'admin',
  specialty: 'مدير ومسؤول المنظومة'
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly dataService = inject(DataService);
  private readonly toast = inject(ToastService);
  private readonly CURRENT_USER_KEY = 'zowad_current_user_v1';

  readonly currentUser = signal<CurrentUser | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isSpecialist = computed(() => this.currentUser()?.role === 'specialist');

  constructor() {
    this.restoreUserSession();
  }

  private restoreUserSession(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.CURRENT_USER_KEY);
      if (stored) {
        this.currentUser.set(JSON.parse(stored));
      } else {
        this.currentUser.set(null);
      }
    } catch {
      this.currentUser.set(null);
    }
  }

  private persistUser(user: CurrentUser | null): void {
    if (typeof localStorage === 'undefined') return;
    if (user) {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.CURRENT_USER_KEY);
    }
  }

  loginUnified(nameInput: string, passwordInput: string): { success: boolean; message: string } {
    const trimmedName = nameInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedName) {
      return { success: false, message: 'يرجى إدخال الاسم' };
    }
    if (!trimmedPass) {
      return { success: false, message: 'يرجى إدخال كلمة المرور' };
    }

    // 1. Check if Admin (Ahmed Khaled Abdel-Sattar)
    if (areArabicNamesEqual(ADMIN_USER.name, trimmedName) || doesArabicNameMatch(trimmedName, ADMIN_USER.name)) {
      if (trimmedPass === ADMIN_PASSWORD) {
        this.currentUser.set(ADMIN_USER);
        this.persistUser(ADMIN_USER);
        this.toast.showSuccess(`مرحباً ${ADMIN_USER.name}`);
        return { success: true, message: 'تم تسجيل الدخول' };
      } else {
        return { success: false, message: 'كلمة المرور غير صحيحة' };
      }
    }

    // 2. Check Specialists
    const specialist = this.findSpecialistByName(trimmedName);
    if (!specialist) {
      return { success: false, message: 'الاسم غير مسجل في النظام' };
    }

    // First time password setup
    if (!specialist.isPasswordSet) {
      this.setPasswordAndLogin(specialist.id, trimmedPass);
      return { success: true, message: 'تم حفظ كلمة المرور وتسجيل الدخول' };
    }

    if (specialist.password !== trimmedPass) {
      return { success: false, message: 'كلمة المرور غير صحيحة' };
    }

    const user: CurrentUser = {
      id: specialist.id,
      name: specialist.name,
      role: 'specialist',
      specialty: specialist.specialty,
      phone: specialist.phone
    };

    this.currentUser.set(user);
    this.persistUser(user);
    this.toast.showSuccess(`مرحباً ${user.name}`);
    return { success: true, message: 'تم تسجيل الدخول' };
  }

  loginAsAdmin(password: string): { success: boolean; message: string } {
    if (!password || password.trim() !== ADMIN_PASSWORD) {
      return {
        success: false,
        message: 'كلمة المرور غير صحيحة'
      };
    }

    this.currentUser.set(ADMIN_USER);
    this.persistUser(ADMIN_USER);
    this.toast.showSuccess(`مرحباً ${ADMIN_USER.name}`);

    return {
      success: true,
      message: 'تم تسجيل الدخول'
    };
  }

  findSpecialistByName(nameInput: string): Specialist | undefined {
    if (!nameInput || nameInput.trim().length < 2) {
      return undefined;
    }
    const list = this.dataService.specialists();
    let match = list.find(s => areArabicNamesEqual(s.name, nameInput));
    if (!match) {
      match = list.find(s => doesArabicNameMatch(nameInput, s.name));
    }
    return match;
  }

  loginSpecialistWithNameAndPassword(nameInput: string, passwordInput: string): { success: boolean; message: string; requiresPasswordSetup?: boolean; matchedSpecialist?: Specialist } {
    const specialist = this.findSpecialistByName(nameInput);

    if (!specialist) {
      return {
        success: false,
        message: 'الاسم غير مسجل'
      };
    }

    if (!specialist.isPasswordSet) {
      return {
        success: false,
        requiresPasswordSetup: true,
        matchedSpecialist: specialist,
        message: 'يرجى تعيين كلمة المرور'
      };
    }

    if (specialist.password !== passwordInput) {
      return {
        success: false,
        message: 'كلمة المرور غير صحيحة'
      };
    }

    const user: CurrentUser = {
      id: specialist.id,
      name: specialist.name,
      role: 'specialist',
      specialty: specialist.specialty,
      phone: specialist.phone
    };

    this.currentUser.set(user);
    this.persistUser(user);
    this.toast.showSuccess(`مرحباً ${user.name}`);

    return {
      success: true,
      message: 'تم تسجيل الدخول'
    };
  }

  setPasswordAndLogin(specialistId: string, newPassword: string): boolean {
    const specialist = this.dataService.specialists().find(s => s.id === specialistId);
    if (!specialist) return false;

    const updated: Specialist = {
      ...specialist,
      password: newPassword,
      isPasswordSet: true
    };

    this.dataService.updateSpecialist(updated);

    const user: CurrentUser = {
      id: updated.id,
      name: updated.name,
      role: 'specialist',
      specialty: updated.specialty,
      phone: updated.phone
    };

    this.currentUser.set(user);
    this.persistUser(user);
    this.toast.showSuccess(`تم حفظ كلمة المرور وتسجيل دخول (${updated.name}) بنجاح`);

    return true;
  }

  logout(): void {
    this.currentUser.set(null);
    this.persistUser(null);
    this.toast.showInfo('تم تسجيل الخروج بنجاح');
  }
}
