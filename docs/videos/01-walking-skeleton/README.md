# 01 · The walking skeleton

> **Runtime:** ~3.5 min · **Audience:** contributors and product owners · **Prerequisites:** none

**Video:** [01-walking-skeleton.mp4](01-walking-skeleton.mp4) · [Slides](slides.html) · **Audio:** [01-walking-skeleton.mp3](01-walking-skeleton.mp3) · [Transcript](script.md)

## Why this video exists

Slice 01 ([prompt](../../prompts/01-walking-skeleton.md)) builds the frame every journey hangs on. This video shows what it guarantees and how it is proven.

## Learning objectives

By the end, the viewer can:

- run the CLI to migrate and seed two organizations, and explain why a second seed changes nothing;
- explain where the tenant comes from and what happens on a cross-tenant request;
- describe how audit entries are written and why they cannot change;
- find their way around the shell on a phone and a laptop.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who applies migrations? | Only `PromiseHub.Cli`; the API refuses to start with pending ones |
| Where does the tenant come from? | The session's membership, never the request |
| What does a cross-tenant lookup return? | 404, plus an `AccessDenied` audit entry |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Cli/CliApp.cs` | migrate, seed, reset |
| `backend/src/PromiseHub.Api/Middleware/MigrationGuard.cs` | start-up guard |
| `backend/src/PromiseHub.Infrastructure/Persistence/PromiseHubDbContext.cs` | query filter and save guard |
| `clips/shell-desktop.mp4`, `clips/shell-phone.mp4` | the shell, recorded from the running app with the fake API |
| `shots/*.png` | Today and not found |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, promises | What the skeleton guarantees |
| 00:45-01:17 | Migrate and seed | CLI commands, the two organizations, start-up guard |
| 01:17-01:47 | Tenancy | Membership, filter, cross-tenant 404 |
| 01:47-02:03 | Audit | Unit of work, immutability |
| 02:03-02:49 | Shell | Desktop and phone clips, states |
| 02:49-03:29 | Testing, recap | Fake API, things to remember |

## Demo commands

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run --project backend/src/PromiseHub.Cli -- reset
npm --prefix frontend start
cd e2e; npx playwright test
```

## Pitfalls

- Start the frontend on a free port: the e2e suite uses 4317.
- The clips fake `/api/me` in `clips/clips.mjs`; keep it in step with `e2e/fixtures/fake-api.ts`.

## References

- [EF Core global query filters](https://learn.microsoft.com/ef/core/querying/filters)
- [Playwright](https://playwright.dev/docs/intro)
