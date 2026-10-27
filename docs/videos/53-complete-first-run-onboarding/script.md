# 53 · Complete first-run onboarding

A new youth account is ready to learn only once the youth has said what to call them, what they want to hear about and where they belong. This video shows the short setup a youth goes through the first time they open Learning, how they can leave and come back to the step they stopped on, and the friendly waiting state a youth sees before program staff place them in a program.

## Setup opens on the first visit

Nadia is eighteen and has a youth account at Harbourview, linked to her child record. The first time she opens Learning, there is no setup saved for her yet, so Learning sends her straight to the welcome. It has three steps, with a stepper that says which one she is on. Step one asks what to call her, prefilled from the first name on her record, and her pronouns from a short list. Mentors and staff see this name; her record keeps her legal name. Every Continue saves the step on the server. Step two asks what she wants to be told about: lesson reminders and mentor messages are on, announcements are off, and she switches announcements on. Step three introduces the program staff placed her in, After-School Tutoring, with its schedule and dates. She does not choose it. She taps Finish, the setup is marked complete and audited, and Learning opens with a welcome.

## Mistakes and failures

If she clears her name and continues, the server refuses it, the error shows beside the field and in a summary at the top, and nothing is saved. A name longer than sixty characters, or pronouns outside the list, are refused the same way. If a save fails, her answers stay on screen and she simply tries again.

## Leave and resume

Nadia does not have to finish in one go. On step two she taps Finish later. What is on screen is saved with that step, and Learning opens. From then on Learning never sends her back automatically. Instead it shows a note that she stopped at step two of three, with a button to pick up where she left off. It opens the welcome at step two, with her answers as she left them.

## Waiting for a program

Sometimes a youth has an account before staff place them anywhere. On the program step, Nadia then sees a note that she is not in a program yet and that Learning opens fully the moment staff add her. She can still finish. On Learning, instead of an empty page, she sees a friendly waiting state with Check again. The lock is on the server: lessons answer forbidden with the code no cohort until her child record has an active enrollment in a program that is not archived, in her own organization. When staff enroll her, Check again opens her lessons with no other step.

## Consent comes first

A youth under the consent age, like Sofía at twelve, meets the consent gate before any of this. The setup endpoints refuse her until a guardian consents, so nothing personal is stored first, and the consent gate answers before the program lock. With Learning off, every one of these endpoints answers not found and the welcome redirects to Today. Staff, mentors and volunteers are refused.

## How it is tested

The API tests read the defaults from the record, save each step and read it back, refuse a blank name, a long name, other pronouns and a wrong step field by field, finish once with an audit entry, and refuse finishing before a name was saved. They prove the consent gate, the module and the roles, and that a youth of another organization reads only her own setup and her own programs. For the waiting state they check the no cohort answer, enrollment opening the lessons, an ended enrollment and an archived program, and the consent gate answering first. The browser tests run every screen on a phone and a laptop against the fake API, with accessibility checks.

## Recap

Things to remember. Setup opens once, on the first visit to Learning, and every step is saved on the server. Finish later keeps the answers, and Learning offers to pick up at that step. A youth in no program sees a waiting state, and lessons stay locked on the server until staff place them. Next, youth complete lessons.
