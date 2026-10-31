import { signal } from '@angular/core';
import { LearningBondAgentStep, LearningBondApi } from '@promisehub/api';
import { PhDialogs } from '@promisehub/components';
import { GuardianLearningBondText } from './guardian-learning-bond-text';
import { LearningBondAgentData } from './learning-bond-agent-data';
import { LearningBondAgentDialog } from './learning-bond-agent-dialog';

/**
 * The glue behind a page's agent bubble (L2-160): the page shows its approved fixed line; when the model answers within the server's
 * timeout, its words replace the line. Ask opens the conversation.
 */
export class LearningBondAgentBubble {
  /** The model's words for the step, or null while the fixed line stands. */
  readonly reply = signal<string | null>(null);

  constructor(
    private readonly api: LearningBondApi,
    private readonly dialogs: PhDialogs,
    private readonly step: LearningBondAgentStep,
  ) {}

  load(token: string): void {
    this.reply.set(null);
    this.api.askAgent(token, this.step).subscribe((r) => this.reply.set(r?.reply ?? null));
  }

  open(token: string, text: GuardianLearningBondText): void {
    this.dialogs.open<void, LearningBondAgentData, LearningBondAgentDialog>(
      LearningBondAgentDialog,
      {
        token,
        step: this.step,
        text,
      },
    );
  }
}
