/** One line of a timeline: who, what they did, and when (already formatted). */
export interface TimelineEntry {
  key: string;
  actor: string;
  text: string;
  meta: string;
}
