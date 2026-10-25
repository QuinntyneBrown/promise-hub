import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONS, IconName } from './icon-name';

/** Decorative stroke icon (design system: icon). The text beside it names the action. */
@Component({
  selector: 'ph-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class]': '"icon icon--" + size()' },
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
})
export class PhIcon {
  readonly name = input.required<IconName>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  private readonly sanitizer = inject(DomSanitizer);
  // The paths are the static constants above, never user input.
  protected readonly paths = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name()]),
  );
}
