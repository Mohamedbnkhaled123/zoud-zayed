import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { AttendanceStatus, Child } from '../../models';
import { formatArabicDate, getTodayString, formatDateKey, formatCurrency } from '../../utils/arabic-utils';

interface CalendarDay {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  attendedCount: number;
  absentCount: number;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss'
})
export class AttendanceComponent {
  readonly dataService = inject(DataService);
  readonly authService = inject(AuthService);
  readonly toast = inject(ToastService);

  readonly selectedDate = signal<string>(getTodayString());
  readonly currentMonth = signal<Date>(new Date());

  // Session Calculation Toggle & Optional Price
  readonly isPriceCalculationEnabled = computed(() => this.dataService.settings().enablePriceCalculation);
  readonly sessionPrice = computed(() => this.dataService.settings().defaultSessionPrice);
  sessionPriceInput = signal<number | null>(
    this.dataService.settings().defaultSessionPrice > 0
      ? this.dataService.settings().defaultSessionPrice
      : null
  );

  togglePriceCalculation(): void {
    this.dataService.setPriceCalculationEnabled(!this.isPriceCalculationEnabled());
  }

  onPriceInputChange(val: number | string | null): void {
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
      this.toast.showError('يرجى إدخال رقم صحيح غير سالب');
      return;
    }
    this.dataService.setDefaultSessionPrice(price);
    if (price > 0) {
      this.toast.showSuccess(`تم حفظ سعر الجلسة (${formatCurrency(price)})`);
    } else {
      this.toast.showInfo('تم حفظ الحساب بعدد الجلسات دون تحديد سعر');
    }
  }

  // Month navigation
  readonly monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  readonly currentMonthName = computed(() => {
    return this.monthNames[this.currentMonth().getMonth()];
  });

  readonly currentYear = computed(() => {
    return this.currentMonth().getFullYear();
  });

  readonly formattedSelectedDate = computed(() => {
    return formatArabicDate(this.selectedDate());
  });

  readonly isTodaySelected = computed(() => {
    return this.selectedDate() === getTodayString();
  });

  // Calendar generation
  readonly calendarDays = computed<CalendarDay[]>(() => {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();
    const todayStr = getTodayString();
    const selected = this.selectedDate();

    const firstDay = new Date(year, month, 1);
    const startDayIndex = firstDay.getDay();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    const user = this.authService.currentUser();
    const specId = user ? user.id : '';

    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = formatDateKey(prevDate);
      const sessions = this.dataService.getSessionsForDate(dateStr)
        .filter(s => specId ? s.specialistId === specId : false);
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selected,
        attendedCount: sessions.filter(s => s.status === 'attended').length,
        absentCount: sessions.filter(s => s.status === 'absent').length
      });
    }

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const curDate = new Date(year, month, dayNum);
      const dateStr = formatDateKey(curDate);
      const sessions = this.dataService.getSessionsForDate(dateStr)
        .filter(s => specId ? s.specialistId === specId : false);
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selected,
        attendedCount: sessions.filter(s => s.status === 'attended').length,
        absentCount: sessions.filter(s => s.status === 'absent').length
      });
    }

    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nextDate = new Date(year, month + 1, dayNum);
      const dateStr = formatDateKey(nextDate);
      const sessions = this.dataService.getSessionsForDate(dateStr)
        .filter(s => specId ? s.specialistId === specId : false);
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selected,
        attendedCount: sessions.filter(s => s.status === 'attended').length,
        absentCount: sessions.filter(s => s.status === 'absent').length
      });
    }

    return days;
  });

  readonly availableChildren = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.dataService.children().filter(c => c.specialistId === user.id);
  });

  readonly selectedDateSessions = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.dataService.getSessionsForDate(this.selectedDate())
      .filter(s => s.specialistId === user.id);
  });

  readonly selectedDateAttendedCount = computed(() => {
    return this.selectedDateSessions().filter(s => s.status === 'attended').length;
  });

  readonly totalAttendedSessions = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return 0;
    return this.dataService.sessions()
      .filter(s => s.specialistId === user.id && s.status === 'attended')
      .length;
  });

  readonly totalCalculatedAmount = computed(() => {
    return this.totalAttendedSessions() * this.sessionPrice();
  });

  readonly formattedTotalCalculatedAmount = computed(() => {
    return formatCurrency(this.totalCalculatedAmount());
  });

  getChildStatusOnSelectedDate(childId: string): AttendanceStatus | 'unrecorded' {
    const session = this.selectedDateSessions().find(s => s.childId === childId);
    return session ? session.status : 'unrecorded';
  }

  prevMonth(): void {
    const cur = this.currentMonth();
    this.currentMonth.set(new Date(cur.getFullYear(), cur.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const cur = this.currentMonth();
    this.currentMonth.set(new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
  }

  goToToday(): void {
    const today = getTodayString();
    this.selectedDate.set(today);
    this.currentMonth.set(new Date());
  }

  selectDate(dateStr: string): void {
    this.selectedDate.set(dateStr);
  }

  markAttendance(child: Child, status: AttendanceStatus): void {
    const user = this.authService.currentUser();
    const specId = user?.id || child.specialistId;
    const date = this.selectedDate();

    this.dataService.recordAttendance(
      child.id,
      specId,
      date,
      status
    );
  }
}
