import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PhIcon } from '../icon/icon';
import { IconName } from '../icon/icon-name';

/** Alert (design system: alert): an inline message in a tone, with a title, text and optional actions (projected). */
@Component({
  selector: 'ph-alert',
  imports: [PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"alert alert--" + tone()',
    '[attr.role]': 'tone() === "danger" ? "alert" : "status"',
  },
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
})
export class PhAlert {
  readonly tone = input<'info' | 'success' | 'warning' | 'danger'>('info');
  readonly title = input.required<string>();
  readonly text = input<string | null>(null);
  protected readonly icon = computed<IconName>(() => (this.tone() === 'info' ? 'info' : 'warning'));
}
