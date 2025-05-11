

import { Injectable } from '@angular/core';
import { Auth, User, authState } from '@angular/fire/auth';
import { Firestore, Timestamp, doc, docData } from '@angular/fire/firestore';


import { Observable, of, combineLatest } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators';

// Define interfaces for your document data
export interface UserData {
  uid?: string;
  email?: string;
  name?: string;
  accountType?: string;
  profilePicture?: string;
  createdAt?: Timestamp;

}
//Vendors data
export interface VendorData {
  uid?: string;
  name?: string;
  location?: string;
  bio?: string;
  email?: string;
  experience?: string;
  jobField?: string;
  phoneNo?: string;
  profilePicture?: string;
  rate?: number;
  businessName?: string;
  jobPosition?: string;
  workDays?: string[];
  serviceArea?: string[];
  startTime?: string;
  endTime?: string;


}


export interface UserAccountData {
  userData: UserData | null;
  vendorData: VendorData | null;
}


@Injectable({
  providedIn: 'root'
})
export class AccountService {

  // Private observable for the Angular fire auth state
  private readonly authState$: Observable<User | null>;

  // Public observable for the user's document data from 'users' collection
  readonly userData$: Observable<UserData | null>;


  readonly vendorData$: Observable<VendorData | null>;

  readonly combinedAccountData$: Observable<UserAccountData | null>;


  constructor(private auth: Auth, private firestore: Firestore) {
    console.log('AccountService initialized');

    // Get the Angular Fire Auth state observable
    this.authState$ = authState(this.auth);

    // fetching User data
    this.userData$ = this.authState$.pipe(
      tap(user => console.log('Auth state changed:', user ? user.uid : 'Logged out')),
      switchMap(user => {
        if (user) {

          const userDocRef = doc(this.firestore, 'users', user.uid);

          return docData(userDocRef, { idField: 'uid' }) as Observable<UserData>;
        } else {
          return of(null);
        }
      }),
      tap(data => console.log('UserData emitted:', data))
    );

    // fetching Vendor Data ---

    this.vendorData$ = this.authState$.pipe(
      tap(user => console.log('Auth state changed for vendor data fetch:', user ? user.uid : 'Logged out')), // Optional: for debugging
      switchMap(user => {
        if (user) {
          // If user is logged in, get the reference to their doc in the vendors collection
          // change users to vendors here!
          const vendorDocRef = doc(this.firestore, 'vendors', user.uid);

          return docData(vendorDocRef, { idField: 'uid' }) as Observable<VendorData>;
        } else {

          return of(null);
        }
      }),
      tap(data => console.log('VendorData emitted:', data))
    );


    this.combinedAccountData$ = combineLatest([this.userData$, this.vendorData$]).pipe(
      map(([userData, vendorData]) => {

        if (!userData) {
          return null;
        }

        return { userData, vendorData };
      }),
      tap(data => console.log('Combined Account Data emitted:', data))
    );

  }

  // methods here to update user /vendor data
  //trigger changes in Firestore
  async updateUserData(uid: string, data: Partial<UserData>): Promise<void> {
    if (!uid) {
      console.error("Cannot update user data: UID is missing.");
      return;
    }
    const userDocRef = doc(this.firestore, 'users', uid);

    console.log(`Attempted to update user document for UID: ${uid}`);

  }

  async updateVendorData(uid: string, data: Partial<VendorData>): Promise<void> {
    if (!uid) {
      console.error("Cannot update vendor data: UID is missing.");
      return;
    }
    const vendorDocRef = doc(this.firestore, 'vendors', uid);

    console.log(`Attempted to update vendor document for UID: ${uid}`);

  }


  async createVendorData(uid: string, initialData: VendorData): Promise<void> {
    if (!uid) {
      console.error("Cannot create vendor data: UID is missing.");
      return;
    }
    const vendorDocRef = doc(this.firestore, 'vendors', uid);

    console.log(`Attempted to create/set vendor document for UID: ${uid}`);

  }


}
