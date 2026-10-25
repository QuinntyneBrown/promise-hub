import { Routes } from '@angular/router';
import { ChildPage } from './child/child-page';
import { FamiliesPage } from './families/families-page';
import { HouseholdPage } from './household/household-page';

export const routes: Routes = [
  { path: '', component: FamiliesPage, title: 'Families · PromiseHub' },
  { path: ':householdId', component: HouseholdPage, title: 'Household · PromiseHub' },
  { path: ':householdId/children/:childId', component: ChildPage, title: 'Child · PromiseHub' },
];
