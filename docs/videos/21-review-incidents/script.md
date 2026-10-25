# 21 · Review incidents

A report is only half of the promise. Someone responsible has to read it, decide what happens next, and write that down where the reporter and the board can see it. This video shows how Marisol, the program director, reviews Jaylen's report of Mateo's fall.

## What review promises

Only admins and program directors review. A review always has a note, and an outcome: closed with no further action, closed with a policy change, or kept open while follow-up is pending. The reporter is emailed when it is reviewed. Anyone who can read the report can add a follow-up, even after it is closed, and a supervisor can reopen it. The page keeps a trail of who submitted and who opened it.

## Marisol reviews the report

Here is the report on Marisol's laptop. The trail already shows that Jaylen submitted it and that she opened it. She taps Mark reviewed, writes that the first-aid procedure was followed and the stairwell lighting was reported, and confirms. The report is closed with her note. A day later she adds a follow-up: the building manager replaced the bulbs.

## Rules that keep it honest

Mark reviewed without a note is refused, and the dialog asks for one. A closed report can't be reviewed twice; it has to be reopened first. Jaylen can add a follow-up to his own report but can't review it.

## How it is tested

Backend tests cover the required note, closing and keeping open, the reporter's email, a second review refused, follow-ups after closing, reopening, the trail, and site leads refused. The browser tests follow Marisol and Jaylen on phone and desktop, with accessibility checks on the page and the dialog. Fixing a flaky accessibility check along the way, the app now scrolls to the top on every navigation.

## Recap

Things to remember. Every review has a note and an outcome. The reporter is told. Follow-ups stay on the report, even after closing. Next, the youth worker's session.
