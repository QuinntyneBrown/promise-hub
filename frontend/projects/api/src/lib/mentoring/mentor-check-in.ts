import type { MentorCheckInEngagement } from './mentor-check-in-engagement';
import type { MentorCheckInKind } from './mentor-check-in-kind';

/** One mentor check-in as the mentor who wrote it reads it (L2-090); dates are yyyy-MM-dd. */
export interface MentorCheckIn {
  id: string;
  childId: string;
  youthName: string;
  date: string;
  kind: MentorCheckInKind;
  engagement: MentorCheckInEngagement;
  topics: string | null;
  actionItems: string | null;
  /** Only ever answered to its author. */
  privateNotes: string | null;
  followUpOn: string | null;
  shared: boolean;
  guardianInformed: boolean;
  createdAt: string;
}
