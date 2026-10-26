# 49 · Merge Waypoint: foundation

> **Runtime:** ~4 min · **Audience:** contributors, product owners and anyone picking up prompts 50 to 81 · **Prerequisites:** [03 · Configure modules](../03-configure-modules/README.md), [48 · Operational readiness](../48-operational-readiness/README.md)

**Video:** [49-merge-waypoint-foundation.mp4](49-merge-waypoint-foundation.mp4) · [Slides](slides.html) · **Audio:** [49-merge-waypoint-foundation.mp3](49-merge-waypoint-foundation.mp3) · [Transcript](script.md)

## Why this video exists

Slice 49 prepares PromiseHub to take in Waypoint one journey at a time: the merge mapping (ADR 0043), the Learning, Mentoring and Public website modules, the Youth, Mentor and Volunteer roles, youth accounts linked to child records, the four new libraries and the seeded cast (`L1-023` to `L1-025`, `L2-004`, `L2-005`, `L2-007`, `L2-038`, `L2-042`, `L2-045`).

## Learning objectives

By the end, the viewer can:

- say where cohorts, sessions, attendance, applications and announcements land in PromiseHub;
- name the three new modules, what each needs, and why they start off;
- say what a youth, a mentor and a volunteer can reach, and how the server enforces it.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What is a Waypoint cohort here? | A program; sessions are events and attendance is Roll Call |
| What happens when Learning is off? | Its endpoints answer 404, `/learning` and `/curriculum` redirect to Today, and nothing is deleted |
| What can a youth reach? | Only the child record their account links to; staff endpoints answer 403 |
| Who links a youth account? | An admin, to one child in the same organization, audited |

## Code / assets on screen

| File | What to show |
|---|---|
| `docs/adr/0043-merge-waypoint.md` | The subsystem, role, module and component mapping |
| `backend/src/PromiseHub.Domain/Organizations/ModuleCatalog.cs` | The three new modules and the whole-suite preset |
| `backend/src/PromiseHub.Api/Authorization/AuthorizationSetup.cs` | The fallback policy that requires `UseStaffApp` |
| `frontend/projects/promisehub/src/app/shell/navigation.ts` | Sections by module and role |
| `clips/modules-desktop.mp4`, `clips/youth-phone.mp4`, `clips/mentor-desktop.mp4` | Recorded against the running frontend with a faked API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:26 | Introduction | What Waypoint brings |
| 00:26-01:20 | Mapping, modules | Where Waypoint lands; three new modules |
| 01:20-01:48 | Settings | Tom turns Learning and Mentoring off and on |
| 01:48-02:18 | Roles | Youth, mentor and volunteer scopes |
| 02:18-02:51 | Shell | Sofía's phone with Learning on then off; Daniel's Mentoring |
| 02:51-03:51 | Testing, recap | Cases and what comes next |

## Demo commands

```sh
dotnet test backend/PromiseHub.sln --filter "ParticipantModuleGateTests|ParticipantRoleTests|YouthLinkTests|ModuleConfigurationTests"
cd e2e && npx playwright test tests/shell/participant-shell.spec.ts tests/learning tests/curriculum tests/mentoring tests/website
node tools/video-record/record-clips.mjs docs/videos/49-merge-waypoint-foundation --base http://localhost:4317
```

## Pitfalls

- A new endpoint without a permission is closed to youth, mentors and volunteers; open it on purpose with `AllowAnyMember()` or a permission.
- The navigation reads the session once; after saving modules the shell follows on the next load.
- Curriculum shares the Learning module with the `learning` library: turning Learning off hides both.

## References

- [Policy-based authorization in ASP.NET Core (Microsoft Learn)](https://learn.microsoft.com/aspnet/core/security/authorization/policies)
- [Angular router `CanMatch` guards](https://angular.dev/guide/routing/route-guards)
