import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { RealtimeEvent } from './realtime-event';
import { RealtimeEvents } from './realtime-events';

/** The event stream over the browser's EventSource: it sends the session cookie and reconnects on its own. */
@Injectable()
export class EventSourceRealtimeEvents implements RealtimeEvents {
  private readonly baseUrl = inject(API_BASE_URL);

  events(): Observable<RealtimeEvent> {
    return new Observable<RealtimeEvent>((subscriber) => {
      if (typeof EventSource === 'undefined') return undefined;
      const source = new EventSource(`${this.baseUrl}/realtime`, { withCredentials: true });
      source.onopen = () => subscriber.next({ type: 'open' });
      source.addEventListener('conversation', (e) => {
        const data = JSON.parse((e as MessageEvent<string>).data) as { youthId?: string };
        if (data.youthId) subscriber.next({ type: 'conversation', youthId: data.youthId });
      });
      source.addEventListener('announcement', () => subscriber.next({ type: 'announcement' }));
      return () => source.close();
    });
  }
}
