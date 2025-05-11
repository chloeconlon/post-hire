
import { Injectable } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Platform } from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { Importance } from '@capacitor/local-notifications';


@Injectable({
  providedIn: 'root'
})

//Push notification service for handling push notifications
export class PushNotificationService {
  public notificationReceived = new Subject<PushNotificationSchema>();
  public notificationClicked = new Subject<ActionPerformed>();
  public tokenReceived = new Subject<string>();
  public registrationError = new Subject<any>();

  // Store token for reuse
  protected fcmToken: string | null = null;
  protected initialized = false;

  constructor(protected platform: Platform) { }


  async initialize() {
    if (this.initialized) return;

    try {
      if (!this.platform.is('capacitor')) return;

      console.log('Initializing base push notification service');
      await LocalNotifications.requestPermissions();

      // Set up listeners for push events
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success:', token.value);
        this.fcmToken = token.value;
        this.tokenReceived.next(token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
        this.registrationError.next(error);
      });

      PushNotifications.addListener('pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          console.log('Push notification received:', notification);
          this.notificationReceived.next(notification);
        });

      PushNotifications.addListener('pushNotificationActionPerformed',
        (action: ActionPerformed) => {
          console.log('Push notification action performed:', action);
          this.notificationClicked.next(action);
        });

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing push service:', error);
      throw error;
    }
  }

  //register for push notifications
  async registerForPush(): Promise<string | null> {
    // Initialising 
    if (!this.initialized) {
      await this.initialize();
    }

    // Return existing token if we have one
    if (this.fcmToken) {
      return this.fcmToken;
    }

    try {
      // Request permissions
      const permStatus = await PushNotifications.requestPermissions();

      if (permStatus.receive === 'granted') {
        await PushNotifications.register();

        // Returns a promise that resolves when we get a token
        return new Promise<string>((resolve) => {
          const subscription = this.tokenReceived.subscribe(token => {
            subscription.unsubscribe();
            resolve(token);
          });

          // timeout
          setTimeout(() => {
            subscription.unsubscribe();
            resolve(this.fcmToken || '');
          }, 5000);
        });
      } else {
        console.warn('Push notification permission denied');
        return null;
      }
    } catch (error) {
      console.error('Error registering for push:', error);
      return null;
    }
  }


  // Show local notification

  async showLocalNotification(
    title: string,
    body: string,
    data?: any,
    channelId: string = 'chat_notifications'
  ) {
    try {
      const notificationId = new Date().getTime();

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: title,
            body: body,
            extra: data,
            sound: 'default',
            smallIcon: 'ic_notification',
            channelId: channelId,
            schedule: { at: new Date(Date.now()) }
          }
        ]
      });

      return notificationId;
    } catch (error) {
      console.error('Error showing local notification:', error);
      return null;
    }
  }

  async createNotificationChannel(
    id: string,
    name: string,
    description: string,
    importance: Importance = 4
  ) {
    if (!this.platform.is('android')) return;

    try {
      await LocalNotifications.createChannel({
        id,
        name,
        description,
        importance,
        visibility: 1,
        vibration: true
      });
    } catch (error) {
      console.error('Error creating notification channel:', error);
    }
  }
}