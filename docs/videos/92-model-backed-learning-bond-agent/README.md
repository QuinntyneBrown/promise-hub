# 92 · The model-backed Learning Bond agent

> **Runtime:** ~3.8 min · **Audience:** guardians' advocates, program directors, contributors and product owners · **Prerequisites:** [86 · Claim the Learning Bond](../86-claim-the-learning-bond/README.md)

**Video:** [92-model-backed-learning-bond-agent.mp4](92-model-backed-learning-bond-agent.mp4) · [Slides](slides.html) · **Audio:** [92-model-backed-learning-bond-agent.mp3](92-model-backed-learning-bond-agent.mp3) · [Transcript](script.md)

## Why this video exists

Slice 92 puts a language model behind the agent bubble that every Learning Bond page already had:

- The approved fixed line shows first; the model's words replace it when they come within 10 s and pass the server's checks.
- Guardians ask questions in an Ask dialog; the conversation is the household's own.
- The model sees only the household's language, first names, ages, statuses and computed figures, and its five tools only read, for the link's household.
- A SIN typed in the chat is refused before the model; replies and tool calls are audited by step and tool name.

The requirements are `L2-160` and `L2-163`, with ADR 0085.

## Learning objectives

By the end, the viewer can:

- Say when the model's words replace the fixed line, and when they don't.
- Say what the model is given, and what it never sees.
- Name the five tools and why none of them acts.
- Say what happens to a SIN typed into the chat.

## Key questions

| Question | What a strong answer includes |
|---|---|
| When does the model's answer show? | When it comes within the timeout (10 s, `LearningBond:Agent:TimeoutSeconds`), has 60 words or fewer, repeats no nine-digit number and states only amounts the rules produced. Otherwise the approved fixed line stays (`source: "fixed"`). |
| What does the model see? | The step's fixed system prompt (`LearningBondAgentPrompts`) and `AgentContext`: organization name, children's first names and ages, claim status, the rule's estimate, whether benefits were checked, and the totals. Never a SIN, birth date, address, phone, email or intake answer. |
| What can its tools do? | Read only: `GetStatus`, `GetEstimate`, `ListBenefits`, `ExplainStep`, `OfferCallback`, each for the link's household. Any other tool answers "No such tool." and is audited as refused. |
| What happens to a SIN in the chat? | The server refuses it before the model, keeps the message with the number removed, and answers in the household's language that numbers go only in the form field. |
| Which model? | Claude through the official Anthropic SDK (`ClaudeLanguageModel`) when `LearningBond:Agent:ApiKey` is set; otherwise `UnconfiguredLanguageModel` and every step keeps its line. |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/LearningBond/LearningBondAgent.cs`, `LearningBondAgentPrompts.cs`, `ILanguageModel.cs` | The checks, the context, the tools |
| `backend/src/PromiseHub.Infrastructure/LearningBond/ClaudeLanguageModel.cs` | The provider behind configuration |
| `frontend/projects/learning-bond/src/lib/guardian/learning-bond-agent-bubble.ts`, `learning-bond-agent-dialog.ts` | The bubble and the Ask dialog |
| `shots/phone-fixed-line.png`, `phone-model-line.png`, `phone-ask-empty.png`, `phone-ask-busy.png`, `phone-ask-answered.png`, `phone-spanish.png` | On a phone |
| `shots/desktop-model-down.png`, `desktop-sin-refused.png`, `desktop-ask-failed.png` | On a laptop |
| `clips/estimate-phone.mp4`, `safeguards-desktop.mp4`, `spanish-phone.mp4` | Screen recordings of the running app against a fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00 | Introduction | The same bubble, a model behind it |
| 00:23 | The fixed line first | The approved line, then the model's words |
| 00:48 | Ask a question | The Ask dialog and the household's conversation |
| 01:10 | What the model sees | The context and the five tools |
| 01:44 | Safeguards | Model down, a SIN refused, a failed send |
| 02:16 | In her language | Spanish; audit; the provider |
| 02:38 | Testing | API and browser tests |
| 03:20 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/92-model-backed-learning-bond-agent --base http://localhost:4317
node tools/video-audio/generate-audio.mjs docs/videos/92-model-backed-learning-bond-agent
node tools/video-build/build-video.mjs docs/videos/92-model-backed-learning-bond-agent --no-captions
```

## Pitfalls

- The clips fake the API, as the e2e suite does; no model was called. The SIN shown is not a real number.
- The real provider has not been exercised against the live API here: no key is configured in development or CI.

## References

- `docs/specs/L2.md`: L2-160, L2-163, L2-159, L2-161
- `docs/adr/0076-learning-bond-keeps-financial-data-encrypted-and-submits-only-on-the-guardians-request.md` and ADR 0085
- `docs/detailed-designs/learning-bond/run-learning-bond-agent/README.md`
