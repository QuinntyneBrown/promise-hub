import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { PhIcon } from '../icon/icon';

let nextId = 0;

/** File upload (design system: file-upload): a drop zone with a button that opens the file picker; emits the chosen file. */
@Component({
  selector: 'ph-file-upload',
  imports: [PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss',
})
export class PhFileUpload {
  readonly title = input.required<string>();
  readonly text = input<string | null>(null);
  readonly accept = input<string | null>(null);
  readonly buttonLabel = input('Choose file');
  readonly busy = input(false);
  readonly fileSelected = output<File>();

  protected readonly id = `ph-file-${nextId++}`;
  protected readonly over = signal(false);

  protected picked(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (file) this.fileSelected.emit(file);
    input.value = '';
  }

  protected dropped(event: DragEvent): void {
    event.preventDefault();
    this.over.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.fileSelected.emit(file);
  }
}
