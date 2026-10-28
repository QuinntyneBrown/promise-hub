import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  contentChild,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PhBadge } from '../badge/badge';
import { TableCell } from './table-cell';
import { TableColumn } from './table-column';

/** Table (design system: table): rows of records under labelled columns, scrolling sideways on a phone. */
@Component({
  selector: 'ph-table',
  imports: [NgTemplateOutlet, RouterLink, PhBadge],
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
  /** Heading of the last column when the page gives a `#rowActions` template; the template gets the row's index. */
  readonly actionsLabel = input('Actions');
  protected readonly rowActions = contentChild<TemplateRef<{ $implicit: number }>>('rowActions');

  protected text(cell: TableCell): string {
    return cell === null ? '' : typeof cell === 'string' ? cell : cell.text;
  }

  protected badge(cell: TableCell): { text: string; tone: ReturnType<PhBadge['tone']> } | null {
    return cell !== null && typeof cell === 'object' && 'tone' in cell ? cell : null;
  }

  protected linked(
    cell: TableCell,
  ): { text: string; link: string | unknown[]; suffix?: string } | null {
    return cell !== null && typeof cell === 'object' && 'link' in cell ? cell : null;
  }

  protected tagged(
    cell: TableCell,
  ): { text: string; badge: { text: string; tone: ReturnType<PhBadge['tone']> } } | null {
    return cell !== null && typeof cell === 'object' && 'badge' in cell ? cell : null;
  }
}
