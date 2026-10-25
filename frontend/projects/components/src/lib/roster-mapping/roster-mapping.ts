import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PhIcon } from '../icon/icon';
import { SelectOption } from '../select/select-option';
import { RosterMappingRow } from './roster-mapping-row';

/** Roster mapping (design system: roster-mapping): each spreadsheet column, a sample, and the field it becomes. */
@Component({
  selector: 'ph-roster-mapping',
  imports: [PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './roster-mapping.html',
  styleUrl: './roster-mapping.scss',
})
export class PhRosterMapping {
  readonly rows = input.required<RosterMappingRow[]>();
  readonly options = input.required<SelectOption[]>();
  readonly changed = output<{ column: string; value: string }>();

  protected id(column: string): string {
    return `map-${column.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase()}`;
  }
}
