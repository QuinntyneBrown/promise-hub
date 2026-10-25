# 10 · Send guardian messages

Reaching families is the heart of PromiseHub, and permission slips depend on it. This video shows Marisol, the program director, writing a message to the tutoring families, seeing exactly who it will reach and what it costs, sending it, and checking each household's delivery. It also shows what happens when the organization runs out of text messages for the month.

## What sending promises

A message goes to households, through each household's primary guardian. Marisol picks a program or an event, and can narrow it to one language. The server counts the households live, says how many get a text and how many an email, and prices the text in SMS segments against the monthly cap. Sending queues one delivery per household, and a background job sends them, one organization at a time, through provider abstractions. Each delivery is sent once, retried with backoff if the provider refuses it, and recorded as failed if it never goes.

## Marisol writes and sends

Here is the composer on Marisol's laptop. After-School Tutoring is chosen, and three households are counted, all by text. As she types, the preview on the right shows the text exactly as guardians will see it, with Harbourview's name first, and the counter keeps the characters and segments honest. Narrowing to Spanish leaves one household, the Riveras. She goes back to all languages and sends to three guardians. The message page opens with three delivered and a row for each household, including the Riveras' text in Spanish.

## At the cap

Each organization has a monthly cap on text segments, two thousand on the Standard plan. Here, on a phone, the cap is already reached. The composer says so, switches the text choices off and leaves email on. Marisol messages the Saturday Sports family. The Trans have no email address, so their delivery is shown as failed with that reason, right at the top. When a text would pass the cap, households with an email get it by email instead, and those without are paused, never silently dropped.

## The states on screen

Two screens to remember: the list of messages with their delivery badges, and the message page with each household's delivery and the text as sent.

## How it is tested

Backend tests cover the live count by program, event and language, segment counting for long messages, one delivery per household sent by the job, a second run sending nothing twice, a household the channel cannot reach, a refused send retried and then failed, the warning near the cap, fallback and pause at the cap, validation, youth workers refused, another organization's messages and programs, and Messages switched off, where the job sends nothing. The browser tests walk the composer, sending, failures and the cap on phone and desktop, with an accessibility check on every state.

## Recap

Things to remember. Messages go to households, in their language, through their primary guardian. The server counts and prices every send before it goes. A per-tenant job sends each delivery once, and at the cap texts pause while email continues. Next, editing a permission slip.
