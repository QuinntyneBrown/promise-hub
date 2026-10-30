import type { Route } from '@playwright/test';
import { learningBondAcceptances, learningBondAgreementVersion, type Membership } from './seed';

/** A Learning Bond guardian link as texted with an invitation: the household and its organization. */
export interface FakeLearningBondLink {
  householdId: string;
  organizationId: string;
  /** The household's language code, as the API answers it. */
  language: 'en' | 'es' | 'fr';
}

/** An organization's acceptance of one agreement version, as the API answers it. */
export interface FakeLearningBondAcceptance {
  organizationId: string;
  version: number;
  acceptedBy: string;
  acceptedAt: string;
}

/** The platform's agreement sections (backend DatabaseSeeder.SeedAgreement). */
const sections = [
  {
    title: 'What we collect',
    text: 'Learning Bond collects, with each guardian’s per-child consent, the guardian’s and each child’s social insurance number, whether the family filed last year’s tax return, and, for the child benefits check, household size, marital status and whether the family receives the Canada Child Benefit. Names, dates of birth, address, phone and email come from your roster.',
  },
  {
    title: 'Where it goes',
    text: 'Social insurance numbers, income and benefit details are sent only to the RESP provider the guardian chooses and to the Government of Canada (Employment and Social Development Canada), and to the benefit programs the guardian applies to. They are encrypted with a key your organization never holds, decrypted only to send an application the guardian submitted, and destroyed once the provider or program has received it.',
  },
  {
    title: 'What your organization sees',
    text: 'Your staff see each family’s completion status and the organization’s counts and totals. No one in your organization, including platform administrators, can read a social insurance number, income answer, marital status, benefit or dollar amount of a family. Every Learning Bond action is in your audit log without those values.',
  },
];

/**
 * Mirrors the Learning Bond backend (ADR 0076, ADR 0077): the guardian links the fake hands out, the agreement and each organization's
 * acceptances. The module gate itself is the fake API's per-organization module state; the caller checks are the fake API's.
 */
export class FakeLearningBond {
  /** The current agreement version; tests publish a new one with publishVersion. */
  version = learningBondAgreementVersion;
  effectiveOn = '2026-10-01';

  /** Every acceptance; Harbourview's is Tom's of the current version (Thu 29 Oct 2026). */
  readonly acceptances: FakeLearningBondAcceptance[] = learningBondAcceptances.map((organizationId) => ({
    organizationId,
    version: learningBondAgreementVersion,
    acceptedBy: 'Tom Nguyen',
    acceptedAt: '2026-10-29T15:00:00Z',
  }));

  /** token → link. The Rivera link is Harbourview's (module on); the Northgate link is an organization with the module off. */
  readonly links = new Map<string, FakeLearningBondLink>([
    ['tok-lb-rivera', { householdId: 'hh-rivera', organizationId: 'org-harbourview', language: 'es' }],
    ['tok-lb-northgate', { householdId: 'hh-northgate-rivera', organizationId: 'org-northgate', language: 'es' }],
  ]);

  /** Whether the organization accepted the current version (L2-135 criterion 4). */
  hasAccepted(organizationId: string): boolean {
    return this.acceptances.some((a) => a.organizationId === organizationId && a.version === this.version);
  }

  /** The platform publishes a new version: earlier acceptances no longer count for launching (L2-136 criterion 4). */
  publishVersion(version: number, effectiveOn: string): void {
    this.version = version;
    this.effectiveOn = effectiveOn;
  }

  /** Forgets an organization's acceptances, as if it never accepted. */
  forget(organizationId: string): void {
    for (let i = this.acceptances.length - 1; i >= 0; i--) if (this.acceptances[i]!.organizationId === organizationId) this.acceptances.splice(i, 1);
  }

  /** GET /learning-bond/agreement (L2-136 criterion 1). */
  agreement(route: Route, m: Membership, moduleOn: boolean): Promise<void> {
    const own = this.acceptances.filter((a) => a.organizationId === m.organizationId).sort((a, b) => b.version - a.version);
    const current = own.find((a) => a.version === this.version);
    const earlier = current ? undefined : own.find((a) => a.version < this.version);
    const dto = (a?: FakeLearningBondAcceptance) => (a ? { version: a.version, acceptedBy: a.acceptedBy, acceptedAt: a.acceptedAt } : null);
    return route.fulfill({
      json: { version: this.version, effectiveOn: this.effectiveOn, sections, acceptance: dto(current), earlierAcceptance: dto(earlier), signer: null, moduleOn },
    });
  }

  /** POST /learning-bond/agreement/acceptances (L2-136 criteria 2 and 3). */
  accept(route: Route, m: Membership, now: string): Promise<void> {
    const body = route.request().postDataJSON() as { authority?: boolean };
    if (!body.authority) return route.fulfill({ status: 422, json: { errors: { authority: 'Confirm you have authority to accept this agreement, or ask someone else to sign.' } } });
    if (!this.hasAccepted(m.organizationId)) this.acceptances.push({ organizationId: m.organizationId, version: this.version, acceptedBy: m.personName, acceptedAt: now });
    return route.fulfill({ status: 201, json: { id: `acceptance-${m.organizationId}-${this.version}` } });
  }
}
