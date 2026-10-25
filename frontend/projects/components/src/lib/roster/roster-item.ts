import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PhAvatar } from '../avatar/avatar';
import { AvatarTint } from '../avatar/avatar-tint';

/**
 * Roster row (design system: roster): avatar, name with flags (projected with phRosterFlags),
 * a status line and actions (projected). The left stripe shows the status.
 */
@Component({
  selector: 'ph-roster-item',
  imports: [RouterLink, PhAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'listitem', '[class]': '"roster__item roster__item--" + status()' },
  templateUrl: './roster-item.html',
  styleUrl: './roster-item.scss',
})
export class PhRosterItem {
  readonly name = input.required<string>();
  readonly meta = input<string | null>(null);
  readonly status = input<'not-yet' | 'in' | 'out' | 'absent' | 'missing' | 'queued'>('not-yet');
  readonly avatarTint = input<AvatarTint>('accent');
  /** The child's Quick Card, when Quick Cards is on; the name becomes its link. */
  readonly link = input<string | unknown[] | null>(null);
}
