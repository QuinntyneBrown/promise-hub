import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  AssignWorkItem,
  AssignWorkOptions,
  AssignedWorkResult,
  LoadResult,
  MENTORING_API,
} from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhButton,
  PhCheckboxGroup,
  PhDialog,
  PhEmptyState,
  PhErrorSummary,
  PhRadioGroup,
  PhSelect,
  PhSkeleton,
  PhTextField,
  PhTextarea,
} from '@promisehub/components';
import { startWith } from 'rxjs';
import {
  KIND_OPTIONS,
  WHO_OPTIONS,
  cohortOptions,
  itemOptions,
  youthOptions,
} from '../assign-work-words';

/** The server's field names and the ids of the fields in the dialog, for the error summary's links. */
const FIELD: Record<string, string> = {
  itemId: 'assign-item',
  who: 'assign-who',
  childIds: 'assign-youth',
  programId: 'assign-cohort',
  dueOn: 'assign-due',
  message: 'assign-message',
};

/**
 * Assigns work (dialog: assign-work, L2-092 criteria 1 to 3): a lesson, quiz or assignment, chosen youth or a whole cohort, a due date and
 * an optional message. Loads what the mentor may assign, checks the required fields here and shows the server's errors by field; closes
 * with what the server saved.
 */
@Component({
  selector: 'ph-assign-work-dialog',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhCheckboxGroup,
    PhDialog,
    PhEmptyState,
    PhErrorSummary,
    PhRadioGroup,
    PhSelect,
    PhSkeleton,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './assign-work-dialog.html',
})
export class AssignWorkDialog {
  private readonly api = inject(MENTORING_API);
  protected readonly ref = inject<DialogRef<AssignedWorkResult>>(DialogRef);

  /** Null while loading. */
  protected readonly options = toSignal(
    this.api.assignOptions().pipe(startWith<LoadResult<AssignWorkOptions> | null>(null)),
    { initialValue: null },
  );
  protected readonly loaded = computed(() => {
    const r = this.options();
    return r?.status === 'loaded' ? r.value : null;
  });

  /** Loaded with nothing published to assign. */
  protected readonly nothing = computed(() => this.loaded()?.items.length === 0);

  protected readonly kinds = KIND_OPTIONS;
  protected readonly whoOptions = WHO_OPTIONS;
  protected readonly kind = signal<AssignWorkItem['kind']>('Lesson');
  protected readonly itemId = signal('');
  protected readonly who = signal('');
  protected readonly programId = signal('');
  protected readonly childIds = signal<string[]>([]);
  protected readonly dueOn = signal('');
  protected readonly message = signal('');

  protected readonly items = computed(() => itemOptions(this.loaded()?.items ?? [], this.kind()));
  protected readonly cohorts = computed(() => cohortOptions(this.loaded()?.cohorts ?? []));
  protected readonly youth = computed(() => youthOptions(this.loaded()?.youth ?? []));
  protected readonly chosenHint = computed(() =>
    this.childIds().length ? `${this.childIds().length} chosen` : null,
  );

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([key, message]) => ({ field: FIELD[key] ?? key, message })),
  );

  protected chooseKind(kind: AssignWorkItem['kind']): void {
    this.kind.set(kind);
    this.itemId.set('');
  }

  protected count(value: string): string {
    return `${value.length.toLocaleString('en-US')} / 500`;
  }

  protected save(): void {
    if (this.busy()) return;
    const missing: Record<string, string> = {};
    if (!this.itemId()) missing['itemId'] = 'Choose what to assign.';
    const cohort = this.who() === 'cohort' && this.programId();
    const chosen = this.who() === 'youth' && this.childIds().length > 0;
    if (!cohort && !chosen) missing['who'] = 'Choose who it’s for.';
    if (!this.dueOn()) missing['dueOn'] = 'Choose a due date.';
    this.errors.set(missing);
    if (Object.keys(missing).length) return;
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .assignWork({
        kind: this.kind(),
        itemId: this.itemId(),
        childIds: chosen ? this.childIds() : [],
        programId: cohort ? this.programId() : null,
        dueOn: this.dueOn(),
        message: this.message().trim() || null,
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'assigned') {
          this.ref.close(outcome.result);
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.failed.set(true);
        }
      });
  }
}
