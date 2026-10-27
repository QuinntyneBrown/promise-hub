import { ChangeDetectionStrategy, Component, input, model, signal } from '@angular/core';
import { PhButton } from '../button/button';

let nextId = 0;

/**
 * Code playground (design system: code-playground): a labelled editor for a small page of HTML and CSS, Run, and a preview that
 * renders the code in an iframe with an empty `sandbox`, so no script runs and nothing leaves the page.
 */
@Component({
  selector: 'ph-code-playground',
  imports: [PhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './code-playground.html',
  styleUrl: './code-playground.scss',
})
export class PhCodePlayground {
  /** The editor's visible label, such as “Try it yourself”. */
  readonly label = input.required<string>();
  /** The code being edited. */
  readonly code = model('');
  /** Read only, as once a project is submitted. */
  readonly readonly = input(false);

  protected readonly id = `ph-code-${nextId++}`;
  /** What the preview shows; null until Run. */
  protected readonly preview = signal<string | null>(null);

  protected edit(event: Event): void {
    this.code.set((event.target as HTMLTextAreaElement).value);
  }

  protected run(): void {
    this.preview.set(this.code());
  }
}
