import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** List (design system: list) on a flush card. Rows are ph-list-item. */
@Component({
  selector: 'ph-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './list.html',
  styleUrl: './list.scss',
})
export class PhList {
  readonly label = input.required<string>();
}
