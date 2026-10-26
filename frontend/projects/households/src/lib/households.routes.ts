import { Routes } from '@angular/router';
import { ChildPage } from './child/child-page';
import { FamiliesPage } from './families/families-page';
import { HouseholdPage } from './household/household-page';
import { SearchPage } from './search/search-page';

export const routes: Routes = [
  { path: '', component: FamiliesPage, title: 'Families · PromiseHub' },
  { path: ':householdId', component: HouseholdPage, title: 'Household · PromiseHub' },
  { path: ':householdId/children/:childId', component: ChildPage, title: 'Child · PromiseHub' },
];

/** Global search, mounted at /search; it reads the roster, so it belongs to Roster (ADR 0028). */
export const searchRoutes: Routes = [
  { path: '', component: SearchPage, title: 'Search · PromiseHub' },
];
