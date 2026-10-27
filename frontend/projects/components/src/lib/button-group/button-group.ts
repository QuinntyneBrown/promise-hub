import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonGroupOption } from './button-group-option';

/**
 * Button group (design system: button-group): related choices of which exactly one is pressed, such as a youth's tracks. Each
 * choice is a real button with `aria-pressed`; choosing emits `choose` with its value.
 */
@Component({
  selector: 'ph-button-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button-group.html',
  styleUrl: './button-group.scss',
})
export class PhButtonGroup {
  /** The group's accessible name, such as “Your tracks”. */
  readonly label = input.required<string>();
  readonly options = input.required<ButtonGroupOption[]>();
  /** The pressed value. */
  readonly value = input<string | null>(null);
  /** Full width; the choices share it. */
  readonly block = input(false);
  readonly choose = output<string>();
}
