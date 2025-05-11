
import { Component, OnInit, OnDestroy, Directive } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { NavigationService } from '../services/navigation.service';
import { ViewChild, ElementRef } from '@angular/core';
import { AnimationController } from '@ionic/angular';

import { Auth } from '@angular/fire/auth';
import { AccountService, UserData } from '../services/account.service';

import { ChatService, Chat, ExtendedChat } from '../services/chat.service';

import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { SwipeDirective } from '../directives/swipe.directive';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonList, IonItem, IonAvatar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-message-list',
  templateUrl: './message-list.page.html',
  styleUrls: ['./message-list.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonItem,
    IonToolbar,
    IonTitle,
    IonContent,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonList,
    IonItem,
    IonAvatar,
    AsyncPipe,
    SwipeDirective
  ],
})
export class MessageListPage implements OnInit, OnDestroy {
  @ViewChild('pageElement', { static: true }) pageElement!: ElementRef;


  userChats$!: Observable<ExtendedChat[]>;


  constructor(
    private navService: NavigationService,
    private animationCtrl: AnimationController,
    private chatService: ChatService,
    private router: Router,
    private auth: Auth,
    private accountService: AccountService
  ) {
    console.log('MessageListPage constructor');
  }

  ngOnInit() {
    console.log('MessageListPage ngOnInit');
    this.userChats$ = this.chatService.getUserChats();
  }

  ngOnDestroy() {
    console.log('MessageListPage ngOnDestroy');
  }

  openChat(chatId: string) {
    console.log(`Opening chat with ID: ${chatId}`);
    this.router.navigate(['/chat', chatId]);
  }

  getOtherParticipantDetails(chat: ExtendedChat): Observable<UserData | null> {

    if (chat.otherParticipantName && chat.otherParticipantId) {
      return of({
        uid: chat.otherParticipantId,
        name: chat.otherParticipantName
      } as UserData);
    }

    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return of(null);
    }

    const otherParticipantId = chat.participantIds.find(uid => uid !== currentUser.uid);
    if (!otherParticipantId) {
      console.warn(`Could not find other participant ID in chat ${chat.id}`);
      return of(null);
    }

    if (chat.participantNames && chat.participantNames[otherParticipantId]) {
      return of({
        uid: otherParticipantId,
        name: chat.participantNames[otherParticipantId]
      } as UserData);
    }

    console.log(`Fetching details for participant: ${otherParticipantId}`);

    return this.chatService.getUserNameById(otherParticipantId).pipe(
      map(name => {
        if (name) {
          return {
            uid: otherParticipantId,
            name: name
          } as UserData;
        }
        return null;
      })
    );
  }

  truncateMessage(message: string, limit: number = 20): string {
    if (!message) return 'No messages yet';
    return message.length > limit ? message.slice(0, limit) + '...' : message;
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

  nextPage() {
    this.navService.goToNext();
  }

  previousPage() {
    this.navService.goToPrevious();
  }

  goToMessages() { this.navService.goToMessages(); }
  goToSearch() { this.navService.goToSearch(); }
  goToAccount() { this.navService.goToAccount(); }
}