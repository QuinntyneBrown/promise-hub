# 70 · Schedule sessions and RSVP

A cohort meets on a rhythm, and staff plan better when they know who is coming. This video shows how a program director schedules a cohort's sessions in PromiseHub, including a session that repeats every week, how she sees every program's sessions on a calendar, and how a youth answers whether she will come, so staff see the counts and the notes on the event.

## Scheduling a weekly session

Marisol Delgado is the program director at Harbourview Youth Collective. After-School Tutoring meets every Thursday, so on Events she chooses New event. She names it Tutoring night, picks After-School Tutoring, and sets it for Thursday the twelfth of November, from four to six in the afternoon, in Room 2 of the community centre. Then she turns on Repeat weekly, which says it will repeat every Thursday at this time, until the program's last day. When she creates it, a toast says thirty-three weekly sessions were scheduled, and the first one opens.

## What the server does

A weekly series is not a second kind of calendar. Each week becomes an ordinary event of the program, so check-in, slips and reports treat it like any other. The server keeps the same local time every week, even after the clocks change in March, and stops on the program's last day, the twenty-fourth of June. A start after that day is refused, and so is a series longer than sixty sessions. Each session that needs a permission slip gets its own draft slip, and the series is audited once, with how many sessions it made. Editing or cancelling a session changes only that session.

## The calendar

From Events, Calendar shows the month by week, Monday first. Every session sits on its day with its time, today is marked, and a cancelled Saturday Sports says Cancelled and is struck through. The previous and next month buttons and This month change the month, and the address keeps it, so the page can be shared. Program narrows the calendar to one program, here After-School Tutoring. A month with nothing says so and offers New event. The server decides each session's day in the organization's time zone, so the calendar never depends on the viewer's clock.

## The youth's schedule

Sofía Rivera is twelve and in After-School Tutoring. In her navigation, Schedule lists her sessions in the next four weeks, by day. Each shows when and where, and whether she has replied. For the field trip she chooses RSVP. The dialog asks, Will you be there? She chooses Yes, I'll be there, and writes a note for staff: Can I bring my inhaler on the bus? When she sends it, a toast says RSVP sent, and the trip shows Going with her note. She can change her answer any time before the session starts.

## What the server checks

The answer is required, and must be going, maybe or can't make it. The note is optional, up to five hundred characters. There is one answer per youth and session, and answering again replaces it. A session that has started, ended or been cancelled is closed to answers. Sofía can only answer for sessions of her own programs. Another organization's sessions are never found. Under the consent age, her schedule stays closed until a guardian agrees. Each answer is audited, but never the note.

## Staff see the answers

Back on the field trip, Marisol sees an RSVPs card. Going, maybe, can't make it and no reply are counted, where no reply means youth on the roster who sign in and haven't answered yet. Below the counts, each answer is listed with the youth's note, newest first, so whoever runs the trip knows to bring Sofía's inhaler.

## On a phone

On a phone, the calendar becomes a list of only the days with sessions, and Sofía's schedule and the RSVP sheet fit one column, with nothing scrolling sideways.

## Refused and failed

A weekly series that starts after the program ends is refused, and the error says when the program ends. Sending an RSVP with no answer asks for one. A failed send keeps her answer. If the trip is cancelled while the dialog is open, it says RSVPs are closed, and her schedule then shows the trip as cancelled. When the schedule or the calendar can't load, the page says so and offers Try again. When a guardian hasn't agreed yet, the schedule says so. And with Roster off, the schedule and the calendar are gone, and their addresses lead back to Today.

## How it is tested

The API tests cover the weekly series, its local time across the clock change, the last day and the sixty session limit, the calendar's months, days and filter, the schedule, every RSVP check, the counts, the consent gate, roles, another organization, and Roster off. The browser tests schedule, browse, answer and read the answers on a phone and a laptop, against the fake API, with accessibility checks.

## Recap

Things to remember. A session can repeat every week through the program's last day, and each week is an ordinary event. The calendar shows every program's sessions by month. Youth answer going, maybe or can't make it with a note, and staff see the counts and the notes on the event. Next, staff take attendance for those cohort sessions.
