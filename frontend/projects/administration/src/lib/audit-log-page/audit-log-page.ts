import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AUDIT_API, AuditFilter, AuditLog, LoadResult } from '@promisehub/api';
import {
  PhButton,
  PhCard,
  PhEmptyState,
  PhPageHeader,
  PhSelect,
  PhSkeleton,
  PhTable,
  PhTextField,
  SelectOption,
  TableColumn,
  formatDateTime,
} from '@promisehub/components';
import { debounceTime, startWith, switchMap } from 'rxjs';

/** The audit log (mock: audit-log): who viewed or changed what, when, searchable and exportable. Admins only. */
@Component({
  selector: 'ph-audit-log-page',
  imports: [
    FormsModule,
    PhButton,
    PhCard,
    PhEmptyState,
    PhPageHeader,
    PhSelect,
    PhSkeleton,
    PhTable,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './audit-log-page.html',
  styleUrl: './audit-log-page.css',
})
export class AuditLogPage {
  private readonly api = inject(AUDIT_API);

  protected readonly filter = signal<AuditFilter>({ q: '', action: '', days: 7, page: 1 });
  protected readonly result = toSignal(
    toObservable(this.filter).pipe(
      debounceTime(200),
      switchMap((f) => this.api.search(f).pipe(startWith<LoadResult<AuditLog> | null>(null))),
    ),
    { initialValue: null },
  );
  protected readonly log = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value : null;
  });
  protected readonly rows = computed(() =>
    (this.log()?.entries ?? []).map((e) => ({
      when: formatDateTime(e.when),
      who: e.who,
      action: e.action,
      record: e.record,
      summary: e.summary,
    })),
  );
  protected readonly exportUrl = computed(() => this.api.exportUrl(this.filter()));
  protected readonly columns: TableColumn[] = [
    { key: 'when', label: 'When' },
    { key: 'who', label: 'Who' },
    { key: 'action', label: 'Action' },
    { key: 'record', label: 'Record' },
    { key: 'summary', label: 'Details' },
  ];
  protected readonly actions: SelectOption[] = [
    { value: '', label: 'All actions' },
    { value: 'Viewed', label: 'Viewed' },
    { value: 'Created', label: 'Created' },
    { value: 'Updated', label: 'Updated' },
    { value: 'Deleted', label: 'Deleted' },
    { value: 'Signed', label: 'Signed' },
    { value: 'Sent', label: 'Sent' },
    { value: 'Exported', label: 'Exported' },
    { value: 'SignedIn', label: 'Signed in' },
    { value: 'AccessDenied', label: 'Access denied' },
  ];
  protected readonly periods: SelectOption[] = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '365', label: 'Last year' },
  ];

  protected set(change: Partial<AuditFilter>): void {
    this.filter.update((f) => ({ ...f, ...change, page: change.page ?? 1 }));
  }

  protected range(l: AuditLog): string {
    const from = (l.page - 1) * l.pageSize + 1;
    return `Showing ${from}–${from + l.entries.length - 1} of ${l.total.toLocaleString('en-US')}`;
  }
}
