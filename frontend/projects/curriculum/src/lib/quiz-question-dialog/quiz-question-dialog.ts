import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CURRICULUM_API, QuestionFields, QuestionType } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhCheckboxGroup,
  PhDialog,
  PhRadioGroup,
  PhSelect,
  PhTextField,
  PhTextarea,
  RadioOption,
  SelectOption,
} from '@promisehub/components';
import { questionTypeLabel } from '../question-label';
import { QuizQuestionDialogData } from './quiz-question-dialog-data';

const LETTERS = 'ABCDEF';

/**
 * Add or edit a quiz question (dialog: quiz-question, L2-073 criteria 2 and 3): the text, the type, options with the correct ones for
 * choice types, True or False, or the accepted answers of a short answer. The server checks every rule; closes true when saved.
 */
@Component({
  selector: 'ph-quiz-question-dialog',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhCheckboxGroup,
    PhDialog,
    PhRadioGroup,
    PhSelect,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quiz-question-dialog.html',
})
export class QuizQuestionDialog {
  private readonly api = inject(CURRICULUM_API);
  protected readonly data = inject<QuizQuestionDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  private readonly q = this.data.question;
  protected text = this.q?.text ?? '';
  protected readonly type = signal<QuestionType>(this.q?.type ?? 'MultipleChoice');
  protected options: string[] =
    this.q && this.q.type !== 'TrueFalse' && this.q.type !== 'ShortAnswer'
      ? [...this.q.options]
      : ['', ''];
  protected correctOne =
    this.q && this.q.type !== 'MultipleAnswer' ? `${this.q.correct[0] ?? ''}` : '';
  protected correctMany: string[] =
    this.q?.type === 'MultipleAnswer' ? this.q.correct.map((i) => `${i}`) : [];
  protected answers = this.q?.answers.join('\n') ?? '';

  protected readonly typeOptions: SelectOption[] = (
    ['MultipleChoice', 'TrueFalse', 'MultipleAnswer', 'ShortAnswer'] as QuestionType[]
  ).map((t) => ({ value: t, label: questionTypeLabel(t) }));
  protected readonly trueFalse: RadioOption[] = [
    { value: '0', label: 'True' },
    { value: '1', label: 'False' },
  ];
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected letter(i: number): string {
    return LETTERS[i]!;
  }

  /** Each option as a choice: "A · Packed the kit bags for everyone". */
  protected choices(): RadioOption[] {
    return this.options.map((o, i) => ({
      value: `${i}`,
      label: `${LETTERS[i]} · ${o.trim() || 'Option ' + LETTERS[i]}`,
    }));
  }

  protected changeType(type: QuestionType): void {
    this.type.set(type);
    this.correctOne = '';
    this.correctMany = [];
    this.errors.set({});
  }

  protected addOption(): void {
    this.options = [...this.options, ''];
  }

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    const fields = this.fields();
    const call = this.q
      ? this.api.updateQuestion(this.q.id, fields)
      : this.api.addQuestion(this.data.quizId, fields);
    call.subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.ref.close(true);
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.failed.set(true);
      }
    });
  }

  private fields(): QuestionFields {
    const type = this.type();
    const options = [...this.options];
    // Trailing blank options are dropped; a blank one between others is left for the server to refuse.
    while (options.length && !options[options.length - 1]!.trim()) options.pop();
    const correct =
      type === 'ShortAnswer'
        ? []
        : type === 'MultipleAnswer'
          ? this.correctMany.map(Number)
          : this.correctOne === ''
            ? []
            : [Number(this.correctOne)];
    return {
      text: this.text,
      type,
      options: type === 'TrueFalse' || type === 'ShortAnswer' ? [] : options,
      correct,
      answers: type === 'ShortAnswer' ? this.answers.split('\n') : [],
    };
  }
}
