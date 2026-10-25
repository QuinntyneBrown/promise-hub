import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Stepper (design system: stepper): where a short wizard is, as dots and "Step 2 of 3". */
@Component({
  selector: 'ph-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-testid': 'stepper' },
  templateUrl: './stepper.html',
  styleUrl: './stepper.scss',
})
export class PhStepper {
  /** 1-based. */
  readonly current = input.required<number>();
  readonly total = input.required<number>();

  protected readonly dots = computed(() => Array.from({ length: this.total() }, (_, i) => i + 1));
}
