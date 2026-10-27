import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { AssignmentDetail } from './assignment-detail';
import { AssignmentFields } from './assignment-fields';
import { AwardOutcome } from './award-outcome';
import { toAwardOutcome } from './to-award-outcome';
import { BadgeDetail } from './badge-detail';
import { BadgeFields } from './badge-fields';
import { BadgeList } from './badge-list';
import { BadgeOptions } from './badge-options';
import { CurriculumApi } from './curriculum-api';
import { ContentStatus } from './content-status';
import { Curriculum } from './curriculum';
import { LessonDetail } from './lesson-detail';
import { LessonFields } from './lesson-fields';
import { ModuleDetail } from './module-detail';
import { ModuleFields } from './module-fields';
import { Progression } from './progression';
import { StageFields } from './stage-fields';
import { NewTrack } from './new-track';
import { QuestionFields } from './question-fields';
import { QuizDetail } from './quiz-detail';
import { QuizSettings } from './quiz-settings';

@Injectable()
export class HttpCurriculumApi implements CurriculumApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  tracks(): Observable<LoadResult<Curriculum>> {
    return toLoad(this.http.get<Curriculum>(`${this.baseUrl}/curriculum`));
  }

  createTrack(track: NewTrack): Observable<WriteOutcome> {
    return toWrite(this.http.post<{ id: string }>(`${this.baseUrl}/curriculum/tracks`, track));
  }

  reorderModules(trackId: string, moduleIds: string[]): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/curriculum/tracks/${trackId}/module-order`, {
        moduleIds,
      }),
    );
  }

  createModule(trackId: string, title: string, description: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/curriculum/modules`, {
        trackId,
        title,
        description,
      }),
    );
  }

  module(id: string): Observable<LoadResult<ModuleDetail>> {
    return toLoad(this.http.get<ModuleDetail>(`${this.baseUrl}/curriculum/modules/${id}`));
  }

  updateModule(id: string, fields: ModuleFields): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/curriculum/modules/${id}`, fields));
  }

  setTrackStatus(id: string, status: ContentStatus): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/curriculum/tracks/${id}/status`, { status }),
    );
  }

  setModuleStatus(id: string, status: ContentStatus): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/curriculum/modules/${id}/status`, { status }),
    );
  }

  reorderLessons(moduleId: string, lessonIds: string[]): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/curriculum/modules/${moduleId}/lesson-order`, {
        lessonIds,
      }),
    );
  }

  createLesson(moduleId: string, title: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/curriculum/lessons`, { moduleId, title }),
    );
  }

  lesson(id: string): Observable<LoadResult<LessonDetail>> {
    return toLoad(this.http.get<LessonDetail>(`${this.baseUrl}/curriculum/lessons/${id}`));
  }

  updateLesson(id: string, fields: LessonFields): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/curriculum/lessons/${id}`, fields));
  }

  setLessonStatus(id: string, status: ContentStatus): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/curriculum/lessons/${id}/status`, { status }),
    );
  }

  deleteLesson(id: string): Observable<WriteOutcome> {
    return toWrite(this.http.delete<null>(`${this.baseUrl}/curriculum/lessons/${id}`));
  }

  uploadVideo(lessonId: string, file: File): Observable<WriteOutcome> {
    const form = new FormData();
    form.append('file', file, file.name);
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/curriculum/lessons/${lessonId}/video`, form),
    );
  }

  removeVideo(lessonId: string): Observable<WriteOutcome> {
    return toWrite(this.http.delete<null>(`${this.baseUrl}/curriculum/lessons/${lessonId}/video`));
  }

  setTrackCohorts(trackId: string, programIds: string[]): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/curriculum/tracks/${trackId}/cohorts`, { programIds }),
    );
  }

  createQuiz(moduleId: string, lessonId: string | null, title: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/curriculum/quizzes`, {
        moduleId,
        lessonId,
        title,
      }),
    );
  }

  quiz(id: string): Observable<LoadResult<QuizDetail>> {
    return toLoad(this.http.get<QuizDetail>(`${this.baseUrl}/curriculum/quizzes/${id}`));
  }

  addQuestion(quizId: string, fields: QuestionFields): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(
        `${this.baseUrl}/curriculum/quizzes/${quizId}/questions`,
        fields,
      ),
    );
  }

  updateQuestion(id: string, fields: QuestionFields): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/curriculum/quiz-questions/${id}`, fields));
  }

  deleteQuestion(id: string): Observable<WriteOutcome> {
    return toWrite(this.http.delete<null>(`${this.baseUrl}/curriculum/quiz-questions/${id}`));
  }

  updateQuiz(id: string, settings: QuizSettings): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/curriculum/quizzes/${id}`, settings));
  }

  reorderQuestions(quizId: string, questionIds: string[]): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/curriculum/quizzes/${quizId}/question-order`, {
        questionIds,
      }),
    );
  }

  setQuizStatus(id: string, status: ContentStatus): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/curriculum/quizzes/${id}/status`, { status }),
    );
  }

  createAssignment(
    moduleId: string,
    lessonId: string | null,
    title: string,
  ): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/curriculum/assignments`, {
        moduleId,
        lessonId,
        title,
      }),
    );
  }

  assignment(id: string): Observable<LoadResult<AssignmentDetail>> {
    return toLoad(this.http.get<AssignmentDetail>(`${this.baseUrl}/curriculum/assignments/${id}`));
  }

  updateAssignment(id: string, fields: AssignmentFields): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/curriculum/assignments/${id}`, fields));
  }

  setAssignmentStatus(id: string, status: ContentStatus): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/curriculum/assignments/${id}/status`, { status }),
    );
  }

  badges(): Observable<LoadResult<BadgeList>> {
    return toLoad(this.http.get<BadgeList>(`${this.baseUrl}/curriculum/badges`));
  }

  badgeOptions(): Observable<LoadResult<BadgeOptions>> {
    return toLoad(this.http.get<BadgeOptions>(`${this.baseUrl}/curriculum/badges/options`));
  }

  badge(id: string): Observable<LoadResult<BadgeDetail>> {
    return toLoad(this.http.get<BadgeDetail>(`${this.baseUrl}/curriculum/badges/${id}`));
  }

  createBadge(fields: BadgeFields): Observable<WriteOutcome> {
    return toWrite(this.http.post<{ id: string }>(`${this.baseUrl}/curriculum/badges`, fields));
  }

  updateBadge(id: string, fields: BadgeFields): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/curriculum/badges/${id}`, fields));
  }

  deleteBadge(id: string): Observable<WriteOutcome> {
    return toWrite(this.http.delete<null>(`${this.baseUrl}/curriculum/badges/${id}`));
  }

  awardBadge(id: string, membershipId: string | null): Observable<AwardOutcome> {
    return toAwardOutcome(
      this.http.post<{ id: string }>(`${this.baseUrl}/curriculum/badges/${id}/awards`, {
        membershipId,
      }),
    );
  }

  progression(): Observable<LoadResult<Progression>> {
    return toLoad(this.http.get<Progression>(`${this.baseUrl}/curriculum/progression`));
  }

  addStage(fields: StageFields): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/curriculum/progression/stages`, fields),
    );
  }

  updateStage(id: string, fields: StageFields): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/curriculum/progression/stages/${id}`, fields),
    );
  }

  reorderStages(stageIds: string[]): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/curriculum/progression/stage-order`, { stageIds }),
    );
  }

  addCompetency(stageId: string, fields: StageFields): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(
        `${this.baseUrl}/curriculum/progression/stages/${stageId}/competencies`,
        fields,
      ),
    );
  }

  removeCompetency(id: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.delete<null>(`${this.baseUrl}/curriculum/progression/competencies/${id}`),
    );
  }
}
