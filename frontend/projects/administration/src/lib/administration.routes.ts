import { Routes } from '@angular/router';
import { AuditLogPage } from './audit-log-page/audit-log-page';
import { BillingPage } from './billing-page/billing-page';
import { CoveragePage } from './coverage-page/coverage-page';
import { OrganizationsPage } from './organizations-page/organizations-page';
import { PeoplePage } from './people-page/people-page';
import { StaffPage } from './staff-page/staff-page';

/** Mounted by the app at /settings/staff; staff access is always part of the product. */
export const routes: Routes = [
  { path: '', component: StaffPage, title: 'Staff and roles · PromiseHub' },
];

/** Mounted by the app at /settings/coverage. */
export const coverageRoutes: Routes = [
  { path: '', component: CoveragePage, title: 'Staff coverage · PromiseHub' },
];

/** Mounted by the app at /settings/billing; every organization has a plan. */
export const billingRoutes: Routes = [
  { path: '', component: BillingPage, title: 'Billing · PromiseHub' },
];

/** Mounted by the app at /settings/audit; every organization keeps an audit log. */
export const auditRoutes: Routes = [
  { path: '', component: AuditLogPage, title: 'Audit log · PromiseHub' },
];

/** Mounted by the app at /admin/organizations; the only screen that spans tenants, for platform admins. */
export const organizationsRoutes: Routes = [
  { path: '', component: OrganizationsPage, title: 'Organizations · PromiseHub' },
];

/** Mounted by the app at /people; people administration is always on and admins only (L2-112, ADR 0070). */
export const peopleRoutes: Routes = [
  { path: '', component: PeoplePage, title: 'People · PromiseHub' },
];
