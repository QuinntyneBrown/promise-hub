import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Roster (design system: roster): a session's children, each row striped by status. Rows are ph-roster-item. */
@Component({
  selector: 'ph-roster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './roster.html',
  styleUrl: './roster.scss',
})
export class PhRoster {
  readonly label = input.required<string>();
}
