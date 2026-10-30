import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Email preview (design system: email-preview): an email a guardian or a signer receives, with its title, text, one action and a quiet
 * footer naming the sender, shown inside a card on the page that sends it. A specimen: the action and footer are not controls, so nothing
 * in it takes focus.
 */
@Component({
  selector: 'ph-email-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './email-preview.html',
  styleUrl: './email-preview.scss',
})
export class PhEmailPreview {
  readonly title = input.required<string>();
  readonly text = input.required<string>();
  /** The button's label, such as "Check now". */
  readonly action = input.required<string>();
  /** The sender line, such as "Harbourview After-School via PromiseHub · Harbourview Youth Collective, Hamilton · Unsubscribe". */
  readonly footer = input.required<string>();
}
