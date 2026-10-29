import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteLink } from '../site-nav/site-link';

/** Site footer (design system: site-footer): closes every public page with the organization's name, its pages plus Privacy, and a quiet note. */
@Component({
  selector: 'ph-site-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class PhSiteFooter {
  readonly organization = input.required<string>();
  readonly links = input.required<SiteLink[]>();
  /** A quiet line under the links, such as the city and who powers the pages. */
  readonly note = input<string | null>(null);
}
