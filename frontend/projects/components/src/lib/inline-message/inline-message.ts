import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Inline message (design system: inline-message): concise help beside the thing it explains, as a muted caption. The text is projected. */
@Component({
  selector: 'ph-inline-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inline-message.html',
  styleUrl: './inline-message.scss',
})
export class PhInlineMessage {}
