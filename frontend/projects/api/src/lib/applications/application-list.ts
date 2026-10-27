import type { ApplicationCounts } from './application-counts';
import type { ApplicationSummary } from './application-summary';

/** The pipeline for one status, with the count of every status. */
export interface ApplicationList {
  counts: ApplicationCounts;
  applications: ApplicationSummary[];
}
