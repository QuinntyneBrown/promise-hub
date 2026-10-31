import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhIcon } from '../icon/icon';

/** Step marker (design system: step-marker): a step's number in a circle, or a check once it is done. Decorative; the step's words carry it. */
@Component({
  selector: 'ph-step-marker',
  imports: [PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class.done]': 'done()' },
  templateUrl: './step-marker.html',
  styleUrl: './step-marker.scss',
})
export class PhStepMarker {
  readonly step = input.required<number>();
  readonly done = input(false);
}
