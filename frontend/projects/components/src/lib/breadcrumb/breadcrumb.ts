import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbItem } from './breadcrumb-item';

/** Breadcrumb (design system: breadcrumb): the path to this page; the last item is the current page. */
@Component({
  selector: 'ph-breadcrumb',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
})
export class PhBreadcrumb {
  readonly items = input.required<BreadcrumbItem[]>();
}
