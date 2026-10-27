import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Checkbox (design system: checkbox): a yes or no choice, such as selecting a row; the label can be for screen readers only. */
@Component({
  selector: 'ph-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhCheckbox), multi: true },
  ],
})
export class PhCheckbox implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly labelHidden = input(false);
  /** Shown under the box and announced with it, when the box must be ticked to continue. */
  readonly error = input<string | null>(null);
  /** Ties the error to the box; required with an error. */
  readonly inputId = input<string | null>(null);

  protected readonly checked = signal(false);
  protected readonly disabled = signal(false);
  private onChange: (value: boolean) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected toggle(checked: boolean): void {
    this.checked.set(checked);
    this.onChange(checked);
  }

  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }
}
