# 57 · Complete lessons

A youth signs in to learn, so Learning has to show her what to do next and let her do it. This video follows Sofía Rivera through PromiseHub's lessons: her Learning home and her tracks, modules that unlock in order, reading and scripture lessons with a video, and coding lessons and projects, with every lock enforced on the server and her progress saved there.

## Learning home and tracks

Sofía is twelve. Her guardian has consented, and she is placed in After-School Tutoring and Saturday Sports. Learning greets her by the name she goes by, says how many lessons she has done, and offers to continue where she left off: Pick Up the Towel, in Leading by Serving. Each of her tracks is listed with the program that follows it. Opening Leadership Foundations shows its modules in order. Knowing Yourself is done. Leading by Serving has not started. Speaking Up is locked, says what unlocks it, and is not a link. Because she is in two programs that follow two tracks, a button group switches to Digital Skills.

## Modules unlock in order

A module unlocks when its prerequisite module is done, and a lesson unlocks when every lesson before it in the module is done. One service on the server, called the learner progress, decides this for every request. A locked module or lesson answers forbidden with the name of what to finish first, so typing an address never skips ahead. Drafts, tracks her programs do not follow, and anything from another organization answer not found.

## Reading a lesson

Pick Up the Towel shows what she will learn, the teaching, a prompt to think about, and its video. Leader notes are never sent to her. Mark complete saves the lesson on the server once and audits it, and the next lesson opens from Next. Last in Line is a scripture lesson: the passage sits in a scripture block with its reference, and the bigger text button makes the passage and the teaching easier to read on a phone.

## The lesson video

The video player uses the browser's own controls. The video streams from the learning API under her signed-in session, with range requests so she can skip ahead, and only to a youth who may open the lesson. If it fails to load, the player says so and offers Retry, and the lesson text stays readable.

## Coding lessons

Your First Webpage teaches in steps, each with a code sample. In the playground she writes her own page and presses Run. The preview runs in a sandboxed frame under a policy that blocks every script and request, so nothing she writes can run or leave the page. She ticks the checklist and saves. Her code and ticks are kept on the server, and ticking every item completes the lesson.

## Coding projects

Build Your Event Page is a project. She builds the page, saves a draft, and submits it with a note to her mentor. The submission is stored once as submitted, audited, and the project shows read only. Mentor review comes with a later journey.

## Empty, failed and off

With no published track, Learning says no lessons yet. If it fails to load, the error offers Try again. Staff, mentors and volunteers are refused, a youth without consent is asked for it first, and a youth in no program waits. Turn Learning off, and every learning page goes to Today and every learning endpoint answers not found.

## How it is tested

The API tests cover the home, tracks, modules and locks, reading and completing lessons, the video stream and its ranges, coding progress and project submissions, roles, consent, another organization and Learning off. The browser tests run every screen on a phone and a laptop against the fake API, with accessibility checks and no sideways scrolling.

## Recap

Things to remember. Learning shows only published content of the tracks a youth's programs follow. Modules and lessons unlock in order, and the server enforces every lock. Progress, code and submissions are saved on the server, and the preview never runs her scripts. Next, families and partners apply or refer a youth to a program.
