# 22 · Follow up no-shows

The scariest question at a youth program is a simple one: a child who should be here isn't, and nobody knows why. This video shows how PromiseHub texts the family fifteen minutes after the start, takes their reply, and shows Jaylen, the site lead, who is missing and what each family said.

## What no-show follow-up promises

Fifteen minutes after a session starts, each family with a child who isn't checked in gets one text: reply 1 if on the way, 2 if absent. The text goes once, however many times the job runs, and it follows the same rules as every other message, so the text limit and the email fallback apply. A reply of 2 marks the child absent; a reply of 1 shows they're on the way. The site lead sees all of it on the roster.

## Jaylen watches the roster

Here is tonight's roster on Jaylen's phone. Mateo is checked in. Jordan, Sofía and Yusuf each show that their guardian was texted at a quarter past four. A minute later, the replies are in: Sofía is absent, and Yusuf's family says he's on the way. Jordan's family hasn't answered, so Jaylen knows exactly who to call.

## Keeping replies safe

Replies arrive from the text provider, which must send a shared secret; anything without it is refused. A number with no open alert changes nothing, and the organization always comes from the alert the family is answering, never from the text itself. With Roll Call switched off, or the session's no-show switch off, no text is sent.

## How it is tested

Backend tests move a fake clock past the fifteen minutes and run the job twice, checking that each household gets exactly one text naming only the children not checked in. They check the replies of 1 and 2, the audit entries, the shared secret, an unknown number, the per-session switch and the module switched off. The browser tests show each reply on the roster on phone and desktop with an accessibility check.

## Recap

Things to remember. One text per family, fifteen minutes after the start. A reply of 2 marks the child absent. The roster shows who still needs a call. Next, ending the session.
