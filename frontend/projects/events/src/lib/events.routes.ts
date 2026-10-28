import { Routes } from '@angular/router';
import { EventFormPage } from './event-form-page/event-form-page';
import { EventPage } from './event-page/event-page';
import { EventsCalendarPage } from './events-calendar-page/events-calendar-page';
import { YouthSchedulePage } from './youth-schedule-page/youth-schedule-page';
import { EventsPage } from './events-page/events-page';

export const routes: Routes = [
  { path: '', component: EventsPage, title: 'Events · PromiseHub' },
  { path: 'new', component: EventFormPage, title: 'New event · PromiseHub' },
  { path: 'calendar', component: EventsCalendarPage, title: 'Calendar · PromiseHub' },
  { path: ':eventId', component: EventPage, title: 'Event · PromiseHub' },
  { path: ':eventId/edit', component: EventFormPage, title: 'Edit event · PromiseHub' },
];

/** A youth's schedule (ADR 0064): mounted at /schedule under Roster, because it reads the roster and events. */
export const scheduleRoutes: Routes = [
  { path: '', component: YouthSchedulePage, title: 'Your schedule · PromiseHub' },
];
