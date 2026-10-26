import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BILLING_API, Billing, LoadResult } from '@promisehub/api';
import {
  Fact,
  PhAlert,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhDialogs,
  PhEmptyState,
  PhPageHeader,
  PhProgressBar,
  PhSkeleton,
  ToastService,
  formatDate,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { ChangePlanDialog } from '../change-plan-dialog/change-plan-dialog';

/** Billing (mock: billing): the plan, usage against its limits, changing plan and the payment grace period. */
@Component({
  selector: 'ph-billing-page',
  imports: [
    PhAlert,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhPageHeader,
    PhProgressBar,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './billing-page.html',
  styleUrl: './billing-page.css',
})
export class BillingPage {
  private readonly api = inject(BILLING_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly reload$ = new Subject<void>();

  protected readonly result = toSignal(
    this.reload$.pipe(
      startWith(undefined),
      switchMap(() => this.api.load().pipe(startWith<LoadResult<Billing> | null>(null))),
    ),
    { initialValue: null },
  );
  protected readonly billing = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value : null;
  });

  protected subtitle(b: Billing): string {
    return b.monthlyPrice
      ? `${b.plan} plan · $${b.monthlyPrice}/month`
      : `${b.plan} plan · no charge`;
  }

  protected facts(b: Billing): Fact[] {
    return [
      {
        key: 'plan',
        term: 'Plan',
        value: `${b.plan} · up to ${b.childLimit.toLocaleString('en-US')} active children`,
      },
      {
        key: 'price',
        term: 'Price',
        value: b.monthlyPrice ? `$${b.monthlyPrice} a month` : 'Free',
      },
      { key: 'sms', term: 'Texts', value: `${b.smsCap.toLocaleString('en-US')} segments a month` },
    ];
  }

  protected atLimit(b: Billing): boolean {
    return b.activeChildren >= b.childLimit;
  }

  protected date(iso: string): string {
    return formatDate(iso);
  }

  protected reload(): void {
    this.reload$.next();
  }

  protected changePlan(b: Billing): void {
    this.dialogs
      .open<{ plan: string; proratedCharge: number }, Billing, ChangePlanDialog>(
        ChangePlanDialog,
        b,
      )
      .closed.subscribe((changed) => {
        if (!changed) return;
        this.toasts.show({
          tone: 'success',
          title: `You’re on ${changed.plan}`,
          text: changed.proratedCharge
            ? `$${changed.proratedCharge.toFixed(2)} is added to this month’s invoice.`
            : 'The change applies now.',
        });
        this.reload();
      });
  }
}
