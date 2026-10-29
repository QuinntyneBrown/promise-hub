import type { PublicImpact } from './public-impact';
import type { PublicProgram } from './public-program';
import type { PublicTrack } from './public-track';

/** What the public pages show of an organization's published content (L2-133). */
export interface PublicContent {
  programs: PublicProgram[];
  tracks: PublicTrack[];
  /** True while Mentoring is on: the mentorship model shows. */
  mentorship: boolean;
  impact: PublicImpact;
}
