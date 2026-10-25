import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Textarea (design system: textarea): a labelled multi-line field. */
@Component({
  selector: 'ph-textarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './textarea.html',
  styleUrl: './textarea.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhTextarea), multi: true },
  ],
})
export class PhTextarea implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly rows = input(2);
  readonly optional = input(false);
  readonly placeholder = input<string | null>(null);
  readonly error = input<string | null>(null);

  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

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
