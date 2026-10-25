import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let nextId = 0;

/** Recipient count (design system: recipient-count): the live number a send will reach, announced as it changes. */
@Component({
  selector: 'ph-recipient-count',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recipient-count.html',
  styleUrl: './recipient-count.scss',
})
export class PhRecipientCount {
  /** Null while the count is unavailable. */
  readonly count = input<number | null>(null);
  readonly noun = input('guardians');
  readonly detail = input<string | null>(null);
  /** Why nobody can be reached, or a cap warning, shown under the count. */
  readonly warning = input<string | null>(null);

  protected readonly id = `ph-recipient-count-${nextId++}`;
}
