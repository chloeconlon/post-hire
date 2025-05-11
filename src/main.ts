import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { HttpClientModule } from '@angular/common/http';

import { environment } from './environments/environment';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { IonicModule } from '@ionic/angular';
import { AuthService } from './app/services/auth-service.service';
import { getAuth, provideAuth } from '@angular/fire/auth';
import 'hammerjs';


// Firebase imports
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
// ... other firebase imports

// Import our push services
import { PushNotificationService } from './app/services/push-notifications.service';
  import { AuthPushService } from './app/services/auth-push.service';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    importProvidersFrom(HttpClientModule),
    
    // Router configuration
    provideRouter(routes, withPreloading(PreloadAllModules)),
    
    // Firebase providers
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    // ... other firebase providers

    provideAuth(() => getAuth()), // <-- Add this line
    provideFirestore(() => getFirestore()),

    
    // Explicitly provide our push notification services
    PushNotificationService,
    AuthPushService,
    AuthService,
    IonicModule
  ],
});