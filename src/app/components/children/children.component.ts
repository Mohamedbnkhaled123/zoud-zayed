import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Child, AttendanceStatus } from '../../models';
import { formatArabicDate, getTodayString } from '../../utils/arabic-utils';

@Component({
  selector: 'app-children',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './children.component.html',
  styleUrl: './children.component.scss'
})
export class ChildrenComponent {
  readonly dataService = inject(DataService);
  readonly authService = inject(AuthService);
  readonly toast = inject(ToastService);

  readonly WEEK_DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // Search & Filter
  readonly searchQuery = signal<string>('');
  readonly selectedDiagnosisFilter = signal<string>('all');

  // Today Date Strings
  readonly todayDateString = computed(() => getTodayString());
  readonly formattedTodayDate = computed(() => formatArabicDate(getTodayString()));

  // Pricing option toggle
  readonly isPriceCalculationEnabled = computed(() => this.dataService.settings().enablePriceCalculation);
  readonly sessionPrice = computed(() => this.dataService.settings().defaultSessionPrice);

  togglePriceCalculation(): void {
    const nextState = !this.isPriceCalculationEnabled();
    this.dataService.setPriceCalculationEnabled(nextState);
  }

  // Update session price on child card directly
  updateChildPrice(child: Child, newPrice: any): void {
    const parsed = newPrice === '' || newPrice === null ? undefined : Number(newPrice);
    const validPrice = parsed !== undefined && !isNaN(parsed) && parsed >= 0 ? parsed : undefined;
    const updated: Child = {
      ...child,
      sessionPrice: validPrice
    };
    this.dataService.updateChild(updated);
  }

  getChildEffectivePrice(child: Child): number {
    if (child.sessionPrice !== undefined && child.sessionPrice !== null && child.sessionPrice > 0) {
      return child.sessionPrice;
    }
    return this.sessionPrice() || 0;
  }

  // Single Child Modal / Form state
  showChildModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingChildId = signal<string>('');

  // Form Fields
  childName = signal<string>('');
  childAge = signal<number | null>(null);
  childDiagnosis = signal<string>('');
  guardianName = signal<string>('');
  guardianPhone = signal<string>('');
  childSpecialistId = signal<string>('');
  childSessionPrice = signal<number | null>(null);
  childScheduleDays = signal<string[]>([]);
  childNotes = signal<string>('');

  // Child history view modal
  selectedChildForHistory = signal<Child | null>(null);

  // Only children that belong to the logged-in user (Specialist or Admin) are visible
  readonly myChildren = computed(() => {
    const user = this.authService.currentUser();
    if (!user) {
      return [];
    }
    return this.dataService.children().filter(c => c.specialistId === user.id);
  });

  // Dynamic diagnoses extracted only from the logged-in user's children
  readonly availableDiagnoses = computed(() => {
    const set = new Set<string>();
    for (const c of this.myChildren()) {
      const diag = c.diagnosis?.trim();
      if (diag) set.add(diag);
    }
    return Array.from(set);
  });

  readonly filteredChildren = computed(() => {
    let list = this.myChildren();
    const query = this.searchQuery().trim().toLowerCase();
    const diagFilter = this.selectedDiagnosisFilter();

    if (query) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(query) ||
        (c.diagnosis && c.diagnosis.toLowerCase().includes(query)) ||
        (c.guardianName && c.guardianName.toLowerCase().includes(query)) ||
        (c.guardianPhone && c.guardianPhone.includes(query))
      );
    }

    if (diagFilter !== 'all') {
      list = list.filter(c => c.diagnosis?.trim() === diagFilter);
    }

    return list;
  });

  toggleScheduleDay(day: string): void {
    const cur = this.childScheduleDays();
    if (cur.includes(day)) {
      this.childScheduleDays.set(cur.filter(d => d !== day));
    } else {
      this.childScheduleDays.set([...cur, day]);
    }
  }

  openAddModal(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.toast.showError('يرجى تسجيل الدخول أولاً');
      return;
    }

    this.isEditing.set(false);
    this.editingChildId.set('');
    this.childName.set('');
    this.childAge.set(null);
    this.childDiagnosis.set('');
    this.guardianName.set('');
    this.guardianPhone.set('');
    this.childSessionPrice.set(null);
    this.childScheduleDays.set([]);
    this.childNotes.set('');
    this.childSpecialistId.set(user.id);

    this.showChildModal.set(true);
  }

  closeModal(): void {
    this.showChildModal.set(false);
  }

  saveChild(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.toast.showError('يرجى تسجيل الدخول لحفظ بيانات الطفل');
      return;
    }

    if (!this.childName().trim()) {
      this.toast.showError('يرجى كتابة اسم الطفل');
      return;
    }

    const ageVal = Number(this.childAge()) || 0;
    const priceVal = this.childSessionPrice() !== null && this.childSessionPrice() !== undefined
      ? Number(this.childSessionPrice())
      : undefined;

    if (this.isEditing()) {
      const existing = this.dataService.getChildById(this.editingChildId());
      if (!existing || existing.specialistId !== user.id) {
        this.toast.showError('غير مصرح لك بتعديل هذا الطفل');
        return;
      }
      const updated: Child = {
        id: this.editingChildId(),
        name: this.childName().trim(),
        age: ageVal,
        diagnosis: this.childDiagnosis().trim(),
        guardianName: this.guardianName().trim(),
        guardianPhone: this.guardianPhone().trim(),
        specialistId: user.id,
        sessionPrice: priceVal,
        scheduleDays: this.childScheduleDays(),
        notes: this.childNotes().trim(),
        createdAt: existing.createdAt || getTodayString()
      };
      this.dataService.updateChild(updated);
    } else {
      this.dataService.addChild({
        name: this.childName().trim(),
        age: ageVal,
        diagnosis: this.childDiagnosis().trim(),
        guardianName: this.guardianName().trim(),
        guardianPhone: this.guardianPhone().trim(),
        specialistId: user.id,
        sessionPrice: priceVal,
        scheduleDays: this.childScheduleDays(),
        notes: this.childNotes().trim()
      });
    }

    this.closeModal();
  }

  deleteChild(child: Child): void {
    const user = this.authService.currentUser();
    if (!user || child.specialistId !== user.id) {
      this.toast.showError('غير مصرح');
      return;
    }
    if (confirm(`تأكيد حذف الطفل "${child.name}"؟`)) {
      this.dataService.deleteChild(child.id);
    }
  }

  // Today attendance directly from children card
  getTodayStatus(childId: string): AttendanceStatus | 'unrecorded' {
    const session = this.dataService.getTodaySessionForChild(childId);
    return session ? session.status : 'unrecorded';
  }

  markTodayAttendance(child: Child, status: AttendanceStatus): void {
    const user = this.authService.currentUser();
    if (!user || child.specialistId !== user.id) {
      this.toast.showError('يرجى تسجيل الدخول لتسجيل الحضور');
      return;
    }
    const today = getTodayString();
    const curStatus = this.getTodayStatus(child.id);

    // Toggle off if already active!
    if (curStatus === status) {
      this.dataService.removeAttendance(child.id, today);
      return;
    }

    const effectivePrice = this.getChildEffectivePrice(child);
    this.dataService.recordAttendance(child.id, user.id, today, status, effectivePrice);
  }

  clearTodayAttendance(child: Child): void {
    this.dataService.removeAttendance(child.id, getTodayString());
  }

  openEditModal(child: Child): void {
    const user = this.authService.currentUser();
    if (!user || child.specialistId !== user.id) {
      this.toast.showError('غير مصرح');
      return;
    }
    this.isEditing.set(true);
    this.editingChildId.set(child.id);
    this.childName.set(child.name);
    this.childAge.set(child.age || null);
    this.childDiagnosis.set(child.diagnosis || '');
    this.guardianName.set(child.guardianName || '');
    this.guardianPhone.set(child.guardianPhone || '');
    this.childSpecialistId.set(user.id);
    this.childSessionPrice.set(child.sessionPrice || null);
    this.childScheduleDays.set(child.scheduleDays || []);
    this.childNotes.set(child.notes || '');

    this.showChildModal.set(true);
  }

  openHistory(child: Child): void {
    this.selectedChildForHistory.set(child);
  }

  closeHistory(): void {
    this.selectedChildForHistory.set(null);
  }

  getChildSessions(childId: string) {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.dataService.getSessionsForChild(childId).filter(s => s.specialistId === user.id);
  }

  formatDate(dateStr: string): string {
    return formatArabicDate(dateStr);
  }

  getSpecialistName(specId: string): string {
    const user = this.authService.currentUser();
    if (user && user.id === specId) {
      return user.name;
    }
    return this.dataService.getSpecialistById(specId)?.name || 'غير محدد';
  }
}
