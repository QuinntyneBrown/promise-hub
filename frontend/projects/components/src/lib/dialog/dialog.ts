import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { PhIcon } from '../icon/icon';
import { IconName } from '../icon/icon-name';

let nextId = 0;

/**
 * Dialog (design system: dialog): the panel inside a CDK Dialog. Title, description, an optional
 * icon, the body (projected) and a footer (projected with phDialogFooter). Open it with PhDialogs.
 */
@Component({
  selector: 'ph-dialog',
  imports: [PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
})
export class PhDialog {
  protected readonly ref = inject(DialogRef, { optional: true });
  protected readonly id = `ph-dialog-${nextId++}`;

  constructor() {
    // Name the CDK dialog by this title, as Angular Material's dialog title does.
    const container = this.ref?.containerInstance as unknown as
      { _addAriaLabelledBy?: (id: string) => void } | undefined;
    container?._addAriaLabelledBy?.(`${this.id}-title`);
  }

  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly icon = input<IconName | null>(null);
  readonly tone = input<'default' | 'danger'>('default');
}
