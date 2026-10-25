import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectOption } from './select-option';

/** Select (design system: select): a labelled native select. Options are strings or value/label pairs. */
@Component({
  selector: 'ph-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select.html',
  styleUrl: './select.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhSelect), multi: true }],
})
export class PhSelect implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input.required<(string | SelectOption)[]>();
  readonly error = input<string | null>(null);

  protected readonly items = computed(() =>
    this.options().map((o) => (typeof o === 'string' ? { value: o, label: o } : o)),
  );
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
