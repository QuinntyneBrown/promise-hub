# 24 · End a session

At six o'clock the room empties, but the attendance record isn't finished until someone closes it. Children who never came need a status, and children who left need to be signed out. This video shows how Jaylen ends tutoring night in two taps, and leaves a note for the next site lead.

## What ending a session promises

Ending a session asks two questions. The children not checked in: mark them absent, or leave them as not recorded. The children not signed out: sign them out to a guardian at the end time, or leave them for later. Every change is recorded with who made it. Once a session has ended it is read-only, so the numbers in the reports don't move. Notes can be added before or after.

## Jaylen ends tutoring night

Here is tonight's roster on Jaylen's phone. Three children are still in, and Sofía never arrived. He taps End session, keeps the choices to mark absent and sign out at six, and confirms. The screen says the session is recorded, with the totals, and the check-in buttons are gone. Then he opens session notes and writes that the projector in room two is broken again.

## Read-only after the end

If anyone tries to check a child in after the end, the server refuses: this session has ended. Ending it a second time is refused too. The notes stay on the session for the next site lead and for Marisol.

## How it is tested

Backend tests end the session both ways and check every child's status, who ended it, the audit entry, the refusals afterwards, notes after ending, another organization and the module switched off. The browser tests end the session on phone and desktop with accessibility checks on the dialog and the recorded screen.

## Recap

Things to remember. Two questions, then the session is recorded. Ended sessions are read-only. Notes are for whoever comes next. Next, sending messages to families.
