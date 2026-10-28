import { Injectable, inject } from '@angular/core';
import { Observable, share } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { RealtimeEvent } from './realtime-event';
import { RealtimeEvents } from './realtime-events';

/**
 * The event stream over the browser's EventSource: it sends the session cookie and reconnects on its own. One connection per tab is shared
 * by every subscriber (the bell, the notification center, a page) and closed when the last one leaves (ADR 0069).
 */
@Injectable()
export class EventSourceRealtimeEvents implements RealtimeEvents {
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly stream = new Observable<RealtimeEvent>((subscriber) => {
    if (typeof EventSource === 'undefined') return undefined;
    const source = new EventSource(`${this.baseUrl}/realtime`, { withCredentials: true });
    source.onopen = () => subscriber.next({ type: 'open' });
    source.addEventListener('conversation', (e) => {
      const data = JSON.parse((e as MessageEvent<string>).data) as { youthId?: string };
      if (data.youthId) subscriber.next({ type: 'conversation', youthId: data.youthId });
    });
    source.addEventListener('announcement', () => subscriber.next({ type: 'announcement' }));
    source.addEventListener('notification', () => subscriber.next({ type: 'notification' }));
    return () => source.close();
  }).pipe(share());

  events(): Observable<RealtimeEvent> {
    return this.stream;
  }
}
