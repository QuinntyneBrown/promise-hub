import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { LEARNING_BOND_API, LearningBondAgentMessage } from '@promisehub/api';
import {
  PhAgentMessage,
  PhAlert,
  PhButton,
  PhDialog,
  PhMessageThread,
  ThreadMessage,
} from '@promisehub/components';
import { LearningBondAgentData } from './learning-bond-agent-data';

/**
 * Ask the agent (learning-bond-ask, L2-160): the household's own conversation and one question at a time. The agent explains; it never
 * acts. A number typed here is refused by the server and never reaches the model.
 */
@Component({
  selector: 'ph-learning-bond-agent-dialog',
  imports: [PhAgentMessage, PhAlert, PhButton, PhDialog, PhMessageThread],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-agent-dialog.html',
})
export class LearningBondAgentDialog implements OnInit {
  private readonly api = inject(LEARNING_BOND_API);
  protected readonly data = inject<LearningBondAgentData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef>(DialogRef);

  protected readonly draft = signal('');
  protected readonly conversation = signal<LearningBondAgentMessage[]>([]);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly messages = computed<ThreadMessage[]>(() =>
    this.conversation().map((m, i) => ({
      id: String(i),
      body: m.text,
      meta: m.role === 'Guardian' ? this.data.text.you : this.data.text.speaker,
      mine: m.role === 'Guardian',
    })),
  );

  ngOnInit(): void {
    this.api
      .agentConversation(this.data.token)
      .subscribe((c) => this.conversation.set(c?.messages ?? []));
  }

  protected send(question: string): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.failed.set(false);
    this.api.askAgent(this.data.token, this.data.step, question).subscribe((reply) => {
      if (!reply) {
        this.busy.set(false);
        this.failed.set(true);
        return;
      }
      this.draft.set('');
      this.api.agentConversation(this.data.token).subscribe((c) => {
        this.busy.set(false);
        this.conversation.set(c?.messages ?? []);
      });
    });
  }
}
