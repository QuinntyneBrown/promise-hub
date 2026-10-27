import type { Route } from '@playwright/test';
import type { FakeAssessments, FakeQuestion, FakeQuiz } from './fake-assessments';

export type AttemptStatus = 'InProgress' | 'Scored' | 'AwaitingApproval';

export interface FakeAnswer {
  questionId: string;
  choices: number[] | null;
  text: string | null;
}

export interface FakeAttempt {
  id: string;
  membershipId: string;
  quizId: string;
  number: number;
  order: string[];
  answers: FakeAnswer[];
  position: number;
  status: AttemptStatus;
  correct: number | null;
  total: number | null;
  score: number | null;
  passed: boolean | null;
  submittedAt: string | null;
}

/** What the quiz routes need to know about the youth's module: the quiz as she stands with it, or null when not visible. */
export interface QuizPlace {
  quiz: FakeQuiz;
  moduleId: string;
  moduleTitle: string;
  lessonTitle: string | null;
  locked: boolean;
  unlockAfter: string | null;
}

const given = (a: FakeAnswer) => (a.choices?.length ?? 0) > 0 || !!a.text?.trim();

/** Whether an answer is right (ADR 0055): exactly the correct options, or a short answer matching an accepted one ignoring case and spaces. */
export function isRight(q: FakeQuestion, a: FakeAnswer | undefined): boolean {
  if (!a) return false;
  if (q.type === 'ShortAnswer') return !!a.text?.trim() && q.answers.some((x) => x.trim().toLowerCase() === a.text!.trim().toLowerCase());
  const chosen = [...new Set(a.choices ?? [])].sort();
  return chosen.length === q.correct.length && [...q.correct].sort().every((c, i) => c === chosen[i]);
}

/**
 * Quiz attempts as the API answers them (L2-075, L2-076, ADR 0055): started or resumed, autosaved, scored once on submit and locked;
 * the best scored attempt counts. FakeApi checks the Learning module, Learn, consent and placement first; the caller sees only her own
 * attempts and only quizzes visible to her.
 */
export class FakeQuizTaking {
  private nextId = 1;
  readonly attempts: FakeAttempt[] = [];

  /** Answers every answer save with 0 (network down) while true, to show the offline state. */
  offline = false;

  /** Answers every submit with 500, to show the failed state. */
  failSubmits = false;

  constructor(private readonly assessments: FakeAssessments) {}

  mine(membershipId: string, quizId: string): FakeAttempt[] {
    return this.attempts.filter((a) => a.membershipId === membershipId && a.quizId === quizId).sort((a, b) => a.number - b.number);
  }

  /** The best counted score: the highest scored (not waiting) attempt. */
  best(membershipId: string, quizId: string): FakeAttempt | null {
    return (
      this.mine(membershipId, quizId)
        .filter((a) => a.status === 'Scored')
        .sort((a, b) => b.score! - a.score! || a.number - b.number)[0] ?? null
    );
  }

  /** A quiz's state on the module page: locked, next, in-progress, passed, not-passed or awaiting. */
  state(membershipId: string, quiz: FakeQuiz, locked: boolean): string {
    const mine = this.mine(membershipId, quiz.id);
    const best = this.best(membershipId, quiz.id);
    if (locked) return 'locked';
    if (best && best.score! >= quiz.passMark) return 'passed';
    if (mine.some((a) => a.status === 'InProgress')) return 'in-progress';
    if (mine.some((a) => a.status === 'AwaitingApproval')) return 'awaiting';
    if (mine.some((a) => a.status === 'Scored')) return 'not-passed';
    return 'next';
  }

  passed(membershipId: string, quiz: FakeQuiz): boolean {
    const best = this.best(membershipId, quiz.id);
    return !!best && best.score! >= quiz.passMark;
  }

  /** An attempt already submitted, as if taken earlier: its answers scored as the API would. */
  submitted(membershipId: string, quizId: string, answers: FakeAnswer[], submittedAt = '2026-10-27T20:12:00Z'): FakeAttempt {
    const a = this.create(membershipId, quizId);
    a.answers = answers;
    this.score(a, submittedAt);
    return a;
  }

  /** An attempt in progress, as if started earlier and left at a question. */
  inProgress(membershipId: string, quizId: string, answers: FakeAnswer[], position: number): FakeAttempt {
    const a = this.create(membershipId, quizId);
    a.answers = answers;
    a.position = position;
    return a;
  }

  private create(membershipId: string, quizId: string): FakeAttempt {
    const quiz = this.assessments.quizzes.find((q) => q.id === quizId)!;
    const questions = this.assessments.questionsOf(quizId);
    const order = quiz.shuffle ? [...questions].reverse() : questions;
    const attempt: FakeAttempt = {
      id: `qa-${this.nextId++}`,
      membershipId,
      quizId,
      number: this.mine(membershipId, quizId).length + 1,
      order: order.map((q) => q.id),
      answers: [],
      position: 0,
      status: 'InProgress',
      correct: null,
      total: null,
      score: null,
      passed: null,
      submittedAt: null,
    };
    this.attempts.push(attempt);
    return attempt;
  }

  private score(a: FakeAttempt, at: string): void {
    const quiz = this.assessments.quizzes.find((q) => q.id === a.quizId)!;
    const questions = this.assessments.questionsOf(a.quizId);
    a.correct = questions.filter((q) =>
      isRight(
        q,
        a.answers.find((x) => x.questionId === q.id),
      ),
    ).length;
    a.total = questions.length;
    a.score = a.total === 0 ? 0 : Math.round((100 * a.correct) / a.total);
    a.passed = a.score >= quiz.passMark;
    a.status = quiz.requireApproval ? 'AwaitingApproval' : 'Scored';
    a.submittedAt = at;
  }

  private ordered(a: FakeAttempt): FakeQuestion[] {
    const questions = this.assessments.questionsOf(a.quizId);
    const kept = a.order.map((id) => questions.find((q) => q.id === id)).filter((q): q is FakeQuestion => !!q);
    return [...kept, ...questions.filter((q) => !a.order.includes(q.id))];
  }

  /** GET /learning/quizzes/{id}. */
  intro(route: Route, membershipId: string, place: QuizPlace | null): Promise<void> {
    if (!place) return route.fulfill({ status: 404 });
    if (place.locked)
      return route.fulfill({
        status: 403,
        json: { code: 'locked', unlockAfter: place.unlockAfter },
      });
    const q = place.quiz;
    const mine = this.mine(membershipId, q.id);
    const open = mine.find((a) => a.status === 'InProgress');
    const submitted = mine.filter((a) => a.status !== 'InProgress');
    const best = this.best(membershipId, q.id);
    return route.fulfill({
      json: {
        id: q.id,
        title: q.title,
        moduleId: place.moduleId,
        moduleTitle: place.moduleTitle,
        lessonTitle: place.lessonTitle,
        questionCount: this.assessments.questionsOf(q.id).length,
        passMark: q.passMark,
        attemptsAllowed: q.attemptsAllowed,
        feedback: q.feedback,
        attemptsUsed: submitted.length,
        attemptNumber: open?.number ?? submitted.length + 1,
        inProgress: open
          ? {
              attemptId: open.id,
              number: open.number,
              answered: open.answers.filter(given).length,
            }
          : null,
        bestScore: best?.score ?? null,
        passed: this.passed(membershipId, q),
        bestAttemptId: best?.id ?? null,
        lastAttemptId: submitted.at(-1)?.id ?? null,
        awaiting: mine.some((a) => a.status === 'AwaitingApproval'),
        canStart: !!open || q.attemptsAllowed === null || submitted.length < q.attemptsAllowed,
      },
    });
  }

  private view(a: FakeAttempt, place: QuizPlace) {
    return {
      attemptId: a.id,
      quizId: a.quizId,
      title: place.quiz.title,
      moduleId: place.moduleId,
      moduleTitle: place.moduleTitle,
      number: a.number,
      attemptsAllowed: place.quiz.attemptsAllowed,
      position: a.position,
      questions: this.ordered(a).map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
      })),
      answers: a.answers,
    };
  }

  /** POST /learning/quizzes/{id}/attempts: resumes the attempt in progress or starts the next one. */
  start(route: Route, membershipId: string, place: QuizPlace | null): Promise<void> {
    if (!place) return route.fulfill({ status: 404 });
    if (place.locked)
      return route.fulfill({
        status: 403,
        json: { code: 'locked', unlockAfter: place.unlockAfter },
      });
    const mine = this.mine(membershipId, place.quiz.id);
    let attempt = mine.find((a) => a.status === 'InProgress');
    if (!attempt) {
      if (place.quiz.attemptsAllowed !== null && mine.length >= place.quiz.attemptsAllowed)
        return route.fulfill({ status: 409, json: { code: 'no-attempts' } });
      attempt = this.create(membershipId, place.quiz.id);
    }
    return route.fulfill({ json: this.view(attempt, place) });
  }

  private validate(a: FakeAttempt, answers: FakeAnswer[]): Record<string, string> | null {
    const questions = this.assessments.questionsOf(a.quizId);
    for (const answer of answers) {
      const q = questions.find((x) => x.id === answer.questionId);
      if (!q) return { answers: 'Answer only questions of this quiz.' };
      const choices = answer.choices ?? [];
      if (choices.some((c) => c < 0 || c >= q.options.length)) return { answers: 'Choose one of the options.' };
      if ((q.type === 'MultipleChoice' || q.type === 'TrueFalse') && choices.length > 1) return { answers: 'Choose one answer.' };
      if ((answer.text?.length ?? 0) > 200) return { answers: 'Keep your answer under 200 characters.' };
    }
    return null;
  }

  private own(membershipId: string, id: string): FakeAttempt | undefined {
    return this.attempts.find((a) => a.id === id && a.membershipId === membershipId);
  }

  /** PUT /learning/attempts/{id}/answers. */
  save(route: Route, membershipId: string, id: string, visible: (quizId: string) => QuizPlace | null): Promise<void> {
    if (this.offline) return route.abort('internetdisconnected');
    const a = this.own(membershipId, id);
    if (!a || !visible(a.quizId)) return route.fulfill({ status: 404 });
    if (a.status !== 'InProgress') return route.fulfill({ status: 409, json: { code: 'submitted' } });
    const body = route.request().postDataJSON() as {
      answers?: FakeAnswer[];
      position?: number;
    };
    const errors = this.validate(a, body.answers ?? []);
    if (errors) return route.fulfill({ status: 422, json: { errors } });
    a.answers = body.answers ?? [];
    a.position = Math.max(0, Math.min(body.position ?? 0, a.order.length - 1));
    return route.fulfill({ status: 204 });
  }

  /** POST /learning/attempts/{id}/submit: saves the final answers, scores them and locks the attempt. */
  submit(route: Route, membershipId: string, id: string, visible: (quizId: string) => QuizPlace | null): Promise<void> {
    if (this.failSubmits) return route.fulfill({ status: 500 });
    const a = this.own(membershipId, id);
    if (!a || !visible(a.quizId)) return route.fulfill({ status: 404 });
    if (a.status !== 'InProgress') return route.fulfill({ status: 409, json: { code: 'submitted' } });
    const body = route.request().postDataJSON() as {
      answers?: FakeAnswer[];
      position?: number;
    };
    const errors = this.validate(a, body.answers ?? []);
    if (errors) return route.fulfill({ status: 422, json: { errors } });
    a.answers = body.answers ?? [];
    this.score(a, '2026-10-27T20:12:00Z');
    return route.fulfill({ json: { id: a.id } });
  }

  /** GET /learning/attempts/{id}: her own submitted attempt; the review only as the feedback rule allows. */
  result(route: Route, membershipId: string, id: string, visible: (quizId: string) => QuizPlace | null): Promise<void> {
    const a = this.own(membershipId, id);
    const place = a ? visible(a.quizId) : null;
    if (!a || !place || a.status === 'InProgress') return route.fulfill({ status: 404 });
    const q = place.quiz;
    const used = this.mine(membershipId, q.id).filter((x) => x.status !== 'InProgress').length;
    const left = q.attemptsAllowed === null ? null : Math.max(0, q.attemptsAllowed - used);
    const awaiting = a.status === 'AwaitingApproval';
    const showAnswers = !awaiting && (q.feedback === 'ShowAnswers' || (q.feedback === 'AfterLastAttempt' && left === 0));
    const open = this.mine(membershipId, q.id).some((x) => x.status === 'InProgress');
    return route.fulfill({
      json: {
        attemptId: a.id,
        quizId: q.id,
        title: q.title,
        moduleId: place.moduleId,
        moduleTitle: place.moduleTitle,
        number: a.number,
        attemptsAllowed: q.attemptsAllowed,
        attemptsUsed: used,
        attemptsLeft: left,
        status: awaiting ? 'awaiting-approval' : 'scored',
        submittedAt: a.submittedAt,
        score: awaiting ? null : a.score,
        correct: awaiting ? null : a.correct,
        total: awaiting ? null : a.total,
        passMark: q.passMark,
        passed: awaiting ? null : a.passed,
        bestScore: this.best(membershipId, q.id)?.score ?? null,
        canRetake: open || left === null || left > 0,
        feedback: q.feedback,
        review: showAnswers
          ? this.ordered(a).map((question, i) => {
              const answer = a.answers.find((x) => x.questionId === question.id);
              return {
                questionId: question.id,
                number: i + 1,
                text: question.text,
                type: question.type,
                options: question.options,
                chosen: answer?.choices ?? [],
                answerText: answer?.text ?? null,
                correctOptions: question.type === 'ShortAnswer' ? [] : question.correct,
                accepted: question.type === 'ShortAnswer' ? question.answers : [],
                right: isRight(question, answer),
              };
            })
          : [],
      },
    });
  }
}
