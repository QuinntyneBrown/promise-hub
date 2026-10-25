import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhBadge } from '../badge/badge';
import { TableCell } from './table-cell';
import { TableColumn } from './table-column';

/** Table (design system: table): rows of records under labelled columns, scrolling sideways on a phone. */
@Component({
  selector: 'ph-table',
  imports: [PhBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './table.html',
  styleUrl: './table.scss',
})
export class PhTable {
  /** Read by screen readers as the table's name. */
  readonly caption = input.required<string>();
  readonly columns = input.required<TableColumn[]>();
  readonly rows = input.required<Record<string, TableCell>[]>();
  /** Inside a flush card: no border of its own. */
  readonly flush = input(false);

  protected text(cell: TableCell): string {
    return cell === null ? '' : typeof cell === 'string' ? cell : cell.text;
  }

  protected badge(cell: TableCell): Exclude<TableCell, string | null> | null {
    return cell !== null && typeof cell === 'object' ? cell : null;
  }
}
