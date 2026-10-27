# 65 · View journey and progress

Youth stay with something when they can see how far they have come. This video shows how a youth sees that in PromiseHub: her journey through the tracks her programs follow, her weekly streak, the stage she has reached, the badges she has earned and the ones still locked, and her own progress on quizzes, attendance and competencies. Every number is computed by the server from the same records Learning counts, so the pages always agree.

## Your journey

Sofía Rivera is twelve and in After-School Tutoring at Harbourview. On Learning, a new card called Your journey links to three pages. She opens Your journey. At the top, four numbers: her overall progress, forty-four percent, four of nine lessons; a streak of three weeks; two of six badges; and her stage, Contributor, stage two of three. Below, her roadmap: each track her programs follow, with its modules in order. Knowing Yourself is done, Leading by Serving is where she is, and Speaking Up is locked until she finishes it, with no link. Continue takes her straight to the module she is in.

## Streak and stage

The streak counts weeks in a row, Monday to Sunday, with at least one lesson completed. It counts back from this week, or from last week while this week has none yet, so a streak does not break on a Monday morning. Her stage comes from the progression framework a program director authors. A stage is earned when every competency in it has her mentor's latest assessment at proficient or mastered. The first stage not earned is where she is, and later stages are ahead. Nothing is stored, so a new assessment moves her at once.

## Badges

The Badges card shows every badge she can earn, earned first, and See all badges opens her collection. She has earned First Steps and Speaks Up, the second awarded by hand by Marisol Delgado. Still to unlock says what earns each badge and how far she is: Servant Heart, two of three lessons. A badge by hand says the program team awards it. She only sees badges she can earn: badges by hand, and automatic badges whose lesson, module, quiz or assignment is in a track she follows. A badge deleted after she earned it stays hers. Her milestones list when she joined, each badge in order, and next up, the badge she is closest to.

## Your progress

Your progress puts her own numbers in one place, on three tabs. Overview shows her overall progress, her quiz average, her streak and her attendance, then her competencies, each with its stage and level. Quizzes lists each quiz she has submitted once, with her best score and whether she passed; a result waiting for her mentor shows Waiting and does not count yet. The arrow keys move between tabs. Attendance lists the sessions she was marked at, newest first.

## On a phone

On a phone the journey, badges and progress stack into one column, with nothing scrolling sideways.

## Empty, refused and off

With no track published yet, the journey says it starts with her first track. With no badge earned, Badges says no badges yet, offers Start a lesson and still lists every badge to unlock. When Roll Call is off for her organization, the server sends no attendance, so there is no Attendance tab and no attendance number. A failed load offers Try again. Before a guardian consents, the server refuses and the page points back to Learning. Staff are refused, another organization's tracks, stages and badges are never returned, and with Learning off these pages go to Today while the endpoints answer not found.

## How it is tested

The API tests cover the journey counts, the streak across weeks, the stages from assessments, badges earned and locked with their progress and milestones, the quiz history and average, attendance with Roll Call on and off, other roles, another organization and Learning off. The browser tests run all three pages on a phone and a laptop against the fake API, with accessibility checks.

## Recap

Things to remember. The journey, badges and progress are computed on read from the records Learning already keeps. The streak counts weeks in a row with a lesson, and the stage comes from the latest assessments. Attendance shows only while Roll Call is on. Next, youth write reflections.
