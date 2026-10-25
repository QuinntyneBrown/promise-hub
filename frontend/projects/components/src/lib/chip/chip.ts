import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Chip (design system: chip): a pressed or unpressed choice in a group, such as a preset. */
@Component({
  selector: 'ph-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chip.html',
  styleUrl: './chip.scss',
})
export class PhChip {
  readonly pressed = input(false);
}
