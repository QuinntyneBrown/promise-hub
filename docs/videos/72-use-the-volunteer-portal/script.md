# 72 · Use the volunteer portal

A volunteer comes to a session to help, not to manage youth. This video shows the volunteer portal in PromiseHub: a volunteer signs in and sees only what is theirs, today's assigned session on Today, their upcoming schedule, and attendance for their own session within volunteer permissions. There is no separate volunteer app. It is the PromiseHub shell, composed for the Volunteer role.

## Today's session

Leo Martins volunteers at Harbourview Youth Collective. His volunteer coordinator assigned him to tonight's Tutoring night, and to Saturday Sports. When he signs in, his navigation is Today, Check-in and Schedule, and nothing else. Today shows one card for tonight's session: Your session today, four to six in Room 2 of the community centre, four youth on the roster, none checked in yet, and one button, Take attendance. Below it, Your work links his schedule. There are no youth names on Today, and nothing about anyone's progress or records.

## Taking attendance

Take attendance opens Tutoring night's roster. Leo sees each youth by name, with Checked in, Absent or Not yet here, and no medical flags, because volunteers never read medical details. Names do not open Quick Cards, rows offer no sign-out, and there is no attendance history. He opens Yusuf's check-in sheet. It offers Now, Earlier and Mark absent instead, and nothing more. He checks Yusuf in, marks Sofía absent, then Mark the rest present checks in the other two, and a toast says two marked present.

## Within volunteer permissions

Late and excused are for staff and mentors. A new permission, qualify attendance, guards them on the server, so if a volunteer's phone sent a late or excused mark anyway, the API would answer forbidden and record nothing. A volunteer runs only the sessions he is assigned to. Every other session's roster and every write to it is refused, and another organization's sessions are not found at all. Each mark he makes is audited and works offline, exactly as it does for staff.

## His schedule

Schedule lists the sessions Leo is assigned to in the next four weeks, grouped by day. Tonight's Tutoring night is marked Today, with Take attendance. Saturday Sports is marked Assigned, with the time, the gym, the program and two youth. The list comes from a new endpoint, sessions mine, which starts from his own assignments, never from an id the phone sends, and stops at sessions that have ended.

## On a phone

On a phone, Today, Schedule and the roster each fit one column, the tab bar shows Today, Check-in and Schedule, and nothing scrolls sideways. Leo opens Schedule from the tab bar and takes attendance from tonight's row, just as he does on a laptop, with buttons large enough for a thumb.

## Empty, failed and refused

On a day with no session, Today says No session today and points to his schedule. If his session cannot load, the card says so and offers Try again. A cancelled Saturday stays on his schedule, marked Cancelled. With no assignments, the schedule says his volunteer coordinator will add him. If he opens a session he is not assigned to, the page says You're not assigned to this session, and to ask his volunteer coordinator. And with Roll Call off, Check-in and Schedule disappear, their addresses lead back to Today, and the API answers not found.

## How it is tested

The API tests cover the schedule's window, order, roster size, status and today flag, a cancelled session, an empty schedule, roles that do not run sessions, Roll Call off and another organization, and a volunteer's present and absent marks, the late and excused refusals, other sessions, history and corrections. The browser tests walk Leo's Today, his schedule and his roster on a phone and a laptop against the fake API, with accessibility checks on every state.

## Recap

Things to remember. The volunteer portal is the PromiseHub shell for the Volunteer role, not a second app. Today shows the session he is assigned to, Schedule shows the next four weeks, and attendance is present or absent for his own sessions only. Next, guardians see their youth's progress in their own portal.
