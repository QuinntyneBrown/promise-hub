/**
 * What the event stream says (L2-107): `open` on every (re)connection, so a page fetches what it may have missed; `conversation` names a
 * youth's conversation; `announcement` names nothing. No event carries content.
 */
export type RealtimeEvent =
  { type: 'open' } | { type: 'conversation'; youthId: string } | { type: 'announcement' };
