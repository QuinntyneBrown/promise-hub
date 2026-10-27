import type { Route } from '@playwright/test';
import type { ContentStatus, FakeLesson, FakeModule, FakeTrack } from './fake-curriculum';

export type QuestionType = 'MultipleChoice' | 'TrueFalse' | 'MultipleAnswer' | 'ShortAnswer';
export type FeedbackMode = 'ShowAnswers' | 'ScoreOnly' | 'AfterLastAttempt';

export interface FakeQuiz {
  id: string;
  organizationId: string;
  moduleId: string;
  lessonId: string | null;
  title: string;
  passMark: number;
  attemptsAllowed: number | null;
  feedback: FeedbackMode;
  shuffle: boolean;
  requiredToComplete: boolean;
  status: ContentStatus;
}

export type SubmissionType = 'Text' | 'Photo' | 'Link' | 'File';

export interface FakeAssignment {
  id: string;
  organizationId: string;
  moduleId: string;
  lessonId: string | null;
  title: string;
  brief: string | null;
  submissionTypes: SubmissionType[];
  rubric: { description: string; points: number }[];
  dueDate: string | null;
  graceDays: number;
  allowLate: boolean;
  requireApproval: boolean;
  status: ContentStatus;
}

export interface FakeQuestion {
  id: string;
  quizId: string;
  position: number;
  text: string;
  type: QuestionType;
  options: string[];
  correct: number[];
  answers: string[];
}

/** What FakeAssessments reads from the curriculum: modules, lessons and who follows a track, for the caller's organization only. */
export interface CurriculumSource {
  moduleOf(org: string, id: string): FakeModule | undefined;
  trackOf(id: string): FakeTrack;
  lessonsOf(moduleId: string): FakeLesson[];
  followingNames(org: string, trackId: string): string[];
}

const TYPES: QuestionType[] = ['MultipleChoice', 'TrueFalse', 'MultipleAnswer', 'ShortAnswer'];
const clean = (v: string | null | undefined): string | null => (v && v.trim() ? v.trim() : null);
const unprocessable = (route: Route, errors: Record<string, string>) => route.fulfill({ status: 422, json: { errors } });

/**
 * Quizzes and assignments as the API answers them (L2-073, L2-074, ADR 0054). Every call reaches it only after FakeApi checked the
 * Learning module and AuthorCurriculum, and it sees only the caller's organization.
 */
export class FakeAssessments {
  private nextId = 1;

  constructor(private readonly curriculum: CurriculumSource) {}

  quizzes: FakeQuiz[] = [
    {
      id: 'qz-serving',
      organizationId: 'org-harbourview',
      moduleId: 'cm-serving',
      lessonId: null,
      title: 'Leading by Serving quiz',
      passMark: 70,
      attemptsAllowed: 2,
      feedback: 'ShowAnswers',
      shuffle: false,
      requiredToComplete: false,
      status: 'Draft',
    },
  ];

  questions: FakeQuestion[] = [];

  assignments: FakeAssignment[] = [
    {
      id: 'as-serve',
      organizationId: 'org-harbourview',
      moduleId: 'cm-serving',
      lessonId: 'l-towel',
      title: 'Serve someone this week',
      brief: null,
      submissionTypes: ['Text'],
      rubric: [],
      dueDate: null,
      graceDays: 0,
      allowLate: false,
      requireApproval: false,
      status: 'Draft',
    },
  ];

  /** Gives a quiz two questions: a multiple choice and a true or false. */
  seedQuestions(quizId: string): void {
    this.questions.push(
      {
        id: `qq-${this.nextId++}`,
        quizId,
        position: 1,
        text: 'In Pick Up the Towel, what did the captain do before the big game?',
        type: 'MultipleChoice',
        options: ['Packed the kit bags for everyone', 'Went home early', 'Asked the coach for help', 'Chose the starting team'],
        correct: [0],
        answers: [],
      },
      { id: `qq-${this.nextId++}`, quizId, position: 2, text: 'Leading is a title someone gives you.', type: 'TrueFalse', options: ['True', 'False'], correct: [1], answers: [] },
    );
  }

  private quiz(org: string, id: string): FakeQuiz | undefined {
    return this.quizzes.find((q) => q.id === id && q.organizationId === org);
  }

  private questionsOf(quizId: string): FakeQuestion[] {
    return this.questions.filter((q) => q.quizId === quizId).sort((a, b) => a.position - b.position);
  }

  private lessonError(moduleId: string, lessonId: string | null | undefined): string | null {
    return lessonId && !this.curriculum.lessonsOf(moduleId).some((l) => l.id === lessonId) ? 'Choose a lesson of this module.' : null;
  }

  private lessonTitle(q: { moduleId: string; lessonId: string | null }): string | null {
    return this.curriculum.lessonsOf(q.moduleId).find((l) => l.id === q.lessonId)?.title ?? null;
  }

  /** The module editor's Quizzes and assignments card. */
  summaries(moduleId: string): { quizzes: unknown[]; assignments: unknown[] } {
    return {
      assignments: this.assignments
        .filter((a) => a.moduleId === moduleId)
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((a) => ({ id: a.id, title: a.title, lessonTitle: this.lessonTitle(a), status: a.status, totalPoints: a.rubric.reduce((n, c) => n + c.points, 0) })),
      quizzes: this.quizzes
        .filter((q) => q.moduleId === moduleId)
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((q) => ({ id: q.id, title: q.title, lessonTitle: this.lessonTitle(q), status: q.status, questionCount: this.questionsOf(q.id).length })),
    };
  }

  /** POST /curriculum/quizzes. */
  createQuiz(route: Route, org: string): Promise<void> {
    const b = route.request().postDataJSON() as { moduleId: string; lessonId?: string | null; title?: string };
    if (!this.curriculum.moduleOf(org, b.moduleId)) return route.fulfill({ status: 404 });
    const title = clean(b.title);
    if (!title) return unprocessable(route, { title: 'Give the quiz a title.' });
    if (title.length > 120) return unprocessable(route, { title: 'Keep the title under 120 characters.' });
    const lessonError = this.lessonError(b.moduleId, b.lessonId);
    if (lessonError) return unprocessable(route, { lessonId: lessonError });
    const id = `qz-${this.nextId++}`;
    this.quizzes.push({
      id,
      organizationId: org,
      moduleId: b.moduleId,
      lessonId: b.lessonId ?? null,
      title,
      passMark: 70,
      attemptsAllowed: 2,
      feedback: 'ShowAnswers',
      shuffle: false,
      requiredToComplete: false,
      status: 'Draft',
    });
    return route.fulfill({ status: 201, json: { id } });
  }

  /** GET /curriculum/quizzes/{id}. */
  getQuiz(route: Route, org: string, id: string): Promise<void> {
    const q = this.quiz(org, id);
    if (!q) return route.fulfill({ status: 404 });
    const m = this.curriculum.moduleOf(org, q.moduleId)!;
    const t = this.curriculum.trackOf(m.trackId);
    return route.fulfill({
      json: {
        id: q.id,
        moduleId: m.id,
        moduleTitle: m.title,
        trackId: t.id,
        trackName: t.name,
        title: q.title,
        lessonId: q.lessonId,
        status: q.status,
        passMark: q.passMark,
        attemptsAllowed: q.attemptsAllowed,
        feedback: q.feedback,
        shuffle: q.shuffle,
        requiredToComplete: q.requiredToComplete,
        questions: this.questionsOf(q.id).map(({ id: qid, position, text, type, options, correct, answers }) => ({ id: qid, position, text, type, options, correct, answers })),
        lessons: this.curriculum.lessonsOf(m.id).map((l) => ({ id: l.id, position: l.position, title: l.title })),
        programs: this.curriculum.followingNames(org, t.id),
      },
    });
  }

  /** The same per-type rules as QuestionRules. */
  private checkQuestion(b: { text?: string; type?: string; options?: string[]; correct?: number[]; answers?: string[] }): { errors: Record<string, string>; q: Omit<FakeQuestion, 'id' | 'quizId' | 'position'> | null } {
    const errors: Record<string, string> = {};
    const text = clean(b.text);
    if (!text) errors['text'] = 'Write the question.';
    else if (text.length > 500) errors['text'] = 'Keep the question under 500 characters.';
    if (!TYPES.includes(b.type as QuestionType)) return { errors: { ...errors, type: 'Choose a question type.' }, q: null };
    const type = b.type as QuestionType;
    const options = type === 'TrueFalse' ? ['True', 'False'] : (b.options ?? []).map((o) => o.trim());
    const correct = [...new Set(b.correct ?? [])].sort((x, y) => x - y);
    const answers = [...new Map((b.answers ?? []).map((a) => a.trim()).filter(Boolean).map((a) => [a.toLowerCase(), a])).values()];
    if (type === 'ShortAnswer') {
      if (!answers.length) errors['answers'] = 'Add at least one accepted answer.';
    } else {
      if (options.length < 2 || options.length > 6 || options.some((o) => !o || o.length > 200)) errors['options'] = 'Give 2 to 6 options.';
      const inRange = correct.every((i) => i >= 0 && i < options.length);
      if (type === 'MultipleAnswer') {
        if (!correct.length || !inRange) errors['correct'] = 'Mark at least one correct answer.';
      } else if (correct.length !== 1 || !inRange) errors['correct'] = 'Mark the correct answer.';
    }
    if (Object.keys(errors).length) return { errors, q: null };
    return { errors, q: { text: text!, type, options: type === 'ShortAnswer' ? [] : options, correct: type === 'ShortAnswer' ? [] : correct, answers: type === 'ShortAnswer' ? answers : [] } };
  }

  /** POST /curriculum/quizzes/{id}/questions. */
  addQuestion(route: Route, org: string, quizId: string): Promise<void> {
    if (!this.quiz(org, quizId)) return route.fulfill({ status: 404 });
    const { errors, q } = this.checkQuestion(route.request().postDataJSON());
    if (!q) return unprocessable(route, errors);
    const count = this.questionsOf(quizId).length;
    if (count >= 50) return unprocessable(route, { text: 'A quiz holds up to 50 questions.' });
    const id = `qq-${this.nextId++}`;
    this.questions.push({ id, quizId, position: count + 1, ...q });
    return route.fulfill({ status: 201, json: { id } });
  }

  private question(org: string, id: string): FakeQuestion | undefined {
    const q = this.questions.find((x) => x.id === id);
    return q && this.quiz(org, q.quizId) ? q : undefined;
  }

  /** PUT /curriculum/quiz-questions/{id}. */
  updateQuestion(route: Route, org: string, id: string): Promise<void> {
    const existing = this.question(org, id);
    if (!existing) return route.fulfill({ status: 404 });
    const { errors, q } = this.checkQuestion(route.request().postDataJSON());
    if (!q) return unprocessable(route, errors);
    Object.assign(existing, q);
    return route.fulfill({ status: 204 });
  }

  /** DELETE /curriculum/quiz-questions/{id}: the later questions move up. */
  deleteQuestion(route: Route, org: string, id: string): Promise<void> {
    const q = this.question(org, id);
    if (!q) return route.fulfill({ status: 404 });
    this.questions = this.questions.filter((x) => x.id !== id);
    this.questionsOf(q.quizId).forEach((x, i) => (x.position = i + 1));
    return route.fulfill({ status: 204 });
  }

  /** PUT /curriculum/quizzes/{id}: the rules, checked as QuizCommands checks them. */
  updateQuiz(route: Route, org: string, id: string): Promise<void> {
    const q = this.quiz(org, id);
    if (!q) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as {
      title?: string;
      lessonId?: string | null;
      passMark?: number;
      attemptsAllowed?: number | null;
      feedback?: string;
      shuffle?: boolean;
      requiredToComplete?: boolean;
    };
    const errors: Record<string, string> = {};
    const title = clean(b.title);
    if (!title) errors['title'] = 'Give the quiz a title.';
    else if (title.length > 120) errors['title'] = 'Keep the title under 120 characters.';
    const passMark = b.passMark ?? 0;
    if (passMark < 1 || passMark > 100) errors['passMark'] = 'Choose a pass mark from 1 to 100%.';
    const attempts = b.attemptsAllowed ?? null;
    if (attempts !== null && (attempts < 1 || attempts > 10)) errors['attemptsAllowed'] = 'Choose 1 to 10 attempts, or unlimited.';
    if (!['ShowAnswers', 'ScoreOnly', 'AfterLastAttempt'].includes(b.feedback ?? '')) errors['feedback'] = 'Choose when youth see the answers.';
    const lessonError = this.lessonError(q.moduleId, b.lessonId);
    if (lessonError) errors['lessonId'] = lessonError;
    if (Object.keys(errors).length) return unprocessable(route, errors);
    Object.assign(q, {
      title,
      lessonId: b.lessonId ?? null,
      passMark,
      attemptsAllowed: attempts,
      feedback: b.feedback as FeedbackMode,
      shuffle: !!b.shuffle,
      requiredToComplete: !!b.requiredToComplete,
    });
    return route.fulfill({ status: 204 });
  }

  /** PUT /curriculum/quizzes/{id}/question-order. */
  reorderQuestions(route: Route, org: string, id: string): Promise<void> {
    if (!this.quiz(org, id)) return route.fulfill({ status: 404 });
    const { questionIds } = route.request().postDataJSON() as { questionIds?: string[] };
    const questions = this.questionsOf(id);
    const ids = questions.map((q) => q.id);
    if (!questionIds || questionIds.length !== ids.length || new Set(questionIds).size !== ids.length || !questionIds.every((x) => ids.includes(x))) {
      return unprocessable(route, { questionIds: 'Send every question of the quiz once.' });
    }
    questionIds.forEach((qid, i) => (questions.find((q) => q.id === qid)!.position = i + 1));
    return route.fulfill({ status: 204 });
  }

  /** PUT /curriculum/quizzes/{id}/status. */
  setQuizStatus(route: Route, org: string, id: string): Promise<void> {
    const q = this.quiz(org, id);
    if (!q) return route.fulfill({ status: 404 });
    const { status } = route.request().postDataJSON() as { status: ContentStatus };
    if (status !== 'Draft' && status !== 'Published') return unprocessable(route, { status: 'Choose Draft or Published.' });
    if (status === 'Published' && !this.questionsOf(id).length) return unprocessable(route, { status: 'Add a question before publishing the quiz.' });
    q.status = status;
    return route.fulfill({ status: 204 });
  }

  private assignment(org: string, id: string): FakeAssignment | undefined {
    return this.assignments.find((a) => a.id === id && a.organizationId === org);
  }

  /** POST /curriculum/assignments. */
  createAssignment(route: Route, org: string): Promise<void> {
    const b = route.request().postDataJSON() as { moduleId: string; lessonId?: string | null; title?: string };
    if (!this.curriculum.moduleOf(org, b.moduleId)) return route.fulfill({ status: 404 });
    const title = clean(b.title);
    if (!title) return unprocessable(route, { title: 'Give the assignment a title.' });
    if (title.length > 120) return unprocessable(route, { title: 'Keep the title under 120 characters.' });
    const lessonError = this.lessonError(b.moduleId, b.lessonId);
    if (lessonError) return unprocessable(route, { lessonId: lessonError });
    const id = `as-${this.nextId++}`;
    this.assignments.push({
      id,
      organizationId: org,
      moduleId: b.moduleId,
      lessonId: b.lessonId ?? null,
      title,
      brief: null,
      submissionTypes: ['Text'],
      rubric: [],
      dueDate: null,
      graceDays: 0,
      allowLate: false,
      requireApproval: false,
      status: 'Draft',
    });
    return route.fulfill({ status: 201, json: { id } });
  }

  /** GET /curriculum/assignments/{id}. */
  getAssignment(route: Route, org: string, id: string): Promise<void> {
    const a = this.assignment(org, id);
    if (!a) return route.fulfill({ status: 404 });
    const m = this.curriculum.moduleOf(org, a.moduleId)!;
    const t = this.curriculum.trackOf(m.trackId);
    return route.fulfill({
      json: {
        id: a.id,
        moduleId: m.id,
        moduleTitle: m.title,
        trackId: t.id,
        trackName: t.name,
        title: a.title,
        lessonId: a.lessonId,
        status: a.status,
        brief: a.brief,
        submissionTypes: a.submissionTypes,
        rubric: a.rubric,
        totalPoints: a.rubric.reduce((n, c) => n + c.points, 0),
        dueDate: a.dueDate,
        graceDays: a.graceDays,
        allowLate: a.allowLate,
        requireApproval: a.requireApproval,
        lessons: this.curriculum.lessonsOf(m.id).map((l) => ({ id: l.id, position: l.position, title: l.title })),
        programs: this.curriculum.followingNames(org, t.id),
      },
    });
  }

  /** PUT /curriculum/assignments/{id}: saved with the whole rubric, checked as AssignmentCommands checks it. */
  updateAssignment(route: Route, org: string, id: string): Promise<void> {
    const a = this.assignment(org, id);
    if (!a) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as {
      title?: string;
      lessonId?: string | null;
      brief?: string;
      submissionTypes?: string[];
      rubric?: { description?: string; points?: number }[];
      dueDate?: string | null;
      graceDays?: number;
      allowLate?: boolean;
      requireApproval?: boolean;
    };
    const errors: Record<string, string> = {};
    const title = clean(b.title);
    if (!title) errors['title'] = 'Give the assignment a title.';
    else if (title.length > 120) errors['title'] = 'Keep the title under 120 characters.';
    const brief = clean(b.brief);
    if (!brief) errors['brief'] = 'Describe the task.';
    else if (brief.length > 5000) errors['brief'] = 'Keep the task under 5,000 characters.';
    const ways: SubmissionType[] = ['Text', 'Photo', 'Link', 'File'];
    const sent = b.submissionTypes ?? [];
    if (!sent.length || !sent.every((t) => ways.includes(t as SubmissionType))) errors['submissionTypes'] = 'Choose at least one way to submit.';
    const rubric = (b.rubric ?? []).map((c) => ({ description: clean(c.description), points: c.points ?? 0 }));
    if (rubric.length > 10) errors['rubric'] = 'Keep the rubric to 10 criteria.';
    else if (rubric.some((c) => !c.description || c.description.length > 200 || c.points < 1 || c.points > 100)) errors['rubric'] = 'Give each criterion a description and 1 to 100 points.';
    const grace = b.graceDays ?? 0;
    if (grace < 0 || grace > 14) errors['graceDays'] = 'Choose a grace period of up to 14 days.';
    const lessonError = this.lessonError(a.moduleId, b.lessonId);
    if (lessonError) errors['lessonId'] = lessonError;
    if (Object.keys(errors).length) return unprocessable(route, errors);
    Object.assign(a, {
      title,
      lessonId: b.lessonId ?? null,
      brief,
      submissionTypes: ways.filter((w) => sent.includes(w)),
      rubric: rubric.map((c) => ({ description: c.description!, points: c.points })),
      dueDate: b.dueDate ?? null,
      graceDays: grace,
      allowLate: !!b.allowLate,
      requireApproval: !!b.requireApproval,
    });
    return route.fulfill({ status: 204 });
  }
}
