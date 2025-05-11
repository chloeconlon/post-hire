
import { Inject, Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject } from 'rxjs';
import { PushNotificationService } from './push-notifications.service';
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

@Injectable({
  providedIn: 'root'
})
export class AuthPushService {
  private currentUserId: string | null = null;
  public isAuthenticated = new BehaviorSubject<boolean>(false);
  public newMessageReceived = new Subject<{ senderId: string, messageId: string, message: string }>();


  constructor(
    @Inject(PushNotificationService) private pushNoticationService: PushNotificationService,
    private platform: Platform,
    private router: Router,
    private http: HttpClient
  ) {
    this.platform.ready().then(async () => {
      await this.pushNoticationService.initialize();
      this.setupNotificationHandlers();
      await this.checkExistingAuth();
    });
  }

  private setupNotificationHandlers() {
    this.pushNoticationService.tokenReceived.subscribe(token => {
      if (this.currentUserId) {
        this.sendTokenToServer(this.currentUserId, token);
      }
    });
    this.pushNoticationService.notificationReceived.subscribe(notification => {
      if (notification.data && notification.data.type === 'message') {
        this.handleNewMessageNotification(notification);
      } else {
        this.showStandardNotification(notification);
      }
    });
    this.pushNoticationService.notificationClicked.subscribe(action => {
      const notification = action.notification;
      if (notification.data) {
        this.handleNotificationTap(notification);
      }
    });
  }

  private async checkExistingAuth() {
    try {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        this.currentUserId = storedUserId;
        this.isAuthenticated.next(true);
        await this.pushNoticationService.registerForPush();
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  }

  async loginNotification(uid: string, email: string) {
    try {
      this.currentUserId = uid;
      localStorage.setItem('userId', uid);
      localStorage.setItem('userEmail', email);
      this.isAuthenticated.next(true);
      const token = await this.pushNoticationService.registerForPush();
      if (token) {
        await this.sendTokenToServer(uid, token);
      }
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  //Logging out notification
  async logoutNotification() {
    try {

      this.currentUserId = null;
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      this.isAuthenticated.next(false);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  private handleNewMessageNotification(notification: PushNotificationSchema) {
    if (notification.data) {
      this.newMessageReceived.next({
        senderId: notification.data.senderId,
        messageId: notification.data.messageId,
        message: notification.body || ''
      });
      this.showMessageNotification(notification);
    }
  }

  private async showMessageNotification(notification: PushNotificationSchema) {
    try {
      await this.pushNoticationService.createNotificationChannel(
        'messages-channel',
        'Messages',
        'Notifications for new messages',
        5
      );
      const senderName = notification.data?.senderName || 'Someone';
      await this.pushNoticationService.showLocalNotification(
        notification.title || `New message from ${senderName}`,
        notification.body || '',
        notification.data,
        'messages-channel'
      );
    } catch (error) {
      console.error('Error showing message notification:', error);
    }
  }

  private async showStandardNotification(notification: PushNotificationSchema) {
    await this.pushNoticationService.showLocalNotification(
      notification.title || 'New Notification',
      notification.body || '',
      notification.data
    );
  }


  private async markMessageAsRead(messageId: string) {

  }

  private handleNotificationTap(notification: PushNotificationSchema) {
    if (!notification.data) return;
    switch (notification.data.type) {
      case 'message':
        if (notification.data.senderId && notification.data.conversationId) {
          this.router.navigate(['/messages', notification.data.conversationId], {
            queryParams: {
              senderId: notification.data.senderId,
              highlight: notification.data.messageId
            }
          });
        } else if (notification.data.senderId) {
          this.router.navigate(['/messages', notification.data.senderId]);
        } else {
          this.router.navigate(['/messages']);
        }
        break;
      case 'friend_request':
        this.router.navigate(['/friends/requests']);
        break;
      case 'system':
        this.router.navigate(['/notifications']);
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }

  private async sendTokenToServer(userId: string, token: string) {

  }
}
