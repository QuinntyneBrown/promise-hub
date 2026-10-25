import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SLIPS_API, Slip, UnsignedFamily } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhCard,
  PhEmptyState,
  PhPageHeader,
  PhRadioGroup,
  PhTextField,
  RadioOption,
  ToastService,
  formatWhen,
} from '@promisehub/components';

/**
 * Sign on this tablet (mock: sign-on-tablet): a guardian at the door types their name on the staff device for their
 * family's unsigned children, who are cleared at once (L2-016 criterion 3).
 */
@Component({
  selector: 'ph-sign-on-tablet-page',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhCard,
    PhEmptyState,
    PhPageHeader,
    PhRadioGroup,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sign-on-tablet-page.html',
})
export class SignOnTabletPage {
  private readonly api = inject(SLIPS_API);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  /** Route parameters from /check-in/:sessionId/sign-on-tablet/:householdId. */
  readonly sessionId = input.required<string>();
  readonly householdId = input.required<string>();

  protected readonly slip = signal<Slip | null>(null);
  protected readonly family = signal<UnsignedFamily | null>(null);
  protected readonly state = signal<'loading' | 'ready' | 'gone' | 'error'>('loading');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected name = '';
  protected photos = 'yes';
  protected readonly photoOptions: RadioOption[] = [
    { value: 'yes', label: 'Okay' },
    { value: 'no', label: 'No photos' },
  ];

  protected readonly names = computed(() => {
    const children = this.family()?.children ?? [];
    return children.length > 1
      ? `${children.slice(0, -1).join(', ')} and ${children[children.length - 1]}`
      : (children[0] ?? '');
  });

  constructor() {
    effect(() => this.load(this.sessionId(), this.householdId()));
  }

  protected load(sessionId: string, householdId: string): void {
    this.state.set('loading');
    this.api.forEvent(sessionId).subscribe((slip) => {
      if (slip.status !== 'loaded')
        return this.state.set(slip.status === 'not-found' ? 'gone' : 'error');
      this.slip.set(slip.value);
      this.api.unsigned(slip.value.id).subscribe((families) => {
        const family =
          families.status === 'loaded'
            ? families.value.households.find((f) => f.householdId === householdId)
            : undefined;
        this.family.set(family ?? null);
        this.state.set(family ? 'ready' : families.status === 'loaded' ? 'gone' : 'error');
      });
    });
  }

  protected when(s: Slip): string {
    return formatWhen(s.eventStartsAt, s.eventStartsAt);
  }

  protected sign(s: Slip, f: UnsignedFamily): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api
      .signOnTablet(s.id, f.householdId, this.name, s.askPhotos ? this.photos === 'yes' : null)
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          const many = f.children.length > 1;
          this.toasts.show({
            tone: 'success',
            title: `${this.names()} ${many ? 'are' : 'is'} cleared`,
            text: 'A copy was texted to the family.',
          });
          void this.router.navigate(['/check-in', this.sessionId()]);
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.failed.set(true);
        }
      });
  }
}
