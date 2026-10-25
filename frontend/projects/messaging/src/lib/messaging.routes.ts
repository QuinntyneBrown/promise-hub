import { Routes } from '@angular/router';
import { MessagePage } from './message-page/message-page';
import { MessagesPage } from './messages-page/messages-page';
import { NewMessagePage } from './new-message-page/new-message-page';

export const routes: Routes = [
  { path: '', component: MessagesPage, title: 'Messages · PromiseHub' },
  { path: 'new', component: NewMessagePage, title: 'New message · PromiseHub' },
  { path: ':messageId', component: MessagePage, title: 'Message · PromiseHub' },
];
