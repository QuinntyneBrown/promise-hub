import { Injectable } from '@angular/core';
import { QueuedAttendance } from './queued-attendance';

const PREFIX = 'promisehub.offline.';

/**
 * What this device keeps for check-in without signal (L2-028): the last rosters and Quick Cards it loaded, with the time
 * they were saved, and the attendance actions waiting to send, in order. Storage can be unavailable; then nothing is kept.
 */
@Injectable({ providedIn: 'root' })
export class OfflineStore {
  save<T>(key: string, value: T): void {
    this.write(key, { value, savedAt: new Date().toISOString() });
  }

  read<T>(key: string): { value: T; savedAt: string } | null {
    return this.load<{ value: T; savedAt: string }>(key);
  }

  queue(): QueuedAttendance[] {
    return this.load<QueuedAttendance[]>('queue') ?? [];
  }

  enqueue(action: QueuedAttendance): void {
    this.write('queue', [...this.queue(), action]);
  }

  remove(clientActionId: string): void {
    this.write(
      'queue',
      this.queue().filter((a) => a.clientActionId !== clientActionId),
    );
  }

  /** Forgets everything this device keeps for offline check-in, when someone signs out (L2-048). */
  clear(): void {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // Storage is blocked: there is nothing kept to forget.
    }
  }

  private load<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private write(key: string, value: unknown): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Storage is full or blocked: the app keeps working online.
    }
  }
}
