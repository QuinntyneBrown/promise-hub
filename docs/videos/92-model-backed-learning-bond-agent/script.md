# 92 · The model-backed Learning Bond agent

Every Learning Bond page has a small speech bubble, the agent, that explains the step a family is on. Until now it showed one approved line per step. This video follows Carmen Rivera as a language model answers behind that same bubble, in her own words and language. Nothing it does can send, sign or withdraw anything.

## The fixed line first

Carmen opens Mateo's estimate. The bubble shows the approved line for this step straight away, so the page is useful before any model answers. In the background, the page asks the agent for this step. When the model answers within ten seconds, its words replace the line. Here it explains the fourteen hundred dollars: five hundred for Mateo's first year and one hundred for each year since.

## Ask a question

Under the bubble, Ask a question opens a dialog. Carmen types, does it cost anything, and sends. The answer comes back in plain words: claiming is free, and the money goes into Mateo's RESP. Her question and the answer are kept with her family's link, and only her family can read them. No staff screen shows the conversation.

## What the model sees

The model is told only what the step needs. That is the household's language, the children's first names and ages, where each claim stands, and the figures the rules computed. It never sees a social insurance number, a birth date, an address, a phone number, an email or the family's answers. Its five tools only read: the status, an estimate, the benefits found, a step explained, and an offer of a call. Each answers for the family on the link and no one else. There is no tool to consent, submit or withdraw.

## Safeguards

On a laptop, the model is down, and the approved line simply stays. If Carmen types a number that could be a social insurance number, the server refuses it before the model ever sees it. It keeps her message with the number removed, and reminds her that numbers go only in the form. A reply longer than sixty words, or one stating an amount no rule produced, is thrown away, and the fixed line stands. If a question can't be sent, the dialog says so and keeps her words.

## In her language

Carmen's family reads Spanish, so the agent answers in Spanish. Each reply and each tool call is recorded in the audit log by step and tool name, never by what was said. With credentials configured, the model is Claude, through the official Anthropic SDK. Without them, every step keeps its approved line.

## How it is tested

The API tests use a fake model that records every request. They cover the model's answer replacing the fixed line, and a slow or failing model leaving it. They prove nothing personal or financial is sent, that a SIN in the chat never reaches the model, and that the tools answer only for the link's household and refuse anything else. They also cover invented amounts and long replies thrown away, the audit, the module off answering not found, and another organization never reading the conversation. In the browser, the agent spec walks Carmen through the bubble and the dialog on a phone and a laptop, with accessibility checks.

## Recap

Things to remember. The approved line shows first, and the model's words replace it only when they come in time and pass the checks. The model sees first names, ages, statuses and computed figures, nothing more. Its tools only read, for one household. A SIN typed in the chat is refused and never sent on. That completes the Learning Bond journey.
