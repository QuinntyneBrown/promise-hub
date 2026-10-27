# Detailed designs

One folder per subsystem, one folder per vertically sliced feature, each with a `README.md` (overview, description, L2 requirements, diagrams) and a `diagrams/` folder of PlantUML sources rendered to PNG. Subsystem names match the feature folders mandated in `AGENTS.md` (`backend/src/PromiseHub.Application/<Subsystem>/` and `frontend/projects/<subsystem>/`); `shell` is the `promisehub` application and `platform` holds cross-cutting designs. Requirements are in `docs/specs/L1.md` and `docs/specs/L2.md`; screens are in `docs/mocks/`.

| Subsystem | Feature | L2 requirements |
|---|---|---|
| organizations | set-up-organization | L2-008 |
| organizations | isolate-tenant-data | L2-001 |
| organizations | switch-organization | L2-002 |
| organizations | manage-organizations | L2-003 |
| organizations | configure-modules | L2-004 |
| organizations | enforce-module-gates | L2-005 |
| organizations | set-privacy-and-residency | L2-030 |
| organizations | configure-consent-policy | L2-056 |
| identity | sign-in | L2-006 |
| identity | authorize-request | L2-007, L2-045 |
| identity | sign-in-as-youth-or-mentor | L2-046 |
| identity | recover-locked-account | L2-047 |
| identity | end-user-session | L2-048 |
| identity | revoke-sessions | L2-049 |
| identity | recover-expired-session | L2-050 |
| identity | handle-deactivated-account | L2-050 |
| identity | accept-invitation | L2-052, L2-053 |
| identity | set-secure-password | L2-053 |
| identity | replace-expired-invitation | L2-054 |
| staff | invite-and-onboard-staff | L2-009 |
| staff | issue-invitations | L2-051 |
| staff | manage-pending-invitations | L2-052, L2-054 |
| households | maintain-household | L2-011 |
| enrollment | enroll-guardian | L2-013 |
| imports | import-roster | L2-010 |
| guardian | verify-guardian-link | L2-026 |
| guardian | localize-guardian-pages | L2-027 |
| guardian | manage-guardian-consent | L2-055 |
| guardian | unlock-minor-participation | L2-056, L2-057 |
| guardian | enforce-minor-safeguards | L2-057 |
| guardian | view-consent-record | L2-058 |
| guardian | manage-consent-settings | L2-058 |
| programs | manage-programs | L2-012 |
| programs | manage-cohorts | L2-061, L2-012 |
| programs | manage-terms-and-tracks | L2-061 |
| events | manage-events | L2-012 |
| slips | write-and-send-slip | L2-014 |
| slips | sign-slip | L2-015 |
| slips | remind-and-clear | L2-016 |
| incidents | report-and-review-incident | L2-023 |
| attendance | check-in-and-sign-out | L2-017 |
| attendance | alert-no-show-and-end-session | L2-018 |
| attendance | show-quick-card | L2-019 |
| attendance | manage-approved-pickups | L2-020 |
| attendance | sync-offline-queue | L2-028 |
| messaging | compose-and-send-message | L2-021 |
| messaging | enforce-sms-cap | L2-022 |
| reports | compute-report | L2-024 |
| reports | export-report | L2-025 |
| audit | record-and-search-audit | L2-032 |
| billing | meter-plan-and-usage | L2-037 |
| notifications | notify-in-app | L2-040 |
| search | search-organization | L2-039 |
| shell | compose-navigation | L2-029, L2-038 |
| shell | render-responsive-accessible-ui | L2-035, L2-036 |
| platform | secure-transport-and-storage | L2-031 |
| platform | meet-performance-budgets | L2-033 |
| platform | run-background-jobs | L2-034 |
| platform | observe-and-alert | L2-041 |
| platform | migrate-and-seed | L2-042 |
| platform | merge-waypoint-foundation | L2-004, L2-007, L2-042, L2-045 |
| learning | read-own-record (journeys 57, 61, 62, 65, 66 add more; see [learning](learning/README.md)) | L2-005, L2-007, L2-045 |
| learning | obtain-required-consent | L2-056 |
| learning | onboard-youth | L2-059 |
| learning | await-cohort-placement | L2-060 |
| curriculum | open-curriculum (journeys 60, 64 add more; see [curriculum](curriculum/README.md)) | L2-005, L2-007 |
| curriculum | author-tracks-and-modules | L2-066, L2-012, L2-007 |
| curriculum | author-lessons | L2-067 |
| curriculum | upload-lesson-video | L2-067, L2-031 |
| mentoring | list-assigned-youth (journeys 55, 63, 67, 68, 69 add more; see [mentoring](mentoring/README.md)) | L2-005, L2-007 |
| mentoring | assign-mentors | L2-062, L2-007 |
| mentoring | manage-mentor-roster | L2-063, L2-065, L2-062 |
| mentoring | view-youth-record | L2-064, L2-065, L2-007, L2-019, L2-011 |
| identity | scope-data-by-role | L2-065, L2-007 |
| website | serve-public-site (journey 81 adds more; see [website](website/README.md)) | L2-005 |

Render all diagrams with:

```
set PLANTUML_JAR=C:\Users\quinn\plantuml.jar
python C:\Users\quinn\.claude\skills\writing-software-design-documents\scripts\render_puml.py docs/detailed-designs
```
