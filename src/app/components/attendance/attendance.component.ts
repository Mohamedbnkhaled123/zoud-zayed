import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { AttendanceStatus, Child, SessionRecord } from '../../models';
import { 
  formatArabicDate, 
  getTodayString, 
  formatDateKey, 
  formatCurrency, 
  getDayNameFromDateKey, 
  calculateDurationMinutes, 
  formatSessionTiming 
} from '../../utils/arabic-utils';

interface CalendarDay {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  attendedCount: number;
  cancelledCount: number;
  absentCount: number;
  coverCount: number;
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

  readonly WEEK_DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // Day filter for categorize: 'all' or specific day like 'السبت'
  readonly selectedDayFilter = signal<string>('all');

  readonly selectedDateDayName = computed(() => {
    return getDayNameFromDateKey(this.selectedDate());
  });

  selectDayFilter(day: string): void {
    this.selectedDayFilter.set(day);
  }

  getDayChildrenCount(day: string): number {
    const list = this.myChildren();
    if (day === 'all') return list.length;
    return list.filter(c => c.scheduleDays && c.scheduleDays.includes(day)).length;
  }

  // Pricing
  readonly isPriceCalculationEnabled = computed(() => this.dataService.settings().enablePriceCalculation);
  readonly sessionPrice = computed(() => this.dataService.settings().defaultSessionPrice);

  // Cover Modal State
  showCoverModal = signal<boolean>(false);
  coverChildId = signal<string>('');
  coverColleagueName = signal<string>('');
  coverStatus = signal<AttendanceStatus>('attended');
  coverPrice = signal<number | null>(null);
  coverStartTime = signal<string>('');
  coverEndTime = signal<string>('');
  coverDurationMinutes = signal<number | null>(null);
  coverNotes = signal<string>('');

  onCoverStartTimeChange(val: string): void {
    this.coverStartTime.set(val);
    const end = this.coverEndTime();
    if (val && end) {
      const dur = calculateDurationMinutes(val, end);
      if (dur) this.coverDurationMinutes.set(dur);
    }
  }

  onCoverEndTimeChange(val: string): void {
    this.coverEndTime.set(val);
    const start = this.coverStartTime();
    if (start && val) {
      const dur = calculateDurationMinutes(start, val);
      if (dur) this.coverDurationMinutes.set(dur);
    }
  }

  onCoverDurationChange(val: any): void {
    const num = val === '' || val === null ? null : Number(val);
    this.coverDurationMinutes.set(num && !isNaN(num) && num > 0 ? num : null);
  }

  formatTiming(start?: string | null, end?: string | null, dur?: number | null): string {
    return formatSessionTiming(start, end, dur);
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

  // All specialists for the cover dropdown
  readonly allSpecialists = computed(() => {
    const curUser = this.authService.currentUser();
    return this.dataService.specialists().filter(s => s.id !== curUser?.id);
  });

  // All children across center for cover sessions
  readonly allChildren = computed(() => this.dataService.children());

  // Logged-in user's own children
  readonly myChildren = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.dataService.children().filter(c => c.specialistId === user.id);
  });

  // Sessions for the logged-in user on selected date (regular + cover)
  readonly selectedDateSessions = computed<SessionRecord[]>(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.dataService.getSessionsForDate(this.selectedDate())
      .filter(s => s.specialistId === user.id);
  });

  readonly selectedDateAttendedCount = computed(() => {
    return this.selectedDateSessions().filter(s => s.status === 'attended').length;
  });

  readonly selectedDateCancelledCount = computed(() => {
    return this.selectedDateSessions().filter(s => s.status === 'cancelled').length;
  });

  readonly selectedDateAbsentCount = computed(() => {
    return this.selectedDateSessions().filter(s => s.status === 'absent').length;
  });

  readonly selectedDateCoverCount = computed(() => {
    return this.selectedDateSessions().filter(s => s.isCover).length;
  });

  // Filtered by selected day category (e.g. 'السبت' or 'all')
  readonly filteredDateSessions = computed<SessionRecord[]>(() => {
    const day = this.selectedDayFilter();
    const sessions = this.selectedDateSessions();
    if (day === 'all') return sessions;

    return sessions.filter(s => {
      if (s.isCover) return true; // keep cover sessions accessible
      const child = this.getChildInfo(s.childId);
      return child?.scheduleDays && child.scheduleDays.includes(day);
    });
  });

  readonly filteredUnrecordedChildren = computed<Child[]>(() => {
    const day = this.selectedDayFilter();
    const unrecorded = this.myChildren().filter(
      c => this.getChildStatusOnSelectedDate(c.id) === 'unrecorded'
    );
    if (day === 'all') return unrecorded;
    return unrecorded.filter(c => c.scheduleDays && c.scheduleDays.includes(day));
  });

  // Calendar matrix
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

    // Prev month padding
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
        cancelledCount: sessions.filter(s => s.status === 'cancelled').length,
        absentCount: sessions.filter(s => s.status === 'absent').length,
        coverCount: sessions.filter(s => s.isCover).length
      });
    }

    // Current month days
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
        cancelledCount: sessions.filter(s => s.status === 'cancelled').length,
        absentCount: sessions.filter(s => s.status === 'absent').length,
        coverCount: sessions.filter(s => s.isCover).length
      });
    }

    // Next month padding
    const remainingCells = 42 - days.length;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
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
        cancelledCount: sessions.filter(s => s.status === 'cancelled').length,
        absentCount: sessions.filter(s => s.status === 'absent').length,
        coverCount: sessions.filter(s => s.isCover).length
      });
    }

    return days;
  });

  getChildStatusOnSelectedDate(childId: string): AttendanceStatus | 'unrecorded' {
    const session = this.selectedDateSessions().find(s => s.childId === childId);
    return session ? session.status : 'unrecorded';
  }

  getSessionForChild(childId: string): SessionRecord | undefined {
    return this.selectedDateSessions().find(s => s.childId === childId);
  }

  getChildName(childId: string): string {
    const child = this.dataService.getChildById(childId);
    return child ? child.name : 'طفل غير معروف';
  }

  getChildInfo(childId: string): Child | undefined {
    return this.dataService.getChildById(childId);
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

  goToYesterday(): void {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const dateStr = formatDateKey(d);
    this.selectedDate.set(dateStr);
    this.currentMonth.set(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  selectDate(dateStr: string): void {
    this.selectedDate.set(dateStr);
    const [y, m] = dateStr.split('-').map(Number);
    this.currentMonth.set(new Date(y, m - 1, 1));
  }

  markAttendance(child: Child, status: AttendanceStatus): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.toast.showError('يرجى تسجيل الدخول أولاً');
      return;
    }
    const date = this.selectedDate();
    const curStatus = this.getChildStatusOnSelectedDate(child.id);

    // Toggle off if already that status
    if (curStatus === status) {
      this.dataService.removeAttendance(child.id, date);
      return;
    }

    const price = child.sessionPrice || this.sessionPrice() || 0;
    this.dataService.recordAttendance(
      child.id,
      user.id,
      date,
      status,
      price
    );
  }

  clearAttendance(childId: string): void {
    this.dataService.removeAttendance(childId, this.selectedDate());
  }

  deleteSession(sessionId: string): void {
    this.dataService.deleteSession(sessionId);
  }

  // Cover Modal Handlers
  openCoverModal(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.toast.showError('يرجى تسجيل الدخول أولاً');
      return;
    }
    this.coverChildId.set('');
    this.coverColleagueName.set('');
    this.coverStatus.set('attended');
    this.coverPrice.set(this.sessionPrice() > 0 ? this.sessionPrice() : null);
    this.coverStartTime.set('');
    this.coverEndTime.set('');
    this.coverDurationMinutes.set(null);
    this.coverNotes.set('');
    this.showCoverModal.set(true);
  }

  closeCoverModal(): void {
    this.showCoverModal.set(false);
  }

  onCoverChildSelect(childId: string): void {
    this.coverChildId.set(childId);
    const ch = this.dataService.getChildById(childId);
    if (ch) {
      if (ch.sessionPrice) {
        this.coverPrice.set(ch.sessionPrice);
      }
      if (ch.defaultStartTime) {
        this.coverStartTime.set(ch.defaultStartTime);
      }
      if (ch.defaultEndTime) {
        this.coverEndTime.set(ch.defaultEndTime);
      }
      if (ch.sessionDurationMinutes) {
        this.coverDurationMinutes.set(ch.sessionDurationMinutes);
      }
      const ownerSpec = this.dataService.getSpecialistById(ch.specialistId);
      if (ownerSpec) {
        this.coverColleagueName.set(ownerSpec.name);
      }
    }
  }

  saveCoverSession(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.toast.showError('يرجى تسجيل الدخول أولاً');
      return;
    }

    const cId = this.coverChildId();
    if (!cId) {
      this.toast.showError('يرجى اختيار الطفل المشمول بالتغطية');
      return;
    }

    const colleague = this.coverColleagueName().trim();
    const status = this.coverStatus();
    const priceVal = this.coverPrice() !== null ? Number(this.coverPrice()) : 0;
    const date = this.selectedDate();
    const startVal = this.coverStartTime().trim() || undefined;
    const endVal = this.coverEndTime().trim() || undefined;
    const durVal = this.coverDurationMinutes() !== null && this.coverDurationMinutes() !== undefined && Number(this.coverDurationMinutes()) > 0
      ? Number(this.coverDurationMinutes())
      : undefined;

    this.dataService.recordAttendance(
      cId,
      user.id,
      date,
      status,
      priceVal,
      this.coverNotes().trim(),
      true, // isCover
      colleague,
      undefined, // coveredSpecialistId
      startVal,
      endVal,
      durVal
    );

    this.closeCoverModal();
  }
}
