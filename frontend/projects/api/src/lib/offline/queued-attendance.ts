/** A check-in or absence made without signal, waiting to send; replays are safe because the server keys them by clientActionId. */
export interface QueuedAttendance {
  clientActionId: string;
  sessionId: string;
  childId: string;
  childName: string;
  kind: 'check-in' | 'absent';
  /** When it happened on the device; sent as the arrival time for a check-in. */
  at: string;
}
