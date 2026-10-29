import type { FakeBadge } from './fake-badges';
import type { FakeModule, FakeTrack } from './fake-curriculum';
import type { FakeProgram } from './programs';
import type { ModuleId } from './seed';

/** What the public website reads from the rest of the fake API, always for the one organization its address names. */
export interface WebsiteSource {
  modules: ModuleId[];
  programs: FakeProgram[];
  /** The enrollment link of a program while one was opened, else undefined. */
  enrollmentSlug(programId: string): string | undefined;
  tracks: FakeTrack[];
  curriculumModules: FakeModule[];
  /** The track each program follows. */
  programTrack(programId: string): string | undefined;
  badges: FakeBadge[];
  /** The full name of a program's lead mentor while the mentor is active, else null. */
  leadMentor(programId: string): string | null;
  /** The organization's today (yyyy-mm-dd). */
  today: string;
}

/** Mirrors backend PublicContentHandler (L2-133, ADR 0075): published content only, never people. */
export class FakeWebsite {
  content(s: WebsiteSource) {
    const learning = s.modules.includes('Learning');
    const mentoring = s.modules.includes('Mentoring');
    const tracks = learning
      ? s.tracks
          .filter((t) => t.status === 'Published')
          .map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            modules: s.curriculumModules
              .filter((m) => m.trackId === t.id && m.status === 'Published')
              .sort((a, b) => a.position - b.position)
              .map((m) => ({
                title: m.title,
                description: m.description,
                badge:
                  s.badges
                    .filter((b) => !b.deleted && b.rule === 'ModuleCompleted' && b.targetId === m.id)
                    .map((b) => b.name)
                    .sort()[0] ?? null,
              })),
          }))
          .filter((t) => t.modules.length > 0)
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];
    const programs = s.programs
      .filter((p) => p.status === 'Active' && p.endsOn >= s.today)
      .sort((a, b) => a.startsOn.localeCompare(b.startsOn) || a.name.localeCompare(b.name))
      .map((p) => {
        const slug = s.enrollmentSlug(p.id);
        const track = tracks.find((t) => t.id === s.programTrack(p.id));
        const lead = mentoring ? s.leadMentor(p.id) : null;
        return {
          name: p.name,
          schedule: p.schedule,
          ages: p.ages,
          startsOn: p.startsOn,
          endsOn: p.endsOn,
          status: p.startsOn <= s.today ? 'Running' : 'Upcoming',
          applyPath: p.enrollmentOpen && slug ? `/g/enroll/${slug}` : null,
          track: track?.name ?? null,
          leadMentor: lead ? lead.trim().split(/\s+/)[0]! : null,
        };
      });
    return {
      programs,
      tracks: tracks.map(({ name, description, modules }) => ({
        name,
        description,
        modules,
      })),
      mentorship: mentoring,
      impact: {
        programs: programs.length,
        open: programs.filter((p) => p.applyPath !== null).length,
        tracks: learning ? tracks.length : null,
        modules: learning ? tracks.reduce((n, t) => n + t.modules.length, 0) : null,
      },
    };
  }
}

export type WebsiteRequestKind = 'contact' | 'volunteer' | 'donation';

/** A request a visitor sent, as the fake stores it. */
export interface FakeWebsiteRequest {
  organizationId: string;
  kind: WebsiteRequestKind;
  email: string;
  at: string;
  [field: string]: unknown;
}

const TOPICS = ['Programs and enrollment', 'Volunteering', 'Giving', 'Something else'];
const AREAS = ['Homework help', 'Coaching a sports team', 'Camp helper', 'Driving and setup', 'Wherever I’m needed'];
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const clean = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** A fake answer: the status and the body. */
export interface FakeAnswer {
  status: number;
  json?: unknown;
}

/** Mirrors backend WebsiteRequestsHandler (L2-134, ADR 0075): validated, limited to five per kind, email and hour, stored per organization. */
export class FakeWebsiteRequests {
  readonly rows: FakeWebsiteRequest[] = [];

  constructor(private readonly now: () => Date) {}

  of(organizationId: string, kind: WebsiteRequestKind): FakeWebsiteRequest[] {
    return this.rows.filter((r) => r.organizationId === organizationId && r.kind === kind);
  }

  private limited(organizationId: string, kind: WebsiteRequestKind, email: string): boolean {
    const since = this.now().getTime() - 3_600_000;
    return this.of(organizationId, kind).filter((r) => r.email === email && Date.parse(r.at) > since).length >= 5;
  }

  private person(b: Record<string, unknown>, errors: Record<string, string>): { name: string | null; email: string | null } {
    const name = clean(b['name']);
    const email = clean(b['email'])?.toLowerCase() ?? null;
    if (!name || name.length > 100) errors['name'] = 'Enter your name.';
    if (!email || !EMAIL.test(email)) errors['email'] = 'Enter an email like name@example.com.';
    return { name, email };
  }

  private store(organizationId: string, kind: WebsiteRequestKind, email: string, fields: Record<string, unknown>): void {
    this.rows.push({ organizationId, kind, email, at: this.now().toISOString(), ...fields });
  }

  contact(organizationId: string, b: Record<string, unknown>): FakeAnswer {
    const errors: Record<string, string> = {};
    const { name, email } = this.person(b, errors);
    const topic = clean(b['topic']);
    const message = clean(b['message']);
    if (!topic || !TOPICS.includes(topic)) errors['topic'] = 'Choose a topic.';
    if (!message) errors['message'] = 'Write your message.';
    else if (message.length > 2000) errors['message'] = 'Use at most 2,000 characters.';
    if (Object.keys(errors).length) return { status: 422, json: { errors } };
    if (this.limited(organizationId, 'contact', email!)) return { status: 429, json: { code: 'too-many' } };
    this.store(organizationId, 'contact', email!, { name, topic, message });
    return { status: 204 };
  }

  volunteer(organizationId: string, b: Record<string, unknown>): FakeAnswer {
    const errors: Record<string, string> = {};
    const { name, email } = this.person(b, errors);
    const phone = clean(b['phone']);
    const area = clean(b['area']);
    const about = clean(b['about']);
    if (phone && phone.length > 30) errors['phone'] = 'Enter a phone number of up to 30 characters.';
    if (!area || !AREAS.includes(area)) errors['area'] = 'Choose how you’d like to help.';
    if (about && about.length > 1000) errors['about'] = 'Use at most 1,000 characters.';
    if (b['screeningAcknowledged'] !== true)
      errors['screeningAcknowledged'] = 'Tick the box to say you understand volunteers are screened.';
    if (Object.keys(errors).length) return { status: 422, json: { errors } };
    if (this.limited(organizationId, 'volunteer', email!)) return { status: 429, json: { code: 'too-many' } };
    this.store(organizationId, 'volunteer', email!, { name, phone, area, about, screeningAcknowledged: true });
    return { status: 204 };
  }

  /** Mirrors backend DonateAsync with a fake payment provider: a checkout per pledge, or 503 unavailable without one (L2-134 criterion 3). */
  donate(organizationId: string, b: Record<string, unknown>, provider: boolean): FakeAnswer {
    const errors: Record<string, string> = {};
    const amount = b['monthlyAmount'];
    if (typeof amount !== 'number' || ![20, 50, 100].includes(amount)) errors['monthlyAmount'] = 'Choose a monthly amount.';
    const { name, email } = this.person(b, errors);
    if (Object.keys(errors).length) return { status: 422, json: { errors } };
    if (this.limited(organizationId, 'donation', email!)) return { status: 429, json: { code: 'too-many' } };
    if (!provider) return { status: 503, json: { code: 'unavailable' } };
    const providerReference = `chk_${String(this.rows.filter((r) => r.kind === 'donation').length + 1).padStart(3, '0')}`;
    this.store(organizationId, 'donation', email!, { name, monthlyAmount: amount, providerReference });
    return { status: 200, json: { checkoutUrl: `https://checkout.example/pay/${providerReference}` } };
  }

  /** A request sent earlier, as a visitor would have. */
  add(organizationId: string, kind: WebsiteRequestKind, email: string): void {
    this.store(organizationId, kind, email.toLowerCase(), {});
  }
}
