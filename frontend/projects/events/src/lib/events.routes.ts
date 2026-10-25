import { Routes } from '@angular/router';
import { EventFormPage } from './event-form-page/event-form-page';
import { EventPage } from './event-page/event-page';
import { EventsPage } from './events-page/events-page';

export const routes: Routes = [
  { path: '', component: EventsPage, title: 'Events · PromiseHub' },
  { path: 'new', component: EventFormPage, title: 'New event · PromiseHub' },
  { path: ':eventId', component: EventPage, title: 'Event · PromiseHub' },
  { path: ':eventId/edit', component: EventFormPage, title: 'Edit event · PromiseHub' },
];
