import { Routes } from '@angular/router';
import { AnnouncementsPage } from './announcements-page/announcements-page';
import { MessagePage } from './message-page/message-page';
import { MessagesPage } from './messages-page/messages-page';
import { NewMessagePage } from './new-message-page/new-message-page';

export const routes: Routes = [
  { path: '', component: MessagesPage, title: 'Messages · PromiseHub' },
  { path: 'new', component: NewMessagePage, title: 'New message · PromiseHub' },
  { path: 'announcements', component: AnnouncementsPage, title: 'Announcements · PromiseHub' },
  { path: ':messageId', component: MessagePage, title: 'Message · PromiseHub' },
];
