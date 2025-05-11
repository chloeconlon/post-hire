import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth, createUserWithEmailAndPassword, UserCredential, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Firestore, doc, setDoc, collection } from '@angular/fire/firestore';
import { getFirestore, updateDoc } from 'firebase/firestore';
import { AbstractControl } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { FCM } from '@capacitor-community/fcm';
import { PushNotifications } from '@capacitor/push-notifications';
import { PushNotificationService } from '../services/push-notifications.service';
import { AuthPushService } from '../services/auth-push.service';

import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton,
  IonList, IonSelect, IonSelectOption, IonCheckbox, IonGrid, IonRow,
  IonCol, AlertController, LoadingController
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth-service.service';

// =interface for FCM token result
interface FCMTokenResult {
  token: string;
}

//interface for FCM notification
interface FCMNotification {
  title?: string;
  body?: string;
  data?: any;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton,
    IonSelect, IonSelectOption

  ],
  providers: [AuthPushService, PushNotificationService, AuthService],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginPage implements OnInit, OnDestroy {

  loginForm!: FormGroup;
  customerSignupForm!: FormGroup;
  vendorSignupForm!: FormGroup;


  currentForm: 'login' | 'Customer Signup' | 'Vendor Signup' = 'login';

  private readonly auth: Auth = inject(Auth);
  private readonly firestore: Firestore = inject(Firestore);
  private readonly router: Router = inject(Router);
  private readonly alertController: AlertController = inject(AlertController);
  private readonly loadingController: LoadingController = inject(LoadingController);
  private readonly fb: FormBuilder = inject(FormBuilder);


  private setupPushNotificationListeners() {
    try {
      console.log('Setting up push notification listeners...');

      (FCM as any).addListener('pushNotificationReceived', (notification: FCMNotification) => {
        try {
          console.log('Push received (foreground):', notification);

          if (notification) {
            this.showNotification(notification);
          }
        } catch (err) {
          console.error('Error handling push notification:', err);
        }
      });


    } catch (err) {
      console.error('Error setting up push notification listeners:', err);
    }
  }

  // Add the missing saveTokenToFirestore method
  async saveTokenToFirestore(token: string) {
    try {
      // Make sure user is authenticated
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        console.log('User not logged in, cannot save token');
        return;
      }

      const userId = currentUser.uid;
      const userTokenDocRef = doc(this.firestore, 'userTokens', userId);

      // Save token with timestamp
      await setDoc(userTokenDocRef, {
        uid: userId,
        token: token,
        device: navigator.userAgent,
        lastUpdated: new Date()
      }, { merge: true });

      console.log('FCM token saved to Firestore');
    } catch (error) {
      console.error('Error saving token to Firestore:', error);
    }
  }

  //  showNotification method
  showNotification(notification: FCMNotification) {

    if (notification) {
      const notificationTitle = notification.title || 'New Notification';
      const notificationBody = notification.body || '';

      this.alertController.create({
        header: notificationTitle,
        message: notificationBody,
        buttons: ['OK']
      }).then(alert => alert.present());
    }
  }

  irishCounties: string[] = [
    'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
    'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
    'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
    'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
    'Wexford', 'Wicklow'
  ];

  workDays: string[] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  customerImagePreview: string | ArrayBuffer | null = null;
  vendorImagePreview: string | ArrayBuffer | null = null;

  constructor(private pushService: PushNotificationService, private authPushService: AuthPushService) {
    console.log('LoginPage constructor');

  }
  ngOnInit() {
    console.log('LoginPage ngOnInit');
    this.initForms();

    this.pushService.initialize();
  }

  ngOnDestroy() {
    console.log('LoginPage OnDestroy - removing push notification listeners');
    (FCM as any).removeAllListeners();
  }

  private initForms() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.customerSignupForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNo: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      profilePicture: ['']
    });

    this.vendorSignupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      name: ['', Validators.required],
      workDays: [[]],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      bio: ['', Validators.required],
      experience: [null, [Validators.required, Validators.min(0)]],
      jobField: ['', Validators.required],
      phoneNo: ['', Validators.required],
      businessName: ['', Validators.required],
      profilePicture: [''],
      rate: [null, [Validators.required, Validators.min(0)]],
      serviceArea: [[]],
      jobPosition: ['', Validators.required],
    });

    this.vendorSignupForm.get('workDays')?.setValidators(this.atLeastOneSelectedValidator);
    this.vendorSignupForm.get('serviceArea')?.setValidators(this.atLeastOneSelectedValidator);
  }

  // Validator to ensure at least one service area is selected
  atLeastOneSelectedValidator(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value;

    // Check if the value is an array and has at least 1 item
    if (Array.isArray(value) && value.length > 0) {
      return null; // Valid
    }

    return { 'atLeastOneRequired': true };
  }

  async login() {
    if (this.loginForm.invalid) {
      console.log('Login form is invalid.');
      this.displayAlert('Validation Error', 'Please enter a valid email and password.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Logging in...',
    });
    await loading.present();

    const { email, password } = this.loginForm.value;

    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      const user = userCredential.user;
      console.log('User logged in successfully! UID:', user.uid);
      this.authPushService.loginNotification(user.uid, email);



      await this.router.navigate(['/search']);

      this.loginForm.reset();

    } catch (error: any) {
      console.error('Login failed:', error);
      let errorMessage = 'Login failed. Please try again.';

      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage = 'Invalid email format.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This user account has been disabled.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No user found with this email.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
          default:
            errorMessage = `Login failed: ${error.message}`;
            break;
        }
      }

      this.displayAlert('Login Failed', errorMessage);

    } finally {
      loading.dismiss();
    }
  }

  // Handle file selection for customer profile pic
  onCustomerFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.customerImagePreview = reader.result;

        this.customerSignupForm.patchValue({ profilePicture: reader.result });
        this.customerSignupForm.get('profilePicture')?.markAsDirty();
      };
      reader.readAsDataURL(file);
    }
  }

  // Handle file selection for vendor profile pic
  onVendorFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.vendorImagePreview = reader.result;

        this.vendorSignupForm.patchValue({ profilePicture: reader.result });
        this.vendorSignupForm.get('profilePicture')?.markAsDirty();
      };
      reader.readAsDataURL(file);
    }
  }

  saveImageUrlToFirestore(imageUrl: string) {
    const userId = this.auth.currentUser?.uid;
    if (!userId) return;

    const userRef = doc(this.firestore, 'users', userId);
    updateDoc(userRef, { profilePicture: imageUrl });
  }

  async customerSignup() {
    if (this.customerSignupForm.invalid) {
      console.log('Customer signup form is invalid.');
      this.displayAlert('Validation Error', 'Please fill out all required fields correctly.');
      return;
    }

    if (!this.customerImagePreview) {
      await this.displayAlert('Validation Error', 'Please upload a profile picture.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Signing up customer...',
    });
    await loading.present();

    const {
      name,
      email,
      phoneNo,
      password,
      profilePicture
    } = this.customerSignupForm.value;

    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      const userId = userCredential.user.uid;
      console.log('Firebase Auth Customer User Created! UID:', userId);

      const customersCollection = collection(this.firestore, 'users');
      const customerDocRef = doc(customersCollection, userId);

      const customerProfileData = {
        uid: userId,
        email,
        name,
        accountType: 'customer',
        phoneNo,
        profilePicture: this.customerImagePreview,
        createdAt: new Date()
      };

      await setDoc(customerDocRef, customerProfileData);
      console.log(`Customer profile data saved to Firestore for user ${userId}`);



      this.displayAlert('Signup Successful', 'Your customer account has been created!');
      await this.router.navigate(['/search']);

      this.customerSignupForm.reset();
      this.showLoginForm();

    } catch (error: any) {
      console.error('Customer registration failed:', error);
      let errorMessage = 'Customer registration failed. Please try again.';

      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'The email address is already registered.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email format.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/Password signup is not enabled. Contact support.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please use a stronger password (minimum 6 characters).';
            break;
          default:
            errorMessage = `Registration failed: ${error.message}`;
            break;
        }
      }

      this.displayAlert('Registration Failed', errorMessage);

    } finally {
      loading.dismiss();
    }
  }

  async requestPushNotificationsPermission() {
    console.log('Requesting push notification permissions...');
    try {
      const permissionStatus = await PushNotifications.requestPermissions();
      if (permissionStatus.receive === 'granted') {
        console.log('Push notification permissions granted.');
        await PushNotifications.register();
      } else {
        console.warn('Push notification permissions denied.');
      }
    } catch (error) {
      console.error('Error requesting push notification permissions:', error);
    }
  }

  async vendorSignup() {
    if (this.vendorSignupForm.invalid) {
      console.log('Vendor signup form is invalid.');
      this.displayAlert('Validation Error', 'Please fill out all required fields correctly.');
      return;
    }

    if (!this.vendorImagePreview) {
      await this.displayAlert('Validation Error', 'Please upload a profile picture.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Signing up vendor...',
    });
    await loading.present();

    const { email, password, name, workDays, startTime, endTime, bio, experience, jobField, phoneNo, rate, serviceArea, jobPosition, businessName } = this.vendorSignupForm.value;

    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.auth,
        email, password
      );

      const userId = userCredential.user.uid;
      console.log('Firebase Auth Vendor User Created! UID:', userId);

      // Save to users collection
      const usersCollection = collection(this.firestore, 'users');
      const userDocRef = doc(usersCollection, userId);

      const basicUserData = {
        uid: userId,
        email: email,
        name: name,
        accountType: 'vendor',
        phoneNo: phoneNo,
        profilePicture: this.vendorImagePreview,
        createdAt: new Date()
      };

      await setDoc(userDocRef, basicUserData);
      console.log(`Basic user data saved to Firestore 'users' collection for user ${userId}`);


      const vendorsCollection = collection(this.firestore, 'vendors');
      const vendorDocRef = doc(vendorsCollection, userId);

      const vendorProfileData = {
        uid: userId,
        email: email,
        name: name,
        accountType: 'vendor',
        bio: bio,
        experience: experience,
        jobField: jobField,
        phoneNo: phoneNo,
        profilePicture: this.vendorImagePreview,
        rate: rate,
        serviceArea: serviceArea,
        businessName: businessName,
        jobPosition: jobPosition,
        workDays: workDays,
        startTime: startTime,
        endTime: endTime,
        createdAt: new Date()
      };

      await setDoc(vendorDocRef, vendorProfileData);
      console.log(`Vendor profile data saved to Firestore for user ${userId}`);


      this.displayAlert('Signup Successful', 'Your vendor account has been created!');
      await this.router.navigate(['/search']);

      this.vendorSignupForm.reset();
      this.showLoginForm();

    } catch (error: any) {
      console.error('Vendor registration failed:', error);
      let errorMessage = 'Vendor registration failed. Please try again.';

      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'The email address is already registered.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email format.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/Password signup is not enabled. Contact support.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please use a stronger password (minimum 6 characters).';
            break;
          default:
            errorMessage = `Registration failed: ${error.message}`;
            break;
        }
      }

      this.displayAlert('Registration Failed', errorMessage);

    } finally {
      loading.dismiss();
    }
  }





  //  method to display Alerts
  async displayAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }


  // Methods to control which form is visible on the page
  showLoginForm(): void {
    this.currentForm = 'login';

    this.customerImagePreview = null;
    this.vendorImagePreview = null;
  }

  showCustomerSignupForm(): void {
    this.currentForm = 'Customer Signup';
    this.vendorImagePreview = null;
  }

  showVendorSignupForm(): void {
    this.currentForm = 'Vendor Signup';
    this.customerImagePreview = null;
  }
}