import { Routes } from '@angular/router';
import { IncidentPage } from './incident-page/incident-page';
import { IncidentsPage } from './incidents-page/incidents-page';
import { NewIncidentPage } from './new-incident-page/new-incident-page';

/** Mounted by the app at /incidents while the Incident log module is on. */
export const routes: Routes = [
  { path: '', component: IncidentsPage, title: 'Incidents · PromiseHub' },
  { path: 'new', component: NewIncidentPage, title: 'Report an incident · PromiseHub' },
  { path: ':id', component: IncidentPage, title: 'Incident · PromiseHub' },
];
