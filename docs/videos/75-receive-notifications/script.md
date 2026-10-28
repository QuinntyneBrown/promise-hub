# 75 · Receive notifications in real time

Everyone in a program has something to hear about: a youth's work was graded, her mentor assigned a lesson for Friday, someone wrote to her, a director posted an announcement, a mentor raised an at-risk flag. This video shows how PromiseHub's notification center now serves youth and mentors as well as staff, how a new notice arrives without a reload, and how each person chooses what reaches them, with nothing shown from a module that is off.

## A youth's notification center

Sofía Rivera is twelve and has a youth account at Harbourview Youth Collective. The bell in her top bar counts what she has not read. Her notification center lists her own notices, newest first: Marisol Delgado posted an announcement, Daniel Osei assigned her the Last in Line lesson due Friday, Daniel approved her reflection, and she earned the Faithful Five badge. Each row names its kind and its time, and the unread carry a New badge. Each one links to where she acts on it.

## Arriving in real time

While her center is open, Daniel writes to her. Within a moment a new notice tops the list with New, the count says three unread, and the bell agrees, without a reload. The notice says who wrote, never the words. She opens it, it is marked read, and her conversation with Daniel opens. Reading on her phone tells her laptop too, so the bell drops there as well.

## Where notices come from

Three new kinds join the ones PromiseHub already had. Assigning work notifies each youth account it went to. A direct message notifies the other person in the conversation, and nobody else, not even a supervisor. An announcement sent now notifies the youth and mentors it reaches in the app. Grades, quiz approvals, badges, incidents and at-risk flags notify as before. Every one of them goes through one writer, so a person's choices apply everywhere.

## Mentors and directors

Daniel's center has Sofía's message and the mentor huddle announcement. Marisol, the program director, sees the at-risk flag Daniel raised and an incident to review. Each person sees only their own notices in the organization they are signed in to; another person's, or another organization's, is never listed, and reading one answers not found.

## The event stream

The app keeps one event stream per tab, shared by the bell, the center and whatever page is open. When a save adds a notice, the server sends a notification event with no content to its recipient only. When a notice is read, the same event goes to the reader's other devices. The page then fetches the list through the permission-checked endpoint. If the stream drops, the app fetches again on reconnecting, so nothing is missed and nothing shows twice.

## Choosing what reaches you

From the center, Settings opens Notifications under Your account. Sofía sees one switch for each kind she receives, each saying what it covers: grades and badges, assigned work, messages and announcements, all on to begin with. She turns announcements off and saves. A toast confirms it, the change is audited, and the next announcement creates no notice for her while everyone else still gets theirs. Daniel is offered messages and announcements; Marisol the kinds her role reviews.

## On a phone

On a phone, the center fits one column with nothing scrolling sideways, and a new notice still arrives on its own. The switches sit one under the other, large enough for a thumb. Here are her center and her preferences on the phone.

## Modules and other states

Notifications are not a module; each kind follows its modules. With Messages off, message and announcement notices are neither created nor listed, the count leaves them out, and their switches are not offered; turning Messages back on brings them back. With nothing yet, the center says she is all caught up. If it fails to load, it offers to try again. If a save fails, her switches stay as she set them and the page says nothing changed. A volunteer, who receives none of these kinds, is told there is nothing to choose.

## How it is tested

The API tests cover assigned work, messages and announcements notifying the right people, each kind hidden while any of its modules is off, nothing across people or organizations, the notification event to the recipient only and to the reader's other streams after a read, and the preferences: offered kinds by role and module, a refused kind, the audit, and a kind turned off for one person only. The browser tests walk Sofía, Daniel, Marisol and Leo on a phone and a laptop against the fake API, with accessibility checks on every state.

## Recap

Things to remember. The notification center serves everyone, and every kind follows its modules. A new notice reaches the open app at once through a contentless event, and the app fetches what the person may read. Each person chooses which kinds reach them, and their choice applies to every producer. Next, everyone manages their personal settings.
