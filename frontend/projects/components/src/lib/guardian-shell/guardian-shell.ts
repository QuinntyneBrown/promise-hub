import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhBrandMark } from '../brand-mark/brand-mark';

/**
 * Guardian shell (design system: guardian-shell): the light frame of every guardian page, with the organization's
 * name at the top, one column of content and the organization's contact in the footer (L2-027 criterion 3).
 */
@Component({
  selector: 'ph-guardian-shell',
  imports: [PhBrandMark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guardian-shell.html',
  styleUrl: './guardian-shell.scss',
})
export class PhGuardianShell {
  readonly organization = input<string | null>(null);
  readonly phone = input<string | null>(null);
  /** The footer sentence before the number, in the page's language, such as "Questions? Call Harbourview at". */
  readonly contactText = input<string | null>(null);
  readonly skipLabel = input('Skip to content');
}
