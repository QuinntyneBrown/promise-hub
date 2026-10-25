import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Sync status chip (design system: sync-status): what is saved on this device or waiting to send. The text is projected. */
@Component({
  selector: 'ph-sync-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', '[class.ok]': "tone() === 'ok'" },
  template: '<ng-content />',
  styleUrl: './sync-chip.scss',
})
export class PhSyncChip {
  readonly tone = input<'warning' | 'ok'>('warning');
}
