import type { Route } from '@playwright/test';
import type { FakeAssignment } from './fake-assessments';

/** The day the fake API treats as today, as the API's clock in the tests. */
export const TODAY = '2026-11-05';

/** What the assignment routes need to know about the youth's module: the assignment as she stands with it, or null when not visible. */
export interface AssignmentPlace {
  assignment: FakeAssignment;
  moduleId: string;
  moduleTitle: string;
  lessonTitle: string | null;
  trackId: string;
  locked: boolean;
  unlockAfter: string | null;
}

const days = (iso: string) =>
  Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000;

/** Open until the due date plus the grace days; then late when late work is accepted, otherwise closed (ADR 0056). */
export function dueState(a: FakeAssignment, today = TODAY): 'open' | 'late' | 'closed' {
  if (!a.dueDate || days(today) <= days(a.dueDate) + a.graceDays) return 'open';
  return a.allowLate ? 'late' : 'closed';
}

/**
 * Assignment submissions as the API answers them (L2-077, L2-078, ADR 0056). FakeApi checks the Learning module, Learn, consent and
 * placement first; the caller sees only her own submissions and only assignments visible to her.
 */
export type FakeSubmissionStatus = 'Submitted' | 'InReview' | 'NeedsRevision' | 'Accepted';

export interface FakeSubmissionEvent {
  kind: 'Submitted' | 'ReviewStarted' | 'RevisionRequested' | 'Resubmitted' | 'Accepted';
  actor: string;
  note: string | null;
  at: string;
}

export interface FakeSubmission {
  id: string;
  membershipId: string;
  assignmentId: string;
  text: string | null;
  link: string | null;
  file: { name: string; kind: 'Photo' | 'File'; type: string; bytes: Buffer } | null;
  late: boolean;
  status: FakeSubmissionStatus;
  round: number;
  submittedAt: string;
  feedback: string | null;
  reviewerName: string | null;
  points: number | null;
  history: FakeSubmissionEvent[];
}

interface FormPart {
  value: string;
  fileName: string | null;
  type: string | null;
  bytes: Buffer;
}

/** The parts of a multipart/form-data body by field name. */
function parseForm(body: Buffer, contentType: string): Map<string, FormPart> {
  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType);
  const parts = new Map<string, FormPart>();
  if (!boundary) return parts;
  const marker = Buffer.from(`--${boundary[1] ?? boundary[2]}`);
  let at = body.indexOf(marker);
  while (at !== -1) {
    const start = at + marker.length + 2;
    const next = body.indexOf(marker, start);
    if (next === -1) break;
    const part = body.subarray(start, next - 2);
    const split = part.indexOf('\r\n\r\n');
    const head = part.subarray(0, split).toString('utf-8');
    const bytes = part.subarray(split + 4);
    const name = /name="([^"]*)"/.exec(head)?.[1];
    if (name)
      parts.set(name, {
        value: bytes.toString('utf-8'),
        fileName: /filename="([^"]*)"/.exec(head)?.[1] ?? null,
        type: /content-type:\s*([^\r\n]+)/i.exec(head)?.[1]?.trim() ?? null,
        bytes,
      });
    at = next;
  }
  return parts;
}

const SIGNATURES: Record<string, number[]> = { 'image/png': [137, 80, 78, 71, 13, 10, 26, 10], 'image/jpeg': [0xff, 0xd8, 0xff], 'application/pdf': [0x25, 0x50, 0x44, 0x46, 0x2d] };
const EXTENSIONS: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.pdf': 'application/pdf' };

/** The kind a file counts as for an assignment, or null when refused (ADR 0056). */
function acceptFile(a: FakeAssignment, part: FormPart): 'Photo' | 'File' | null {
  const ext = /\.[^.]+$/.exec(part.fileName ?? '')?.[0]?.toLowerCase() ?? '';
  const type = EXTENSIONS[ext];
  if (!type || type !== part.type || part.bytes.length < 1 || part.bytes.length > 10 * 1024 * 1024) return null;
  if (!SIGNATURES[type]!.every((b, i) => part.bytes[i] === b)) return null;
  if (type !== 'application/pdf' && a.submissionTypes.includes('Photo')) return 'Photo';
  return a.submissionTypes.includes('File') ? 'File' : null;
}

/**
 * Assignment submissions as the API answers them (L2-077, L2-078, ADR 0056). FakeApi checks the Learning module, Learn, consent and
 * placement first; the caller sees only her own submissions and only assignments visible to her.
 */
export class FakeSubmissions {
  private nextId = 1;
  private readonly submissions: FakeSubmission[] = [];

  /** Answers every brief and status read with 500, to show the error states. */
  failReads = false;

  /** Answers every submit and resubmit with 500, to show the failed state. */
  failSubmits = false;

  all(): FakeSubmission[] {
    return this.submissions;
  }

  clear(): void {
    this.submissions.length = 0;
  }

  /** Seeds a submission, as if sent earlier, in the status given. */
  seed(s: Partial<FakeSubmission> & { membershipId: string; assignmentId: string }): FakeSubmission {
    const at = s.submittedAt ?? '2026-11-03T21:12:00Z';
    const row: FakeSubmission = {
      id: `sub-${this.nextId++}`,
      text: null,
      link: null,
      file: null,
      late: false,
      status: 'Submitted',
      round: 1,
      submittedAt: at,
      feedback: null,
      reviewerName: null,
      points: null,
      history: [{ kind: 'Submitted', actor: 'Sofía Rivera', note: null, at }],
      ...s,
    };
    this.submissions.push(row);
    return row;
  }

  /** The mentor starts reviewing it (prompt 63). */
  startReview(id: string, mentor = 'Daniel Osei', at = '2026-11-04T14:30:00Z'): void {
    const s = this.byId(id)!;
    Object.assign(s, { status: 'InReview', reviewerName: mentor });
    s.history.push({ kind: 'ReviewStarted', actor: mentor, note: null, at });
  }

  /** The mentor asks for a revision with a note (prompt 63). */
  requestRevision(id: string, note: string, mentor = 'Daniel Osei', at = '2026-11-04T14:45:00Z'): void {
    const s = this.byId(id)!;
    Object.assign(s, { status: 'NeedsRevision', feedback: note, reviewerName: mentor });
    s.history.push({ kind: 'RevisionRequested', actor: mentor, note, at });
  }

  /** The mentor accepts it with points and a comment (prompt 63). */
  accept(id: string, points: number, note: string, mentor = 'Daniel Osei', at = '2026-11-05T15:20:00Z'): void {
    const s = this.byId(id)!;
    Object.assign(s, { status: 'Accepted', points, feedback: note, reviewerName: mentor });
    s.history.push({ kind: 'Accepted', actor: mentor, note, at });
  }

  private byId(id: string): FakeSubmission | undefined {
    return this.submissions.find((s) => s.id === id);
  }

  /** The caller's submission of an assignment, or undefined. */
  mine(membershipId: string, assignmentId: string): FakeSubmission | undefined {
    return this.submissions.find((s) => s.membershipId === membershipId && s.assignmentId === assignmentId);
  }

  /** An assignment's state on the module page: locked, next, or her submission's status. */
  state(membershipId: string, assignmentId: string, locked: boolean): string {
    if (locked) return 'locked';
    const sub = this.mine(membershipId, assignmentId);
    if (!sub) return 'next';
    return { Submitted: 'submitted', InReview: 'in-review', NeedsRevision: 'needs-revision', Accepted: 'accepted' }[sub.status];
  }

  /** GET /learning/assignments/{id}. */
  brief(route: Route, membershipId: string, place: AssignmentPlace | null, mentorName: string | null): Promise<void> {
    if (this.failReads) return route.fulfill({ status: 500 });
    if (!place) return route.fulfill({ status: 404 });
    if (place.locked) return route.fulfill({ status: 403, json: { code: 'locked', unlockAfter: place.unlockAfter } });
    const a = place.assignment;
    const sub = this.mine(membershipId, a.id);
    return route.fulfill({
      json: {
        id: a.id,
        title: a.title,
        moduleId: place.moduleId,
        moduleTitle: place.moduleTitle,
        lessonTitle: place.lessonTitle,
        brief: a.brief ?? '',
        submissionTypes: (['Text', 'Photo', 'Link', 'File'] as const).filter((t) => a.submissionTypes.includes(t)),
        rubric: a.rubric,
        totalPoints: a.rubric.reduce((n, r) => n + r.points, 0),
        dueDate: a.dueDate,
        graceDays: a.graceDays,
        allowLate: a.allowLate,
        dueState: dueState(a),
        daysLeft: a.dueDate ? days(a.dueDate) - days(TODAY) : null,
        mentorName,
        submission: sub ? { id: sub.id, status: sub.status } : null,
      },
    });
  }

  /** The attestation, the allowed kinds of work and their limits, as SubmissionCommand checks them. */
  private check(a: FakeAssignment, form: Map<string, FormPart>, keepsFile: boolean): { text: string | null; link: string | null; file: FormPart | null; kind: 'Photo' | 'File' | null; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    const text = form.get('text')?.value.trim() || null;
    const link = form.get('link')?.value.trim() || null;
    const file = form.get('file')?.fileName ? form.get('file')! : null;
    const takes = (t: string) => a.submissionTypes.includes(t as never);
    if (form.get('attest')?.value !== 'true') errors['attest'] = 'Confirm this is your own work.';
    if (text && !takes('Text')) errors['text'] = 'This assignment doesn’t take a reflection.';
    else if (text && text.length > 5000) errors['text'] = 'Keep your reflection under 5,000 characters.';
    if (link && !takes('Link')) errors['link'] = 'This assignment doesn’t take a link.';
    else if (link && link.length > 500) errors['link'] = 'Keep the link under 500 characters.';
    else if (link && !/^https?:\/\/[^\s]+$/i.test(link)) errors['link'] = 'Enter a full web address starting with http:// or https://.';
    if (file && !takes('Photo') && !takes('File')) errors['file'] = 'This assignment doesn’t take a file.';
    if (!text && !link && !file && !keepsFile) {
      if (takes('Text')) errors['text'] ??= 'Write your reflection.';
      else if (takes('Photo')) errors['file'] ??= 'Add your photo.';
      else if (takes('File')) errors['file'] ??= 'Add your file.';
      else errors['link'] ??= 'Add your link.';
    }
    let kind: 'Photo' | 'File' | null = null;
    if (file && !errors['file']) {
      kind = acceptFile(a, file);
      if (!kind) errors['file'] = takes('File') ? 'Choose a PDF, JPG or PNG file of up to 10 MB.' : 'Choose a JPG or PNG photo of up to 10 MB.';
    }
    return { text, link, file, kind, errors };
  }

  /** POST /learning/assignments/{id}/submission (multipart). */
  submit(route: Route, membershipId: string, actor: string, place: AssignmentPlace | null): Promise<void> {
    if (this.failSubmits) return route.fulfill({ status: 500 });
    if (!place) return route.fulfill({ status: 404 });
    if (place.locked) return route.fulfill({ status: 403, json: { code: 'locked', unlockAfter: place.unlockAfter } });
    const a = place.assignment;
    if (this.mine(membershipId, a.id)) return route.fulfill({ status: 409, json: { code: 'submitted' } });
    const due = dueState(a);
    if (due === 'closed') return route.fulfill({ status: 409, json: { code: 'closed' } });
    const form = parseForm(route.request().postDataBuffer() ?? Buffer.alloc(0), route.request().headers()['content-type'] ?? '');
    const { text, link, file, kind, errors } = this.check(a, form, false);
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const at = `${TODAY}T21:12:00Z`;
    const row = this.seed({
      membershipId,
      assignmentId: a.id,
      text,
      link,
      file: file && kind ? { name: file.fileName!, kind, type: file.type!, bytes: Buffer.from(file.bytes) } : null,
      late: due === 'late',
      submittedAt: at,
      history: [{ kind: 'Submitted', actor, note: null, at }],
    });
    return route.fulfill({ status: 201, json: { id: row.id } });
  }

  /** POST /learning/submissions/{id}/resubmit (multipart): only from NeedsRevision. */
  resubmit(route: Route, membershipId: string, actor: string, id: string, placeOf: (assignmentId: string) => AssignmentPlace | null): Promise<void> {
    if (this.failSubmits) return route.fulfill({ status: 500 });
    const sub = this.byId(id);
    const place = sub && sub.membershipId === membershipId ? placeOf(sub.assignmentId) : null;
    if (!sub || !place) return route.fulfill({ status: 404 });
    if (sub.status !== 'NeedsRevision') return route.fulfill({ status: 409, json: { code: 'not-revisable' } });
    const form = parseForm(route.request().postDataBuffer() ?? Buffer.alloc(0), route.request().headers()['content-type'] ?? '');
    const removeFile = form.get('removeFile')?.value === 'true';
    const { text, link, file, kind, errors } = this.check(place.assignment, form, !!sub.file && !removeFile);
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const at = `${TODAY}T23:05:00Z`;
    Object.assign(sub, {
      text,
      link,
      file: file && kind ? { name: file.fileName!, kind, type: file.type!, bytes: Buffer.from(file.bytes) } : removeFile ? null : sub.file,
      status: 'Submitted',
      round: sub.round + 1,
      submittedAt: at,
    });
    sub.history.push({ kind: 'Resubmitted', actor, note: null, at });
    return route.fulfill({ json: { id: sub.id } });
  }

  /** GET /learning/submissions/{id}: her own only. */
  view(route: Route, membershipId: string, id: string, placeOf: (assignmentId: string) => AssignmentPlace | null, mentorOf: (trackId: string) => string | null): Promise<void> {
    if (this.failReads) return route.fulfill({ status: 500 });
    const sub = this.byId(id);
    const place = sub && sub.membershipId === membershipId ? placeOf(sub.assignmentId) : null;
    if (!sub || !place) return route.fulfill({ status: 404 });
    return route.fulfill({
      json: {
        id: sub.id,
        assignmentId: sub.assignmentId,
        assignmentTitle: place.assignment.title,
        moduleId: place.moduleId,
        moduleTitle: place.moduleTitle,
        status: sub.status,
        late: sub.late,
        round: sub.round,
        text: sub.text,
        link: sub.link,
        file: sub.file ? { name: sub.file.name, kind: sub.file.kind, bytes: sub.file.bytes.length } : null,
        feedback: sub.feedback,
        reviewerName: sub.reviewerName,
        mentorName: mentorOf(place.trackId),
        points: sub.points,
        totalPoints: place.assignment.rubric.reduce((n, r) => n + r.points, 0),
        submittedAt: sub.submittedAt,
        history: sub.history,
      },
    });
  }

  /** GET /learning/submissions/{id}/file: her own only, as an attachment. */
  file(route: Route, membershipId: string, id: string, placeOf: (assignmentId: string) => AssignmentPlace | null): Promise<void> {
    const sub = this.byId(id);
    if (!sub?.file || sub.membershipId !== membershipId || !placeOf(sub.assignmentId)) return route.fulfill({ status: 404 });
    return route.fulfill({
      status: 200,
      contentType: sub.file.type,
      body: sub.file.bytes,
      headers: { 'content-disposition': `attachment; filename="${sub.file.name}"`, 'x-content-type-options': 'nosniff' },
    });
  }
}
