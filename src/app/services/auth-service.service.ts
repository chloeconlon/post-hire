import { Injectable, inject } from '@angular/core';
import { Auth, User, getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth: Auth = getAuth();

  // It will emit the current User object when signed in or null when signed out
  user$: Observable<User | null>;

  constructor() {


    this.user$ = new Observable<User | null>(observer => {

      const unsubscribe = onAuthStateChanged(this.auth,
        user => {

          observer.next(user);
        },
        error => {

          observer.error(error);
        }
      );

      return () => unsubscribe();
    });



  }


  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // logout method
  async signOut() {
    try {
      await signOut(this.auth);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }


}
