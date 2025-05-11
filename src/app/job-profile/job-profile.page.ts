import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonAvatar, IonLabel, IonItem, IonCard, IonButtons, IonBackButton, IonTab, IonTabButton, IonTabBar, IonTabs } from '@ionic/angular/standalone';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { VendorService } from '../services/vendor.service';
import { ChatService } from '../services/chat.service';
import { NavigationService } from '../services/navigation.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
@Component({
  selector: 'app-job-profile',
  standalone: true,
  templateUrl: './job-profile.page.html',
  styleUrls: ['./job-profile.page.scss'],
  imports: [IonTabs, IonTabBar, CommonModule, FormsModule, RouterModule,
    IonTitle, IonTabButton, IonHeader, IonToolbar, IonContent, IonAvatar, IonLabel, IonItem, IonCard, IonButtons, IonBackButton,
  ],
})
export class JobProfilePage implements OnInit {
  private route = inject(ActivatedRoute);
  private vendorService = inject(VendorService);
  private navService = inject(NavigationService);

  constructor(
    private chatService: ChatService,
    private router: Router
  ) {

  }
  vendorId: string | null = null;

  // 🟡 Default mock vendor
  vendor: any = {
    profilePicture: 'https://via.placeholder.com/150',
    name: 'John Doe',
    location: 'Galway, Ireland',
    phoneNo: '+353 87 123 4567',
    email: 'johndoe@example.com',
    jobField: 'Handyman',
    experience: 5,
    bio: 'Hi, I’m John. I’ve been working in the Galway area for 5 years doing odd jobs and home repairs...',
    availability: 'Mon-Fri, 9am-6pm',
    rate: 30,
    serviceArea: 'Galway City & Surroundings',
  };

  ngOnInit() {
    this.vendorId = this.route.snapshot.paramMap.get('id');
    if (this.vendorId) {
      this.vendorService.getVendorById(this.vendorId).subscribe({
        next: (data) => {
          if (data) {
            this.vendor = data;
          }
        },
        error: (err) => {
          console.error('Failed to fetch vendor from Firestore:', err);

        }
      });
    }
  }
  async startChat(vendorId: string): Promise<void> {
    try {
      console.log(`Starting chat with vendor: ${vendorId}`);

      const chatId = await this.chatService.getOrCreateChat(vendorId);

      this.router.navigate(['/chat', chatId]);
    } catch (error) {
      console.error('Error starting chat:', error);

    }
  }
  //format for time
  formatTime(time: string): string {
    if (!time) return "";
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
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