import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhAvatar } from '../avatar/avatar';
import { TimelineEntry } from './timeline-entry';

/** Timeline (design system: timeline): a chronological history with named actors and times, as a labelled list. */
@Component({
  selector: 'ph-timeline',
  imports: [PhAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
})
export class PhTimeline {
  readonly label = input.required<string>();
  readonly entries = input.required<TimelineEntry[]>();
  readonly empty = input('Nothing yet.');
}
