import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Page header (design system: container-grid-stack, page header): the h1, a subtitle and actions (projected). */
@Component({
  selector: 'ph-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
})
export class PhPageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
