import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Fact } from './fact';

/** Description list (design system: description-list): terms and values in two columns. */
@Component({
  selector: 'ph-description-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './description-list.html',
  styleUrl: './description-list.scss',
})
export class PhDescriptionList {
  readonly facts = input.required<Fact[]>();
}
