import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'search',
    loadComponent: () => import('./search/search.page').then((m) => m.SearchPage),
  },
  {
    path: 'job-profile/:id',
    loadComponent: () => import('./job-profile/job-profile.page').then((m) => m.JobProfilePage),
  },
  {
    path: 'message-list',
    loadComponent: () => import('./message-list/message-list.page').then((m) => m.MessageListPage),
  },
  {
    path: 'account',
    loadComponent: () => import('./account/account.page').then((m) => m.AccountPage),
  },
  {
    path: 'chat/:chatId',
    loadComponent: () => import('./chat/chat.page').then((m) => m.ChatPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
];
