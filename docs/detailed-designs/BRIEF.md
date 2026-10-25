# Design author brief (shared by every writer)

Repo root: `C:\projects\promise-hub`. Write designs under `docs/detailed-designs/{subsystem}/{feature}/README.md` plus `docs/detailed-designs/{subsystem}/{feature}/diagrams/*.puml`, exactly the subsystem and feature names in `docs/detailed-designs/README.md`.

Read first (all three, in full): `C:\Users\quinn\.claude\skills\writing-software-design-documents\references\writing-style.md`, `...\references\diagrams.md`, `...\references\example-design.md`. Then read `docs/specs/L1.md`, `docs/specs/L2.md` and `AGENTS.md` (repository layout, architecture rules, module and multi-tenant rules). Skim `docs/mocks/README.md` and the relevant generator in `docs/mocks/tools/` for screen names and copy.

## Shape of every feature README (four headings, this order)

`# <Feature title>` then `## Overview`, `## Description`, `## Requirements`, `## Diagrams`.

- Overview: background for a newcomer; define local terms in genus–differentia form (`**term** — noun phrase`).
- Description: the concrete parts. Use the mandated names: Angular feature library `frontend/projects/<subsystem>/` with page components and the typed client from `frontend/projects/api/` (services behind injection tokens), components from `frontend/projects/components/`; backend `PromiseHub.Api` minimal-API endpoints (no business logic) → `PromiseHub.Application/<Subsystem>/` MediatR-style command/query handlers, validators and permission checks → `PromiseHub.Domain` entities → `PromiseHub.Infrastructure` (EF Core `PromiseHubDbContext`, SMS/email/push providers, audit log, job runner). Name real-looking classes consistently (`CheckInChildCommand`, `CheckInChildCommandHandler`, `AttendanceRecord`, `AttendanceEndpoints`, `AttendanceApi`). Mark genuinely undecided details `<TO SUPPLY>`; never invent numbers that the specs do not state.
- Requirements: a table `| L2 ID | Refines (L1) | Requirement |` listing ONLY the L2 ids assigned to the feature (plus any other L2 the slice clearly enforces), with the L1 from the L2's `**Traces to:**` line and the requirement text copied verbatim from the paragraph under the L2 heading in `docs/specs/L2.md` (the sentence(s) before `**Acceptance Criteria:**`). Ids exactly as written: `L2-017`, `L1-007`.
- Diagrams: one lead-in sentence or two before each image; relative links `diagrams/<name>.png`. Per feature: `c4-context.puml`, `c4-container.puml`, `c4-component.puml`, `class-structure.puml`, and one `sequence-<behaviour>.puml` per behaviour (at least one; use `alt`/`else` for validation and failure branches rather than extra diagrams).

## Diagram rules

- C4 files start with `@startuml`, `!include <C4/C4_Context>` (or `C4_Container` / `C4_Component`), `LAYOUT_WITH_LEGEND()`, `title ...`, and use only C4 macros: `Person`, `Person_Ext`, `System`, `System_Ext`, `SystemDb`, `Container`, `ContainerDb`, `ContainerQueue`, `Component`, `ComponentDb`, `System_Boundary`, `Container_Boundary`, `Rel`, `Rel_Back`, `BiRel`. No raw `rectangle`, `component`, `node`, `[x]` or bare `-->` arrows.
- Class and sequence diagrams copy the skin headers from `references/diagrams.md`. Sequence diagrams use `box` groupings coloured `#E0F2FE` (Frontend — <Angular library or guardian pages>), `#D1FADF` (Backend — PromiseHub API), `#ECFDF3` (Backend — PromiseHub Application and Domain), `#FFF4E5` (Backend — PromiseHub Infrastructure); name the specific application or layer in each box label; cite L2 ids in message text where a step enforces one.
- The system is `PromiseHub`; the staff UI is the `PromiseHub web app` (Angular), guardian pages are the same app's `guardian` library; external systems: SMS provider, email provider, push provider, spreadsheet file (import), funder template (export).

## Voice (blocking rules)

Third person, present tense, declarative. No `we`, `our`, `you`, `your`. Obligation only through `shall` / `should` / `may`; never `must`, `need to`, `has to`. No hype or fillers (`robust`, `seamless`, `simply`, `very`, `leverage`). One assertion per sentence, under 30 words. Identifiers, paths and type names in backticks. No rhetorical questions, no self-reference to the document's creation.

## Render and verify

After writing each feature's `.puml` files, render that folder and fix every error until the exit code is 0:

```
set PLANTUML_JAR=C:\Users\quinn\plantuml.jar
python C:\Users\quinn\.claude\skills\writing-software-design-documents\scripts\render_puml.py docs/detailed-designs/<subsystem>
```

(In Git Bash: `PLANTUML_JAR=/c/Users/quinn/plantuml.jar python ...`.) Then check that every `![...](diagrams/x.png)` in the README points at a file that exists. Finish with a self-check of the prose for the blocked words.
