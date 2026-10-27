import type { JourneyBadges } from './journey-badges';
import type { JourneyCurrent } from './journey-current';
import type { JourneyStage } from './journey-stage';
import type { JourneyTrack } from './journey-track';

/** A youth's journey (L2-087): progress counted as on Learning, her weekly streak, the module she is in, her roadmap, her stages and her badges. */
export interface Journey {
  completedLessons: number;
  totalLessons: number;
  streakWeeks: number;
  current: JourneyCurrent | null;
  tracks: JourneyTrack[];
  stages: JourneyStage[];
  badges: JourneyBadges;
}
