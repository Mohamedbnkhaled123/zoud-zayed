import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.scss'
})
export class AuthModalComponent {
  readonly authService = inject(AuthService);
  readonly toast = inject(ToastService);

  @Output() closeModal = new EventEmitter<void>();

  nameInput = signal<string>('');
  passwordInput = signal<string>('');
  errorMessage = signal<string>('');

  onNameChange(name: string): void {
    this.nameInput.set(name);
    this.errorMessage.set('');
  }

  handleLogin(): void {
    const name = this.nameInput().trim();
    const password = this.passwordInput();

    if (!name) {
      this.errorMessage.set('يرجى إدخال الاسم');
      return;
    }

    if (!password) {
      this.errorMessage.set('يرجى إدخال كلمة المرور');
      return;
    }

    const res = this.authService.loginUnified(name, password);
    if (res.success) {
      this.closeModal.emit();
    } else {
      this.errorMessage.set(res.message);
    }
  }

  handleLogout(): void {
    this.authService.logout();
    this.nameInput.set('');
    this.passwordInput.set('');
    this.errorMessage.set('');
  }

  onDismiss(): void {
    this.closeModal.emit();
  }
}
