import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { AssignmentDetail } from './assignment-detail';
import type { AssignmentFields } from './assignment-fields';
import type { BadgeDetail } from './badge-detail';
import type { BadgeFields } from './badge-fields';
import type { BadgeList } from './badge-list';
import type { BadgeOptions } from './badge-options';
import type { ContentStatus } from './content-status';
import type { Curriculum } from './curriculum';
import type { LessonDetail } from './lesson-detail';
import type { LessonFields } from './lesson-fields';
import type { ModuleDetail } from './module-detail';
import type { ModuleFields } from './module-fields';
import type { NewTrack } from './new-track';
import type { QuestionFields } from './question-fields';
import type { QuizDetail } from './quiz-detail';
import type { QuizSettings } from './quiz-settings';

/** Curriculum authoring for admins and program directors (Learning module, L2-066, L2-067, L2-073, L2-074, L2-084 to L2-086). */
export interface CurriculumApi {
  tracks(): Observable<LoadResult<Curriculum>>;
  createTrack(track: NewTrack): Observable<WriteOutcome>;
  reorderModules(trackId: string, moduleIds: string[]): Observable<WriteOutcome>;
  setTrackCohorts(trackId: string, programIds: string[]): Observable<WriteOutcome>;
  createModule(trackId: string, title: string, description: string): Observable<WriteOutcome>;
  module(id: string): Observable<LoadResult<ModuleDetail>>;
  updateModule(id: string, fields: ModuleFields): Observable<WriteOutcome>;
  setTrackStatus(id: string, status: ContentStatus): Observable<WriteOutcome>;
  setModuleStatus(id: string, status: ContentStatus): Observable<WriteOutcome>;
  reorderLessons(moduleId: string, lessonIds: string[]): Observable<WriteOutcome>;
  createLesson(moduleId: string, title: string): Observable<WriteOutcome>;
  lesson(id: string): Observable<LoadResult<LessonDetail>>;
  updateLesson(id: string, fields: LessonFields): Observable<WriteOutcome>;
  setLessonStatus(id: string, status: ContentStatus): Observable<WriteOutcome>;
  deleteLesson(id: string): Observable<WriteOutcome>;
  uploadVideo(lessonId: string, file: File): Observable<WriteOutcome>;
  removeVideo(lessonId: string): Observable<WriteOutcome>;
  createQuiz(moduleId: string, lessonId: string | null, title: string): Observable<WriteOutcome>;
  quiz(id: string): Observable<LoadResult<QuizDetail>>;
  addQuestion(quizId: string, fields: QuestionFields): Observable<WriteOutcome>;
  updateQuestion(id: string, fields: QuestionFields): Observable<WriteOutcome>;
  deleteQuestion(id: string): Observable<WriteOutcome>;
  updateQuiz(id: string, settings: QuizSettings): Observable<WriteOutcome>;
  reorderQuestions(quizId: string, questionIds: string[]): Observable<WriteOutcome>;
  setQuizStatus(id: string, status: ContentStatus): Observable<WriteOutcome>;
  createAssignment(
    moduleId: string,
    lessonId: string | null,
    title: string,
  ): Observable<WriteOutcome>;
  assignment(id: string): Observable<LoadResult<AssignmentDetail>>;
  updateAssignment(id: string, fields: AssignmentFields): Observable<WriteOutcome>;
  setAssignmentStatus(id: string, status: ContentStatus): Observable<WriteOutcome>;
  badges(): Observable<LoadResult<BadgeList>>;
  badgeOptions(): Observable<LoadResult<BadgeOptions>>;
  badge(id: string): Observable<LoadResult<BadgeDetail>>;
  createBadge(fields: BadgeFields): Observable<WriteOutcome>;
  updateBadge(id: string, fields: BadgeFields): Observable<WriteOutcome>;
  deleteBadge(id: string): Observable<WriteOutcome>;
}
