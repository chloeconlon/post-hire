import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private darkModeClass = 'dark-theme';

  constructor() {
    // Initialising theme 
    const isDark = localStorage.getItem('dark-mode') === 'true';
    this.setDarkMode(isDark);
  }

  setDarkMode(isDark: boolean): void {
    const body = document.body;

    if (isDark) {
      body.classList.add(this.darkModeClass);
    } else {
      body.classList.remove(this.darkModeClass);
    }

    localStorage.setItem('dark-mode', String(isDark));
  }

  toggleDarkMode(): void {
    const isCurrentlyDark = document.body.classList.contains(this.darkModeClass);
    this.setDarkMode(!isCurrentlyDark);
  }

  isDarkMode(): boolean {
    return document.body.classList.contains(this.darkModeClass);
  }
}