import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PhIcon } from '../icon/icon';

/**
 * Text field (design system: text-field, form-field): a label, an input and an error.
 * A password field gets a Show password toggle. The error is linked by aria-describedby.
 */
@Component({
  selector: 'ph-text-field',
  imports: [PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhTextField), multi: true },
  ],
})
export class PhTextField implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input<
    | 'text'
    | 'email'
    | 'password'
    | 'search'
    | 'tel'
    | 'url'
    | 'date'
    | 'datetime-local'
    | 'number'
    | 'time'
  >('text');
  readonly optional = input(false);
  readonly labelHidden = input(false);
  readonly placeholder = input<string | null>(null);
  readonly help = input<string | null>(null);
  readonly autocomplete = input<string | null>(null);
  readonly inputmode = input<string | null>(null);
  readonly maxlength = input<number | null>(null);
  readonly error = input<string | null>(null);

  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  protected readonly revealed = signal(false);
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected describedBy(): string | null {
    const ids = [
      this.help() ? `${this.inputId()}-help` : null,
      this.error() ? `${this.inputId()}-error` : null,
    ].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  }

  protected inputType(): string {
    return this.type() === 'password' && this.revealed() ? 'text' : this.type();
  }

  protected update(value: string): void {
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
