# 25 · Run check-in offline

Gyms and church basements often have no signal, and that's exactly where children arrive. This video shows how check-in keeps working when the phone loses its connection, and how everything catches up when signal returns.

## What offline check-in promises

Once the roster has opened with signal, the phone keeps it, and it keeps every Quick Card on it, with the time they were saved. Without signal, check-ins and absences are saved on the phone and marked waiting to sync. When signal returns, they're sent in the order they were made, and each one counts only once, even if it's sent twice. A child waiting to sync can't be signed out yet. If another phone marked a child absent while this one checked them in, both are kept, present wins, and the roster flags the conflict.

## Jaylen loses signal

Here is tonight's roster on Jaylen's phone, opened with signal. The signal drops. He checks Jordan in anyway. The row says waiting to sync, the header shows one queued, and Jordan's sign-out button is off. When the signal comes back, the check-in is sent, a message confirms one check-in synced, and the queue is empty.

## Quick Cards and the edge cases

Mateo's Quick Card still opens without signal, marked saved on this phone with the time. If a phone never opened the roster with signal, check-in says plainly that nothing is saved on it. And a check-in that arrives after another phone marked the child absent shows a conflict on the row.

## How it is tested

Backend tests send the same queued check-in twice and see it applied once, and send an older check-in after another device's absence to see present kept, both events stored, the conflict flagged and audited. The browser tests drop the connection in the fake API, open a Quick Card from the phone, queue a check-in, bring the signal back and watch it sync, on phone and desktop with accessibility checks.

## Recap

Things to remember. The phone keeps tonight's roster and Quick Cards. Work done without signal waits, then sends in order, once. Conflicts are kept and flagged, never lost. Next, sending messages to families.
