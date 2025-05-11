// fcm-types.d.ts
import '@capacitor-community/fcm';

declare module '@capacitor-community/fcm' {
  interface FCMPlugin {
    // Add the missing methods
    addListener(eventName: string, listenerFunc: any): any;
    removeAllListeners(): Promise<void>;
  }
}