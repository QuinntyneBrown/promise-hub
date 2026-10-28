# 68 · Flag at-risk youth

Sometimes a mentor gets worried about one of his youth: missed sessions, a change at home, something said that stays with him. This video shows how a mentor puts that worry on record in PromiseHub as an at-risk flag, how program directors are told at once, and how the flag is followed until it is resolved. An at-risk flag is not an incident, and we will see where the two meet.

## Raising a flag

Daniel Osei mentors at Harbourview Youth Collective. From his Mentoring dashboard he opens At-risk flags. Two of his youth are already flagged: Yusuf, marked High, which he raised yesterday, and Jordan, marked Medium, which Hana Kim raised. The most serious come first. He chooses Raise a flag, picks Mateo Rivera, chooses Medium, needs a plan this week, and writes why he is worried. The dialog reminds him that if someone is hurt or in danger, he should not wait for a flag and should tell his program director now. When he raises it, a toast says program directors have been told, and Mateo joins the open list.

## What the server checks

The server keeps each flag on the child, with the organization, who raised it and when. Only a mentor raises a flag, and only on one of his own youth. A youth, a severity of Low, Medium or High, and a reason of up to one thousand characters are required. A youth has at most one open flag, so raising a second one is refused with a message to resolve the first. Every flag is audited as created, with the youth, who raised it and the severity, but never the reason.

## Program directors are told

Raising a flag notifies every admin and program director in the organization. Marisol Delgado sees it in her notifications: Daniel Osei flagged Mateo Rivera as at risk, Medium. The reason stays out of the notification. Opening it takes her to At-risk flags, where she sees every flag at Harbourview, whichever mentor raised it. She can also reach the page from More.

## Resolving a flag

A flag stays open until someone resolves it: a mentor of that youth, an admin or a program director. Marisol chooses Resolve on Jordan's flag, picks Reconnected, back on track, and adds a note. The other choices are handed to the program director, left the program, and flagged in error. Jordan leaves the open list, and the Resolved tab shows how it was resolved, by whom, when, and the note. Resolving is audited too, with the outcome but never the note, and a new flag can be raised later if things change.

## Not an incident

An at-risk flag records a worry, not something that happened. When the Incident log is on, each open flag offers admins and program directors Report an incident, which opens the incident report form. With the Incident log off, nothing on the page mentions incidents. Mentors don't report incidents, so they never see that link.

## Who sees a flag

Daniel sees the flags on youth in his scope. Raising or resolving a flag for a youth who is not his is refused and audited. Another organization's children and flags are never found. Site leads, youth workers, coordinators, volunteers, guardians and youth are refused. With Mentoring off, the page goes to Today, the endpoints answer not found, and the notifications hide. Turning it back on brings every flag back.

## On a phone

On a phone, the flags fit one column, and the dialog rises as a bottom sheet, with nothing scrolling sideways.

## Refused and failed

Raising with nothing filled in lists each missing field beside it and in a summary at the top of the dialog. A youth who already has an open flag is named in a warning. A failed save keeps everything he wrote, so nothing has to be typed twice. If the list can't load, the page says so and offers Try again. A mentor with no flags sees one calm empty state with the action to raise one.

## How it is tested

The API tests cover raising, every field check, one open flag per youth, the audit without the reason, the notifications, directors reading every flag, resolving with each outcome, already resolved, scope, other roles, another organization and Mentoring off. The browser tests raise, read, resolve and report an incident on a phone and a laptop against the fake API, with accessibility checks.

## Recap

Things to remember. A mentor raises an at-risk flag with how serious it is and why. Admins and program directors are told and read every flag. A flag stays open until it is resolved with an outcome, and it is not an incident. Next, mentors assign work to their youth.
