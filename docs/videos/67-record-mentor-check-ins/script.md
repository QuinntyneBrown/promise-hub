# 67 · Record mentor check-ins

Mentoring happens in conversations: a chat after tutoring, a phone call, a moment at a session. This video shows how a mentor records those conversations in PromiseHub as mentor check-ins: how they met, how it went, what they talked about, what happens next and when to follow up. We always say mentor check-in, so nobody confuses it with Roll Call checking a child in at a session. A mentor check-in is read only by the mentor who wrote it.

## Logging a mentor check-in

Daniel Osei mentors Mateo Rivera at Harbourview Youth Collective. He opens Mateo's record and chooses Log a mentor check-in. The dialog already names Mateo. He sets the date, chooses how they met, one to one, and how it went, Engaged. He writes what they talked about, the action items, and a private note about the family. He sets a follow-up for next Thursday and ticks guardian was informed. Sharing stays off. When he saves, a toast says Mentor check-in saved, and the record's Mentor check-ins card shows it.

## What the server checks

The server keeps each mentor check-in on the child, with the organization and the mentor who wrote it. A youth, a date, how they met and how it went are required. The date can't be in the future in the organization's time zone, and the follow-up can't be before the check-in. Each text field holds up to two thousand characters. Every save is audited as created, with the youth, who logged it and whether it is shared, but never what was said.

## Private notes and sharing

Private notes are Daniel's alone, even when a check-in is shared. Sharing is off by default, so a check-in starts as a private mentor note. Turned on, it is marked Shared in his history. The youth and guardian view of shared check-ins comes with the guardian portal, and it will leave private notes out.

## The history

From his dashboard, Mentor check-ins opens his history: every one to one, call and session he has logged, newest first. Each row shows the youth, how they met, the date, how it went, what they talked about, the action items, the follow-up, whether the guardian was informed, his private notes, and Shared or Private. He filters by youth or by type, and a filter that matches nothing offers Clear filters. Logging from the history, he chooses the youth himself. Here he logs a session with Sofía and shares it, and it tops the list.

## Follow-ups on the dashboard

His dashboard now has a Follow-ups card. For each of his youth, it takes his latest mentor check-in and shows its follow-up date, soonest first. Jordan's follow-up was on Tuesday, so it says Overdue. Each row opens that youth's record. With no follow-ups planned, the card says how to plan one.

## Who reads a mentor check-in

Daniel sees only the check-ins he wrote, for youth still in his scope. Another mentor of the same youth never sees them. Logging for a youth who is not his is refused and audited. Another organization's children are never found, and admins, program directors, staff, youth and guardians are refused. With Mentoring off, the page goes to Today and the endpoints answer not found, and turning it back on brings every check-in back.

## On a phone

On a phone, the Follow-ups card and the history fit one column, and the dialog rises as a bottom sheet, with nothing scrolling sideways.

## Refused and failed

A date in the future and a follow-up before it are listed beside the fields and in a summary at the top of the dialog, and the summary takes the focus so a screen reader hears it first. A failed save keeps everything he wrote, with a message to try again, so nothing has to be typed twice. If the history itself can't load, the page says so and offers Try again. With Mentoring off, opening Mentor check-ins goes straight to Today. A mentor with no check-ins yet sees one calm empty state with the action to log the first.

## How it is tested

The API tests cover logging, every field check, private by default, the audit without the words, the history with its filters and order, another mentor's check-ins, a youth leaving his scope, follow-ups with the overdue flag, other roles, another organization and Mentoring off. The browser tests log from the record and the history, filter, read the follow-ups and walk the failed, empty and forbidden states on a phone and a laptop against the fake API, with accessibility checks.

## Recap

Things to remember. A mentor check-in records one conversation and is read only by the mentor who wrote it. Private notes never leave him. Follow-ups on his dashboard come from his latest check-in with each youth. Next, mentors flag youth who are at risk.
