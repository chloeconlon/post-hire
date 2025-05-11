import { Injectable } from '@angular/core';

// Add interface to extend Window with custom properties
interface CustomWindow extends Window {
  opera?: any;
  MSStream?: any;
}

@Injectable({
  providedIn: 'root'
})
export class DiagnosticService {
  constructor() {
    console.log('DiagnosticService initialized');
  }


  logEnvironment() {
    console.log('=== Diagnostic Information ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('Platform:', this.detectPlatform());
    console.log('=== End Diagnostic Information ===');
  }
  //Detetcting the platform
  private detectPlatform(): string {

    const customWindow = window as CustomWindow;
    const userAgent = navigator.userAgent || navigator.vendor || customWindow.opera;

    if (/android/i.test(userAgent)) {
      return 'Android';
    }

    if (/iPad|iPhone|iPod/.test(userAgent) && !customWindow.MSStream) {
      return 'iOS';
    }

    return 'Web';
  }


  checkDependencies(): { [key: string]: boolean } {
    const results = {
      'Platform': typeof window !== 'undefined',
      'LocalStorage': this.checkLocalStorage(),
      'PushNotifications': this.checkPushNotificationsSupport(),
    };

    console.log('Dependency check results:', results);
    return results;
  }

  //checking if local storage is available
  private checkLocalStorage(): boolean {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  }


  //Checks if push notifications are supported

  private checkPushNotificationsSupport(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }
}