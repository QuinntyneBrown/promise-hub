/** Work waiting for the caller, with how many. */
export interface TodayTask {
  kind: 'incidents' | 'enrollments' | 'pickups';
  count: number;
}
