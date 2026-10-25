# 06 · Check children in

Knowing exactly who is here is the most valuable thing PromiseHub does on a weeknight. This video shows Jaylen, Harbourview's site lead, checking children in to Tutoring night on his phone, one tap per child, and what happens when the network lets him down.

## What check-in promises

Today shows tonight's session and how many children are in. The roster lists every child enrolled in the session's program. One tap checks a child in, and the row and totals change before the server answers. A child can be checked in at an earlier time or marked absent instead. A child who is not on the roster joins tonight as a walk-in. Every change is recorded, a repeated tap never counts twice, and nothing of Roll Call appears when the module is off.

## Jaylen at the door

Here is Jaylen on his phone. He taps Check in on Mateo, then Sofía, and each row turns green with the time while a toast counts how many are here. Yusuf will not be coming tonight, so Jaylen opens his options and marks him absent. Nikolai Petrov arrives with his mother, but he is not on the roster. The search finds no one, so Jaylen adds him as a walk-in with his mother's name and phone. Nikolai is checked in for tonight only and flagged for the office to enroll.

## When the network fails

If the server refuses a check-in, the row goes back to not yet here, the totals return, and a toast names the child who was not checked in, so nobody is left believing a child is recorded when they are not. Each tap carries its own action id, so if a weak connection sends it twice, the second one changes nothing.

## On a laptop

On a laptop, Today shows the session card with its counts and an Open check-in button. The same roster opens with its totals, search and filters for not yet, checked in and absent.

## Who can do what

Site leads, youth workers, program directors and admins run sessions. Volunteer coordinators see the roster without medical flags and without buttons. Another organization's session answers not found, and with Roll Call off, check-in redirects to Today and the session card disappears.

## How it is tested

Backend tests cover today's sessions in the organization's time zone, the roster, check-in now and earlier, absent then present, the repeated tap, walk-ins, cancelled sessions, each role and the cross-tenant cases. The browser tests check in, recover from a failure, mark absent, add a walk-in and confirm the module-off redirect at phone and desktop widths with an accessibility check on every state.

## Recap

Things to remember. One tap, instant feedback, and an honest revert on failure. A repeated tap never counts twice. Walk-ins are tonight only. Next, the Quick Card a site lead opens in an emergency.
