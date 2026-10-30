import type { LearningBondAcceptance } from './learning-bond-acceptance';
import type { LearningBondCoverageMode } from './learning-bond-coverage-mode';

/** GET /learning-bond/overview: the Settings › Learning Bond hub (L2-136 criteria 4 and 9). Counts and program names only. */
export interface LearningBondOverview {
  agreementVersion: number;
  /** The organization's latest acceptance, of this version or an earlier one. */
  acceptance: LearningBondAcceptance | null;
  /** The current version while it is not yet accepted; null otherwise. */
  pendingVersion: number | null;
  /** yyyy-mm-dd, while a version is pending. */
  pendingEffectiveOn: string | null;
  coverage: LearningBondCoverageMode;
  /** The chosen programs' names; empty while every program is covered. */
  programs: string[];
  households: number;
  statusRoles: string[];
  senderName: string;
  /** Language codes the households use: en, es, fr. */
  languages: string[];
  /** Why Launch is disabled, such as "A new version of the agreement needs accepting."; null when it isn't. */
  launchBlocked: string | null;
}
