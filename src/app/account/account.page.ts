
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { IonHeader, IonItem, IonToolbar, IonTitle, IonContent, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

import { NavigationService } from '../services/navigation.service';
import { ViewChild, ElementRef } from '@angular/core';
import { AnimationController } from '@ionic/angular';
import { Auth } from '@angular/fire/auth';

import { AccountService, UserAccountData } from '../services/account.service';
import { AuthPushService } from '../services/auth-push.service';
import { SwipeDirective } from '../directives/swipe.directive';
import { ThemeService } from '../services/theme.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  providers: [AuthPushService],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonItem,
    IonToolbar,
    IonTitle,
    IonContent,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    AsyncPipe,
    SwipeDirective
  ],
})
export class AccountPage implements OnInit, OnDestroy {

  @ViewChild('pageElement', { static: true }) pageElement!: ElementRef;

  readonly combinedAccountData$: Observable<UserAccountData | null>;





  constructor(

    private accountService: AccountService,
    private auth: Auth,
    private navService: NavigationService,
    private animationCtrl: AnimationController,
    private router: Router,
    private authPushService: AuthPushService,
    private themeService: ThemeService
  ) {
    console.log('AccountPage constructor');

    this.combinedAccountData$ = this.accountService.combinedAccountData$;


  }

  ngOnInit() {
    console.log('AccountPage ngOnInit');

  }

  ngOnDestroy() {
    console.log('AccountPage ngOnDestroy');

  }

  async logout() {
    try {
      this.authPushService.logoutNotification();

      await this.auth.signOut();
      console.log('Logged out');

      this.goToLogin();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }

  capitalizeFirstLetter(str: string): string {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  formatTime(time?: string): string {
    if (!time) return "N/A";
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }


  //Navigation methods
  nextPage() {
    this.navService.goToNext();
  }

  previousPage() {
    this.navService.goToPrevious();
  }


  playAnimation() {
    if (!this.pageElement) {
      console.error('Animation Error: Element not found');
      return;
    }

    const animation = this.animationCtrl.create()
      .addElement(this.pageElement.nativeElement)
      .duration(200)
      .fromTo('transform', 'translateX(100%)', 'translateX(0)');

    animation.play();
  }

  goToMessages() {
    this.navService.goToMessages();
  }

  goToSearch() {
    this.navService.goToSearch();
  }

  goToAccount() {
    this.navService.goToAccount();
  }

  goToLogin() {
    this.navService.goToLogin();
  }

}
