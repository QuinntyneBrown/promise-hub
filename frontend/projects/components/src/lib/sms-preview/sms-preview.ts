import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** SMS preview (design system: sms-preview): the text as a guardian's phone shows it, with characters and segments. */
@Component({
  selector: 'ph-sms-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sms-preview.html',
  styleUrl: './sms-preview.scss',
})
export class PhSmsPreview {
  readonly text = input.required<string>();
  readonly characters = input.required<number>();
  readonly segments = input.required<number>();
  /** Over the limit or the cap: the meta line turns to the danger colour. */
  readonly over = input(false);
}
