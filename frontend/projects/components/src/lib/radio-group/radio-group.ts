import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RadioOption } from './radio-option';

let nextId = 0;

/** Radio group (design system: radio-group): one choice from a few, in a fieldset with a legend. */
@Component({
  selector: 'ph-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './radio-group.html',
  styleUrl: './radio-group.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhRadioGroup), multi: true },
  ],
})
export class PhRadioGroup implements ControlValueAccessor {
  readonly legend = input.required<string>();
  readonly options = input.required<RadioOption[]>();
  /** The invalid state: the message under the choices, announced with the group. */
  readonly error = input<string | null>(null);

  protected readonly name = `ph-radio-${nextId++}`;
  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected select(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }
}
