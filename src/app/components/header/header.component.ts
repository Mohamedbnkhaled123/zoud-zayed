import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

export type ActiveTab = 'children' | 'dashboard' | 'admin-specialists';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);

  @Input() currentTab: ActiveTab = 'children';
  @Output() tabChange = new EventEmitter<ActiveTab>();
  @Output() openAuthModal = new EventEmitter<void>();

  mobileMenuOpen = false;

  setTab(tab: ActiveTab): void {
    this.tabChange.emit(tab);
    this.mobileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  onLoginClick(): void {
    this.openAuthModal.emit();
    this.mobileMenuOpen = false;
  }

  onLogout(): void {
    this.authService.logout();
    this.mobileMenuOpen = false;
  }
}
