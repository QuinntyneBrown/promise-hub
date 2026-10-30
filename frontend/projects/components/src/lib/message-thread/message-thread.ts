import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PhButton } from '../button/button';
import { PhTextarea } from '../textarea/textarea';
import { ThreadMessage } from './thread-message';

/**
 * Message thread (design system: message-thread): a conversation's messages oldest first, theirs on the start side and the reader's own on
 * the end side, day separators, sending and failed said in words with Try again, and a composer with Send. Read only without a composer.
 */
@Component({
  selector: 'ph-message-thread',
  imports: [FormsModule, PhButton, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './message-thread.html',
  styleUrl: './message-thread.scss',
})
export class PhMessageThread {
  readonly label = input.required<string>();
  readonly messages = input<ThreadMessage[]>([]);
  /** Shows the composer. */
  readonly composer = input(true);
  /** Disables the composer, as while a safeguard blocks the conversation. */
  readonly disabled = input(false);
  readonly busy = input(false);
  /** The server's error for the message, shown under the field. */
  readonly error = input<string | null>(null);
  /** A hint under the field, such as what never to type in it. */
  readonly help = input<string | null>(null);
  /** The composer's words, in the reader's language. */
  readonly composerLabel = input('Write a message');
  readonly fieldLabel = input('Message');
  readonly sendLabel = input('Send');
  readonly notSentLabel = input('Not sent.');
  readonly tryAgainLabel = input('Try again');

  /** The words being written; the page clears them once sent and keeps them when the server refuses them. */
  readonly draft = model('');
  /** The words to send. */
  readonly send = output<string>();
  /** Try again on a failed message, by its id. */
  readonly retry = output<string>();

  protected submit(): void {
    const body = this.draft().trim();
    if (!body || this.busy() || this.disabled()) return;
    this.send.emit(body);
  }

  protected keydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.submit();
    }
  }
}
