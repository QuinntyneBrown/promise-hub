import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  IMPORTS_API,
  ImportPreview,
  ImportSummary,
  ImportUpload,
  PROGRAMS_API,
  SESSION_API,
  can,
} from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhErrorPage,
  PhErrorSummary,
  PhFileUpload,
  PhPageHeader,
  PhRosterMapping,
  PhSelect,
  PhStat,
  PhStepper,
  PhSwitch,
  RosterMappingRow,
  SelectOption,
  ToastService,
} from '@promisehub/components';
import { EMPTY, catchError, map } from 'rxjs';

type Step = 'upload' | 'mapping' | 'review' | 'done';

const FIELDS: SelectOption[] = [
  { value: 'ChildName', label: 'Child name' },
  { value: 'DateOfBirth', label: 'Date of birth' },
  { value: 'School', label: 'School and grade' },
  { value: 'GuardianName', label: 'Guardian name' },
  { value: 'GuardianPhone', label: 'Guardian phone' },
  { value: 'GuardianEmail', label: 'Guardian email' },
  { value: 'Allergies', label: 'Allergies and medication' },
  { value: 'Language', label: 'Language' },
  { value: 'Notes', label: 'Notes' },
  { value: 'Cohort', label: 'Cohort' },
  { value: 'YouthEmail', label: 'Youth email' },
  { value: 'Skip', label: 'Skip' },
];

/** Import a roster (mock: import-roster): upload a spreadsheet, map its columns, review duplicates and gaps, then import (L2-010). */
@Component({
  selector: 'ph-import-roster-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhErrorPage,
    PhErrorSummary,
    PhFileUpload,
    PhPageHeader,
    PhRosterMapping,
    PhSelect,
    PhStat,
    PhStepper,
    PhSwitch,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './import-roster-page.html',
})
export class ImportRosterPage {
  private readonly api = inject(IMPORTS_API);
  private readonly toasts = inject(ToastService);
  private readonly me = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  /** Youth email is offered only while Learning is on and to an admin, who alone invites youth (L2-130). */
  protected readonly fields = computed<SelectOption[]>(() => {
    const me = this.me();
    const invites = !!me && me.modules.includes('Learning') && can(me.role, 'manageStaff');
    return FIELDS.filter((f) => f.value !== 'YouthEmail' || invites);
  });
  protected readonly programs = toSignal(
    inject(PROGRAMS_API)
      .list('active')
      .pipe(
        map((r): SelectOption[] => [
          ...(r.status === 'loaded'
            ? r.value.programs.map((p) => ({ value: p.id, label: p.name }))
            : []),
          { value: '', label: 'Don’t enroll yet, just create families' },
        ]),
      ),
    {
      initialValue: [
        { value: '', label: 'Don’t enroll yet, just create families' },
      ] as SelectOption[],
    },
  );

  protected readonly step = signal<Step>('upload');
  protected readonly upload = signal<ImportUpload | null>(null);
  protected readonly rows = signal<RosterMappingRow[]>([]);
  protected readonly preview = signal<ImportPreview | null>(null);
  protected readonly summary = signal<ImportSummary | null>(null);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly merge = signal<Set<number>>(new Set());
  protected programId = '';

  protected readonly allowed = computed(
    () => !this.me() || can(this.me()!.role, 'writeHouseholds'),
  );
  protected readonly stepNumber = computed(
    () => ({ upload: 1, mapping: 2, review: 3, done: 3 })[this.step()],
  );
  protected readonly summaryItems = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors())
      .filter(([field]) => field !== 'file')
      .map(([, message]) => ({ field: 'mapping', message })),
  );

  protected chosen(file: File): void {
    this.busy.set(true);
    this.errors.set({});
    this.api.upload(file).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'ok') {
        this.upload.set(r.value);
        this.rows.set(
          r.value.columns.map((c) => ({
            column: c.name,
            sample: c.sample,
            value: this.offered(c.field) ?? 'Skip',
            matched: !!this.offered(c.field),
          })),
        );
        this.step.set('mapping');
      } else if (r.status === 'invalid') {
        this.errors.set(r.errors);
      } else {
        this.errors.set({ file: `We couldn’t read ${file.name}. Try again.` });
      }
    });
  }

  /** The matched field when it is offered here, else none. */
  private offered(field: string | null): string | null {
    return field && this.fields().some((f) => f.value === field) ? field : null;
  }

  /** Whether the mapping uses a field, to show its counts. */
  protected mapped(field: string): boolean {
    return this.rows().some((r) => r.value === field);
  }

  protected remap(change: { column: string; value: string }): void {
    this.rows.update((rows) =>
      rows.map((r) => (r.column === change.column ? { ...r, value: change.value } : r)),
    );
  }

  protected review(): void {
    const upload = this.upload();
    if (!upload) return;
    this.busy.set(true);
    this.errors.set({});
    const mapping = Object.fromEntries(this.rows().map((r) => [r.column, r.value]));
    this.api.saveMapping(upload.id, mapping, this.programId || null).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'ok') {
        this.preview.set(r.value);
        this.merge.set(new Set());
        this.step.set('review');
      } else if (r.status === 'invalid') {
        this.errors.set(r.errors);
      } else {
        this.failed.set(true);
      }
    });
  }

  protected toggleMerge(row: number, on: boolean): void {
    this.merge.update((set) => {
      const next = new Set(set);
      if (on) next.add(row);
      else next.delete(row);
      return next;
    });
  }

  protected run(): void {
    const upload = this.upload();
    if (!upload) return;
    this.busy.set(true);
    this.failed.set(false);
    this.api.run(upload.id, [...this.merge()]).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'ok') {
        this.summary.set(r.value);
        this.step.set('done');
        this.toasts.show({
          tone: 'success',
          title: 'Roster imported',
          text: `${r.value.imported} of ${r.value.rows} rows · ${r.value.needFix} to fix`,
        });
      } else {
        this.failed.set(true);
      }
    });
  }

  protected toFix(s: ImportSummary): string {
    return `${s.needFix} row${s.needFix === 1 ? ' needs' : 's need'} a guardian phone or email`;
  }

  protected toFixRows(s: ImportSummary): string {
    const rows = s.toFix.map((r) => r.row);
    return `Row${rows.length === 1 ? '' : 's'} ${rows.join(', ')} ${rows.length === 1 ? 'has' : 'have'} no contact.`;
  }
}
