# 74 · Announce and message

A program needs two ways to talk. Staff tell a whole program, or everyone, what is coming. And a mentor needs a direct line to each young person he mentors, with rules that keep minors safe. This video shows both in PromiseHub's Messages module: a program director publishes announcements that youth and mentors read in the app and guardians receive as a text, and a mentor and the youth he mentors exchange messages that arrive in near real time, under safeguards the server enforces.

## Announcing to a program

Marisol Delgado is the program director at Harbourview Youth Collective. From Messages she opens Announcements, which lists what was announced, to which program and to whom, and how many of the youth and mentors it reached have read it. New announcement opens a dialog. She writes the title and the message, picks After-School Tutoring, and chooses who hears it: youth, youth and guardians, guardians, mentors or everyone. She sends it now. A toast says it was sent, and it tops the list.

## Guardians and the SMS cap

Guardians have no accounts, so their copy goes through the Messages pipeline that already sends texts and emails: one delivery per household of the enrolled children, by text, or by email when there is no mobile. The SMS cap applies exactly as before, and the guardian portal lists it as an announcement. Schedule for later sets a date and time; nobody sees it and no text goes until then. Every announcement is audited with its title, program and audience.

## Reading announcements

Sofía Rivera is twelve and has a youth account. Announcements in her menu lists only what was aimed at youth of her programs, or at everyone, newest first, with who sent it, their role and when, and New on what she has not read. Mark all read clears the badges for her alone. While the page is open, a new announcement appears without a reload. Daniel Osei, her mentor, reads the ones meant for mentors, never the ones meant for youth.

## Conversations

Daniel opens Messages from his navigation. He has one conversation for each youth he mentors who has a youth account: Sofía, with one new message, and Nadia, who has not written yet. Sofía's conversation shows their messages oldest first, hers on the left and his on the right, each with who and when, and a day separator. He answers, the message appears at the end as his, and the new count is gone. When Sofía replies, her message arrives at the end, ringed as new, without a reload.

## Real time

The app keeps one event stream open while a conversation or a list is on screen. When something changes, the server sends a small event that names only the conversation, never the words, and only to the youth and her mentor in that organization. The page then fetches the conversation through the same permission-checked endpoint. If the stream drops, the browser reconnects and the page fetches again, so nothing is missed and nothing shows twice.

## On a phone

On a phone, Messages is in Sofía's tab bar. She opens her conversation with Daniel, reads his answer and replies, and the composer sits under the thread with a Send button large enough for a thumb. Her announcements fit one column with nothing scrolling sideways. Here are her conversations, the thread and her announcements on the phone.

## Safeguards

The safeguards live on the server. Only a mentor and the youth assigned to him write in their conversation; no other adult can message a youth. Before Carmen consented, Sofía's conversation says it is waiting for a guardian's consent, the composer is disabled, and the server refuses messages both ways. If a send fails, the message stays with Not sent and Try again. Nadia's empty conversation invites Daniel to say hi. Messages are never edited or deleted, and each send is audited with the two names, never the words.

## Supervisors and refusals

Marisol reads every conversation between a mentor and a youth, read only, for safeguarding. There is no composer, and each opening is recorded in the audit log. A youth worker is refused and told who writes here. With Messages or Mentoring off, Messages leaves the navigation, the route goes to Today, and the API answers not found.

## How it is tested

The API tests cover composing with field errors, scheduling, the guardian copy and the dispatcher, reach and reads, the youth and mentor feeds, the conversation for the participants only, the consent block and its withdrawal, reassignment, the supervisor's audited view, the event stream with no words and nothing across organizations, and Messages and Mentoring off. The browser tests walk Marisol, Daniel and Sofía on a phone and a laptop against the fake API, with accessibility checks on every state.

## Recap

Things to remember. Announcements reach youth and mentors in the app and guardians through Messages, under the SMS cap. A conversation is a youth and her mentor only, blocked until a guardian consents for a minor, and readable by program directors. Events carry no words, so every page fetches what it is allowed to read. Next, everyone receives their notifications in real time.
