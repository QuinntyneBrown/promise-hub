import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhAvatar } from '../avatar/avatar';
import { CallContact } from './call-contact';

/** Call list (design system: call-list): contacts in the order to call, each number a tappable tel: link; the first is primary. */
@Component({
  selector: 'ph-call-list',
  imports: [PhAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './call-list.html',
  styleUrl: './call-list.scss',
})
export class PhCallList {
  readonly label = input.required<string>();
  readonly contacts = input.required<CallContact[]>();
}
