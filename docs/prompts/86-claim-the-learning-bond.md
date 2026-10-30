# Feature 86: Claim the Learning Bond

## Goal

Persona: **Guardian**. Journey "Claim the Learning Bond" in `docs/journeys.md`. The value journey of the module.

Carmen taps the invitation link and `guardian-learning-bond` opens in her language with no account: the agent's three-sentence explanation in the `agent-message` bubble, each covered child under 18 with the amount they may be owed, and Continue, Not now and I'm not interested. An unknown device sees the six-digit code first and nothing about the children before it succeeds. On `learning-bond-consent` she ticks one box per child with the exact wording, types her name and agrees; the consent is its own `LearningBondConsent` with scope `LearningBond`. `learning-bond-intake` confirms the enrolment record and asks only three things: her SIN, the child's SIN and whether the family filed last year's taxes; numbers go in form fields, are validated on the server, encrypted, and shown afterwards as the last three digits; a second child reuses her answers. `learning-bond-estimate` shows one number from `LearningBondRule`, never from the model. `learning-bond-review` recommends a no-fee RESP provider, shows every field with Edit, and Submit to {provider} is the only way to send: nothing leaves before it, a double tap sends nothing more, and a failed provider leaves the application retryable. The agent bubble on every step shows the approved fixed line per step from `AgentFallbackCopy`; the model-backed answer is prompt 92. Pausing and following the deposit are prompt 87; withdrawing consent is prompt 88.

Prompts `01` to `85` in `docs/prompts/` are assumed done; reuse what they built, in particular `GuardianAccess` and the device code from prompt `12`, the cipher from prompt `82` and the `agent-message` component. Frontend libraries: `frontend/projects/learning-bond/`, `frontend/projects/guardian/`, `frontend/projects/api/`. Backend feature folders under `backend/src/PromiseHub.*/LearningBond/`.

Why now: everything before it exists to deliver this link; everything after it reads the records this creates. Keep the slices thin: at 31 days this is the largest Learning Bond prompt.

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
- The mocks exist: `guardian-learning-bond`, `guardian-home`, `learning-bond-consent`, `learning-bond-intake`, `learning-bond-estimate`, `learning-bond-review`, `learning-bond-submitted`. Check them against this journey. Add any missing state (default, loading, empty, error, invalid, busy, success, forbidden) by editing `docs/mocks/tools/pages_learning_bond.py`, `pages_learning_bond_guardian.py`, `dialogs.py` or `notifications.py`, rebuilding with `python docs/mocks/tools/build.py --clean` and re-running `check_mocks.py docs/mocks --write`. Do not hand-edit generated HTML.

## Phase 2: Design system (`extracting-design-systems`, `writing-screen-composition`)
- Make sure every component these mocks use is in `docs/design-system/`. Change tokens only if a new value is needed.
- Update `docs/screen-composition.md` for these screens.

## Phase 3: Requirements (`writing-requirements`)
- Existing requirements this journey must satisfy:
  - `L2-144 The invitation opens the guardian's Learning Bond page`
  - `L2-145 Per-child consent for the financial module`
  - `L2-146 Intake asks once and only for what is missing`
  - `L2-147 Learning Bond estimate shown as one number`
  - `L2-148 Recommended no-fee provider and a pre-filled application`
  - `L2-149 Nothing leaves before the guardian taps Submit`
  - `L2-160 The agent acts only for the household and never past an approval gate (fixed-line form only)`
  - `L2-163 Learning Bond screens are accessible, responsive, translated and fast`
  - `L2-026, L2-159, L2-161, L2-162 (cross-reference)`
- Add Given/When/Then acceptance criteria where they are missing (module-off, cross-tenant and permission cases included). Add a new L2 entry only for behaviour none of these cover, numbered after the last one in `docs/specs/L2.md`.

## Phase 4: Detailed design (`writing-design-documents`)
- The designs exist:
  - `docs/detailed-designs/learning-bond/open-guardian-learning-bond/README.md`
  - `docs/detailed-designs/learning-bond/give-and-withdraw-consent/README.md`
  - `docs/detailed-designs/learning-bond/complete-intake/README.md`
  - `docs/detailed-designs/learning-bond/estimate-learning-bond/README.md`
  - `docs/detailed-designs/learning-bond/review-and-submit-application/README.md`
  - `docs/detailed-designs/learning-bond/run-learning-bond-agent/README.md`
- Update only where the journey reveals a gap. Read ADR 0076 in `docs/adr/` first. Record real decisions as ADRs.

## Phase 5: Estimate update (`estimating-designs`)
- Keep the effort in `docs/estimates/learning-bond.md` and the journey's row in `docs/journeys.md`. When done, update percent complete from evidence, then re-run the rollup and the check.

## Phase 6: Incremental implementation (ATDD, `implementing-incrementally`)
- Plan thin vertical slices, for example:
  1. Guardian page from the link: device code first, covered children with amounts, Continue, Not now, Not interested; the Learning Bond card on `guardian-home`
  2. Per-child consent with the exact wording version and typed name, stored with scope `LearningBond`, audited
  3. Intake: record confirmation and Fix this, guardian SIN, child SIN and the tax question, server validation, encryption, masking, reuse for a second child
  4. Estimate from `LearningBondRule` by birth year with the born-before-2004 and No-tax-return outcomes
  5. Prepare the application, recommend a provider by province, edit fields with a review version
  6. Submit: trusted device, 202, idempotency key, nothing sent before Submit, provider failure retryable, confirmation text
  7. The agent bubble on every step with the fixed line and an optional hint, screen-reader speaker name, translated
- For each slice:
  - Write the Given-When-Then criteria.
  - Write the acceptance test (Playwright page objects, API integration tests), traced to its requirement.
  - Run it and show that it fails for the expected reason.
  - Implement the minimum that makes it pass, and refactor while the tests are green.
  - Run the regression checks (`npm run check`, `dotnet build`, `dotnet format --verify-no-changes`, `dotnet test`, the Playwright suite), then commit.
- When all slices are green, keep the mocks, design system, screen composition and designs aligned with what was built.

## Phase 7: Journey video (`creating-narrated-videos`, MANDATORY)
- When the journey works end to end, make a narrated video of it in `docs/videos/86-claim-the-learning-bond/` (`script.md`, `slides.html`, `README.md` outline, `clips/clips.mjs`). Use only the existing pipeline in `tools/video-audio/`, `tools/video-record/` and `tools/video-build/` and the shared assets in `docs/videos/assets/`.
- On brand: the PromiseHub logo (`docs/videos/assets/mark.svg`) on the title and closing slides, the shared `slides.css` with the design-system tokens, and the cast from `docs/mocks/README.md` (Harbourview Youth Collective, the Rivera family and the rest).
- Show the real app: record screen clips of Carmen Rivera on a phone doing this journey in the running frontend (with the fake API), and include screenshots of the key states (default, empty, error, success; phone and desktop). Never show a real or realistic social insurance number; use the seeded masked values.
- Background music is mandatory: `<body data-music="../assets/music/on-the-beach-intro-outro.mp3">`. The builder lays it under the narration. No captions unless asked.
- Run `build-video.mjs --check`, look at the slides, encode, watch the result, and add a row to `docs/videos/README.md`.

## Done means
- Guardian can do this end to end: open the text link, consent per child, give SINs once, see the estimate and submit a pre-filled application to a no-fee RESP provider.
- All the new and existing tests pass, including module-off, cross-tenant, permission and axe checks.
- Every presentation component the screens use that the design system (`docs/design-system/`) defines is implemented once in `frontend/projects/components/` and reused from there by the app and every feature library. No feature library or the app re-implements, copies, wraps or restyles one; a component or variant the library lacked was added to the library first.
- No social insurance number or financial detail is stored in clear text, logged, returned unmasked or sent anywhere before the guardian taps Submit.
- The documentation agrees with the code, and the estimate and `docs/journeys.md` show the true percent complete.
- `docs/videos/86-claim-the-learning-bond/86-claim-the-learning-bond.mp4` exists, with narration, the PromiseHub logo, real screen clips and screenshots, and background music.
- The work is on a branch with a pull request to the default branch, and its checks are green. Fetch and rebase first.
- At the end, `docs/journeys.md` is updated for this journey (status, percent complete and video link), and every change is committed and pushed to `origin`. Nothing is left uncommitted or unpushed.
- Only then end the run, with a short summary of what was built, the decisions made along the way, and anything deferred.
