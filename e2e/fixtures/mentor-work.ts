import type { FakeApi } from './fake-api';
import type { ModuleId } from './seed';

const ALL: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const REFLECTION =
  'On Tuesday I stayed after tutoring to stack the chairs and wipe the tables so Jaylen could lock up on time. Nobody asked me. It felt small, but he noticed and said thanks.';

/** Daniel mentors Sofía and Nadia; Nadia sent Serve someone this week late, Sofía sent it on time, Nadia's quiz waits for approval. */
export function waitingWork(api: FakeApi): void {
  api.setModules('org-harbourview', ALL);
  api.curriculumState.youthJourney();
  api.curriculumState.assessments.assignmentJourney();
  api.curriculumState.assessments.quizJourney();
  api.curriculumState.assessments.quizzes.find((q) => q.id === 'qz-serving')!.requireApproval = true;
  api.assignYouthMentor('c-sofia', 'm-daniel');
  api.assignYouthMentor('c-nadia', 'm-daniel');
  api.learningState.work.seed({ membershipId: 'm-nadia', assignmentId: 'as-serve', text: 'I helped my neighbour carry her shopping.', late: true, submittedAt: '2026-11-02T23:40:00Z', history: [{ kind: 'Submitted', actor: 'Nadia Haddad', note: null, at: '2026-11-02T23:40:00Z' }] });
  api.learningState.work.seed({ membershipId: 'm-sofia', assignmentId: 'as-serve', text: REFLECTION, submittedAt: '2026-11-03T21:12:00Z' });
  api.learningState.quizzes.submitted(
    'm-nadia',
    'qz-serving',
    [
      { questionId: 'qq-captain', choices: [1], text: null },
      { questionId: 'qq-title', choices: [1], text: null },
      { questionId: 'qq-towel', choices: [0], text: null },
      { questionId: 'qq-first', choices: null, text: 'others' },
    ],
    '2026-11-04T22:02:00Z',
  );
}

