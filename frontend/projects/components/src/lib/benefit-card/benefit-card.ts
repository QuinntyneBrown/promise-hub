import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhBadge } from '../badge/badge';
import { PhCard } from '../card/card';

/**
 * Benefit card (design system: benefit-card): a benefit's name, its state as a badge, who pays and how much, one line of why, the action
 * for that state, and the source with its rule version.
 */
@Component({
  selector: 'ph-benefit-card',
  imports: [PhBadge, PhCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-testid': 'benefit-card' },
  templateUrl: './benefit-card.html',
  styleUrl: './benefit-card.scss',
})
export class PhBenefitCard {
  readonly name = input.required<string>();
  readonly level = input.required<string>();
  readonly amount = input.required<string>();
  readonly state = input.required<string>();
  readonly tone = input<'neutral' | 'info' | 'success' | 'warning' | 'danger'>('neutral');
  readonly text = input<string | null>(null);
  readonly source = input<string | null>(null);
}
