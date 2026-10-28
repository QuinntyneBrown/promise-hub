# 76 · Manage people

> **Runtime:** ~5.5 min · **Audience:** admins and office managers, developers · **Prerequisites:** [29 · Manage staff access](../29-manage-staff-access/README.md), [51 · Accept an invitation](../51-accept-an-invitation/README.md)

**Video:** [76-manage-people.mp4](76-manage-people.mp4) · [Slides](slides.html) · **Audio:** [76-manage-people.mp3](76-manage-people.mp3) · [Transcript](script.md)

## Why this video exists

Prompt 76 brings Waypoint's people directory, person record and account lifecycle into PromiseHub (`L2-112` to `L2-114`, ADR 0070). An admin finds every account of the organization in one directory filtered on the server, opens a person's record, changes a role with the server's rules and an audit entry, and deactivates or reactivates an account without deleting anything. A youth account follows its child record. Mentoring and Learning add their fields only while they are on.

## Learning objectives

By the end, the viewer can:

- Find any account with search, role, status and program filters, a page at a time.
- Read what a person's record shows, and what disappears while Mentoring or Learning is off.
- Change a role, and say which changes the server refuses.
- Deactivate and reactivate an account, and say what happens to the person's sessions and records.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who appears in People? | Every membership of the organization that is not removed: staff, mentors, volunteers and youth; never another organization's |
| Which role changes are refused? | A youth account's, a change to Youth, Mentor while Mentoring is off, and your own (422) |
| What does deactivation do? | The next request answers 401 account-deactivated (or continues in the person's other organization); sign-in says the account is inactive only after the right password; nothing is deleted; audited |
| What happens when a household is deleted? | Its youth accounts are deactivated with it and cannot be reactivated while the child record is deleted |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Staff/PeopleHandler.cs` | The directory and the record, module fields by module |
| `backend/src/PromiseHub.Application/Staff/AccountLifecycleHandler.cs` | Deactivate, reactivate and youth following the child record |
| `backend/src/PromiseHub.Api/Middleware/TenantContextMiddleware.cs` | A deactivated membership refused on its next request |
| `frontend/projects/administration/src/lib/people-page/`, `person-page/` | The directory and the record |
| `frontend/projects/components/src/lib/pagination/` | The shared pagination component |
| `shots/desktop-people.png`, `desktop-mentors.png`, `desktop-no-results.png` | The directory and its filters |
| `shots/desktop-sofia.png`, `desktop-change-role.png`, `desktop-role-changed.png` | A record and a role change |
| `shots/desktop-deactivate.png`, `desktop-deactivated.png`, `desktop-reactivated.png`, `desktop-child-deleted.png` | The lifecycle |
| `shots/phone-people.png`, `phone-sofia.png`, `desktop-mentoring-off.png`, `desktop-empty.png`, `desktop-forbidden.png` | Phone and states |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 0:00-0:28 | Introduction | What the journey covers |
| 0:28-1:05 | Directory | Every account, by name, with role, programs, mentor and status |
| 1:05-1:32 | Filters | Mentors, a search with no results |
| 1:32-2:00 | Record | Sofía's record and its history |
| 2:00-2:31 | Role | Leo to youth worker, with the warning |
| 2:31-3:16 | Lifecycle | Deactivate, find under Deactivated, reactivate |
| 3:16-3:37 | Youth | The deleted child record |
| 3:37-3:52 | Phone | One column |
| 3:52-4:24 | States | Mentoring off, only you, failed, forbidden |
| 4:24-4:56 | Testing | API and browser tests |
| 4:56-5:20 | Recap | Things to remember |

## Demo commands

```sh
cd frontend && npm run start -- --port 4200
node tools/video-record/record-clips.mjs docs/videos/76-manage-people
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/76-manage-people
node tools/video-build/build-video.mjs docs/videos/76-manage-people --no-captions
```

## Pitfalls

- Removal (Staff and roles) is permanent; deactivation (the record) is reversible. Both keep the records.
- Mentor accounts stay listed while Mentoring is off so they can still be deactivated; only the Mentor filter and column go.
- Profile editing, notes, the consent summary and a password reset from the record are deferred (ADR 0070).

## References

- [OWASP: Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [EF Core global query filters](https://learn.microsoft.com/ef/core/querying/filters)
