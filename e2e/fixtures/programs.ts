// Seeded programs, rosters and events for the fake API. Mirrors backend DatabaseSeeder; "now" is 5 Nov 2026, 4:12 pm in Hamilton (21:12Z).

export const NOW = new Date('2026-11-05T21:12:00Z');

export interface FakeProgram {
  id: string;
  organizationId: string;
  name: string;
  startsOn: string;
  endsOn: string;
  schedule: string | null;
  capacity: number;
  ages: string | null;
  enrollmentOpen: boolean;
  seasonConsent: boolean;
  /** The cohort's term (L2-061); null when none. */
  term: string | null;
  status: 'Active' | 'Archived';
  archivedAt: string | null;
  archivedBy: string | null;
  /** Child ids on the roster. */
  roster: string[];
}

export interface FakeEvent {
  id: string;
  organizationId: string;
  programId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  place: string | null;
  requiresSlip: boolean;
  noShowAlert: boolean;
  staffNotes: string | null;
  status: 'Scheduled' | 'Cancelled' | 'Ended';
  endedAt?: string | null;
  endedBy?: string | null;
  notes?: string | null;
  slipStatus: 'NotNeeded' | 'Draft' | 'Scheduled' | 'Sent';
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationMessage: string | null;
  guardiansTold: boolean;
  /** The weekly series it was created in (L2-093); absent for a single event. */
  seriesId?: string | null;
}

const program = (
  id: string,
  organizationId: string,
  name: string,
  startsOn: string,
  endsOn: string,
  schedule: string,
  capacity: number,
  ages: string,
  roster: string[],
  archived = false,
): FakeProgram => ({
  id,
  organizationId,
  name,
  startsOn,
  endsOn,
  schedule,
  capacity,
  ages,
  enrollmentOpen: !archived,
  seasonConsent: true,
  term: null,
  status: archived ? 'Archived' : 'Active',
  archivedAt: archived ? '2026-09-01T12:00:00Z' : null,
  archivedBy: archived ? 'Marisol Delgado' : null,
  roster,
});

const event = (id: string, organizationId: string, programId: string, name: string, startsAt: string, endsAt: string, place: string, requiresSlip: boolean): FakeEvent => ({
  id,
  organizationId,
  programId,
  name,
  startsAt,
  endsAt,
  place,
  requiresSlip,
  noShowAlert: true,
  staffNotes: null,
  status: 'Scheduled',
  slipStatus: requiresSlip ? 'Draft' : 'NotNeeded',
  cancelledAt: null,
  cancelledBy: null,
  cancellationMessage: null,
  guardiansTold: false,
});

export function seedPrograms(): FakeProgram[] {
  return [
    program('p-tutoring', 'org-harbourview', 'After-School Tutoring', '2026-09-08', '2027-06-24', 'Mon–Thu, 4–6 pm', 50, '6–13', ['c-mateo', 'c-sofia', 'c-jordan', 'c-yusuf']),
    program('p-sports', 'org-harbourview', 'Saturday Sports', '2026-09-12', '2027-05-29', 'Sat, 10 am–12 pm', 80, '7–14', ['c-kevin', 'c-emily']),
    program('p-winter', 'org-harbourview', 'Winter Camp 2026', '2026-12-21', '2026-12-23', '21–23 Dec, 8 am–5 pm', 60, '6–12', []),
    program('p-summer', 'org-harbourview', 'Summer Camp 2026', '2026-07-06', '2026-08-14', 'Mon–Fri, 9 am–4 pm', 40, '6–12', [], true),
    program('p-kids-club', 'org-northgate', 'Kids Club', '2026-09-09', '2027-06-16', 'Wed, 6–7:30 pm', 30, '5–11', ['c-ng-mateo']),
  ];
}

export function seedEvents(): FakeEvent[] {
  return [
    event('e-tutoring-today', 'org-harbourview', 'p-tutoring', 'Tutoring night', '2026-11-05T21:00:00Z', '2026-11-05T23:00:00Z', 'Harbourview Community Centre, Room 2', false),
    event('e-sports', 'org-harbourview', 'p-sports', 'Saturday Sports', '2026-11-07T15:00:00Z', '2026-11-07T17:00:00Z', 'Bennetto School gym', false),
    event('e-rbg', 'org-harbourview', 'p-tutoring', 'Fall field trip: Royal Botanical Gardens', '2026-11-14T14:00:00Z', '2026-11-14T20:00:00Z', 'Royal Botanical Gardens · bus leaves 8:45 am', true),
    event('e-tutoring-yesterday', 'org-harbourview', 'p-tutoring', 'Tutoring night', '2026-11-04T21:00:00Z', '2026-11-04T23:00:00Z', 'Harbourview Community Centre, Room 2', false),
    event('e-kids-club', 'org-northgate', 'p-kids-club', 'Kids Club night', '2026-11-11T23:00:00Z', '2026-11-12T00:00:00Z', 'Northgate fellowship hall', false),
  ];
}

const HAMILTON = 'America/Toronto';
const offsetFormat = new Intl.DateTimeFormat('en-US', { timeZone: HAMILTON, timeZoneName: 'longOffset' });
const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: HAMILTON, year: 'numeric', month: '2-digit', day: '2-digit' });

/** Minutes east of UTC in Hamilton at that moment (−300 in winter, −240 in summer). */
function hamiltonOffset(at: Date): number {
  const name = offsetFormat.formatToParts(at).find((p) => p.type === 'timeZoneName')!.value; // "GMT-05:00"
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}

/** The organization's calendar day (yyyy-mm-dd) of a moment. Mirrors the backend's use of the organization's time zone. */
export function hamiltonDay(iso: string): string {
  return dayFormat.format(new Date(iso));
}

/** Weekly starts at the same Hamilton wall-clock time while the local day is on or before lastDay; one past 60 at most. Mirrors WeeklySeries. */
export function weeklyStarts(first: string, lastDay: string): string[] {
  const start = new Date(first);
  const starts: string[] = [];
  for (let week = 0; starts.length <= 60; week++) {
    const naive = new Date(start.getTime() + week * 7 * 86_400_000);
    const at = new Date(naive.getTime() + (hamiltonOffset(start) - hamiltonOffset(naive)) * 60_000);
    if (hamiltonDay(at.toISOString()) > lastDay) break;
    starts.push(at.toISOString());
  }
  return starts;
}
