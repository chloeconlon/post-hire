import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AnimationController } from '@ionic/angular';
@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  constructor(private router: Router, private animationCtrl: AnimationController) { }
  private readonly routes = ['/message-list', '/search', '/account'];



  getCurrentRouteIndex(): number {
    const currentRoute = this.router.url;
    return this.routes.indexOf(currentRoute);
  }

  navigateWithAnimation(direction: 'forward' | 'backward') {
    const currentIndex = this.getCurrentRouteIndex();

    // If we're not on one of our main routes, just go to messages
    if (currentIndex === -1) {

      this.goToMessages();
      return;
    }

    let nextIndex: number;

    if (direction === 'forward') {
      nextIndex = currentIndex === this.routes.length - 1 ? currentIndex : currentIndex + 1;
    } else {
      nextIndex = currentIndex === 0 ? currentIndex : currentIndex - 1;
    }

    this.router.navigate([this.routes[nextIndex]]);
  }

  goToNext() {
    this.navigateWithAnimation('forward');
  }

  goToPrevious() {
    this.navigateWithAnimation('backward');
  }
  goToMessages() {
    this.router.navigate(['/message-list']);
  }

  goToSearch() {
    this.router.navigate(['/search']);
  }

  goToAccount() {
    this.router.navigate(['/account']);
  }

  goToChat() {
    this.router.navigate(['/chat']);
  }

  goToLogin() {
    this.router.navigate(['/login']);

  }
}


