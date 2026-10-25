# 09 · Record attendance as a youth worker

Youth workers run the door most nights, so check-in has to be just as quick for them. They should only ever see the sessions they work, though, and the server has to hold that line even when someone types a link by hand. This video shows Aisha working tonight's session, what she sees when she opens one she is not on, and how the rule is built and tested.

## The rule

Staff are assigned to sessions, the way the event page lists who is working. Admins, program directors and site leads can run any session. A youth worker runs only the sessions they are assigned to. Today lists just those, and every other session answers forbidden on the server, whether she asks for its roster or tries to check a child in, mark an absence, add a walk-in or sign a child out. Another organization's session still answers not found, so nothing about another tenant leaks.

## Aisha's night

Here is Aisha on her phone. Today shows one session, Tutoring night, because that is the one she is assigned to. She opens check-in, taps Check in for Mateo, and later signs him out to Carmen from the approved list, exactly as a site lead would.

## A session she is not on

Now Aisha follows an old link to last night's session. The server refuses, and the page says plainly that she is not on this session and that a site lead can add her. One tap takes her back to her own session for tonight.

## The two states

Side by side, the two states Aisha can meet: her Today with only her session, and the page for a session she is not on.

## How it is tested

Backend tests cover the list of today's sessions for a youth worker, a site lead and a volunteer coordinator, check-in and sign-out on her own session, a forbidden answer for every read and write on another session, site leads and directors running sessions without an assignment, another organization's session, and Roll Call switched off. The browser tests repeat the journey on phone and desktop, with an accessibility check on each state.

## Recap

Things to remember. Staff are assigned per session. Youth workers see and run only their own sessions. Everything else is refused on the server, not just hidden. Next, sending a permission slip.
