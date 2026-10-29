# Run the Learning Bond agent

## Overview

The Learning Bond agent is the bubble at the top of every guardian Learning Bond page (`agent()` in the mocks). It explains the step, answers questions and prepares the next one; the server decides. `LearningBondAgent` talks to a language model behind `ILanguageModel` with a fixed system prompt per step and nothing but the household's language, children's first names and ages, statuses and computed figures. It has five read-only tools, each a server method authorized against the link's household, and no tool for consent, submit, withdraw or another household. When the model answers nothing within 10 s, `AgentFallbackCopy` supplies the approved wording of the step, so consent, intake, review and submit complete without the model. This design also fixes the accessibility, responsiveness, language and performance rules every Learning Bond screen follows.

Terms used in this document:

- **step prompt** — fixed system prompt for one step (`Landing`, `Consent`, `Intake`, `Estimate`, `Review`, `Submitted`, `Benefits`, `Reminders`, `Total`), platform text with no organization edits
- **agent context** — `AgentContext`: language, children's first names and ages, claim and application statuses, estimates and totals the rules computed
- **fallback copy** — `AgentFallbackCopy`: the approved line of a step in English, Spanish and French, shown as is when the model is slow or down
- **tool** — `GetStatus`, `GetEstimate`, `ListBenefits`, `ExplainStep`, `OfferCallback`, each a server method taking the household from the link, never from the model

The conversation belongs to the household of the link; a tool call naming another household's child or application answers 404 and is audited, the agent endpoint answers 404 while the module is off, and `AgentConversation` is never answered to a staff endpoint. Each reply and tool call is audited by step and tool name, never by content (ADR 0076).

## Description

Frontend:

- **`AgentBubble`** (`components`, `ph-agent-bubble`) — the bubble with the sprout icon tile, the reply text (`aria-label="Learning Bond"`, a visually hidden "Learning Bond:" prefix), an optional hint, a `ph-text-field` with Send for the guardian's message and a `ph-skeleton` line while waiting; it renders the fallback copy first and replaces it with the model's words when they arrive within budget.
- **`AgentFacade`** (`learning-bond`) — one per page; sends `{ step, message? }` through `LEARNING_BOND_API.agent(token, request)`, applies the 10 s client timeout, keeps the fallback on timeout and offers I'd rather talk to someone (`learning-bond-callback`) when the reply says it cannot answer.
- **Every guardian page** — one column, one primary action, `ph-*` components only, 24 by 24 px targets, visible focus, no sideways scroll from 360 to 1440 px; the SIN field is `ph-secret-field` (visible label, format hint, `inputmode="numeric"`, `autocomplete="off"`, error linked with `aria-describedby` and announced, masked on blur with Show); amounts and dates follow the household's locale through Angular's locale data ("1 200 $" in French).

Backend:

- **`LearningBondAgent`** (`Application/LearningBond/`) — `ReplyAsync(scope, step, message)`: builds `AgentContext` from the household, runs `AgentRedactor` over the guardian's message and the context, calls `ILanguageModel.CompleteAsync(stepPrompt, context, tools, 10 s)`, executes tool calls through `AgentTools`, caps the reply at 60 words in the household's language, stores an `AgentMessage` on the household's `AgentConversation` and answers `AgentReplyDto`. A prompt-injection request (ignore instructions, submit, another family, a different amount) is declined in plain words by the step prompt's rules and the absence of any such tool; amounts in a reply come only from tool results.
- **`AgentRedactor`** — removes 9-digit numbers, dates of birth, addresses, phone numbers, emails, income answers and document contents from anything sent to the model or stored.
- **`AgentTools`** — `GetStatus(childId?)`, `GetEstimate(childId)`, `ListBenefits()`, `ExplainStep(step)`, `OfferCallback()`; every id is checked against the link's household, else 404 audited; `OfferCallback` only tells the page to show the callback dialog.
- **`AgentFallbackCopy`** — the approved line per step and language, returned when `ILanguageModel` throws, times out at 10 s or answers nothing; the page continues.
- **`ILanguageModel`** (`Infrastructure/LearningBond/`) — the vendor adapter; tests register `FakeLanguageModel`, which answers scripted replies, tool calls, an injection attempt and a timeout. The model and its configuration are `<TO SUPPLY>`.
- **Endpoints** — `POST /g/learning-bond/{token}/agent` (`LearningBondGuardianEndpoints.cs`); `GET .../agent/conversation` for the household's own reading; no staff route reads a conversation.
- **Budgets and checks** — `GET .../estimate` answers within 500 ms p95 and the agent's first words appear within 3 s p95 (the fallback renders at once); every Learning Bond screen in every state is axe clean in both themes in `e2e/tests/learning-bond/`.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-160` | `L1-029` | The agent shall explain, ask and prepare through tools authorized for the verified household's link; consent, submission and withdrawal shall never be available to it. |
| `L2-163` | `L1-029` | Every Learning Bond screen shall be accessible, responsive, in the household's language and within the performance budgets. |
| `L2-035` | `L1-019` | Every screen shall meet WCAG 2.2 AA in both themes. |
| `L2-036` | `L1-019` | Layouts shall adapt at the design system's breakpoints from 360 px phones up to 1600 px screens. |
| `L2-027` | `L1-013` | Guardian pages, texts and emails shall be in English, Spanish or French as the household chose, with one primary action per page. |
| `L2-033` | `L1-018` | Guardian pages shall meet the performance budget measured on a mid-range phone over simulated 4G. |

## Diagrams

The language model sees redacted context only; the guardian's actions never pass through it.

![C4 system context for run the Learning Bond agent](diagrams/c4-context.png)

The agent runs in the API; the model is a vendor behind an abstraction with a fake in tests.

![C4 container view for run the Learning Bond agent](diagrams/c4-container.png)

The redactor sits between the household and the model; the tools sit between the model and the data.

![C4 component view for run the Learning Bond agent](diagrams/c4-component.png)

The context carries first names, ages, statuses and figures; the conversation belongs to one household.

![Class structure for run the Learning Bond agent](diagrams/class-structure.png)

A reply with a tool call is authorized against the link's household and capped at 60 words.

![Sequence for an agent reply with a tool call](diagrams/sequence-agent-reply.png)

A slow model gives way to the fallback copy at 10 s and the flow continues.

![Sequence for the model timeout fallback](diagrams/sequence-model-timeout.png)
