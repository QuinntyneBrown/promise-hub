import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LoadResult, REPORTS_API, Report, SurveySent } from '@promisehub/api';
import {
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhErrorPage,
  PhPageHeader,
  PhProgressBar,
  PhSelect,
  PhSkeleton,
  PhStat,
  PhTable,
  SelectOption,
  TableColumn,
  ToastService,
  PhInlineMessage,
} from '@promisehub/components';
import { Subject, merge, startWith, switchMap } from 'rxjs';
import { ExportDialog, ExportDialogData } from '../export-dialog/export-dialog';
import { SendSurveyDialog } from '../send-survey-dialog/send-survey-dialog';

/** Reports (mock: reports): headline numbers, children by age, attendance by program and households by language. */
@Component({
  selector: 'ph-reports-page',
  imports: [
    PhInlineMessage,
    FormsModule,
    PhButton,
    PhCard,
    PhEmptyState,
    PhErrorPage,
    PhPageHeader,
    PhProgressBar,
    PhSelect,
    PhSkeleton,
    PhStat,
    PhTable,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.css',
})
export class ReportsPage {
  private readonly api = inject(REPORTS_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly retry$ = new Subject<void>();
  private programs: SelectOption[] = [];

  protected readonly program = signal('');
  protected readonly result = toSignal(
    merge(toObservable(this.program), this.retry$).pipe(
      switchMap(() =>
        this.api.report(this.program() || null).pipe(startWith<LoadResult<Report> | null>(null)),
      ),
    ),
    { initialValue: null },
  );
  protected readonly report = computed(() => {
    const r = this.result();
    if (r?.status !== 'loaded') return null;
    if (!this.program()) {
      this.programs = r.value.programs.map((p) => ({ value: p.id, label: p.name }));
    }
    return r.value;
  });
  protected readonly ageColumns: TableColumn[] = [
    { key: 'band', label: 'Age' },
    { key: 'count', label: 'Children' },
  ];

  protected programOptions(): SelectOption[] {
    return [{ value: '', label: 'All programs' }, ...this.programs];
  }

  protected retry(): void {
    this.retry$.next();
  }

  protected feedback(r: Report): string {
    return r.surveyResponses ? `${r.surveyAverage} of 5` : 'No answers yet';
  }

  protected openSurvey(): void {
    this.dialogs
      .open<SurveySent, void, SendSurveyDialog>(SendSurveyDialog)
      .closed.subscribe((sent) => {
        if (!sent) return;
        this.toasts.show({
          tone: 'success',
          title: `Survey sent to ${sent.households} households`,
          text: 'It closes in a week.',
        });
      });
  }

  protected openExport(): void {
    this.dialogs.open<void, ExportDialogData, ExportDialog>(ExportDialog, {
      programId: this.program() || null,
    });
  }
}
