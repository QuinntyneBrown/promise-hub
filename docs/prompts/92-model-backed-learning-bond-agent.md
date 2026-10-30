# Feature 92: Model-backed Learning Bond agent

## Goal

Persona: **Guardian**. Completes the journey "Learning Bond safeguards" in `docs/journeys.md` (the fixed-line bubble shipped in prompt 86).

`LearningBondAgent` talks to a language model behind `ILanguageModel` with a fixed system prompt per step (`Landing`, `Consent`, `Intake`, `Estimate`, `Review`, `Submitted`, `Benefits`, `Reminders`, `Total`) and nothing but the household's language, the children's first names and ages, statuses and the figures the rules computed. It has five read-only tools (`GetStatus`, `GetEstimate`, `ListBenefits`, `ExplainStep`, `OfferCallback`), each a server method taking the household from the link, never from the model, and no tool for consent, submit, withdraw or another household. The bubble shows the approved fixed line first and replaces it when the model answers within 10 seconds; when the model is slow, down or answers nothing usable, the fixed line stays and nothing breaks. A SIN typed into the chat is refused and never sent to the model. The model never states an amount a rule did not produce. The conversation is readable by the household only (`GET .../agent/conversation`); no staff route reads it. Tests use a fake `ILanguageModel`; a real provider is wired through configuration and is deferred when no credentials exist.

Prompts `01` to `91` in `docs/prompts/` are assumed done; reuse what they built. Frontend libraries: `frontend/projects/learning-bond/`, `frontend/projects/api/`. Backend feature folders under `backend/src/PromiseHub.*/LearningBond/`. Read ADR 0076 before starting; it fixes what the agent may and may not do.

Why now: the fixed line let every journey ship without it; this adds the model behind the same bubble without changing any earlier test.

## Finish the whole feature in one run. Do not stop. (CRITICAL)

- You are authorised to take this feature all the way: checking mocks, design system, requirements and design, the estimate, incremental ATDD implementation, the journey video, green tests and a pull request. Go through every phase and every slice in one continuous run. Do not pause between phases to report, ask for approval, or wait for "continue".
- Do not end your turn until the "Done means" list at the bottom is fully true. A partial result, a plan, or "the next steps would be..." is not done.
- Where `AGENTS.md` says "stop and ask", treat this prompt as the confirmation in advance for everything in scope here. Choose the simplest option that fits the existing architecture, record it (an ADR in `docs/adr/` or the detailed design's open-questions section), and keep going.
- If the components library lacks something, that is not a reason to stop. Update the design system and the library first, as the project rules require, then go on.
- When a test, build or command fails, find the root cause and fix it, then go on. Never weaken a test to make it pass, and never skip a step quietly.
- Only stop for a real blocker you cannot resolve yourself, such as missing credentials, or an action outside this repository that can't be undone. If that happens, finish everything else first, then report the blocker clearly.
- Keep track of progress (a todo list), so that nothing gets left out after context is summarised.

## Rules (read first, binding)

- Follow `AGENTS.md` exactly, especially:
  - The mandatory repository layout; files go only where the tree assigns them. The feature is `LearningBond` in `backend/src/PromiseHub.*/LearningBond/`, `frontend/projects/learning-bond/`, `docs/specs/`, `docs/detailed-designs/learning-bond/`, `docs/estimates/learning-bond.md` and `e2e/tests/learning-bond/`.
  - Components library is mandatory: every design-system component is built once in `frontend/projects/components/` and reused; no local copies or restyles in feature libraries. The Learning Bond components (`agent-message`, `email-preview`, `benefit-card`, `step-marker`) are in `docs/design-system/` and not yet in the library.
  - One file per type: Angular components use separate `.ts`, `.html` and (when needed) `.css` files, never inline templates or styles; backend and frontend keep one type per file.
  - Feature libraries depend only on `components` and `api`; pages use API tokens (`LEARNING_BOND_API`), never `HttpClient`; dialogs use Angular CDK Dialog; no inline forms.
  - Multi-tenant: tenant from membership or the guardian link, every query filtered by organization id, a cross-tenant integration test per endpoint.
  - Module: **Learning Bond** (needs Roster and Messages; ADR 0076). Include the module-off acceptance case: the guardian route is not found, the Learning Bond card is absent from `guardian-home`, and the API answers 404.
  - Social insurance numbers and financial details follow `L2-159`: encrypted at the field under a key outside the database, shown only as the last three digits, destroyed when no longer needed, never logged, never in a message to the agent.
  - Backend tests are API integration tests with a fake database and fakes for external services (language model, RESP provider channel, webhooks, time); authorization tests alongside each feature.
  - Playwright, Chromium only, Page Object Model, axe on every screen, backend faked in `e2e/fixtures/` (unrouted requests fail loudly); keep the fake in step with the API.
  - Every sensitive action is audited (`L2-161`). No architecture tests. The banned product word from the Naming section of `AGENTS.md` never appears.
- If something seems to need more scope, leave it out, note it as deferred, and continue.
- Work through the phases below **in order**, using the skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.

## Phase 1: Mocks (`writing-html-mocks`)
- The mocks exist: `guardian-learning-bond`, `learning-bond-estimate`, `learning-bond-review`, `learning-bond-benefits`. Check them against this journey. Add any missing state (default, loading, empty, error, invalid, busy, success, forbidden) by editing `docs/mocks/tools/pages_learning_bond.py`, `pages_learning_bond_guardian.py`, `dialogs.py` or `notifications.py`, rebuilding with `python docs/mocks/tools/build.py --clean` and re-running `check_mocks.py docs/mocks --write`. Do not hand-edit generated HTML.

## Phase 2: Design system (`extracting-design-systems`, `writing-screen-composition`)
- Make sure every component these mocks use is in `docs/design-system/`. Change tokens only if a new value is needed.
- Update `docs/screen-composition.md` for these screens.

## Phase 3: Requirements (`writing-requirements`)
- Existing requirements this journey must satisfy:
  - `L2-160 The agent acts only for the household and never past an approval gate`
  - `L2-163 Learning Bond screens are accessible, responsive, translated and fast (the 3-second first-words budget)`
  - `L2-159, L2-161, L2-162 (cross-reference)`
- Add Given/When/Then acceptance criteria where they are missing (module-off, cross-tenant and permission cases included). Add a new L2 entry only for behaviour none of these cover, numbered after the last one in `docs/specs/L2.md`.

## Phase 4: Detailed design (`writing-design-documents`)
- The designs exist:
  - `docs/detailed-designs/learning-bond/run-learning-bond-agent/README.md`
- Update only where the journey reveals a gap. Read ADR 0076 in `docs/adr/` first. Record real decisions as ADRs.

## Phase 5: Estimate update (`estimating-designs`)
- Keep the effort in `docs/estimates/learning-bond.md` and the journey's row in `docs/journeys.md`. When done, update percent complete from evidence, then re-run the rollup and the check.

## Phase 6: Incremental implementation (ATDD, `implementing-incrementally`)
- Plan thin vertical slices, for example:
  1. `ILanguageModel` abstraction with a fake, the step prompts and `AgentContext` with no financial detail in it
  2. The agent endpoint: fixed line first, model answer within 10 s replaces it, timeouts and errors fall back silently
  3. The five read-only tools authorized against the link's household; a request about another household or for an action is refused
  4. SIN refusal in the chat, amounts only from rules, the household's own conversation read; a real provider behind configuration
- For each slice:
  - Write the Given-When-Then criteria.
  - Write the acceptance test (Playwright page objects, API integration tests), traced to its requirement.
  - Run it and show that it fails for the expected reason.
  - Implement the minimum that makes it pass, and refactor while the tests are green.
  - Run the regression checks (`npm run check`, `dotnet build`, `dotnet format --verify-no-changes`, `dotnet test`, the Playwright suite), then commit.
- When all slices are green, keep the mocks, design system, screen composition and designs aligned with what was built.

## Phase 7: Journey video (`creating-narrated-videos`, MANDATORY)
- When the journey works end to end, make a narrated video of it in `docs/videos/92-model-backed-learning-bond-agent/` (`script.md`, `slides.html`, `README.md` outline, `clips/clips.mjs`). Use only the existing pipeline in `tools/video-audio/`, `tools/video-record/` and `tools/video-build/` and the shared assets in `docs/videos/assets/`.
- On brand: the PromiseHub logo (`docs/videos/assets/mark.svg`) on the title and closing slides, the shared `slides.css` with the design-system tokens, and the cast from `docs/mocks/README.md` (Harbourview Youth Collective, the Rivera family and the rest).
- Show the real app: record screen clips of Carmen asking the agent a question doing this journey in the running frontend (with the fake API), and include screenshots of the key states (default, empty, error, success; phone and desktop). Never show a real or realistic social insurance number; use the seeded masked values.
- Background music is mandatory: `<body data-music="../assets/music/on-the-beach-intro-outro.mp3">`. The builder lays it under the narration. No captions unless asked.
- Run `build-video.mjs --check`, look at the slides, encode, watch the result, and add a row to `docs/videos/README.md`.

## Done means
- The agent explains and prepares but never submits, SINs are encrypted and destroyed, every action is audited and the module is gated end to end; the model answers behind the same bubble and every earlier test still passes unchanged.
- All the new and existing tests pass, including module-off, cross-tenant, permission and axe checks.
- Every presentation component the screens use that the design system (`docs/design-system/`) defines is implemented once in `frontend/projects/components/` and reused from there by the app and every feature library. No feature library or the app re-implements, copies, wraps or restyles one; a component or variant the library lacked was added to the library first.
- No social insurance number or financial detail is stored in clear text, logged, returned unmasked or sent anywhere before the guardian taps Submit.
- The documentation agrees with the code, and the estimate and `docs/journeys.md` show the true percent complete.
- `docs/videos/92-model-backed-learning-bond-agent/92-model-backed-learning-bond-agent.mp4` exists, with narration, the PromiseHub logo, real screen clips and screenshots, and background music.
- The work is on a branch with a pull request to the default branch, and its checks are green. Fetch and rebase first.
- At the end, `docs/journeys.md` is updated for this journey (status, percent complete and video link), and every change is committed and pushed to `origin`. Nothing is left uncommitted or unpushed.
- Only then end the run, with a short summary of what was built, the decisions made along the way, and anything deferred.
