import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CheckboxOption } from './checkbox-option';

let nextId = 0;

/**
 * Checkbox group (design system: checkbox, “group” variant): any number of choices from a few, in a fieldset with a legend and an
 * optional hint. The value is the list of ticked option values, in option order.
 */
@Component({
  selector: 'ph-checkbox-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkbox-group.html',
  styleUrl: './checkbox-group.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhCheckboxGroup), multi: true },
  ],
})
export class PhCheckboxGroup implements ControlValueAccessor {
  readonly legend = input.required<string>();
  readonly options = input.required<CheckboxOption[]>();
  /** A line under the legend, such as “Optional.”. */
  readonly hint = input<string | null>(null);
  /** The invalid state: the message under the boxes, announced with the group. */
  readonly error = input<string | null>(null);

  protected readonly id = `ph-checkbox-group-${nextId++}`;
  protected readonly value = signal<string[]>([]);
  protected readonly disabled = signal(false);
  private onChange: (value: string[]) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected toggle(option: string, checked: boolean): void {
    const ticked = new Set(this.value());
    if (checked) ticked.add(option);
    else ticked.delete(option);
    const next = this.options()
      .map((o) => o.value)
      .filter((v) => ticked.has(v));
    this.value.set(next);
    this.onChange(next);
  }

  protected describedBy(): string | null {
    const ids = [this.hint() ? `${this.id}-hint` : null, this.error() ? `${this.id}-error` : null];
    return ids.filter(Boolean).join(' ') || null;
  }

  writeValue(value: string[] | null): void {
    this.value.set(value ?? []);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }
}
