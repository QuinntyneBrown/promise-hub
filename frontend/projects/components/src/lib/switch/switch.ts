import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Switch (design system: switch): an on/off choice with its label beside it. */
@Component({
  selector: 'ph-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './switch.html',
  styleUrl: './switch.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhSwitch), multi: true }],
})
export class PhSwitch implements ControlValueAccessor {
  readonly label = input.required<string>();
  /** Read by screen readers only, when the row around the switch already says what it controls. */
  readonly labelHidden = input(false);

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
