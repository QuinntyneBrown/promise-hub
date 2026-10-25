# 0006: Module gates, navigation mapping and dependency details

- Status: accepted
- Date: 2026-10-25

## Context

`L2-004` and `L2-005` require per-organization modules, 404 for an off module's endpoints and navigation built only from modules that are on. The designs left open whether Quick Cards needs Roll Call, how long the gate caches, and which module the Events and Programs sections belong to.

## Decision

- **Dependencies.** Every module needs Roster; Pickup also needs Roll Call. Quick Cards needs only Roster, so a Quick Card can be read without check-in.
- **Storage.** One `ModuleConfiguration` row per organization (tenant-owned) lists the modules on. An organization without a row has nothing on.
- **Gate.** `IModuleGate` reads the row once per request; there is no cross-request cache, so a change applies on the next request on every instance. Endpoints declare their module with `RequireModule(ModuleId)`; an off module answers 404 with no body.
- **Session.** `GET /me` carries the modules on (instead of a separate `/me/modules`), so the web app has them with the session it already loads.
- **Endpoints.** `GET` and `PUT /settings/modules` sit in the settings group and need `ManageSettings` (admins and program directors).
- **Navigation.** Today, Settings, Notifications and Your account are always shown. Check-in follows Roll Call, Families follows Roster, Events, Programs and Permission slips follow Permission slips, Messages, Incidents and Reports follow their modules. With only Roster and Roll Call on, the bar shows Today, Check-in and Families (`L2-005` criterion 2).
- **Routes.** Each module route has a `canMatch` guard that loads its library only while the module is on, and a twin that redirects to Today while it is off.

## Consequences

Each feature slice adds its endpoints with `RequireModule` and its route with `moduleRoute`, and its tests include the module-off case.
