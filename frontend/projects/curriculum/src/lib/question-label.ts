import type { QuestionType, QuizQuestion } from '@promisehub/api';

const TYPE_LABELS: Record<QuestionType, string> = {
  MultipleChoice: 'Multiple choice',
  TrueFalse: 'True / false',
  MultipleAnswer: 'Multiple answer',
  ShortAnswer: 'Short answer',
};

/** "Multiple choice", "True / false", "Multiple answer" or "Short answer". */
export function questionTypeLabel(type: QuestionType): string {
  return TYPE_LABELS[type];
}

/** The question's type, option count and correct answers, as the builder lists it. */
export function questionMeta(q: QuizQuestion): string {
  const right = q.correct.map((i) => q.options[i]);
  switch (q.type) {
    case 'ShortAnswer':
      return `Short answer · Accepts: ${q.answers.join(', ')}`;
    case 'TrueFalse':
      return `True / false · Answer: ${right[0]}`;
    case 'MultipleAnswer':
      return `Multiple answer · ${q.options.length} options · Answers: ${right.join('; ')}`;
    default:
      return `Multiple choice · ${q.options.length} options · Answer: ${right[0]}`;
  }
}
