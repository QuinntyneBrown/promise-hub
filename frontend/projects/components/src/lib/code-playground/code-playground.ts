import { ChangeDetectionStrategy, Component, inject, input, model, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PhButton } from '../button/button';

let nextId = 0;

/**
 * Code playground (design system: code-playground): a labelled editor for a small page of HTML and CSS, Run, and a preview that
 * renders the code in a sandboxed iframe of its own opaque origin, under a Content-Security-Policy that blocks every script and
 * request, so nothing the youth writes runs or leaves the page.
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

  private readonly sanitizer = inject(DomSanitizer);
  protected readonly id = `ph-code-${nextId++}`;
  /** What the preview shows; null until Run. */
  protected readonly preview = signal<SafeHtml | null>(null);

  protected edit(event: Event): void {
    this.code.set((event.target as HTMLTextAreaElement).value);
  }

  /**
   * Angular's HTML sanitizer would strip the policy and the youth's styles from `srcdoc`, so the document is trusted as written:
   * it renders only inside the sandboxed frame of its own origin, where the policy blocks every script and request (ADR 0051).
   */
  protected run(): void {
    this.preview.set(
      this.sanitizer.bypassSecurityTrustHtml(PhCodePlayground.document(this.code())),
    );
  }

  /** The preview document: the youth's markup under a policy that allows inline styles and data images only. */
  static document(code: string): string {
    return (
      '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
      '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:">' +
      '<title>Preview</title></head><body>' +
      code +
      '</body></html>'
    );
  }
}
