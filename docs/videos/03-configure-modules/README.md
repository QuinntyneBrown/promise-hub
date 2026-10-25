# 03 · Configure modules

> **Runtime:** ~3 min · **Audience:** contributors and product owners · **Prerequisites:** [02 · Sign in securely](../02-sign-in-securely/README.md)

**Video:** [03-configure-modules.mp4](03-configure-modules.mp4) · [Slides](slides.html) · **Audio:** [03-configure-modules.mp3](03-configure-modules.mp3) · [Transcript](script.md)

## Why this video exists

Slice 03 ([prompt](../../prompts/03-configure-modules.md)) makes every feature a module an organization can switch on or off, which every later feature's tests rely on.

## Learning objectives

By the end, the viewer can:

- switch modules in Settings › Modules and read the server's dependency errors;
- explain what "off" means on the server and in the app;
- say where a new feature declares its module.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What does Pickup need? | Roster and Roll Call |
| What does an off module's endpoint answer? | 404 with no body |
| What happens to data when a module is off? | Nothing; it returns when the module is back on |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Domain/Organizations/ModuleCatalog.cs` | names and dependencies |
| `backend/src/PromiseHub.Application/Organizations/ModuleRules.cs` | the 422 messages |
| `backend/src/PromiseHub.Api/Modules/ModuleGateFilter.cs` | 404 for an off module |
| `frontend/projects/promisehub/src/app/modules/module-route.ts` | canMatch and the redirect |
| `clips/modules-desktop.mp4`, `clips/check-in-only-phone.mp4` | the running app with the fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:40 | Introduction, promises | Eight modules, what off means |
| 00:40-01:20 | Tom switches modules | Pickup error, preset, toast, smaller top bar |
| 01:20-01:45 | The rules | 422, audit, 403 |
| 01:45-02:25 | Off means unreachable | Northgate on a phone, redirect, 404 |
| 02:25-02:55 | Testing, recap | Backend and browser cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter ModuleConfigurationTests
cd e2e; npx playwright test tests/settings
```

## Pitfalls

- A new feature must add `RequireModule` to its endpoints and use `moduleRoute` for its route, or it will be reachable while off.
- The session carries the modules; after saving, the web app reloads it so navigation follows.

## References

- [Angular `CanMatchFn`](https://angular.dev/api/router/CanMatchFn)
- [ASP.NET Core endpoint filters](https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis/min-api-filters)
