import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { formatCurrency } from '../../utils/arabic-utils';

interface ChildFinancialSummary {
  id: string;
  name: string;
  diagnosis: string;
  sessionsCount: number;
  totalAmount: number;
  lastSessionDate: string;
}

interface SpecialistFinancialSummary {
  id: string;
  name: string;
  specialty: string;
  sessionsCount: number;
  totalAmount: number;
}

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.scss'
})
export class FinanceComponent {
  readonly dataService = inject(DataService);
  readonly authService = inject(AuthService);
  readonly toast = inject(ToastService);

  // Optional session price input (does not force a price)
  sessionPriceInput = signal<number | null>(
    this.dataService.settings().defaultSessionPrice > 0
      ? this.dataService.settings().defaultSessionPrice
      : null
  );

  readonly isEnabled = computed(() => this.dataService.settings().enablePriceCalculation);
  readonly sessionPrice = computed(() => this.dataService.settings().defaultSessionPrice);

  toggleCalculation(): void {
    const nextState = !this.isEnabled();
    this.dataService.setPriceCalculationEnabled(nextState);
  }

  onPriceChange(val: number | string | null): void {
    const parsed = val === '' || val === null || val === undefined ? null : Number(val);
    this.sessionPriceInput.set(parsed);
    if (parsed !== null && !isNaN(parsed) && parsed >= 0) {
      this.dataService.setDefaultSessionPrice(parsed);
    } else if (parsed === null) {
      this.dataService.setDefaultSessionPrice(0);
    }
  }

  updateSessionPrice(): void {
    const raw = this.sessionPriceInput();
    const price = raw === null || raw === undefined ? 0 : Number(raw);
    if (isNaN(price) || price < 0) {
      this.toast.showError('يرجى إدخال سعر صالح غير سالب');
      return;
    }
    this.dataService.setDefaultSessionPrice(price);
    if (price > 0) {
      this.toast.showSuccess(`تم حفظ سعر الجلسة (${formatCurrency(price)})`);
    } else {
      this.toast.showInfo('تم حفظ الحساب بعدد الجلسات دون تحديد سعر');
    }
  }

  readonly totalAttendedCount = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return 0;
    return this.dataService.sessions()
      .filter(s => s.specialistId === user.id && s.status === 'attended')
      .length;
  });

  readonly totalEarnings = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return 0;
    const defaultPrice = this.sessionPrice();
    const myChildren = this.dataService.children().filter(c => c.specialistId === user.id);
    const mySessions = this.dataService.sessions().filter(s => s.specialistId === user.id && s.status === 'attended');

    return myChildren.reduce((sum, c) => {
      const attended = mySessions.filter(s => s.childId === c.id).length;
      const price = c.sessionPrice !== undefined && c.sessionPrice !== null && c.sessionPrice > 0
        ? c.sessionPrice
        : defaultPrice;
      return sum + (attended * price);
    }, 0);
  });

  readonly formattedTotalEarnings = computed(() => {
    return formatCurrency(this.totalEarnings());
  });

  readonly childrenFinancialList = computed<ChildFinancialSummary[]>(() => {
    const user = this.authService.currentUser();
    if (!user) return [];

    const children = this.dataService.children().filter(c => c.specialistId === user.id);
    const sessions = this.dataService.sessions().filter(s => s.specialistId === user.id && s.status === 'attended');
    const defaultPrice = this.sessionPrice();

    return children.map(c => {
      const childSessions = sessions.filter(s => s.childId === c.id);
      const sorted = [...childSessions].sort((a, b) => b.date.localeCompare(a.date));
      const effPrice = c.sessionPrice !== undefined && c.sessionPrice !== null && c.sessionPrice > 0
        ? c.sessionPrice
        : defaultPrice;
      return {
        id: c.id,
        name: c.name,
        diagnosis: c.diagnosis,
        sessionsCount: childSessions.length,
        totalAmount: childSessions.length * effPrice,
        lastSessionDate: sorted.length > 0 ? sorted[0].date : 'لا يوجد جلسات'
      };
    }).sort((a, b) => b.sessionsCount - a.sessionsCount);
  });

  readonly specialistsFinancialList = computed<SpecialistFinancialSummary[]>(() => {
    const user = this.authService.currentUser();
    if (!user || user.role !== 'specialist') return [];

    const myAttended = this.totalAttendedCount();
    return [{
      id: user.id,
      name: user.name,
      specialty: user.specialty || '',
      sessionsCount: myAttended,
      totalAmount: this.totalEarnings()
    }];
  });
}
