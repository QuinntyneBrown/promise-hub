# 69 · Assign work

A mentor steers his youth by pointing them at the next thing worth doing: a lesson to read before Tutoring night, a quiz to try, an assignment to hand in. This video shows how a mentor assigns that work in PromiseHub, to one youth, a few of them or a whole cohort, with a due date and a message, and how each youth sees it on her Learning home until she has done it.

## Assigning to a cohort

Daniel Osei mentors at Harbourview Youth Collective. He supports After-School Tutoring, which follows the Leadership Foundations track. On his Mentoring dashboard he chooses Assign work. The dialog asks what he is assigning: a lesson, a quiz or an assignment. He picks the lesson Last in Line, from Leading by Serving, then chooses A whole cohort and After-School Tutoring, with its four youth. He sets the due date to Friday the thirteenth of November and adds a short message. When he assigns it, a toast says Last in Line went to four youth, due Friday the thirteenth.

## Assigning to chosen youth

He can also pick youth one by one. This time he chooses Quiz and the Leading by Serving quiz, then Youth I choose. Each of his youth is listed with their cohort, and Yusuf is marked at risk, because he has an open at-risk flag. A short personal note can help there. Daniel ticks Mateo and Yusuf, sets a due date, and assigns it to just those two.

## What the server checks

The server offers only published lessons, quizzes and assignments of the tracks his youth follow. The item, who it is for and a due date are required, and the due date can't be in the past. The message is optional, up to five hundred characters. Every youth he chooses must follow the track the item is in, and the error names anyone who doesn't. Assigning the same item to a youth again replaces the earlier due date and message, so it is never listed twice. Each assignment is audited once, with the item, how many youth and the due date, but never the message.

## What the youth sees

Sofía Rivera opens Learning. At the top, Assigned to you lists what her mentor asked for, soonest due first. Serve someone this week is overdue, so it comes first in red. Last in Line is due in eight days, with Daniel's message under it. Choosing it opens the lesson. When she completes a lesson, takes a quiz or hands in an assignment, it drops off the list, and with nothing left the card disappears.

## Who can assign

Only a mentor assigns work, and only to his own youth or to a cohort he leads or supports. A youth outside his scope, or a cohort he is not on, is refused and audited. Another organization's children, cohorts and lessons are never found. Admins, program directors, other staff, guardians and youth are refused. Assigning needs Learning content, so with Learning off the dashboard offers no Assign work and the endpoints answer not found. With Mentoring off, the endpoints answer not found and the Learning home shows no assigned work. Turning a module back on brings everything back.

## On a phone

On a phone, the dialog rises as a bottom sheet, and Sofía's assigned work fits one column, with nothing scrolling sideways.

## Refused and failed

Assigning with nothing chosen lists each missing field beside it and in a summary at the top of the dialog. Choosing Kevin, whose cohort follows no track, is refused by the server with his name. A failed save keeps everything he chose. If the options can't load, the dialog says so, and when no track has published work yet, it says there is nothing to assign and offers only Close. The recording ends with Learning off, where the dashboard offers no Assign work, and with Mentoring off, where Sofía's Learning home shows no assigned work at all.

## How it is tested

The API tests cover the options, assigning to chosen youth and to a cohort, every field check, the track rule, assigning again, the audit, the youth's list and what drops off it, scope, roles, another organization and both modules off. The browser tests assign, read the Learning home and check every state on a phone and a laptop against the fake API, with accessibility checks.

## Recap

Things to remember. A mentor assigns a lesson, quiz or assignment to chosen youth or a whole cohort, with a due date and a message. Each youth sees it on her Learning home until she has done it. Assigning needs both Mentoring and Learning. Next, mentors schedule sessions and youth answer whether they will come.
