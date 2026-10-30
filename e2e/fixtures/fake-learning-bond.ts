import { learningBondAcceptances } from './seed';

/** A Learning Bond guardian link as texted with an invitation: the household and its organization. */
export interface FakeLearningBondLink {
  householdId: string;
  organizationId: string;
  /** The household's language code, as the API answers it. */
  language: 'en' | 'es' | 'fr';
}

/**
 * Mirrors the Learning Bond foundation of the backend (ADR 0076, prompt 82): the guardian links the fake hands out and which organizations
 * accepted the current data-handling agreement. The module gate itself is the fake API's per-organization module state.
 */
export class FakeLearningBond {
  /** Organizations that accepted the current agreement version; copied so tests never share changes. */
  readonly acceptances = new Set(learningBondAcceptances);

  /** token → link. The Rivera link is Harbourview's (module on); the Northgate link is an organization with the module off. */
  readonly links = new Map<string, FakeLearningBondLink>([
    ['tok-lb-rivera', { householdId: 'hh-rivera', organizationId: 'org-harbourview', language: 'es' }],
    ['tok-lb-northgate', { householdId: 'hh-northgate-rivera', organizationId: 'org-northgate', language: 'es' }],
  ]);
}
