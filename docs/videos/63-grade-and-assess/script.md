# 63 · Grade and assess

A mentor closes the learning loop. Youth send assignments and finish quizzes; their mentor grades the work, confirms the quiz results that need a mentor, and records how each youth is growing. This video shows how a mentor does all three in PromiseHub, and why nothing a mentor saves can silently overwrite someone else's.

## The review queue

Daniel Osei mentors Sofía Rivera and Nadia Haddad at Harbourview. When Learning is on, his Mentoring page offers Reviews, with the number waiting. Reviews lists the work his youth have sent, oldest first: two submissions of Serve someone this week, Nadia's marked late, and two quiz results waiting for his approval, each with its auto-score. Filters narrow it to assignments or quizzes. The server builds this list from his youth only, the ones assigned to him directly or through a cohort he is on. Another mentor's youth and another organization never reach it.

## Grading a submission

Review opens Sofía's submission. What she sent sits beside the rubric: her reflection, her photo, and the task. Opening it moves it to In review, and Sofía sees that too. Daniel gives each criterion its points, ten, ten and five, and the total follows him, twenty five of twenty five. He writes a comment and chooses Approve. A dialog names the points, and on confirming the submission is Accepted. Sofía sees the points and his comment, gets a notification, and the change is audited.

## Drafts and revisions

Nadia's work needs more. Daniel saves a draft first: his scores and comment are kept, and Nadia still sees In review. Then Request revision asks what she should change. The note is required. Sending it marks the submission Needs revision, Nadia is notified, and when she resubmits it comes back to his queue.

## What the server checks

Every score must be a whole number from zero to that criterion's points, and approving needs every criterion scored. The total is computed on the server. A submission already accepted or sent back cannot be graded again. And every grade names the version of the submission it was read at. If another mentor of hers saved a grade after Daniel opened it, his save is refused as stale, his scores and comment stay on the page, and Load the latest shows what changed.

## Quiz approvals

Some quizzes count only once a mentor approves the score. A program director turns that on in the quiz builder with Mentor approves each score. Quiz approvals lists each waiting result with its auto-score against the pass mark, in words as well as colour. Daniel approves Nadia's seventy five percent with an override of eighty, because a written answer deserved partial credit. The auto-score is kept beside it for the audit, and Nadia sees only the approved score. Approve all approves the rest at their auto-scores in one step, each one audited.

## Competencies

From Sofía's record, Competencies shows Harbourview's five: serves others, speaks up, leads a small group, follows through and works with others. Each has a level, from not started to mastered, and a note. Daniel moves serves others to proficient with a note, and speaks up to developing. Saving keeps a new assessment, with who and when, for each competency that changed, and keeps every earlier one; the latest is what shows. Competencies need Mentoring only, so they stay when Learning is off.

## On a phone

On a phone the queue and the grade page stack in one column, with no sideways scrolling, and each score field is labelled with its criterion and its range.

## The other states

A score out of range or missing shows beside its field and in a summary, and nothing is sent. A failed save keeps everything entered. A youth who is not his is refused, and the refusal is audited. When nothing is waiting, Reviews says he is all caught up. With Learning off, Mentoring offers no Reviews, the reviews pages go to Today, and every review endpoint answers not found.

## How it is tested

The API tests cover the queue, opening and grading with drafts, approvals and revisions, every refusal, stale versions, quiz approvals with overrides and approve all, competencies, another organization, other roles, and Learning and Mentoring off. The browser tests grade, approve and assess on a phone and a laptop against the fake API, with accessibility checks.

## Recap

Things to remember. Mentors see only their own youth's work. Grades are checked and totalled on the server, and a stale save is refused, never silently applied. Approved quiz scores are the only ones that count. Competency assessments are kept, and the latest shows. Next, program directors author badges and progression.
