import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { ContentStatus } from './content-status';
import type { Curriculum } from './curriculum';
import type { LessonDetail } from './lesson-detail';
import type { LessonFields } from './lesson-fields';
import type { ModuleDetail } from './module-detail';
import type { ModuleFields } from './module-fields';
import type { NewTrack } from './new-track';
import type { QuestionFields } from './question-fields';
import type { QuizDetail } from './quiz-detail';

/** Curriculum authoring for admins and program directors (Learning module, L2-066, L2-067, L2-073, L2-074). */
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
}
