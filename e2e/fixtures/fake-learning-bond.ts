import type { Route } from '@playwright/test';
import { learningBondAcceptances, learningBondAgreementVersion, memberships, type Membership } from './seed';

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

/** An open request for a named signer (L2-137). The API never answers the token; the fake keeps the current one so tests can open the link. */
export interface FakeLearningBondSigner {
  id: string;
  name: string;
  title: string;
  email: string;
  sentAt: string;
  expiresAt: string;
  token: string;
  requestedBy: string;
  requestedByMembershipId: string;
}

/** Every signer link the fake has minted: its organization; a link is open only while it is its organization's current one. */
interface FakeLearningBondSignerLink {
  organizationId: string;
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
    ['tok-lb-haddad', { householdId: 'hh-haddad', organizationId: 'org-harbourview', language: 'fr' }],
  ]);

  /** The agent's welcome line for the landing page (AgentFallbackCopy.Welcome). */
  welcome(code: 'en' | 'es' | 'fr', organization: string): string {
    if (code === 'es')
      return `El Bono de Estudios Canadiense es dinero que el Gobierno de Canadá deposita en el RESP de un niño para familias con ingresos más bajos. No tiene que aportar dinero. Lo que escriba va al proveedor del RESP y al Gobierno de Canadá, no a ${organization}.`;
    if (code === 'fr')
      return `Le Bon d’études canadien est de l’argent que le gouvernement du Canada verse dans le REEE d’un enfant pour les familles à revenu modeste. Vous n’avez rien à verser. Ce que vous saisissez va au fournisseur de REEE et au gouvernement du Canada, pas à ${organization}.`;
    return `The Canada Learning Bond is money the Government of Canada puts in a child’s RESP for families with lower incomes. You don’t need to put in any money. What you enter goes to the RESP provider and the Government of Canada, not to ${organization}.`;
  }

  /** "Up to" the amount for a child born in a year, as of 2026 (LearningBondRule v1); null before 2004. */
  estimate(birthYear: number, currentYear = 2026): number | null {
    if (birthYear < 2004 || birthYear > currentYear) return null;
    const years = Math.min(currentYear, birthYear + 15) - birthYear + 1;
    return Math.min(2000, 500 + (years - 1) * 100);
  }

  /** organization → its open signer request (one per organization, L2-137 criterion 5). */
  readonly signers = new Map<string, FakeLearningBondSigner>();

  /** Emails sent to signers: to and subject, as the backend sends them from "{organization} via PromiseHub". */
  readonly signerEmails: { to: string; subject: string }[] = [];

  private nextSigner = 1;

  private nextSignerToken = 1;

  /** token → the organization of every signer link ever minted, so a dead link answers 410 and an unknown one 404 (L2-137 criterion 9). */
  readonly signerLinks = new Map<string, FakeLearningBondSignerLink>();

  /** Whether an organization is suspended (the fake API's own record); its signer links answer 410. */
  isSuspended: (organizationId: string) => boolean = () => false;

  private mintSignerToken(organizationId: string): string {
    const token = `tok-signer-${this.nextSignerToken++}`;
    this.signerLinks.set(token, { organizationId });
    return token;
  }

  /** Names a signer for an organization as its admin would, and answers the link's token (the one in the email). */
  nameSigner(requestedByMembershipId: string, signer: { name: string; title: string; email: string }, now = '2026-11-05T21:12:00Z'): string {
    const admin = memberships.find((m) => m.id === requestedByMembershipId)!;
    const token = this.mintSignerToken(admin.organizationId);
    this.signers.set(admin.organizationId, {
      id: `signer-${this.nextSigner++}`,
      ...signer,
      sentAt: now,
      expiresAt: addDays(now, 14),
      token,
      requestedBy: admin.personName,
      requestedByMembershipId: admin.id,
    });
    return token;
  }

  /** Emails to the admin who asked, once the signer accepted (L2-137 criterion 2): to and subject. */
  readonly adminEmails: { to: string; subject: string }[] = [];

  /** The open request a signer link belongs to, or the status its endpoints answer: 410 for a dead link, 404 for an unknown one. */
  private signerOf(token: string): { organizationId: string; signer: FakeLearningBondSigner } | 404 | 410 {
    const link = this.signerLinks.get(token);
    if (!link) return 404;
    const signer = this.signers.get(link.organizationId);
    if (signer?.token !== token || this.isSuspended(link.organizationId)) return 410;
    return { organizationId: link.organizationId, signer };
  }

  private expiredLink(route: Route, organizationName: (id: string) => string, token: string, status: 404 | 410): Promise<void> {
    if (status === 404) return route.fulfill({ status: 404 });
    const organization = organizationName(this.signerLinks.get(token)!.organizationId);
    return route.fulfill({ status: 410, json: { organization, message: `This link has expired. Ask ${organization} to send a new one.` } });
  }

  /** GET /sign/learning-bond/{token} (L2-137 criteria 8 and 9): anonymous, whether Learning Bond is on or off. */
  signerAgreement(route: Route, token: string, organizationName: (id: string) => string): Promise<void> {
    const found = this.signerOf(token);
    if (typeof found === 'number') return this.expiredLink(route, organizationName, token, found);
    const { signer, organizationId } = found;
    return route.fulfill({
      json: { organization: organizationName(organizationId), requestedBy: signer.requestedBy, name: signer.name, title: signer.title, version: this.version, effectiveOn: this.effectiveOn, sections },
    });
  }

  /** POST /sign/learning-bond/{token}/acceptances (L2-137 criteria 2 and 8): the authority box first; a refusal uses nothing up. */
  acceptAsSigner(route: Route, token: string, organizationName: (id: string) => string, now: string, notify: (organizationId: string, membershipId: string, text: string) => void): Promise<void> {
    const found = this.signerOf(token);
    if (typeof found === 'number') return this.expiredLink(route, organizationName, token, found);
    const { signer, organizationId } = found;
    const body = route.request().postDataJSON() as { authority?: boolean };
    const organization = organizationName(organizationId);
    if (!body.authority) return route.fulfill({ status: 422, json: { errors: { authority: `Confirm you have authority to accept this agreement for ${organization}.` } } });
    if (!this.hasAccepted(organizationId)) this.acceptances.push({ organizationId, version: this.version, acceptedBy: signer.name, acceptedAt: now });
    this.signers.delete(organizationId);
    notify(organizationId, signer.requestedByMembershipId, `${signer.name}, ${signer.title}, accepted the Learning Bond data-handling agreement version ${this.version}.`);
    const admin = memberships.find((m) => m.id === signer.requestedByMembershipId);
    if (admin) this.adminEmails.push({ to: admin.email, subject: `${signer.name} accepted the Learning Bond agreement` });
    return route.fulfill({ status: 201, json: { organization, name: signer.name, title: signer.title, email: signer.email, version: this.version, acceptedAt: now, requestedBy: signer.requestedBy } });
  }

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
  agreement(route: Route, m: Membership, moduleOn: boolean, organizationName: string): Promise<void> {
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
        signer: this.signerDto(this.signers.get(m.organizationId), organizationName),
        moduleOn,
      },
    });
  }

  /** The open request as the API answers it, with the email the signer received (LearningBondSignerEmailDto): never the token. */
  private signerDto(signer: FakeLearningBondSigner | undefined, organization: string) {
    if (!signer) return null;
    const { token: _token, requestedBy, requestedByMembershipId: _requestedByMembershipId, ...dto } = signer;
    const preview = {
      title: `${requestedBy} asked you to accept the Learning Bond data-handling agreement`,
      text:
        `Hello ${signer.name}. ${organization} wants to offer Learning Bond, which helps families claim the Canada Learning Bond and child benefits. ` +
        'Someone with authority has to accept a one-page agreement about what it collects and where it goes. ' +
        `${requestedBy} named you, as ${signer.title}. No PromiseHub account is needed. The link works once, for 14 days.`,
      action: 'Read and accept',
      footer: `${organization} via PromiseHub`,
    };
    return { ...dto, preview };
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
    this.signers.set(m.organizationId, {
      id,
      name,
      title,
      email,
      sentAt: now,
      expiresAt: addDays(now, 14),
      token: this.mintSignerToken(m.organizationId),
      requestedBy: m.personName,
      requestedByMembershipId: m.id,
    });
    this.signerEmails.push({ to: email, subject: `${organizationName} via PromiseHub: please accept the Learning Bond data-handling agreement` });
    return route.fulfill({ status: 201, json: { id } });
  }

  /** POST /learning-bond/agreement/signers/{id}/resend: a new link to the same signer; 404 unless it is the caller's open request. */
  resendSigner(route: Route, m: Membership, id: string, organizationName: string, now: string): Promise<void> {
    const signer = this.signers.get(m.organizationId);
    if (signer?.id !== id) return route.fulfill({ status: 404 });
    this.signers.set(m.organizationId, { ...signer, sentAt: now, expiresAt: addDays(now, 14), token: this.mintSignerToken(m.organizationId) });
    this.signerEmails.push({ to: signer.email, subject: `${organizationName} via PromiseHub: please accept the Learning Bond data-handling agreement` });
    return route.fulfill({ status: 204 });
  }

  /** DELETE /learning-bond/agreement/signers/{id}: cancels the caller's open request; 404 otherwise. */
  cancelSigner(route: Route, m: Membership, id: string): Promise<void> {
    if (this.signers.get(m.organizationId)?.id !== id) return route.fulfill({ status: 404 });
    this.signers.delete(m.organizationId);
    return route.fulfill({ status: 204 });
  }

  /** Learning Bond consents given (LearningBondConsent with scope LearningBond); each starts the child's claim. */
  readonly consents: { householdId: string; childId: string; typedName: string; language: string; wordingVersion: number }[] = [];

  /** The exact consent wording for one child (LearningBondTexts.Consent). */
  consentWording(code: 'en' | 'es' | 'fr', child: string): string {
    if (code === 'es')
      return `Acepto que Learning Bond recopile los números de seguro social de ${child} y míos y nuestra situación fiscal, y los envíe al proveedor de RESP que yo elija y al Gobierno de Canadá para solicitar el Bono de Estudios Canadiense.`;
    if (code === 'fr')
      return `J’accepte que Learning Bond recueille les numéros d’assurance sociale de ${child} et le mien ainsi que notre situation fiscale, et les envoie au fournisseur de REEE que je choisis et au gouvernement du Canada pour demander le Bon d’études canadien.`;
    return `I agree that Learning Bond may collect ${child}’s and my social insurance numbers and tax-filing status and send them to the RESP provider I choose and the Government of Canada to apply for the Canada Learning Bond.`;
  }

  /** The consent step's agent line (AgentFallbackCopy.Consent). */
  consentLine(code: 'en' | 'es' | 'fr', organization: string): string {
    if (code === 'es') return `Antes de preguntar nada, necesito su permiso por cada hijo. Es distinto del consentimiento del programa que dio a ${organization}.`;
    if (code === 'fr') return `Avant de vous demander quoi que ce soit, j’ai besoin de votre permission pour chaque enfant. Elle est distincte du consentement au programme donné à ${organization}.`;
    return `Before I ask anything, I need your permission for each child. It’s separate from the program consent you gave ${organization}.`;
  }

  /** household → its intake: the guardian SIN's last three digits and the tax answer, reused for every child (LearningBondIntake). */
  readonly intakes = new Map<string, { guardianLast3: string | null; taxFiled: string | null }>();

  /** child → its SIN's last three digits and whether a record fix was asked (LearningBondClaim). The fake keeps no whole SIN. */
  readonly claims = new Map<string, { childLast3: string | null; recordFix: string | null }>();

  /** The intake's agent line (AgentFallbackCopy.Intake). */
  intakeLine(code: 'en' | 'es' | 'fr', child: string): string {
    if (code === 'es') return `Ya tengo el nombre y la fecha de nacimiento de ${child} de la inscripción. Solo le pediré lo que falta: los números van en las casillas, nunca en un mensaje para mí.`;
    if (code === 'fr')
      return `J’ai déjà le nom et la date de naissance de ${child} grâce à l’inscription. Je ne demande que ce qui manque : les numéros vont dans les cases, jamais dans un message pour moi.`;
    return `I already have ${child}’s name and date of birth from the enrolment. I’ll only ask for what’s missing: numbers go in the boxes, never in a message to me.`;
  }

  /** Households whose guardian said they aren't interested (LearningBondInvitation.DeclinedAt). */
  readonly declined = new Set<string>();

  /** Every invitation sent (LearningBondInvitation): a household is not invited again within 7 days (L2-140 criterion 5). */
  readonly invitations: { organizationId: string; householdId: string; sentAt: string }[] = [];

  /** Guardians' call requests (LearningBondCallRequest): open until a call is marked done; No answer keeps one open (L2-142). */
  readonly callRequests: { organizationId: string; householdId: string; phone: string; when: 'Mornings' | 'Afternoons' | 'Evenings'; requestedAt: string; outcome: string | null }[] = [];

  /** A guardian asks for a call, as POST /g/learning-bond/{token}/callback would record it. */
  requestCall(organizationId: string, householdId: string, phone: string, when: 'Mornings' | 'Afternoons' | 'Evenings', requestedAt = '2026-11-05T19:10:00Z'): void {
    this.callRequests.push({ organizationId, householdId, phone, when, requestedAt, outcome: null });
  }

  /** Audit summaries the fake records for call outcomes, as the backend writes them. */
  readonly callAudit: string[] = [];

  /** When the household was invited within 7 days of now, if it was. */
  invitedAt(householdId: string, now: string): string | null {
    const since = new Date(new Date(now).getTime() - 7 * 24 * 3600 * 1000).toISOString();
    return (
      this.invitations
        .filter((i) => i.householdId === householdId && i.sentAt > since)
        .map((i) => i.sentAt)
        .sort()
        .at(-1) ?? null
    );
  }

  /** The invitation text naming each eligible child, with the sample link (LearningBondTexts.Sms). */
  invitationSms(code: 'en' | 'es' | 'fr', sender: string, children: string[]): string {
    const and = { en: 'and', es: 'y', fr: 'et' }[code];
    const names = children.length <= 1 ? children.join('') : `${children.slice(0, -1).join(', ')} ${and} ${children.at(-1)}`;
    const plural = children.length > 1;
    const link = 'promisehub.ca/lb/4r7k9x';
    if (code === 'es')
      return `${sender}: ${names} ${plural ? 'podrían' : 'podría'} tener derecho a hasta $2,000 para estudiar después de la secundaria. No cuesta nada. Toque para comprobarlo: ${link} (STOP para salir)`;
    if (code === 'fr')
      return `${sender} : ${names} ${plural ? 'pourraient' : 'pourrait'} recevoir jusqu’à 2 000 $ pour ses études après le secondaire. C’est gratuit. Touchez pour vérifier : ${link} (STOP pour arrêter)`;
    return `${sender}: ${names} may be owed up to $2,000 for school after high school. It costs nothing. Tap to check: ${link} (STOP to opt out)`;
  }

  /** organization → its launch as chosen (LearningBondSettings.LaunchMode, LaunchDate, LaunchedAt). */
  readonly launches = new Map<string, { mode: 'Scheduled' | 'AtTheDoor'; date: string | null; launchedAt: string | null }>();

  /** Audit summaries the fake records for launch changes, as the backend writes them. */
  readonly launchAudit: { organizationId: string; summary: string }[] = [];

  /** GET /learning-bond/launch (L2-140): the counts the fake API computes, the launch range from tomorrow to 90 days ahead (today is Thu 5 Nov 2026). */
  launch(route: Route, m: Membership, counts: { covered: number; mobile: number; emailOnly: number; neither: number; programs: string[] }): Promise<void> {
    const launch = this.launches.get(m.organizationId);
    return route.fulfill({
      json: {
        ...counts,
        noPhoneNumbers: counts.mobile === 0,
        mode: launch?.mode ?? null,
        date: launch?.date ?? null,
        launchedAt: launch?.launchedAt ?? null,
        earliest: '2026-11-06',
        latest: '2027-02-03',
        launchBlocked: this.hasAccepted(m.organizationId) ? null : 'A new version of the agreement needs accepting.',
      },
    });
  }

  /** POST /learning-bond/launch (L2-140 criteria 2 to 4): the day from Fri 6 Nov 2026 to Wed 3 Feb 2027, a mobile number, the current version accepted. */
  scheduleLaunch(route: Route, m: Membership, mobile: number): Promise<void> {
    const body = route.request().postDataJSON() as { mode?: string; date?: string };
    const invalid = (field: string, message: string) => route.fulfill({ status: 422, json: { errors: { [field]: message } } });
    if (body.mode !== 'Scheduled' && body.mode !== 'AtTheDoor') return invalid('mode', 'Choose a day or Staff invite at the door.');
    if (this.launches.get(m.organizationId)?.launchedAt) return invalid('launch', 'Learning Bond has launched. Staff invite new families at the door.');
    if (body.mode === 'Scheduled' && !inLaunchRange(body.date)) return invalid('date', 'Choose a date from tomorrow to 90 days ahead.');
    if (!this.hasAccepted(m.organizationId)) return invalid('launch', 'A new version of the agreement needs accepting.');
    if (body.mode === 'Scheduled' && mobile === 0)
      return route.fulfill({
        status: 422,
        json: { code: 'no-phone-numbers', errors: { launch: 'Add guardians’ mobile numbers before launching. Staff can collect them at check-in.' } },
      });
    this.launches.set(m.organizationId, { mode: body.mode, date: body.mode === 'Scheduled' ? body.date! : null, launchedAt: null });
    this.launchAudit.push({
      organizationId: m.organizationId,
      summary: body.mode === 'Scheduled' ? `Learning Bond launch scheduled for ${launchDay(body.date!)}` : 'Learning Bond launch: staff invite at the door',
    });
    return route.fulfill({ status: 201, json: { id: `launch-${m.organizationId}` } });
  }

  /** PUT /learning-bond/launch (L2-140 criterion 6): moves a scheduled launch that hasn't sent. */
  moveLaunch(route: Route, m: Membership): Promise<void> {
    const launch = this.launches.get(m.organizationId);
    if (launch?.mode !== 'Scheduled' || launch.launchedAt) return route.fulfill({ status: 404 });
    const { date } = route.request().postDataJSON() as { date?: string };
    if (!inLaunchRange(date)) return route.fulfill({ status: 422, json: { errors: { date: 'Choose a date from tomorrow to 90 days ahead.' } } });
    launch.date = date!;
    this.launchAudit.push({ organizationId: m.organizationId, summary: `Learning Bond launch moved to ${launchDay(date!)}` });
    return route.fulfill({ status: 204 });
  }

  /** DELETE /learning-bond/launch (L2-140 criterion 6): cancels a launch that hasn't sent; nothing goes out. */
  cancelLaunch(route: Route, m: Membership): Promise<void> {
    const launch = this.launches.get(m.organizationId);
    if (!launch || launch.launchedAt) return route.fulfill({ status: 404 });
    this.launches.delete(m.organizationId);
    this.launchAudit.push({ organizationId: m.organizationId, summary: 'Learning Bond launch cancelled; nothing was sent' });
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

  /** The sender name: the saved one, or the organization's name cut to 30 characters at a word boundary (L2-139 criterion 5). */
  senderNameOf(organizationId: string, organizationName: string): string {
    return this.settingsOf(organizationId).senderName ?? defaultSender(organizationName);
  }

  /** GET /learning-bond/invitation (L2-139 criterion 1): the platform wording in each language the households use, with samples. */
  invitation(route: Route, m: Membership, organization: { name: string; city: string }, languages: string[]): Promise<void> {
    const sender = this.senderNameOf(m.organizationId, organization.name);
    return route.fulfill({
      json: {
        senderName: sender,
        languages: languages.map((code) => {
          const sms = texts.sms(code, sender);
          return {
            code,
            name: texts.name(code),
            sms,
            smsCharacters: sms.length,
            smsSegments: smsSegments(sms),
            emailTitle: texts.emailTitle(code),
            emailText: texts.emailText(code),
            emailAction: texts.emailAction(code),
            emailFooter: texts.emailFooter(code, sender, organization.name, organization.city),
          };
        }),
      },
    });
  }

  /** PUT /learning-bond/invitation (L2-139 criteria 2 and 3). */
  saveInvitation(route: Route, m: Membership): Promise<void> {
    const name = ((route.request().postDataJSON() as { senderName?: string }).senderName ?? '').trim();
    const valid = name.length > 0 && name.length <= 30 && /^[\p{L}\p{N} &'’.\-]+$/u.test(name) && !/[\p{L}\p{N}-]\.\p{L}{2,}/iu.test(name) && (name.match(/[0-9]/g) ?? []).length < 7;
    if (!valid) return route.fulfill({ status: 422, json: { errors: { senderName: 'Use 1 to 30 letters, numbers and spaces.' } } });
    const before = this.settingsOf(m.organizationId);
    if (before.senderName !== name) {
      this.settings.set(m.organizationId, { ...before, senderName: name });
      this.settingsAudit.push({ organizationId: m.organizationId, summary: 'Learning Bond settings changed: SenderName' });
    }
    return route.fulfill({ status: 204 });
  }

  /** GET /learning-bond/overview (L2-136 criteria 4 and 9): the hub; a pending version disables Launch. */
  overview(route: Route, m: Membership, organizationName: string, programs: FakeLearningBondProgram[], languages: string[]): Promise<void> {
    const own = this.acceptances.filter((a) => a.organizationId === m.organizationId).sort((a, b) => b.version - a.version);
    const latest = own[0];
    const pending = latest?.version !== this.version;
    const settings = this.settingsOf(m.organizationId);
    const chosen = settings.coverage === 'ChosenPrograms' ? programs.filter((p) => settings.programIds.includes(p.id)) : programs;
    return route.fulfill({
      json: {
        agreementVersion: this.version,
        acceptance: latest ? { version: latest.version, acceptedBy: latest.acceptedBy, acceptedAt: latest.acceptedAt } : null,
        pendingVersion: pending ? this.version : null,
        pendingEffectiveOn: pending ? this.effectiveOn : null,
        coverage: settings.coverage,
        programs: settings.coverage === 'ChosenPrograms' ? chosen.map((p) => p.name) : [],
        households: new Set(chosen.flatMap((p) => p.households)).size,
        statusRoles: settings.statusRoles,
        senderName: this.senderNameOf(m.organizationId, organizationName),
        languages,
        launchBlocked: pending ? 'A new version of the agreement needs accepting.' : null,
      },
    });
  }
}

/** The organization's name cut to 30 characters at a word boundary (SenderNameRule.Default). */
function defaultSender(name: string): string {
  if (name.length <= 30) return name;
  const cut = name.slice(0, 30);
  const space = cut.lastIndexOf(' ');
  return (space > 0 ? cut.slice(0, space) : cut).trimEnd();
}

const GSM7 = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';

/** SMS segments as Messaging counts them (SmsSegments): 160 and 153 for GSM-7, 70 and 67 otherwise. */
function smsSegments(text: string): number {
  const gsm = [...text].every((c) => GSM7.includes(c));
  const [single, multi] = gsm ? [160, 153] : [70, 67];
  return text.length <= single ? 1 : Math.ceil(text.length / multi);
}

const link = 'promisehub.ca/lb/4r7k9x';

/** The platform wording (backend LearningBondTexts) with its sample child Maya, guardian Alex and link. */
const texts = {
  name: (code: string) => (code === 'es' ? 'Spanish' : code === 'fr' ? 'French' : 'English'),
  sms: (code: string, sender: string) =>
    code === 'es'
      ? `${sender}: Maya podría tener derecho a hasta $2,000 para estudiar después de la secundaria. No cuesta nada. Toque para comprobarlo: ${link} (STOP para salir)`
      : code === 'fr'
        ? `${sender} : Maya pourrait recevoir jusqu’à 2 000 $ pour ses études après le secondaire. C’est gratuit. Touchez pour vérifier : ${link} (STOP pour arrêter)`
        : `${sender}: Maya may be owed up to $2,000 for school after high school. It costs nothing. Tap to check: ${link} (STOP to opt out)`,
  emailTitle: (code: string) =>
    code === 'es'
      ? 'Maya podría tener derecho a hasta $2,000 para estudiar'
      : code === 'fr'
        ? 'Maya pourrait recevoir jusqu’à 2 000 $ pour ses études'
        : 'Maya may be owed up to $2,000 for school after high school',
  emailText: (code: string) =>
    code === 'es'
      ? 'Hola, Alex. El Gobierno de Canadá deposita el Bono de Estudios Canadiense en un RESP para familias con ingresos más bajos. No cuesta nada y no hace falta aportar dinero. Compruébelo en unos 15 minutos desde su teléfono.'
      : code === 'fr'
        ? 'Bonjour Alex. Le gouvernement du Canada verse le Bon d’études canadien dans un REEE pour les familles à revenu modeste. C’est gratuit et vous n’avez rien à verser. Vérifiez en 15 minutes environ sur votre téléphone.'
        : 'Hi Alex. The Government of Canada puts the Canada Learning Bond into an RESP for families with lower incomes. It costs nothing and you don’t need to put in any money. Check in about 15 minutes on your phone.',
  emailAction: (code: string) => (code === 'es' ? 'Comprobar ahora' : code === 'fr' ? 'Vérifier maintenant' : 'Check now'),
  emailFooter: (code: string, sender: string, organization: string, city: string) => {
    const place = city ? `${organization}, ${city.split(',')[0]!.trim()}` : organization;
    return code === 'es'
      ? `${sender} a través de PromiseHub · ${place} · Dejar de recibir correos`
      : code === 'fr'
        ? `${sender} via PromiseHub · ${place} · Se désabonner`
        : `${sender} via PromiseHub · ${place} · Unsubscribe`;
  },
};

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86_400_000).toISOString();
}

/** A launch day from tomorrow to 90 days ahead: Fri 6 Nov 2026 to Wed 3 Feb 2027 (L2-140 criterion 3). */
function inLaunchRange(date?: string): boolean {
  return !!date && /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= '2026-11-06' && date <= '2027-02-03';
}

/** "Mon 9 Nov 2026", as the backend writes a day in the audit. */
function launchDay(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return `${d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })} ${d.getUTCDate()} ${d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })} ${d.getUTCFullYear()}`;
}

/** The nine digits of a SIN, or null: 9 digits after spaces and hyphens, the check digit (Luhn), not starting with 0 or 8 (L2-146 criterion 3). */
export function sinDigits(value: string): string | null {
  const digits = value.replace(/[\s-]/g, '');
  if (!/^\d{9}$/.test(digits) || digits[0] === '0' || digits[0] === '8') return null;
  let total = 0;
  for (let i = 0; i < 9; i++) {
    let d = Number(digits[i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    total += d;
  }
  return total % 10 === 0 ? digits : null;
}
