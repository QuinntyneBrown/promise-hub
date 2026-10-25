# 11 · Send permission slips

A trip can't go ahead without consent from every family, and chasing paper slips eats a director's week. This video shows Marisol writing the field trip's permission slip, sending it, watching the answers come in, and changing it after families have signed.

## What a slip promises

A slip belongs to one event. It has a title, the words guardians read before signing, a sign-by date before the event, the questions to ask, a reminder schedule and a channel. Marisol can send it now, schedule it for later, or keep it as a draft. Sending reuses the message path from the last video: one message per household, in its channel, within the SMS cap, sent by the background job. Slips answer to their own module, so they go out even when Messages is off.

## Marisol writes and sends

Here is the slip editor for the Fall field trip on Marisol's laptop. The title comes from the event. She writes what families are agreeing to, sets the sign-by date to Thursday the twelfth, keeps photo permission and lunch, and leaves text and email with reminders twice a week. She sends it now. The page turns into tracking: zero of four children signed, each child listed as outstanding.

## Answers and changes

On her phone a day later, the slip shows one signed, one declined and two outstanding, with who answered for each child. Now the plan changes: the group will also swim. Because guardians already signed different terms, Marisol marks the change as material. Saving starts version two, sets every answer back to outstanding and tells each household the slip has changed. A small fix, like a typo, would keep every answer as it is.

## When things go wrong

If the text is empty or the sign-by date falls after the event, the editor lists both problems at the top, marks each field and sends nothing. If the organization has used all its text segments, the slip still goes by email, and the editor names the households that got email only.

## How it is tested

Backend tests cover the draft and what it reaches, saving every field, validation, sending one message per household, the event showing the slip as sent, scheduling, cancelling, sending now, per-child tracking, small and material edits, the SMS cap, volunteer coordinators reading but not sending, another organization's slip, and the module switched off, where a scheduled slip stays unsent. The browser tests repeat these on phone and desktop with an accessibility check on every state.

## Recap

Things to remember. A slip is written once per event and sent now, later or not yet. It travels the same path as messages, under its own module. Answers are tracked per child, and a material change asks everyone to sign again. Next, guardians signing on their phones.
