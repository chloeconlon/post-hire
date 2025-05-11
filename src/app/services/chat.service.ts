// src/app/services/chat.service.ts

import { Injectable } from '@angular/core';
import { Auth, authState, User } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  docData,
  setDoc,
  addDoc,
  Timestamp,
  query,
  where,
  orderBy,
  getDoc,
  limit,
  updateDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Observable, of, switchMap, map, combineLatest, forkJoin } from 'rxjs';
import { AuthPushService } from './auth-push.service';



export interface ChatMessage {
  id: string;
  text?: string;
  timestamp: any;
  senderId: string;
  senderName: string;
  type: 'text' | 'image';
  imageData?: string;
}

export interface EnrichedChatMessage extends ChatMessage {
  senderNameFromDB?: string; // Name fetched from DB to ensure accuracy
  isRead?: boolean;
}

export interface Chat {
  id: string;
  participantIds: string[];
  participants: { [uid: string]: boolean };
  participantNames?: { [uid: string]: string };
  lastMessage?: string;
  lastMessageTimestamp?: any;
  createdAt: any;

}

export interface ExtendedChat extends Chat {
  otherParticipantId?: string;
  otherParticipantName?: string;
  otherParticipantProfilePicture?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private readonly authState$: Observable<User | null> = authState(this.auth);



  constructor(private firestore: Firestore, private auth: Auth, private authPushService: AuthPushService) {

    console.log('ChatService initialized');
    this.authState$ = authState(this.auth);

    this.authPushService.newMessageReceived.subscribe(message => {
      console.log('New message received:', message);
    });
  }

  public getAuthState(): Observable<User | null> {
    return this.authState$;
  }
  //comparing chat ids
  generateChatId(uid1: string, uid2: string): string {
    const sortedUids = [uid1, uid2].sort();
    return `${sortedUids[0]}_${sortedUids[1]}`;
  }
  //find or create chat
  async getOrCreateChat(otherUserId: string): Promise<string> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    const currentUserId = currentUser.uid;

    const chatId = this.generateChatId(currentUserId, otherUserId);
    const chatDocRef = doc(this.firestore, 'chats', chatId);

    const chatDoc = await getDoc(chatDocRef);

    if (!chatDoc.exists()) {
      console.log(`Chat ${chatId} does not exist, creating...`);

      // Get names for both users
      const currentUserName = currentUser.displayName || 'Anonymous';

      // Get other user's name
      const otherUserDoc = await getDoc(doc(this.firestore, 'users', otherUserId));
      const otherUserName = otherUserDoc.exists() ?
        (otherUserDoc.data()['displayName'] || 'Unknown User') : 'Unknown User';

      const initialChatData: Partial<Chat> = {
        participantIds: [currentUserId, otherUserId].sort(),
        participants: {
          [currentUserId]: true,
          [otherUserId]: true
        },
        participantNames: {
          [currentUserId]: currentUserName,
          [otherUserId]: otherUserName
        },
        createdAt: Timestamp.now(),
        lastMessage: '',
        lastMessageTimestamp: Timestamp.now()
      };
      await setDoc(chatDocRef, initialChatData);
      console.log(`Chat ${chatId} created with participant names.`);
    } else {
      console.log(`Chat ${chatId} already exists.`);

      // Add usernames if they don't exist
      const chatData = chatDoc.data();
      if (!chatData['participantNames']) {
        const currentUserName = currentUser.displayName || 'Anonymous';
        const otherUserDoc = await getDoc(doc(this.firestore, 'users', otherUserId));
        const otherUserName = otherUserDoc.exists() ?
          (otherUserDoc.data()['displayName'] || 'Unknown User') : 'Unknown User';

        await updateDoc(chatDocRef, {
          participantNames: {
            [currentUserId]: currentUserName,
            [otherUserId]: otherUserName
          }
        });
        console.log(`Added participant names to existing chat.`);
      }
    }

    return chatId;
  }

  getUserNameById(userId: string): Observable<string | null> {
    if (!userId) return of(null);

    const userDocRef = doc(this.firestore, `users/${userId}`);
    return docData(userDocRef).pipe(
      map(user => {
        console.log(`Fetched user data for ${userId}:`, user);
        return user
          ? user['displayName'] || user['name'] || user['fullName'] || 'Unknown User'
          : 'Unknown User';
      })
    );
  }

  getChatMessages(chatId: string, limitMessages = 50): Observable<EnrichedChatMessage[]> {
    if (!chatId) {
      console.error('Cannot get messages: Chat ID is missing');
      return of([]);
    }

    const chatDocRef = doc(this.firestore, 'chats', chatId);
    const messagesCollectionRef = collection(chatDocRef, 'messages');

    const messagesQuery = query(
      messagesCollectionRef,
      orderBy('timestamp', 'desc'),
      limit(limitMessages)
    );

    return collectionData(messagesQuery, { idField: 'id' }).pipe(
      switchMap(messages => {

        const typedMessages = messages as unknown as ChatMessage[];

        if (typedMessages.length === 0) {
          return of([]);
        }

        // First, get chat document to check if this is a self chat
        return docData(chatDocRef).pipe(
          switchMap((chatData: any) => {
            const chat = chatData as Chat;
            const currentUser = this.auth.currentUser;

            // Check if this is a self chat
            const isSelfChat = chat.participantIds.length === 1 ||
              (chat.participantIds.length === 2 &&
                chat.participantIds[0] === chat.participantIds[1]) ||
              (currentUser && chat.participantIds.filter(id => id === currentUser.uid).length === chat.participantIds.length);

            // For each message, get the sender's current name
            const messageObservables = typedMessages.map(message => {

              if (!message.senderId) {
                return of({
                  ...message,
                  senderNameFromDB: 'Unknown User'
                });
              }

              // Get the current user name from the database
              return this.getUserNameById(message.senderId).pipe(
                map(currentName => {
                  // For self chat, mark messages as from "You"
                  if (isSelfChat && currentUser && message.senderId === currentUser.uid) {
                    return {
                      ...message,
                      senderNameFromDB: `${currentName || message.senderName || 'You'} (You)`
                    };
                  }

                  return {
                    ...message,
                    senderNameFromDB: currentName || message.senderName || 'Unknown User'
                  };
                })
              );
            });

            return combineLatest(messageObservables).pipe(
              map(enrichedMessages => {
                // Sort messages by time (oldest first)
                return enrichedMessages.sort((a, b) => {
                  const timestampA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
                  const timestampB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
                  return timestampA - timestampB;
                });
              })
            );
          })
        );
      })
    );
  }


  // Send a Text message
  async sendMessage(chatId: string, messageText: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Cannot send message: No user logged in');
    }
    if (!chatId) {
      throw new Error('Cannot send message: Chat ID is missing');
    }

    const chatDocRef = doc(this.firestore, 'chats', chatId);
    const messagesSubcollectionRef = collection(chatDocRef, 'messages');


    const userDocRef = doc(this.firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    const userName = userDoc.exists() ?
      (userDoc.data()['displayName'] || user.displayName || 'Anonymous') :
      (user.displayName || 'Anonymous');

    const newMessageData: Partial<ChatMessage> = {
      text: messageText,
      timestamp: Timestamp.now(),
      senderId: user.uid,
      senderName: userName,
      type: 'text'
    };

    try {
      await addDoc(messagesSubcollectionRef, newMessageData);
      console.log(`Message sent to chat ${chatId}`);

      // Update the chat with the last message
      await updateDoc(chatDocRef, {
        lastMessage: messageText,
        lastMessageTimestamp: Timestamp.now()
      });
      console.log(`Chat document updated with last message`);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // --- Send an Image Message 
  async sendImageMessage(chatId: string, base64Image: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Cannot send image: No user logged in');
    }
    if (!chatId) {
      throw new Error('Cannot send image: Chat ID is missing');
    }

    const chatDocRef = doc(this.firestore, 'chats', chatId);
    const messagesSubcollectionRef = collection(chatDocRef, 'messages');

    // Get latest user data from database 
    const userDocRef = doc(this.firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    const userName = userDoc.exists() ?
      (userDoc.data()['displayName'] || user.displayName || 'Anonymous') :
      (user.displayName || 'Anonymous');

    const newMessageData: Partial<ChatMessage> = {
      timestamp: Timestamp.now(),
      senderId: user.uid,
      senderName: userName,
      type: 'image',
      imageData: base64Image
    };

    try {
      // Add the message
      await addDoc(messagesSubcollectionRef, newMessageData);
      console.log(`Image message sent to chat ${chatId}`);

      // Update the chat document with the last message
      await updateDoc(chatDocRef, {
        lastMessage: '📷 Photo',
        lastMessageTimestamp: Timestamp.now()
      });
      console.log(`Chat document updated with last message`);
    } catch (error) {
      console.error('Error sending image message:', error);
      throw error;
    }
  }

  // Add this method to create a self chat
  async createSelfChat(): Promise<string> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    // Create a chat where both users are the current user
    const chatId = this.generateChatId(currentUser.uid, currentUser.uid);
    const chatDocRef = doc(this.firestore, 'chats', chatId);

    const chatDoc = await getDoc(chatDocRef);

    if (!chatDoc.exists()) {
      console.log(`Self-chat ${chatId} does not exist, creating...`);

      const currentUserName = currentUser.displayName || 'You';

      const initialChatData: Partial<Chat> = {
        participantIds: [currentUser.uid],
        participants: {
          [currentUser.uid]: true
        },
        participantNames: {
          [currentUser.uid]: currentUserName
        },
        createdAt: Timestamp.now(),
        lastMessage: '',
        lastMessageTimestamp: Timestamp.now()
      };

      await setDoc(chatDocRef, initialChatData);
      console.log(`Self-chat ${chatId} created.`);
    }

    return chatId;
  }
  async debugUserData() {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return;

    console.log('Auth User:', {
      uid: currentUser.uid,
      displayName: currentUser.displayName
    });

    const userDoc = await getDoc(doc(this.firestore, 'users', currentUser.uid));
    console.log('Firestore User:', userDoc.exists() ? userDoc.data() : 'No document');
  }


  getUserChats(): Observable<ExtendedChat[]> {
    return this.authState$.pipe(
      switchMap(user => {
        if (!user) {
          console.warn("User not logged in, returning empty chats.");
          return of([]);
        }

        console.log("Fetching chats for user:", user.uid);
        const chatsCollectionRef = collection(this.firestore, 'chats');

        const userChatsQuery = query(
          chatsCollectionRef,
          where('participantIds', 'array-contains', user.uid)
        );

        return collectionData(userChatsQuery, { idField: 'id' }).pipe(
          switchMap((chats: any[]) => {
            const typedChats = chats as Chat[];

            // If no chats, return empty array
            if (typedChats.length === 0) {
              return of([] as ExtendedChat[]);
            }

            // For each chat, find the other user and get their name
            const extendedChatObservables = typedChats.map(chat => {
              // Check if this is a self-chat (you messaging yourself)
              const isSelfChat = chat.participantIds.length === 1 ||
                (chat.participantIds.length === 2 &&
                  chat.participantIds[0] === chat.participantIds[1]);

              // If it's a self chat, use the current user's info
              if (isSelfChat) {
                // Get current user info from users collection
                const userDocRef = doc(this.firestore, 'users', user.uid);
                return docData(userDocRef).pipe(
                  map(userData => {
                    const userName = userData ?
                      (userData['displayName'] || userData['name'] || userData['fullName'] || user.displayName || 'You') :
                      (user.displayName || 'You');

                    const profilePicture = userData ? (userData['profilePicture'] || '') : '';

                    return {
                      ...chat,
                      otherParticipantId: user.uid,
                      otherParticipantName: `${userName} (You)`,
                      otherParticipantProfilePicture: profilePicture
                    } as ExtendedChat;
                  })
                );
              }

              // Otherwise, find the other participant
              const otherParticipantId = chat.participantIds.find(id => id !== user.uid);

              if (!otherParticipantId) {
                console.warn(`No other participant found in chat ${chat.id}`);
                return of({
                  ...chat,
                  otherParticipantId: '',
                  otherParticipantName: 'Unknown User'
                } as ExtendedChat);
              }

              //  lookup from users collection
              const userDocRef = doc(this.firestore, 'users', otherParticipantId);
              return docData(userDocRef).pipe(
                map(userData => {
                  console.log(`User data for ${otherParticipantId}:`, userData);

                  // Get name from user document
                  let userName = 'Unknown User';
                  let profilePicture = '';

                  if (userData) {
                    // Try different name fields
                    userName = userData['displayName'] ||
                      userData['name'] ||
                      userData['fullName'] ||
                      'Unknown User';

                    profilePicture = userData['profilePicture'] || '';
                  }

                  console.log(`Name for user ${otherParticipantId}: ${userName}`);

                  // Create extended chat with user info
                  const extendedChat: ExtendedChat = {
                    ...chat,
                    otherParticipantId,
                    otherParticipantName: userName,
                    otherParticipantProfilePicture: profilePicture
                  };

                  return extendedChat;
                })
              );
            });

            // Combine all chats into a single array 
            return combineLatest(extendedChatObservables);
          })
        );
      })
    );
  }


  // Mark a  message as read
  markMessageAsRead(chatId: string, messageId: string): Promise<void> {
    const messageDocRef = doc(this.firestore, 'chats', chatId, 'messages', messageId);
    return updateDoc(messageDocRef, { isRead: true });
  }



  // check if sender is part of a chat
  isSenderInChat(senderId: string, chatId: string): boolean {

    return true;
  }

  getChatWithDetails(chatId: string): Observable<(Chat & { participants: { [uid: string]: any } }) | null> {
    const chatDocRef = doc(this.firestore, 'chats', chatId);

    return docData(chatDocRef, { idField: 'id' }).pipe(
      switchMap((docData: any) => {
        if (!docData) return of(null);


        const chat = docData as unknown as Chat;

        if (!chat.participantIds || !Array.isArray(chat.participantIds) || chat.participantIds.length === 0) {
          return of({
            ...chat,
            participants: {} as { [uid: string]: any }
          });
        }

        // Create an array of observables for each users data
        const participantObservables = chat.participantIds.map(uid =>
          this.getUserNameById(uid).pipe(
            map(name => ({ uid, name }))
          )
        );

        // Combine all user data with the chat
        return forkJoin(participantObservables).pipe(
          map(participants => {
            const participantMap: { [uid: string]: any } = {};
            participants.forEach(p => {
              if (p && p.uid) {
                participantMap[p.uid] = { name: p.name };
              }
            });

            return {
              ...chat,
              participants: participantMap
            };
          })
        );
      })
    );
  }
}