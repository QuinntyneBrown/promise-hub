import { Injectable, signal } from '@angular/core';
import { ToastMessage } from './toast-message';

/** Shows short confirmations in the toast region; each leaves after six seconds or when dismissed. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private next = 1;
  readonly messages = signal<ToastMessage[]>([]);

  show(message: Omit<ToastMessage, 'id'>): void {
    const id = this.next++;
    this.messages.update((list) => [...list, { ...message, id }]);
    setTimeout(() => this.dismiss(id), 6000);
  }

  dismiss(id: number): void {
    this.messages.update((list) => list.filter((m) => m.id !== id));
  }
}
