import type { MentorCheckIn } from './mentor-check-in';

/** The caller's mentor check-ins, newest first, and his youth to filter by or choose from (L2-090 criterion 4). */
export interface MentorCheckInHistory {
  items: MentorCheckIn[];
  youth: { id: string; name: string }[];
}
