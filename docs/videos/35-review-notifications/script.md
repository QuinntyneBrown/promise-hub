# 35 · Review notifications

When something needs a director's attention, it shouldn't depend on them happening to look. This video shows the bell's unread count and the notification center, where staff open what needs them and mark it read.

## What notifications promise

Every notice belongs to one person. Today, reporting an incident notifies everyone whose role reviews incidents. The bell in the top bar shows how many are unread. The notification center lists them newest first, each linking to the record. Opening one marks it read, and Mark all read clears them all. The count follows the person to every device on their next page. A notice belongs to a module, and when that module is off its notices are hidden, not deleted.

## Marisol checks the bell

Here is Today on Marisol's laptop. The bell says two unread. She opens it and the notification center lists two incident reports, the newest first. She marks them all read, and the center says all read.

## Empty and errors

When there is nothing new, the center says you're all caught up. If it fails to load, it offers to try again.

## How it is tested

Backend tests cover reviewers notified newest first with an unread count, opening one marking it read for that person only, mark all read, a youth worker getting no review notice and unable to read someone else's, another organization seeing none, and incident notices hidden while Incidents is off. The browser tests follow Marisol, Aisha and Grace on phone and desktop with accessibility checks.

## Recap

Things to remember. One notice per person. The bell counts what's unread. Notices follow their module. Next, choosing how and when you're notified.
