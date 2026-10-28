# 71 · Take attendance for cohort sessions

Attendance is both a safety record and a funder number. This video shows how a mentor takes attendance for his cohort's session in Roll Call, marking each youth present, late, excused or absent, with or without signal, and how a program director reviews a cohort's attendance and rates and corrects a mark, with the reason kept in the audit log. There is one attendance system, not two.

## A mentor takes attendance

Daniel Osei is a mentor at Harbourview Youth Collective, on the mentor team for After-School Tutoring. While Roll Call is on, Check-in is in his navigation, and his Today has a Check-in card. It opens tonight's Tutoring night with the same roster a site lead uses. Jordan came in after the start, so Daniel opens his check-in sheet and chooses Late. Sofía is at the dentist and her mother let the program know, so he chooses Excused. The rows say Late, checked in at four thirty, and Excused, and the totals carry one late and one excused as captions. Then Mark the rest present checks in everyone not yet marked, and a toast says two marked present.

## One attendance system

Late and excused are not a second set of statuses. A late youth is checked in, with a late flag that stays through sign-out. An excused youth is absent, with an excused flag, so no no-show text goes out. The same check-in and absence endpoints carry the flags, each mark is its own action with its own id, and each is audited with its kind. A mentor runs only the sessions of cohorts on his team. He sees no medical flags, and his rows offer no Quick Cards or sign-out, because those stay with staff.

## Without signal

On a phone in a church basement, the signal drops. Daniel marks Yusuf late and Sofía excused anyway. Each waits on the phone with its flag, the rows say waiting to sync, and the header says two queued. When the signal returns, the marks go in order, a toast says two check-ins synced, and the offline sign goes away. A mark sent twice counts once, a mark the server refuses leaves the queue, and signing out on a shared phone clears it.

## Attendance history

Marisol Delgado is the program director. From Check-in, Attendance history shows a cohort's sessions so far, newest first, with present, late, excused and absent, and a rate, which is present or late out of those marked. Each session says In progress, Recorded, Needs review or Not recorded, and a warning names the latest session nobody marked. Above the table she sees the cohort's rate, how many sessions were recorded, and how many youth are below seventy percent. By youth lists each youth with sessions attended out of marked, and flags those below seventy percent for a follow-up.

## Who sees what

Admins, program directors and site leads choose any active cohort. A mentor chooses only the cohorts on his team, and asking for another is refused and audited. Youth workers, volunteer coordinators and youth cannot open the history. Another organization's cohorts are never found.

## Correcting a mark

On Wednesday, Yusuf was marked absent, but his mother had emailed that morning about a dentist appointment. Marisol chooses Correct on Wednesday's session, picks Yusuf, who shows as absent, chooses Excused, and writes why. When she saves, a toast says the change is in the audit log, and the rates recompute. Corrections work on a session that has ended, but not on one that has not started or was cancelled. The reason is required, up to five hundred characters, and only admins and program directors may correct.

## On a phone

On a phone, the roster, the totals and the history fit one column, and nothing scrolls sideways.

## Refused and failed

Saving a correction without a reason asks for one, beside the field and in a summary. A failed save keeps her choice and her reason. A cohort that has not met yet says no attendance is recorded yet. When the history cannot load, it says so and offers Try again. A youth worker is told the history is for site leads, directors and mentors. And with Roll Call off, Check-in is gone for Daniel too, and its address leads back to Today.

## How it is tested

The API tests cover late and excused, their counts, sign-out and replay, mentors running only their cohorts' sessions, the history's sessions, statuses, rates and youth, who may choose which cohort, corrections and every check, another organization, and Roll Call off. The browser tests mark late and excused, mark the rest present, work offline, review and correct on a phone and a laptop, against the fake API, with accessibility checks.

## Recap

Things to remember. Late is a check-in after the start and excused is an accepted absence, in the one Roll Call. Mentors take attendance for their own cohorts' sessions, online or offline. The history shows each session and each youth with rates, and corrections are audited with a reason. Next, volunteers get their own portal for the sessions they work.
