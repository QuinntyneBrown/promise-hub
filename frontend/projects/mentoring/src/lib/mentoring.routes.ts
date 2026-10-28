import { Routes } from '@angular/router';
import { MentorDashboardPage } from './mentor-dashboard-page/mentor-dashboard-page';
import { MentorGroupPage } from './mentor-group-page/mentor-group-page';
import { MentorYouthDetailPage } from './mentor-youth-detail-page/mentor-youth-detail-page';
import { MentorYouthPage } from './mentor-youth-page/mentor-youth-page';
import { CompetenciesPage } from './competencies-page/competencies-page';
import { MentorCheckInsPage } from './mentor-check-ins-page/mentor-check-ins-page';
import { AtRiskFlagsPage } from './at-risk-flags-page/at-risk-flags-page';
import { GradePage } from './grade-page/grade-page';
import { QuizApprovalsPage } from './quiz-approvals-page/quiz-approvals-page';
import { ReviewsPage } from './reviews-page/reviews-page';
import { unsavedGradeGuard } from './unsaved-grade.guard';

export const routes: Routes = [
  { path: '', component: MentorDashboardPage, title: 'Mentoring · PromiseHub' },
  { path: 'youth', component: MentorYouthPage, title: 'My youth · PromiseHub' },
  { path: 'check-ins', component: MentorCheckInsPage, title: 'Mentor check-ins · PromiseHub' },
  { path: 'flags', component: AtRiskFlagsPage, title: 'At-risk flags · PromiseHub' },
  { path: 'youth/:childId', component: MentorYouthDetailPage, title: 'Youth record · PromiseHub' },
  {
    path: 'youth/:childId/competencies',
    component: CompetenciesPage,
    title: 'Competencies · PromiseHub',
  },
  { path: 'cohorts/:programId', component: MentorGroupPage, title: 'Cohort · PromiseHub' },
];

/** Reviews, grading and quiz approval: loaded only while Mentoring and Learning are both on (ADR 0057). */
export const reviewRoutes: Routes = [
  { path: '', component: ReviewsPage, title: 'Reviews · PromiseHub' },
  { path: 'quizzes', component: QuizApprovalsPage, title: 'Quiz approvals · PromiseHub' },
  {
    path: 'submissions/:id',
    component: GradePage,
    title: 'Grade a submission · PromiseHub',
    canDeactivate: [unsavedGradeGuard],
  },
];
