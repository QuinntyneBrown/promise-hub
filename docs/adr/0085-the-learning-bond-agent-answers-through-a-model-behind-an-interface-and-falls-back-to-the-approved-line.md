# 0085: The Learning Bond agent answers through a model behind an interface and falls back to the approved line

- Status: accepted
- Date: 2026-10-30

## Context

Prompt 92 puts a language model behind the agent bubble that the guardian Learning Bond pages have shown since prompt 86 (`L2-160`, `L2-163`). Until now each bubble showed an approved fixed line per step (`AgentFallbackCopy`). ADR 0076 fixed what the agent may do: it explains and prepares, and never gives consent, submits, withdraws or reads another household. The design named a model behind `ILanguageModel`, a 10-second budget, five read-only tools, a 60-word cap, amounts only from the rules and no SIN in anything sent to the model (`L2-159`). It left open which model to use and how to configure it. No provider key exists in CI.

## Decision

- **The model sits behind `ILanguageModel`.** `ReplyAsync(LanguageModelRequest, runTool, ct)` answers text, or null when it has nothing usable. The request holds the step's fixed system prompt (`LearningBondAgentPrompts`), the household's last 10 turns, the message and the five tools (`GetStatus`, `GetEstimate`, `ListBenefits`, `ExplainStep`, `OfferCallback`). The model calls a tool through `runTool`, and `LearningBondAgent` answers it for the link's household. A child outside that household answers "Not found."; an unknown tool answers "No such tool." and is audited as access denied. Tests register `FakeLanguageModel`.
- **The approved fixed line is the fallback.** The page shows the step's line first. The model's reply replaces it only when it comes within `LearningBond:Agent:TimeoutSeconds` (10 by default). When the model is slow, down, refuses, stops for any reason other than `end_turn` or answers something unusable, the reply is null, `source` is "fixed" and the line stays. Nothing a guardian does depends on the model.
- **Claude through the official Anthropic SDK, configured by key.** `ClaudeLanguageModel` (Infrastructure) uses the `Anthropic` NuGet package (13.3.0). It runs the model from `LearningBond:Agent:Model` (default `claude-opus-5-5`) at low effort with a tool loop of at most 4 rounds. It is registered only when `LearningBond:Agent:ApiKey` is set; otherwise `UnconfiguredLanguageModel` answers null and every step keeps its fixed line. The key comes from configuration only. The server never falls back to a second model, because the product's fallback is the approved line.
- **The server checks every reply.** A reply is shown only if it has 60 words or fewer, contains no nine-digit number, and states only dollar amounts the rules produced: the children's estimates, the total's lines and sums, and the rule's $500, $100 and $2,000. Otherwise the fixed line answers.
- **A SIN is refused before the model.** A message with nine digits, alone or grouped by spaces or hyphens, gets a fixed refusal in the household's language. It never reaches the model, and it is stored with the number replaced ("[number removed]"). The context is built only from allowed fields (organization, first names, ages, claim statuses, paused reasons, estimates, benefits-checked, totals). It never holds a SIN, a birth date, a contact, an address or an answer, so nothing needs to be redacted.
- **The conversation is stored per household, tenant-filtered.** `LearningBondAgentMessage` (organization, household, step, role, text, time) is tenant-owned. Only the household reads it, through `GET /g/learning-bond/{token}/agent/conversation`; no staff route reads it. Replies and tool calls are audited by step, source and tool name, never by their words (`L2-161`).

## Consequences

- Without a key the product behaves exactly as before prompt 92, so every earlier test passes unchanged and CI needs no secret.
- The real provider is not tested against the live API. Its behaviour (refusals, stop reasons, the tool loop) is covered only through the interface's contract with a fake. Reply quality has no evaluation set yet.
- The amount check rejects a reply that states any amount the rules did not produce, even a correct one such as two estimates added together. The cost is the fixed line, which is always correct.
- Changing the model is a configuration change; changing the provider is a new `ILanguageModel` implementation.
