import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Organization logo (design system: org-logo): an organization's own uploaded logo in a square frame, or its initials until it has one.
 * The image is named "{name} logo"; the initials are decorative, since the organization's name is written beside them.
 */
@Component({
  selector: 'ph-org-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"org-logo org-logo--" + size()',
    '[attr.aria-hidden]': 'src() ? null : "true"',
    '[attr.data-initials]': 'src() ? null : initials()',
  },
  templateUrl: './org-logo.html',
  styleUrl: './org-logo.scss',
})
export class PhOrgLogo {
  /** The organization's name: the image's alternative text and the source of the initials. */
  readonly name = input.required<string>();
  /** Where the logo image loads from; null shows the initials. */
  readonly src = input<string | null>(null);
  readonly size = input<'md' | 'sm'>('md');
  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]!.toUpperCase())
      .slice(0, 2)
      .join(''),
  );
}
