import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'zowad_theme';

  readonly isDarkMode = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined') {
      try {
        const hasLocalStorage = typeof localStorage !== 'undefined';
        const savedTheme = hasLocalStorage ? localStorage.getItem(this.storageKey) : null;

        if (savedTheme) {
          this.isDarkMode.set(savedTheme === 'dark');
        } else if (typeof window.matchMedia === 'function') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          this.isDarkMode.set(prefersDark);
        }

        this.applyTheme(this.isDarkMode());

        effect(() => {
          const isDark = this.isDarkMode();
          this.applyTheme(isDark);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.storageKey, isDark ? 'dark' : 'light');
          }
        });
      } catch {
        // Fallback for restricted or mock environments
      }
    }
  }

  toggleTheme(): void {
    this.isDarkMode.update(dark => !dark);
  }

  private applyTheme(isDark: boolean): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }
}
