# 0059: The journey is computed on read, with a weekly lesson streak and stages earned from the latest assessments

- Status: accepted
- Date: 2026-10-27

## Context

Prompt 65 ports Waypoint's youth journey, badges and progress pages (`L2-LEARN-009`, `L2-LEARN-010`) as `L2-087` and `L2-088`. Waypoint builds them from one query each, counts an attendance streak of cohort sessions for its "Faithful Five" badge, shows mentor-assessed competencies as percentages, and has no notion of a youth's current progression stage. PromiseHub already counts lessons and module states in `LearnerProgress` (ADR 0051), holds badges and awards (ADR 0058), the progression stages over the competencies mentors assess (ADR 0057, ADR 0058) and attendance records of the events children check in to (Roll Call). Cohort session attendance arrives with prompt 71.

## Decision

- **Three reads, nothing stored.** `GET /learning/journey`, `GET /learning/badges` and `GET /learning/progress` compute everything from the rows that already exist. Nothing is cached or denormalized, so the counts agree with Learning (`L2-087` criterion 6). Each endpoint sits behind the Learning module, the Learn permission, the consent gate and the placement gate, like every youth read (ADR 0051), and reads only the caller's membership and linked child in her organization.
- **Streak.** A streak counts weeks, Monday to Sunday in UTC, with at least one lesson completed (`LessonProgress.CompletedAt`), counting back from this week, or from last week while this week has none yet. Weeks suit youth who meet weekly; it needs no attendance, so it works whether or not Roll Call is on. Waypoint's attendance streak is not ported; an attendance-streak badge rule waits for prompt 71.
- **Stage.** A stage is earned when every competency in it that is not removed has the youth's latest assessment at Proficient or Mastered; a stage with no competencies counts as earned. The first stage not earned is where she is; later stages are ahead. Nothing is stored, so changing the framework or an assessment moves her at once. Competency levels belong to the progression framework, which is Learning's, so they show whenever Learning is on, even while Mentoring is off.
- **Badges she can earn.** Badges of her organization that are not deleted and are either by hand or automatic with a target in a track she follows (lesson, module, quiz or assignment of a published module). Earned badges always show, deleted or not. Locked automatic badges show progress: lessons done of the module for `ModuleCompleted`, 0 or 1 of 1 otherwise. Next up is the locked automatic badge with the most done of its total, then by name.
- **Quiz history and average.** One row per visible quiz she has submitted: her best scored attempt and its pass, or Waiting while every submitted attempt awaits approval. The average is the rounded mean of the best scores, so a retake replaces rather than drags down an earlier try.
- **Attendance.** Shown only while Roll Call is on (the answer's `attendance` is null otherwise, and the page renders no tab and no number): her child's attendance records marked Present, Signed out (attended) or Absent, newest first. Not-yet records are left out.

## Consequences

- The journey, badges and progress cost a few queries per open; with a youth's handful of tracks this stays within the API's budget (L2-034). A projection or cache can come later without changing the contract.
- Cohort session attendance (prompt 71) can feed the Attendance tab and an attendance-streak rule without changing these endpoints' shape.
