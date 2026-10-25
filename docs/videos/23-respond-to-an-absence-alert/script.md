# 23 · Respond to an absence alert

When a child isn't checked in, the family gets a text. This video shows the family's side: answering that text with a single number, or with a tap on the family's own page, and how the answer reaches the site lead's roster.

## What answering promises

The text says which children aren't checked in and at which session. Replying 1 means on the way; replying 2 means absent. The same text has a link to the family's page, for anyone who would rather tap a button. Either way, the answer appears on the roster within moments, and an absent child is marked absent without anyone typing it in.

## Linh answers on her page

Here is Linh Tran's phone. She opens the link from the text, confirms it's her with a code, and the page says that Emily and Kevin aren't checked in at Tutoring night yet. She taps Absent tonight. The page thanks her, and the alert disappears.

## What the site lead sees

On the roster, each child shows the family's answer: absent, guardian replied, or on the way, guardian replied. Jaylen doesn't have to call those families. Only the ones who haven't answered are left.

## How it is tested

A backend test runs the no-show job, follows the link in the text, checks that a new phone must verify with a code first, sees the open alert with the children's names, answers absent, and checks the roster and that the alert is gone. The browser tests follow Linh on phone and desktop with an accessibility check, and check the answer on Jaylen's roster.

## Recap

Things to remember. Reply 1 or 2, or tap the link. The answer reaches the roster at once. Absent children are marked absent for staff. Next, ending the session.
