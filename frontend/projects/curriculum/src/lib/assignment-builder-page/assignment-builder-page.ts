import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  AssignmentDetail,
  CURRICULUM_API,
  LoadResult,
  RubricCriterion,
  SubmissionType,
} from '@promisehub/api';
import {
  CheckboxOption,
  ErrorSummaryItem,
  PhAlert,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhCheckboxGroup,
  PhDescriptionList,
  PhDialogs,
  PhEmptyState,
  PhErrorSummary,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSelect,
  PhSkeleton,
  PhSwitch,
  PhTextField,
  PhTextarea,
  SelectOption,
  ToastService,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { attachOptions } from '../attach-options';
import { RubricCriterionDialog } from '../rubric-criterion-dialog/rubric-criterion-dialog';
import { RubricCriterionDialogData } from '../rubric-criterion-dialog/rubric-criterion-dialog-data';
import { statusLabel, statusTone } from '../status-label';

const SUMMARY_FIELDS: Record<string, string> = {
  lessonId: 'attach',
  dueDate: 'due',
  graceDays: 'grace',
};

const GRACE: Record<number, string> = { 0: 'None', 1: '1 day', 2: '2 days', 7: '1 week' };

/**
 * The assignment builder (mock: curriculum-assignment, L2-074): the task, the ways to submit, a rubric edited in the rubric-criterion
 * dialog and kept here until Save assignment, the due rules and the status.
 */
@Component({
  selector: 'ph-assignment-builder-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhCheckboxGroup,
    PhDescriptionList,
    PhEmptyState,
    PhErrorSummary,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSelect,
    PhSkeleton,
    PhSwitch,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './assignment-builder-page.html',
})
export class AssignmentBuilderPage {
  private readonly api = inject(CURRICULUM_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();

  /** Route parameter. */
  readonly assignmentId = input.required<string>();

  protected readonly result = toSignal<LoadResult<AssignmentDetail> | null>(
    toObservable(this.assignmentId).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            this.api.assignment(id).pipe(startWith<LoadResult<AssignmentDetail> | null>(null)),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );
  protected form = {
    title: '',
    lessonId: '',
    brief: '',
    submissionTypes: [] as string[],
    dueDate: '',
    graceDays: '0',
    allowLate: false,
    requireApproval: false,
  };
  /** The rubric as edited on the page; sent only with Save assignment. */
  protected readonly rubric = signal<RubricCriterion[]>([]);
  protected readonly total = computed(() => this.rubric().reduce((sum, c) => sum + c.points, 0));
  protected readonly wayOptions: CheckboxOption[] = [
    { value: 'Text', label: 'Text reflection' },
    { value: 'Photo', label: 'Photo' },
    { value: 'Link', label: 'Link' },
    { value: 'File', label: 'File upload' },
  ];
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([field, message]) => ({
      field: SUMMARY_FIELDS[field] ?? field,
      message,
    })),
  );
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly statusLabel = statusLabel;
  protected readonly statusTone = statusTone;

  constructor() {
    effect(() => {
      const r = this.result();
      if (r?.status !== 'loaded') return;
      const a = r.value;
      this.form = {
        title: a.title,
        lessonId: a.lessonId ?? '',
        brief: a.brief ?? '',
        submissionTypes: [...a.submissionTypes],
        dueDate: a.dueDate ?? '',
        graceDays: `${a.graceDays}`,
        allowLate: a.allowLate,
        requireApproval: a.requireApproval,
      };
      this.rubric.set(a.rubric.map((c) => ({ ...c })));
    });
  }

  protected reload(): void {
    this.refresh$.next();
  }

  protected attachOptions(a: AssignmentDetail): SelectOption[] {
    return attachOptions(a.lessons);
  }

  /** None, 1 day, 2 days or 1 week, plus the saved number of days when it is another value. */
  protected graceOptions(a: AssignmentDetail): SelectOption[] {
    const days = [...new Set([0, 1, 2, 7, a.graceDays])].sort((x, y) => x - y);
    return days.map((d) => ({ value: `${d}`, label: GRACE[d] ?? `${d} days` }));
  }

  protected addCriterion(): void {
    this.dialogs
      .open<RubricCriterion, RubricCriterionDialogData, RubricCriterionDialog>(
        RubricCriterionDialog,
        {},
      )
      .closed.subscribe((c) => c && this.rubric.update((list) => [...list, c]));
  }

  protected editCriterion(index: number): void {
    this.dialogs
      .open<RubricCriterion, RubricCriterionDialogData, RubricCriterionDialog>(
        RubricCriterionDialog,
        {
          criterion: this.rubric()[index],
          number: index + 1,
        },
      )
      .closed.subscribe(
        (c) => c && this.rubric.update((list) => list.map((x, i) => (i === index ? c : x))),
      );
  }

  protected removeCriterion(index: number): void {
    this.rubric.update((list) => list.filter((_, i) => i !== index));
  }

  protected save(a: AssignmentDetail): void {
    this.busy.set(true);
    this.failed.set(false);
    const title = this.form.title;
    this.api
      .updateAssignment(a.id, {
        title,
        lessonId: this.form.lessonId || null,
        brief: this.form.brief,
        submissionTypes: this.form.submissionTypes as SubmissionType[],
        rubric: this.rubric(),
        dueDate: this.form.dueDate || null,
        graceDays: Number(this.form.graceDays),
        allowLate: this.form.allowLate,
        requireApproval: this.form.requireApproval,
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.errors.set({});
          this.toasts.show({
            tone: 'success',
            title: 'Assignment saved',
            text: `${title.trim()} · ${this.total()} points`,
          });
          this.reload();
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.failed.set(true);
        }
      });
  }
}
