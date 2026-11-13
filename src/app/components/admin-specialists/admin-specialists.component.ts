import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService, ADMIN_USER } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Specialist } from '../../models';
import { formatArabicDate, getTodayString } from '../../utils/arabic-utils';

@Component({
  selector: 'app-admin-specialists',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-specialists.component.html',
  styleUrl: './admin-specialists.component.scss'
})
export class AdminSpecialistsComponent {
  readonly dataService = inject(DataService);
  readonly authService = inject(AuthService);
  readonly toast = inject(ToastService);

  readonly adminName = ADMIN_USER.name; // 'أحمد خالد عبدالستار'

  // Add specialist form signals
  newSpecName = signal<string>('');
  newSpecSpecialty = signal<string>('');
  newSpecPhone = signal<string>('');
  newSpecCreatedAt = signal<string>(getTodayString());

  showAddModal = signal<boolean>(false);

  openAddModal(): void {
    this.newSpecName.set('');
    this.newSpecSpecialty.set('');
    this.newSpecPhone.set('');
    this.newSpecCreatedAt.set(getTodayString());
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  addSpecialist(): void {
    if (!this.authService.isAdmin()) {
      this.toast.showError('هذه الصلاحية متاحة للأدمن أحمد خالد عبدالستار فقط');
      return;
    }

    if (!this.newSpecName().trim()) {
      this.toast.showError('يرجى إدخال اسم الأخصائي كاملاً');
      return;
    }

    const createdDate = this.newSpecCreatedAt().trim() || getTodayString();

    this.dataService.addSpecialist(
      this.newSpecName().trim(),
      this.newSpecSpecialty().trim(),
      this.newSpecPhone().trim(),
      createdDate
    );

    this.closeAddModal();
  }

  deleteSpecialist(spec: Specialist): void {
    if (!this.authService.isAdmin()) {
      this.toast.showError('غير مصرح');
      return;
    }

    if (confirm(`تأكيد حذف الأخصائي "${spec.name}"؟`)) {
      this.dataService.deleteSpecialist(spec.id);
    }
  }

  getSpecialistChildrenCount(specId: string): number {
    return this.dataService.children().filter(c => c.specialistId === specId).length;
  }

  getSpecialistSessionsCount(specId: string): number {
    return this.dataService.sessions().filter(s => s.specialistId === specId && s.status === 'attended').length;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return formatArabicDate(dateStr);
  }
}
