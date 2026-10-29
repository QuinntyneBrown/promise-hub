# 82 · The Waypoint merge, start to finish

Waypoint was a youth leadership platform. Over thirty-three prompts, forty-nine to eighty-one, it moved into PromiseHub one journey at a time, each with its own video. This closing video tells the whole story in one place: what Waypoint brought, how it was mapped onto PromiseHub, the three new modules and three new roles, every journey in seven groups, and what was left for later.

## What Waypoint brought

Waypoint had lessons, quizzes, assignments, reflections and badges for young people aged twelve to eighteen. It had mentors with a dashboard, grading, check-ins and at-risk flags. It had cohorts and sessions with RSVP and attendance, a volunteer portal, a guardian portal, announcements and direct messages, and a public site with a way to apply and to give. It was its own product, with its own apps, its own requirements and its own tests.

## How it mapped onto PromiseHub

Prompt forty-nine decided, once, where each part would land, and wrote it down in architecture decision record forty-three. Most of Waypoint already had a home. A cohort became a program with a term, a session became an event, and attendance became Roll Call, so there is one attendance system, not two. Applications and referrals use the open enrollment link. Announcements and direct messages use Messages. Guardians still have no accounts: the guardian portal and consent became verified-link guardian pages. And Waypoint's code followed PromiseHub's conventions as it moved: plain handlers and minimal API endpoints, one Angular app with one library per feature, integration tests against a fake database, and Playwright against a fake API.

## Three modules and three roles

What was new became three modules: Learning, Mentoring and Public website. Each needs the roster, each starts off for every organization, and the whole suite preset leaves them off, so nothing changes until an admin turns one on. Three participant roles joined the five staff roles. A youth signs in with an account linked to one child record and reads only that record. A mentor sees only the youth and cohorts assigned to them. A volunteer runs only the sessions they are assigned to. Every staff endpoint refuses these roles unless it opts in, and every new endpoint names its module and its permission.

## Sign-in, invitations and consent

The first group gave participants a way in. Sofía, a youth, signs in on her phone and lands on Learning; Daniel, a mentor, lands on Mentoring. Tom invites Yusuf from his child record and Grace from Staff and roles, with one password rule for everyone and an expired link that asks for a new one. Because Sofía is twelve, Learning is held at a server-side gate until her mother Carmen consents from a verified link, in Spanish. Then three first-run steps set her name, her preferences and her program.

## Cohorts and the mentor dashboard

Next, cohorts. Marisol gives After-School Tutoring its term, sets its lead and supporting mentors and assigns a mentor to each youth. Daniel opens Mentoring on a dashboard of his own youth and cohorts, with who checked in this week and recent attendance. He searches My youth, and opens a record with guardians to call and nothing medical. Anything outside his scope is refused on the server and audited. Young people reach a cohort through the same enrollment link families use: a guardian applies, a young person applies for themselves, or a counsellor like Rachel refers one, and staff place each applicant from one pipeline.

## Learning, from authoring to the journey

The biggest group is Learning. Marisol authors tracks of modules and lessons, with quizzes, assignments, rubrics and badges, and nothing reaches youth until it is published. Sofía opens Learning on what is assigned to her and where she left off. Lessons unlock in order, with every lock enforced on the server. Her quiz attempts are scored on the server and her best score counts. She submits assignments with a promise that the work is her own, and Daniel grades them against the rubric, or sends them back. Badges are awarded once, after each learning event. Her journey shows her roadmap, her streak, her stage and her badges, and her progress shows quizzes, attendance and competencies. Her reflections stay private unless she shares them with her mentor.

## Check-ins, at-risk flags and assigned work

Mentoring adds three tools. Daniel logs mentor check-ins, which only he can read, and his dashboard shows the follow-ups they set and who is due. He raises an at-risk flag on a youth with how serious it is and why; Marisol is notified, reads every flag and resolves it with an outcome. And he assigns a published lesson, quiz or assignment to chosen youth or a whole cohort, which shows on each youth's Learning home until it is done. Assigning needs both Mentoring and Learning.

## Sessions, RSVP and attendance

Sessions became events. Marisol schedules Tutoring night every Thursday as a weekly series, and Sofía answers Going, Maybe or Can't make it, with a note for staff. Late and excused fold into Roll Call, and a mentor takes attendance for his cohort's sessions, online and offline. Leo, a volunteer, sees tonight's session on his Today and marks youth present or absent, nothing more. Carmen opens her household link with no account and reads Sofía's schedule, consents, attendance and Learning progress, but never her work.

## Messages and notifications

Announcements and direct messages are Messages, with safeguards on the server. Marisol announces a room change to youth and guardians, and the guardians' copy goes through Messages under the SMS cap. Daniel and Sofía message each other, and a reply arrives without a reload. Notifications follow their modules, reach a contentless event stream as they are saved, and each person chooses which kinds they want.

## People, settings and reports

Then the running of the organization. Tom opens People, with every account, its role, its mentor and its last sign-in, and deactivates and reactivates an account without losing anything. Every role can reset a forgotten password: here Sofía uses a link on her phone and lands back on Learning, with her other devices signed out. A password with her own email name in it is refused first, and only the newest link ever works. Your account holds each person's profile, password and display choices. Settings opens on the organization, with its logo, the one consent policy, the check-in cadence and the public website's address. Detailed reports list only what the modules allow, exports match what a report shows, and a roster import places youth in cohorts and invites them once.

## The public website

The last journey opened PromiseHub to the public. The address chooses the organization, and an unknown address, a suspended organization and a module that is off all look the same. Dana sees Harbourview's home page, then the programs that are open, with the learning track and mentorship only while those modules are on. Apply is the program's enrollment link. A contact message, a volunteer offer and a monthly gift are each validated, limited, audited and kept for that organization alone, and cards go straight to the payment provider.

## What was deferred

Not everything came across, and each video says what waited. The public website has no staff inbox yet and no real payment provider. Authoring a lesson's kind, passage and starter code, chunked upload and video transcoding wait. Automatic at-risk flags, reminders on assigned work, and editing a whole series of sessions at once are deferred. So are email and push per kind, quiet hours, profile editing on a person's record, an admin sending a reset, and report date ranges, comparisons and PDF exports. Each one is named in its video and its decision record, so it can be picked up later without guessing.

## Recap

Things to remember. Waypoint mapped onto programs, events, Roll Call, enrollment and Messages wherever PromiseHub already had a home. What was new became Learning, Mentoring and Public website, modules that start off, and Youth, Mentor and Volunteer roles that see only what is theirs. Every journey came with its requirement, design, mock, tests and video, and every endpoint answers not found when its module is off and nothing across organizations. What waited is written down. That is the Waypoint merge, start to finish.
