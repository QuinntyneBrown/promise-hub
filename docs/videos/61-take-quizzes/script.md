# 61 · Take quizzes

A quiz is how a youth finds out what stuck, and how her program sees her progress. This video shows how a youth takes a quiz in PromiseHub: the rules first, one question at a time with every answer saved as she goes, a submit that locks the attempt, and a result that shows her score and, when the quiz allows it, the correct answers. The server scores every attempt and enforces the attempt limit.

## The rules first

Sofía Rivera is in After-School Tutoring at Harbourview, and she has done every lesson of Leading by Serving. Its quiz now shows on the module page as up next. Opening it shows the rules: four questions, a pass mark of seventy percent, two attempts with the best one counting, and which attempt this is. Nothing about the answers is sent to her browser before she submits. A quiz attached to the whole module stays locked until every lesson of the module is done, and a quiz attached to a lesson until that lesson is done; the server answers locked and names what to finish first.

## One question at a time

Start quiz begins attempt one. Each question is a group named by the question itself, and each option is a real radio button or checkbox inside a quiz option, so it works with a keyboard and a screen reader. As soon as she chooses, the answer and the question she is on are saved, and the page says Answers saved. A multiple answer question takes several ticks, and a short answer takes a word, matched later ignoring capitals and spaces at either end. If she closes the tab and comes back, the attempt resumes on the same question with her answers. If a quiz shuffles, the order is fixed when the attempt starts.

## Submitting locks the attempt

On the last question, Submit answers opens a dialog. It warns that the attempt is scored and locked, and names any question left blank, which counts as wrong. On confirming, the server saves her final answers, scores them against the stored correct answers, records the score and whether it passed, and audits the submission. From then on the attempt never changes: saving to it or submitting it again is refused.

## Her result

Sofía got three of four, seventy five percent, so she passed. The result shows her score, the pass mark and the attempt. Because this quiz shows the answers after each attempt, the review walks every question: her answer marked correct or wrong in words, and on the multiple answer question the option she missed, marked as the correct answer she didn't choose. The quiz is required to finish the module, so Leading by Serving is now complete, and the next module unlocks.

## Trying again

Had she scored fifty percent, the result says not this time, with the attempts left. Try again returns to the rules, which now say last attempt and show her best score so far. The server refuses a third attempt, and a later, lower score never replaces a better one.

## On a phone

On a phone the rules, the question and the result stack in one column, with no sideways scrolling. The options stay large enough to tap with a thumb, and the save status sits right under the title, so she always knows her answer is safe.

## Locked, offline and the rest

A locked quiz names the lesson to finish first. If the connection drops, her answer stays on screen and the page says it is not saved. It saves again as soon as she is back online, and she cannot submit until then. With no attempts left, Start is gone and her best attempt is offered. A quiz set to show the score only has no review. Some quizzes need a mentor to approve each score. Those results wait for the mentor, which arrives with grading. Another organization's quiz is not found, a failed load offers Try again, and with Learning off these pages go to Today while every endpoint answers not found.

## How it is tested

The API tests cover the rules and the locks, starting, resuming and autosaving, answers that don't fit, scoring each question type, the locked attempt, the attempt limit and the best score, every feedback rule, approval, required quizzes, another organization and Learning off. The browser tests take the quiz on a phone and a laptop against the fake API, offline included, with accessibility checks.

## Recap

Things to remember. Every answer is saved as she goes, and an attempt resumes where she stopped. Scoring happens only on the server, and a submitted attempt never changes. The attempt limit is enforced, and her best score counts. Next, youth submit assignments.
