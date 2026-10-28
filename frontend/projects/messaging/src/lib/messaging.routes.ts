import { Routes } from '@angular/router';
import { AnnouncementsPage } from './announcements-page/announcements-page';
import { MessagePage } from './message-page/message-page';
import { MessagesPage } from './messages-page/messages-page';
import { NewMessagePage } from './new-message-page/new-message-page';
import { YouthAnnouncementsPage } from './youth-announcements-page/youth-announcements-page';

export const routes: Routes = [
  { path: '', component: MessagesPage, title: 'Messages · PromiseHub' },
  { path: 'new', component: NewMessagePage, title: 'New message · PromiseHub' },
  { path: 'announcements', component: AnnouncementsPage, title: 'Announcements · PromiseHub' },
  { path: ':messageId', component: MessagePage, title: 'Message · PromiseHub' },
];

/** A youth's or mentor's announcements (L2-105 criterion 5), at /announcements. */
export const announcementRoutes: Routes = [
  { path: '', component: YouthAnnouncementsPage, title: 'Announcements · PromiseHub' },
];
