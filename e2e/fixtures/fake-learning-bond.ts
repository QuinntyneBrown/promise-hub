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

/** An open request for a named signer (L2-137); the fake keeps no token. */
export interface FakeLearningBondSigner {
  id: string;
  name: string;
  title: string;
  email: string;
  sentAt: string;
  expiresAt: string;
}

/** An organization's Learning Bond settings row (ADR 0076); absent until first saved. */
export interface FakeLearningBondSettings {
  coverage: 'AllPrograms' | 'ChosenPrograms';
  programIds: string[];
  statusRoles: string[];
  senderName: string | null;
}

/** A running program and the households it reaches, as the fake API counts them from its programs and households. */
export interface FakeLearningBondProgram {
  id: string;
  name: string;
  households: string[];
}

/** The roles that may see status, in page order; Admin and Program director always do (L2-138 criterion 4). */
const offeredRoles = ['Admin', 'ProgramDirector', 'SiteLead', 'YouthWorker', 'VolunteerCoordinator'];
const fixedRoles = ['Admin', 'ProgramDirector'];

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

  /** organization → its open signer request (one per organization, L2-137 criterion 5). */
  readonly signers = new Map<string, FakeLearningBondSigner>();

  /** Emails sent to signers: to and subject, as the backend sends them from "{organization} via PromiseHub". */
  readonly signerEmails: { to: string; subject: string }[] = [];

  private nextSigner = 1;

  /** organization → its settings row; absent means every program, Admin and Program director, and the organization's name as sender. */
  readonly settings = new Map<string, FakeLearningBondSettings>();

  /** Audit entries the fake records for settings saves: the organization and the summary, as the backend writes them. */
  readonly settingsAudit: { organizationId: string; summary: string }[] = [];

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
      json: {
        version: this.version,
        effectiveOn: this.effectiveOn,
        sections,
        acceptance: dto(current),
        earlierAcceptance: dto(earlier),
        signer: this.signers.get(m.organizationId) ?? null,
        moduleOn,
      },
    });
  }

  /** POST /learning-bond/agreement/acceptances (L2-136 criteria 2 and 3). */
  accept(route: Route, m: Membership, now: string): Promise<void> {
    const body = route.request().postDataJSON() as { authority?: boolean };
    if (!body.authority) return route.fulfill({ status: 422, json: { errors: { authority: 'Confirm you have authority to accept this agreement, or ask someone else to sign.' } } });
    if (!this.hasAccepted(m.organizationId)) this.acceptances.push({ organizationId: m.organizationId, version: this.version, acceptedBy: m.personName, acceptedAt: now });
    this.signers.delete(m.organizationId);
    return route.fulfill({ status: 201, json: { id: `acceptance-${m.organizationId}-${this.version}` } });
  }

  /** POST /learning-bond/agreement/signers (L2-137 criteria 1, 4 and 5): a new request replaces the open one. */
  requestSigner(route: Route, m: Membership, organizationName: string, now: string): Promise<void> {
    const body = route.request().postDataJSON() as { name?: string; title?: string; email?: string };
    const name = body.name?.trim() ?? '';
    const title = body.title?.trim() ?? '';
    const email = body.email?.trim() ?? '';
    const errors: Record<string, string> = {};
    if (!name || name.length > 100) errors['name'] = 'Enter the signer’s name.';
    if (!title || title.length > 100) errors['title'] = 'Enter the signer’s role or title.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors['email'] = 'Enter an email like name@example.org.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const id = `signer-${this.nextSigner++}`;
    this.signers.set(m.organizationId, { id, name, title, email, sentAt: now, expiresAt: addDays(now, 14) });
    this.signerEmails.push({ to: email, subject: `${organizationName} via PromiseHub: please accept the Learning Bond data-handling agreement` });
    return route.fulfill({ status: 201, json: { id } });
  }

  /** POST /learning-bond/agreement/signers/{id}/resend: a new link to the same signer; 404 unless it is the caller's open request. */
  resendSigner(route: Route, m: Membership, id: string, organizationName: string, now: string): Promise<void> {
    const signer = this.signers.get(m.organizationId);
    if (signer?.id !== id) return route.fulfill({ status: 404 });
    this.signers.set(m.organizationId, { ...signer, sentAt: now, expiresAt: addDays(now, 14) });
    this.signerEmails.push({ to: signer.email, subject: `${organizationName} via PromiseHub: please accept the Learning Bond data-handling agreement` });
    return route.fulfill({ status: 204 });
  }

  /** DELETE /learning-bond/agreement/signers/{id}: cancels the caller's open request; 404 otherwise. */
  cancelSigner(route: Route, m: Membership, id: string): Promise<void> {
    if (this.signers.get(m.organizationId)?.id !== id) return route.fulfill({ status: 404 });
    this.signers.delete(m.organizationId);
    return route.fulfill({ status: 204 });
  }

  settingsOf(organizationId: string): FakeLearningBondSettings {
    return this.settings.get(organizationId) ?? { coverage: 'AllPrograms', programIds: [], statusRoles: [...fixedRoles], senderName: null };
  }

  /** GET /learning-bond/settings (L2-138 criterion 1): the caller's running programs, each with the households it reaches. */
  getSettings(route: Route, m: Membership, programs: FakeLearningBondProgram[]): Promise<void> {
    const settings = this.settingsOf(m.organizationId);
    return route.fulfill({
      json: {
        coverage: settings.coverage,
        programIds: settings.programIds,
        statusRoles: settings.statusRoles,
        programs: programs.map((p) => ({ id: p.id, name: p.name, households: p.households.length })),
        allHouseholds: new Set(programs.flatMap((p) => p.households)).size,
      },
    });
  }

  /** PUT /learning-bond/settings (L2-138 criteria 2 to 4): only the caller's running programs; the fixed roles stay. */
  saveSettings(route: Route, m: Membership, programs: FakeLearningBondProgram[]): Promise<void> {
    const body = route.request().postDataJSON() as { coverage?: string; programIds?: string[]; statusRoles?: string[] };
    const errors: Record<string, string> = {};
    if (body.coverage !== 'AllPrograms' && body.coverage !== 'ChosenPrograms') errors['coverage'] = 'Choose every program or chosen programs.';
    const programIds = body.programIds ?? [];
    if (body.coverage === 'ChosenPrograms') {
      if (!programIds.length) errors['programIds'] = 'Choose at least one program.';
      else if (programIds.some((id) => !programs.some((p) => p.id === id))) errors['programIds'] = 'Choose programs that are running.';
    }
    const roles = body.statusRoles ?? [];
    if (roles.some((r) => !offeredRoles.includes(r))) errors['statusRoles'] = 'Choose staff roles that may see status.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const before = this.settingsOf(m.organizationId);
    const after: FakeLearningBondSettings = {
      coverage: body.coverage as FakeLearningBondSettings['coverage'],
      programIds: body.coverage === 'AllPrograms' ? [] : [...new Set(programIds)],
      statusRoles: offeredRoles.filter((r) => fixedRoles.includes(r) || roles.includes(r)),
      senderName: before.senderName,
    };
    const changed = [
      before.coverage !== after.coverage ? 'Coverage' : null,
      before.programIds.join() !== after.programIds.join() ? 'Programs' : null,
      before.statusRoles.join() !== after.statusRoles.join() ? 'StatusRoles' : null,
    ].filter((c): c is string => c !== null);
    this.settings.set(m.organizationId, after);
    if (changed.length) this.settingsAudit.push({ organizationId: m.organizationId, summary: `Learning Bond settings changed: ${changed.join(', ')}` });
    return route.fulfill({ status: 204 });
  }
}

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86_400_000).toISOString();
}
