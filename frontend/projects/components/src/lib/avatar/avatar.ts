import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AvatarTint } from './avatar-tint';

/** Avatar (design system: avatar): a person's initials on a pastel tint. Decorative; the name is given beside it,
 * so the initials are drawn by CSS and never join an accessible name (WCAG 2.5.3). */
@Component({
  selector: 'ph-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class]': '"avatar avatar--" + size() + " avatar--" + tint()',
    '[attr.data-initials]': 'initials()',
  },
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
})
export class PhAvatar {
  readonly name = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly tint = input<AvatarTint>('accent');
  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]!.toUpperCase())
      .slice(0, 2)
      .join(''),
  );
}
