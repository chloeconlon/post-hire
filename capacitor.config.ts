import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maggiecahill.myJobs',
  appName: 'Post & Hire',
  webDir: 'www', // or wherever your build output is
  server: {
    androidScheme: 'https',
    cleartext: true // Allow cleartext traffic (remove in production)
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  },
  android: {
    allowMixedContent: true // Be careful with this in production
  }
};

export default config;