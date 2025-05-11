import { Component } from '@angular/core';
import { IonHeader, IonItem, IonToolbar, IonTitle, IonContent, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonItem, IonToolbar, IonTitle, IonContent, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel ],
})
export class HomePage {
  constructor(private router:Router) {}

  openMovies() {
    this.router.navigate(['/search'])
  }
}
