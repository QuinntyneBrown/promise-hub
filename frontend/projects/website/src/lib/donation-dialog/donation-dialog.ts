import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WEBSITE_API } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhButton,
  PhDialog,
  PhErrorSummary,
  PhRadioGroup,
  PhTextField,
  RadioOption,
} from '@promisehub/components';

/** The server's field names and the ids of the fields in the dialog, for the error summary's links. */
const FIELD: Record<string, string> = {
  monthlyAmount: 'don-tier',
  name: 'don-name',
  email: 'don-email',
};

/** The monthly tiers (ADR 0075). */
const TIERS: RadioOption[] = [
  { value: '20', label: '$20 a month · Friend', hint: 'Lesson supplies for one child for a term.' },
  {
    value: '50',
    label: '$50 a month · Builder',
    hint: 'A season of weekly mentoring for one young person.',
  },
  {
    value: '100',
    label: '$100 a month · Champion',
    hint: 'Helps run a whole program for a neighbourhood.',
  },
];

/**
 * Give monthly (dialog: start-donation, L2-134 criterion 3). Continuing starts a checkout with the payment provider; the dialog then offers
 * Open secure payment in a new tab. Card details go to the provider only.
 */
@Component({
  selector: 'ph-donation-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhErrorSummary, PhRadioGroup, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './donation-dialog.html',
  styleUrl: './donation-dialog.css',
})
export class DonationDialog {
  private readonly api = inject(WEBSITE_API);
  private readonly slug = inject<string>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<void>>(DialogRef);
  protected readonly tiers = TIERS;

  protected amount = '';
  protected name = '';
  protected email = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly problem = signal<'failed' | 'too-many' | 'unavailable' | null>(null);
  protected readonly busy = signal(false);
  /** The provider's checkout once started, with the amount and the donor's first name. */
  protected readonly checkout = signal<{ url: string; amount: string; first: string } | null>(null);
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([key, message]) => ({ field: FIELD[key] ?? key, message })),
  );

  protected submit(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.problem.set(null);
    this.errors.set({});
    this.api
      .donate(this.slug, {
        monthlyAmount: this.amount ? Number(this.amount) : null,
        name: this.name,
        email: this.email,
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'checkout') {
          this.checkout.set({
            url: outcome.checkoutUrl,
            amount: this.amount,
            first: this.name.trim().split(/\s+/)[0] ?? '',
          });
        } else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
        else if (outcome.status === 'too-many') this.problem.set('too-many');
        else if (outcome.status === 'unavailable') this.problem.set('unavailable');
        else this.problem.set('failed');
      });
  }
}
