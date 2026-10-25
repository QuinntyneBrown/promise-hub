import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Medical flag (design system: medical-flag): a short alert word such as "Allergy" on a danger tint. */
@Component({
  selector: 'ph-flag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.flag--info]': 'tone() === "info"' },
  templateUrl: './flag.html',
  styleUrl: './flag.scss',
})
export class PhFlag {
  readonly tone = input<'danger' | 'info'>('danger');
}
