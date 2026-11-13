import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  private readonly toast = inject(ToastService);
  readonly portfolioUrl = 'https://mohamedkhaled-dev-portfolio.vercel.app';
  readonly phoneNumber = '01024891448';
  readonly isCopied = signal<boolean>(false);

  copyPhone(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.phoneNumber).then(() => {
        this.isCopied.set(true);
        this.toast.showSuccess(`تم نسخ رقم الهاتف (${this.phoneNumber})`);
        setTimeout(() => this.isCopied.set(false), 2000);
      }).catch(() => {
        this.fallbackCopy();
      });
    } else {
      this.fallbackCopy();
    }
  }

  private fallbackCopy(): void {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = this.phoneNumber;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.isCopied.set(true);
      this.toast.showSuccess(`تم نسخ رقم الهاتف (${this.phoneNumber})`);
      setTimeout(() => this.isCopied.set(false), 2000);
    } catch {
      this.toast.showInfo(`رقم الهاتف: ${this.phoneNumber}`);
    }
  }
}
