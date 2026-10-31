import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhIcon } from '../icon/icon';

/**
 * Agent message (design system: agent-message): the Learning Bond agent's one short line for a step, in a bubble beside its face, with an
 * optional hint under it. Screen readers hear the speaker's name first. Nothing in it takes focus.
 */
@Component({
  selector: 'ph-agent-message',
  imports: [PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agent-message.html',
  styleUrl: './agent-message.scss',
})
export class PhAgentMessage {
  readonly text = input.required<string>();
  readonly hint = input<string | null>(null);
  /** Who speaks, read before the line, such as "Learning Bond". */
  readonly speaker = input('Learning Bond');
}
