import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  dateStr?: string;
  isExiting?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  public readonly toasts = this._toasts.asReadonly();

  showSuccess(message: string, title: string = 'تم بنجاح', dateStr?: string): void {
    this.addToast('success', message, title, dateStr);
  }

  showError(message: string, title: string = 'تنبيه'): void {
    this.addToast('error', message, title);
  }

  showInfo(message: string, title: string = 'معلومة'): void {
    this.addToast('info', message, title);
  }

  private addToast(type: 'success' | 'error' | 'info', message: string, title?: string, dateStr?: string): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, message, dateStr, isExiting: false };

    this._toasts.update(current => [...current, newToast]);

    // Start smooth fade out after 1.6 seconds
    setTimeout(() => {
      this.markExiting(id);
    }, 1600);

    // Completely remove after 2.0 seconds
    setTimeout(() => {
      this.remove(id);
    }, 2000);
  }

  markExiting(id: string): void {
    this._toasts.update(current =>
      current.map(t => (t.id === id ? { ...t, isExiting: true } : t))
    );
  }

  dismiss(id: string): void {
    this.markExiting(id);
    setTimeout(() => {
      this.remove(id);
    }, 350);
  }

  remove(id: string): void {
    this._toasts.update(current => current.filter(t => t.id !== id));
  }
}
