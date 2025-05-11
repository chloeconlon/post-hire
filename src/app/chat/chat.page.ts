import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonItem, IonToolbar, IonTitle, IonContent, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonButtons, IonButton, IonFooter } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { NavigationService } from '../services/navigation.service';
import { ViewChild, ElementRef } from '@angular/core';
import { AnimationController, IonContent as IonContentDirective } from '@ionic/angular';
import { ChatService, ChatMessage, ExtendedChat, EnrichedChatMessage } from '../services/chat.service';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, take, filter } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { addIcons } from 'ionicons';
import { camera, arrowBack, send, notifications } from 'ionicons/icons';
import { AuthPushService } from '../services/auth-push.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [AuthPushService],
  imports: [
    FormsModule,
    CommonModule,
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
    IonButtons,
    IonButton,
    IonFooter
  ],
})
export class ChatPage implements OnInit, AfterViewInit {

  @ViewChild('pageElement', { static: true }) pageElement!: ElementRef;
  @ViewChild(IonContentDirective, { static: false }) content!: IonContentDirective;
  @ViewChild('chatContent') chatContent!: ElementRef;

  constructor(
    private navService: NavigationService,
    private animationCtrl: AnimationController,
    private chatService: ChatService,
    private authPushService: AuthPushService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {

    addIcons({
      camera,
      arrowBack,
      send,
      notifications
    });
  }

  userChats$!: Observable<ExtendedChat[]>;
  messageSubscription?: Subscription;
  pushNotificationSubscription?: Subscription;
  newMessage: string = '';
  vendorId!: string;
  chatId!: string;
  messages$!: Observable<EnrichedChatMessage[]>;
  recipientName: string = '';
  recipientProfilePicture: string = '';
  currentUserId!: string;
  messagesLoaded: boolean = false;
  highlightedMessageId?: string;

  ngOnInit(): void {

    this.chatId = this.activatedRoute.snapshot.paramMap.get('chatId')!;
    console.log("Chat opened with ID:", this.chatId);


    this.activatedRoute.queryParams.subscribe(params => {
      if (params['highlight']) {
        this.highlightedMessageId = params['highlight'];
        console.log("Message to highlight:", this.highlightedMessageId);
      }
    });

    // Get current users id
    this.chatService.getAuthState().subscribe(user => {
      if (user) {
        this.currentUserId = user.uid;


        this.messages$ = this.chatService.getChatMessages(this.chatId);


        this.messageSubscription = this.messages$.subscribe(messages => {
          console.log("Messages loaded:", messages.length);
          this.messagesLoaded = true;


          if (this.highlightedMessageId) {
            this.scrollToMessage(this.highlightedMessageId);
          } else {

            this.scrollToBottomMultipleTimes();
          }

          // Mark messages as read when viewed
          this.markMessagesAsRead(messages);
        });

        this.chatService.getUserChats().subscribe(chats => {
          console.log("User Chats Retrieved:", chats);
          if (!chats.length) {
            console.warn("No chats found matching the current user's ID.");
          }
        });

        // Identify the ruser in chat
        this.chatService.getUserChats().subscribe(chats => {
          const chat = chats.find(c => c.id === this.chatId);
          if (chat) {
            this.recipientName = chat.otherParticipantName || 'Unknown User';
            this.recipientProfilePicture = chat.otherParticipantProfilePicture || 'assets/default-avatar.png';
          } else {
            console.warn('Chat not found');
            this.recipientName = 'Unknown User';
            this.recipientProfilePicture = 'assets/default-avatar.png';
          }
        });


        this.subscribeToPushNotifications();
      }
    });
  }

  // Subscribe to push notifications
  private subscribeToPushNotifications() {

    this.pushNotificationSubscription = this.authPushService.newMessageReceived
      .pipe(
        filter(messageData => {

          const isRelevantChat = messageData.senderId === this.chatId ||
            this.chatService.isSenderInChat(messageData.senderId, this.chatId);

          if (isRelevantChat) {
            console.log('Received push notification relevant to current chat:', messageData);
          }

          return isRelevantChat;
        })
      )
      .subscribe(messageData => {
        console.log('Processing push notification for current chat:', messageData);


        // Scroll to new message
        setTimeout(() => {
          this.scrollToBottom(0);
        }, 300);
      });
  }


  //marking msg as read
  private markMessagesAsRead(messages: EnrichedChatMessage[]) {
    const unreadMessages = messages.filter(
      msg => !msg.isRead && msg.senderId !== this.currentUserId
    );

    if (unreadMessages.length > 0) {

      unreadMessages.forEach(message => {
        this.chatService.markMessageAsRead(this.chatId, message.id);
      });
    }
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit executed!');
    this.chatId = this.activatedRoute.snapshot.paramMap.get('chatId')!;
    this.vendorId = this.activatedRoute.snapshot.paramMap.get('vendorId')!;

    console.log("Chat opened with ID:", this.chatId);
    console.log("Vendor ID:", this.vendorId);

    if (this.messagesLoaded) {
      if (this.highlightedMessageId) {
        this.scrollToMessage(this.highlightedMessageId);
      } else {
        this.scrollToBottomMultipleTimes();
      }
    }
  }

  private scrollToBottomMultipleTimes(): void {

    this.scrollToBottom(0);

    setTimeout(() => this.scrollToBottom(0), 100);


    setTimeout(() => this.scrollToBottom(0), 500);


    setTimeout(() => this.scrollToBottom(0), 1000);
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;

    if (!this.chatId || !this.currentUserId) {
      console.error("Missing chatId or currentUserId.");
      return;
    }

    await this.chatService.sendMessage(this.chatId, this.newMessage);
    this.newMessage = '';


    this.scrollToBottomMultipleTimes();
  }

  // Method to take a photo using the device camera
  async takePhoto() {
    try {

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      if (image && image.base64String) {
        console.log("Photo taken successfully");
        await this.sendPhotoMessage(image.base64String);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  }

  // Method to send the photo as a message
  async sendPhotoMessage(base64Image: string) {
    if (!this.chatId || !this.currentUserId) {
      console.error("Missing chatId or currentUserId.");
      return;
    }

    // Send image through the chat service
    await this.chatService.sendImageMessage(this.chatId, base64Image);

    // Scroll to bottom after sending
    this.scrollToBottomMultipleTimes();
  }

  // Scroll to a specific message 
  scrollToMessage(messageId: string) {
    console.log("Attempting to scroll to message:", messageId);


    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.highlightMessage(messageElement);
        console.log("Found and scrolled to message element");
      } else {
        console.log("Message element not found, will try again");

        setTimeout(() => {
          const retryElement = document.getElementById(`message-${messageId}`);
          if (retryElement) {
            retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.highlightMessage(retryElement);
            console.log("Found and scrolled to message element on second attempt");
          } else {
            console.warn("Could not find message element to highlight");

            this.scrollToBottom(0);
          }
        }, 1000);
      }
    }, 300);
  }


  highlightMessage(element: HTMLElement) {

    element.classList.add('highlighted-message');


    setTimeout(() => {
      element.classList.remove('highlighted-message');
    }, 3000);
  }

  private scrollToBottom(delay: number = 300): void {
    setTimeout(() => {
      console.log("Attempting to scroll to bottom");


      if (this.content) {
        this.content.scrollToBottom(0);
        console.log("Used IonContent scrollToBottom");
      }

      else if (this.chatContent?.nativeElement) {
        this.chatContent.nativeElement.scrollTop = this.chatContent.nativeElement.scrollHeight;
        console.log("Used direct DOM scrolling");
      }
    }, delay);
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

  ngOnDestroy(): void {

    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    if (this.pushNotificationSubscription) {
      this.pushNotificationSubscription.unsubscribe();
    }
  }
}