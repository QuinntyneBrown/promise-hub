import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The shapes of the design system's skeleton. */
export type SkeletonShape = 'text' | 'title' | 'subtitle' | 'stat' | 'card' | 'rect';

/**
 * Skeleton (design system: skeleton): reserves the shape of content while its parent is busy. Hidden from assistive
 * technology; the busy parent carries `aria-busy` and a label.
 */
@Component({
  selector: 'ph-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.css',
  host: { 'aria-hidden': 'true', '[class]': '"skeleton--" + shape()' },
})
export class PhSkeleton {
  readonly shape = input<SkeletonShape>('text');
}
