import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Progress bar (design system: progress-bar): how far along something is, with a visible caption and an accessible name. */
@Component({
  selector: 'ph-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss',
})
export class PhProgressBar {
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  /** The accessible name, such as "41 of 48 signed". */
  readonly label = input.required<string>();
  /** Shown beside the bar, such as "41 of 48 · 85%". */
  readonly caption = input<string | null>(null);
  readonly tone = input<'accent' | 'success'>('accent');

  protected readonly percent = computed(() =>
    this.max() ? Math.round((100 * this.value()) / this.max()) : 0,
  );
}
