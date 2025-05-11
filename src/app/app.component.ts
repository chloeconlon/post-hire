import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonApp, IonRouterOutlet, Platform,
} from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';
import { RouterModule } from '@angular/router';
import { PushNotificationService } from './services/push-notifications.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonApp,
    IonRouterOutlet
  ],
})
export class AppComponent implements OnInit {
  constructor(private platform: Platform, private pushNoticationService: PushNotificationService) {
    this.initializeApp();

  }

  ngOnInit() {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();

    // Initialize push services on startup
    if (this.platform.is('capacitor')) {
      try {
        await this.pushNoticationService.initialize();
        console.log('Push services initialized');
      } catch (error) {
        console.error('Failed to initialize push services:', error);
      }
    }
  }


}