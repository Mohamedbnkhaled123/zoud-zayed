import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceComponent } from '../attendance/attendance.component';
import { FinanceComponent } from '../finance/finance.component';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { formatArabicDate, formatCurrency, getTodayString } from '../../utils/arabic-utils';
import { AttendanceStatus } from '../../models';

export interface ChildAnalyticsItem {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  specialistName: string;
  attendedCount: number;
  absentCount: number;
  todayStatus: AttendanceStatus | 'unrecorded';
  totalCost: number;
}

export interface SpecialistAnalyticsItem {
  id: string;
  name: string;
  specialty: string;
  childrenCount: number;
  attendedSessionsCount: number;
  totalEarnings: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AttendanceComponent, FinanceComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  readonly dataService = inject(DataService);
  readonly authService = inject(AuthService);

  readonly todayStr = getTodayString();
  readonly formattedToday = formatArabicDate(this.todayStr);

  // On-demand section toggles - Default false (Requirement: "يظهروا لو الاخصائي طلبهم مش يظهروا من تلقاء نفسهم")
  showAttendanceCalendar = signal<boolean>(false);
  showFinanceAccounts = signal<boolean>(false);
  showChildrenAnalysis = signal<boolean>(false);
  showSpecialistsAnalysis = signal<boolean>(false);

  toggleAttendanceCalendar(): void {
    this.showAttendanceCalendar.update(v => !v);
  }

  toggleFinanceAccounts(): void {
    this.showFinanceAccounts.update(v => !v);
  }

  toggleChildrenAnalysis(): void {
    this.showChildrenAnalysis.update(v => !v);
  }

  toggleSpecialistsAnalysis(): void {
    this.showSpecialistsAnalysis.update(v => !v);
  }

  // User Scoped Data (Strict Privacy - Not visible across users or logged out)
  readonly myChildren = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.dataService.children().filter(c => c.specialistId === user.id);
  });

  readonly mySessions = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.dataService.sessions().filter(s => s.specialistId === user.id);
  });

  // Summary KPIs strictly for logged-in specialist
  readonly totalChildren = computed(() => this.myChildren().length);

  readonly todaySessions = computed(() => {
    return this.mySessions().filter(
      s => s.date === this.todayStr && s.status === 'attended'
    );
  });

  readonly totalAttendedSessions = computed(() => {
    return this.mySessions().filter(s => s.status === 'attended').length;
  });

  readonly totalAbsentSessions = computed(() => {
    return this.mySessions().filter(s => s.status === 'absent').length;
  });

  readonly attendanceRate = computed(() => {
    const total = this.totalAttendedSessions() + this.totalAbsentSessions();
    if (total === 0) return 0;
    return Math.round((this.totalAttendedSessions() / total) * 100);
  });

  readonly isPriceCalculationEnabled = computed(() => {
    return this.dataService.settings().enablePriceCalculation;
  });

  readonly sessionPrice = computed(() => {
    return this.dataService.settings().defaultSessionPrice;
  });

  readonly totalCalculatedEarnings = computed(() => {
    const defaultPrice = this.sessionPrice();
    return this.myChildren().reduce((sum, c) => {
      const billable = this.mySessions().filter(
        s => s.childId === c.id && (s.status === 'attended' || s.status === 'absent')
      ).length;
      const price = c.sessionPrice !== undefined && c.sessionPrice !== null && c.sessionPrice > 0
        ? c.sessionPrice
        : defaultPrice;
      return sum + (billable * price);
    }, 0);
  });

  readonly formattedEarnings = computed(() => {
    return formatCurrency(this.totalCalculatedEarnings());
  });

  // Analytics for Current User's Children only
  readonly allChildrenAnalytics = computed<ChildAnalyticsItem[]>(() => {
    const user = this.authService.currentUser();
    if (!user) return [];

    const children = this.myChildren();
    const sessions = this.mySessions();
    const today = this.todayStr;
    const defaultPrice = this.sessionPrice();

    return children.map(c => {
      const childSessions = sessions.filter(s => s.childId === c.id);
      const attended = childSessions.filter(s => s.status === 'attended').length;
      const absent = childSessions.filter(s => s.status === 'absent').length;
      const billable = attended + absent;
      const todaySession = childSessions.find(s => s.date === today);
      const effectivePrice = c.sessionPrice !== undefined && c.sessionPrice !== null && c.sessionPrice > 0
        ? c.sessionPrice
        : defaultPrice;

      return {
        id: c.id,
        name: c.name,
        age: c.age,
        diagnosis: c.diagnosis,
        specialistName: user.name,
        attendedCount: attended,
        absentCount: absent,
        todayStatus: (todaySession ? todaySession.status : 'unrecorded') as AttendanceStatus | 'unrecorded',
        totalCost: billable * effectivePrice
      };
    }).sort((a, b) => (b.attendedCount + b.absentCount) - (a.attendedCount + a.absentCount));
  });

  // Analytics for Accounts
  readonly allSpecialistsAnalytics = computed<SpecialistAnalyticsItem[]>(() => {
    const user = this.authService.currentUser();
    if (!user) return [];

    if (user.role === 'specialist') {
      const myChildrenCount = this.myChildren().length;
      const myAttended = this.totalAttendedSessions();
      return [{
        id: user.id,
        name: user.name,
        specialty: user.specialty || '',
        childrenCount: myChildrenCount,
        attendedSessionsCount: myAttended,
        totalEarnings: this.totalCalculatedEarnings()
      }];
    }

    // Admin view: high-level aggregated counts without child private details
    const specialists = this.dataService.specialists();
    const children = this.dataService.children();
    const sessions = this.dataService.sessions().filter(s => s.status === 'attended');
    const price = this.sessionPrice();

    return specialists.map(s => {
      const specChildren = children.filter(c => c.specialistId === s.id);
      const specSessions = sessions.filter(sess => sess.specialistId === s.id);

      return {
        id: s.id,
        name: s.name,
        specialty: s.specialty,
        childrenCount: specChildren.length,
        attendedSessionsCount: specSessions.length,
        totalEarnings: specSessions.length * price
      };
    }).sort((a, b) => b.attendedSessionsCount - a.attendedSessionsCount);
  });
}
