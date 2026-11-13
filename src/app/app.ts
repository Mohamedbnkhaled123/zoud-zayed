import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent, ActiveTab } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ToastComponent } from './components/toast/toast.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ChildrenComponent } from './components/children/children.component';
import { AdminSpecialistsComponent } from './components/admin-specialists/admin-specialists.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    ToastComponent,
    DashboardComponent,
    ChildrenComponent,
    AdminSpecialistsComponent,
    AuthModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly authService = inject(AuthService);

  readonly currentTab = signal<ActiveTab>('children');
  readonly isAuthModalOpen = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (!this.authService.isAdmin() && this.currentTab() === 'admin-specialists') {
        this.currentTab.set('children');
      }
    });
  }

  setTab(tab: ActiveTab): void {
    if (tab === 'admin-specialists' && !this.authService.isAdmin()) {
      this.currentTab.set('children');
      return;
    }
    this.currentTab.set(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openAuthModal(): void {
    this.isAuthModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.isAuthModalOpen.set(false);
  }
}
