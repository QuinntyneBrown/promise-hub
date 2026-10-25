import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Brand mark (design system: brand-mark): the PromiseHub mark on the accent tile. Decorative; the link around it is named. */
@Component({
  selector: 'ph-brand-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  templateUrl: './brand-mark.html',
  styleUrl: './brand-mark.scss',
})
export class PhBrandMark {}
