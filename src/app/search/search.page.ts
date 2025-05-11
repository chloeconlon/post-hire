import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonItem, IonToolbar, IonTitle, IonContent, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonSearchbar, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { NavigationService } from '../services/navigation.service';
import { ViewChild, ElementRef } from '@angular/core';
import { AnimationController } from '@ionic/angular';

import { VendorService, Vendors } from '../services/vendor.service';
import { ChatService } from '../services/chat.service';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SwipeDirective } from '../directives/swipe.directive';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonItem, IonToolbar, IonTitle, IonContent, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel,
    IonSearchbar, IonSelect, IonSelectOption, SwipeDirective
  ],
})
export class SearchPage implements OnInit {
  @ViewChild('pageElement', { static: false }) pageElement!: ElementRef;

  vendors$!: Observable<Vendors[]>;

  // Search and filter subjects
  private searchQuerySubject = new BehaviorSubject<string>('');
  private priceFilterSubject = new BehaviorSubject<string>('0');
  private businessAreaSubject = new BehaviorSubject<string>('');
  private locationFilterSubject = new BehaviorSubject<string>('');

  // Filtered vendors based on search query and filters
  filteredVendors$!: Observable<Vendors[]>;

  // Form model properties
  searchQuery = '';
  priceFilter = '0';
  businessAreaFilter = '';
  locationFilter = '';

  irishCounties: string[] = [
    'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
    'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
    'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
    'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
    'Wexford', 'Wicklow'
  ];

  constructor(
    private navService: NavigationService,
    private animationCtrl: AnimationController,
    private chatService: ChatService,
    private router: Router
  ) { }

  private vendorService = inject(VendorService);

  ngOnInit() {
    this.vendors$ = this.vendorService.getVendors();

    this.filteredVendors$ = combineLatest([
      this.vendors$,
      this.searchQuerySubject.asObservable(),
      this.priceFilterSubject.asObservable(),
      this.businessAreaSubject.asObservable(),
      this.locationFilterSubject.asObservable()
    ]).pipe(
      map(([vendors, searchQuery, priceFilter, businessArea, location]) => {

        let filtered = [...vendors];

        // Apply search filter if provided
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(vendor => {
            // Check in job position
            if (vendor.jobPosition && vendor.jobPosition.toLowerCase().includes(query)) {
              return true;
            }

            // Check in business name
            if (vendor.businessName && vendor.businessName.toLowerCase().includes(query)) {
              return true;
            }

            return false;
          });
        }

        // Apply price filter if selected
        if (priceFilter && priceFilter !== '0') {
          const priceValue = parseInt(priceFilter, 10);

          if (priceValue === 101) {
            // Special case for > $100
            filtered = filtered.filter(vendor =>
              vendor.rate > 100
            );
          } else {
            // Normal case for < $X
            filtered = filtered.filter(vendor =>
              vendor.rate <= priceValue
            );
          }
        }

        // Apply business area filter if selected
        if (businessArea) {
          filtered = filtered.filter(vendor =>
            vendor.jobField === businessArea
          );
        }

        // Apply location filter if selected
        if (location) {
          filtered = filtered.filter(vendor =>
            vendor.serviceArea && vendor.serviceArea.includes(location)
          );
        }

        return filtered;
      })
    );

    // Log the original vendors for debugging
    this.vendors$.subscribe(vendors => {
      console.log("Vendors from Firestore:", vendors);
    });
  }

  nextPage() {
    this.navService.goToNext();
  }

  previousPage() {
    this.navService.goToPrevious();
  }

  // Handle search input changes
  onSearchChange(event: any) {
    const query = event.target.value || '';
    this.searchQuerySubject.next(query);
  }

  // Handle price filter changes
  onPriceFilterChange(event: any) {
    const value = event.detail.value;
    this.priceFilterSubject.next(value);
  }

  // Handle business area filter changes
  onBusinessAreaChange(event: any) {
    const value = event.detail.value;
    this.businessAreaSubject.next(value);
  }

  // Handle location filter changes
  onLocationChange(event: any) {
    const value = event.detail.value;
    this.locationFilterSubject.next(value);
  }

  // Clear all filters
  clearFilters() {
    this.searchQuery = '';
    this.priceFilter = '0';
    this.businessAreaFilter = '';
    this.locationFilter = '';

    this.searchQuerySubject.next('');
    this.priceFilterSubject.next('0');
    this.businessAreaSubject.next('');
    this.locationFilterSubject.next('');
  }

  goToVendorProfile(vendorId: string) {
    this.router.navigate(['/job-profile', vendorId]);
  }

  async startChat(vendorId: string): Promise<void> {
    try {
      console.log(`Starting chat with vendor: ${vendorId}`);
      // Use the chat service to get or create a chat with this vendor
      const chatId = await this.chatService.getOrCreateChat(vendorId);

      // Navigate to the chat page with the chatId
      this.router.navigate(['/chat', chatId]);
    } catch (error) {
      console.error('Error starting chat:', error);

    }
  }

  playAnimation() {
    if (!this.pageElement) {
      console.error('Animation Error: Element not found');
      return;
    }

    const animation = this.animationCtrl.create()
      .addElement(this.pageElement.nativeElement)
      .duration(200)
      .fromTo('transform', 'translateX(100%)', 'translateX(0)');

    animation.play();
  }

  goToMessages() {
    this.navService.goToMessages();
  }

  goToSearch() {
    this.navService.goToSearch();
  }

  goToAccount() {
    this.navService.goToAccount();
  }
}