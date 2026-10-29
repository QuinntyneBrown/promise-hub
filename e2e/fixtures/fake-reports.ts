import type { FakeCurriculum } from "./fake-curriculum";
import type { FakeLearning, TrackState } from "./fake-learning";
import type { FakeAtRiskFlag } from "./fake-at-risk-flags";
import type { FakeMentorCheckIn } from "./fake-mentor-check-ins";
import { ageOf } from "./households";
import { NOW, type FakeEvent, type FakeProgram } from "./programs";
import type { ModuleId } from "./seed";

/** One Roll Call record as the fake keeps it. */
export interface ReportRecord {
  status: "NotYet" | "Present" | "Absent" | "SignedOut";
  late?: boolean;
  excused?: boolean;
}

/** What the detailed reports read from the rest of the fake API, always for one organization. */
export interface ReportSource {
  organizationId: string;
  modules: ModuleId[];
  programs: FakeProgram[];
  events: FakeEvent[];
  records(eventId: string): Map<string, ReportRecord>;
  /** Children of the organization by id: name and date of birth. */
  children: Map<string, { name: string; dateOfBirth: string | null }>;
  /** Child ids that left each program (ended enrollments). */
  ended(programId: string): string[];
  /** The youth membership linked to a child, or null. */
  youthAccount(childId: string): string | null;
  flags: FakeAtRiskFlag[];
  checkIns: FakeMentorCheckIn[];
  learning: FakeLearning;
  curriculum: FakeCurriculum;
  /** Badge names a youth membership holds, oldest first. */
  badges(membershipId: string): string[];
  /** The name of a child's mentor, or null. */
  mentorName(childId: string): string | null;
  /** The organization's active mentors by id and name. */
  mentors: { id: string; name: string }[];
  /** Each youth's mentor, child id to mentor id. */
  youthMentors: Map<string, string>;
  /** Each program's mentor team. */
  teams: Map<string, { lead: string | null; supporting: string[] }>;
  /** Accepted or sent-back reviews: who and when. */
  reviews: { actor: string; at: string }[];
  /** The organization's today (yyyy-mm-dd). */
  today: string;
}

const percent = (part: number, whole: number): number | null =>
  whole ? Math.round((100 * part) / whole) : null;
const average = (values: (number | null)[]): number | null => {
  const known = values.filter((v): v is number => v !== null);
  return known.length
    ? Math.round(known.reduce((a, b) => a + b, 0) / known.length)
    : null;
};

/** Attended (present or late) of marked records, as AttendanceMarks counts them. */
function rate(records: ReportRecord[]): number | null {
  const marked = records.filter((r) => r.status !== "NotYet");
  return percent(
    marked.filter((r) => r.status === "Present" || r.status === "SignedOut")
      .length,
    marked.length,
  );
}

interface CohortFacts {
  active: string[];
  ended: string[];
  records: { childId: string; record: ReportRecord }[];
  track: TrackState["track"] | null;
  modules: { id: string; title: string }[];
  learning: Map<
    string,
    { completion: number | null; modules: Map<string, number> }
  >;
}

/** Mirrors backend DetailedReportsHandler (L2-127, L2-128, L2-131, ADR 0074). */
export class FakeReports {
  private facts(s: ReportSource, program: FakeProgram): CohortFacts {
    const sessions = s.events.filter(
      (e) =>
        e.programId === program.id &&
        e.status !== "Cancelled" &&
        e.startsAt <= NOW.toISOString(),
    );
    const records = sessions
      .flatMap((e) =>
        [...s.records(e.id)].map(([childId, record]) => ({ childId, record })),
      )
      .filter((r) => r.record.status !== "NotYet");
    const trackId = s.curriculum.programTracks.get(program.id);
    const track =
      s.curriculum.tracks.find(
        (t) => t.id === trackId && t.status === "Published",
      ) ?? null;
    const modules = track
      ? s.curriculum.modules
          .filter((m) => m.trackId === track.id && m.status === "Published")
          .sort((a, b) => a.position - b.position)
          .map((m) => ({ id: m.id, title: m.title }))
      : [];
    const learning = new Map<
      string,
      { completion: number | null; modules: Map<string, number> }
    >();
    if (s.modules.includes("Learning") && track) {
      for (const childId of [...program.roster, ...s.ended(program.id)]) {
        const membership = s.youthAccount(childId);
        if (!membership) continue;
        const state = s.learning
          .tracks(
            membership,
            s.programs.filter(
              (p) => p.status === "Active" && p.roster.includes(childId),
            ),
          )
          .find((t) => t.track.id === track.id);
        if (!state) continue;
        const done = state.modules.reduce(
          (n, m) => n + m.lessons.filter((l) => l.done).length,
          0,
        );
        const total = state.modules.reduce((n, m) => n + m.lessons.length, 0);
        learning.set(childId, {
          completion: percent(done, total),
          modules: new Map(
            state.modules.map((m) => [
              m.module.id,
              percent(
                m.lessons.filter((l) => l.done).length,
                m.lessons.length,
              ) ?? 0,
            ]),
          ),
        });
      }
    }
    return {
      active: [...program.roster],
      ended: s.ended(program.id),
      records,
      track,
      modules,
      learning,
    };
  }

  /** GET /reports/cohorts/{id} once the caller may read reports; null when the program is not the organization's. */
  cohort(s: ReportSource, programId: string) {
    const program = s.programs.find(
      (p) => p.id === programId && p.organizationId === s.organizationId,
    );
    if (!program) return null;
    const learningOn = s.modules.includes("Learning");
    const mentoringOn = s.modules.includes("Mentoring");
    const rollCallOn = s.modules.includes("RollCall");
    const f = this.facts(s, program);
    const flagged = new Set(
      s.flags
        .filter(
          (x) => x.organizationId === s.organizationId && x.status === "Open",
        )
        .map((x) => x.childId),
    );
    const youth = [...f.active, ...f.ended]
      .map((id) => {
        const status = f.ended.includes(id)
          ? "Ended"
          : mentoringOn && flagged.has(id)
            ? "AtRisk"
            : "OnTrack";
        return {
          childId: id,
          name: s.children.get(id)?.name ?? id,
          hasAccount: !!s.youthAccount(id),
          learning: learningOn
            ? (f.learning.get(id)?.completion ?? null)
            : null,
          attendanceRate: rollCallOn
            ? rate(
                f.records.filter((r) => r.childId === id).map((r) => r.record),
              )
            : null,
          checkIns: mentoringOn
            ? s.checkIns.filter(
                (c) =>
                  c.organizationId === s.organizationId &&
                  c.childId === id &&
                  c.date >= program.startsOn,
              ).length
            : null,
          status,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    const activeLearning = f.active
      .map((id) => f.learning.get(id))
      .filter((l) => !!l);
    return {
      programId: program.id,
      name: program.name,
      trackName: f.track?.name ?? null,
      enrolled: f.active.length,
      ended: f.ended.length,
      retentionRate: percent(f.active.length, f.active.length + f.ended.length),
      attendanceRate: rollCallOn ? rate(f.records.map((r) => r.record)) : null,
      learning: learningOn
        ? {
            averageCompletion: average(activeLearning.map((l) => l.completion)),
            modules: f.modules.map((m) => ({
              moduleId: m.id,
              title: m.title,
              completion:
                average(
                  activeLearning.map((l) => l.modules.get(m.id) ?? null),
                ) ?? 0,
            })),
          }
        : null,
      atRisk: mentoringOn
        ? youth.filter((y) => y.status === "AtRisk").length
        : null,
      comparison: this.comparison(s, learningOn, rollCallOn),
      youth,
    };
  }

  /** GET /reports/youth/{id} once the caller may read reports; null when the child is not the organization's. */
  youth(s: ReportSource, childId: string) {
    const child = s.children.get(childId);
    if (!child) return null;
    const programs = s.programs.filter((p) => p.status === 'Active' && p.roster.includes(childId));
    const account = s.youthAccount(childId);
    let learning = null;
    if (s.modules.includes('Learning') && account) {
      const tracks = s.learning.tracks(account, programs);
      const modules = tracks.flatMap((t) => t.modules);
      const quizzes = modules
        .flatMap((m) => m.quizzes)
        .map((q) => ({ quizId: q.quiz.id, title: q.quiz.title, best: s.learning.quizzes.best(account, q.quiz.id)?.score ?? null }))
        .filter((q) => q.best !== null)
        .map((q) => ({ quizId: q.quizId, title: q.title, bestScore: q.best! }));
      const done = modules.reduce((n, m) => n + m.lessons.filter((l) => l.done).length, 0);
      const total = modules.reduce((n, m) => n + m.lessons.length, 0);
      learning = {
        completedLessons: done,
        totalLessons: total,
        completion: percent(done, total),
        quizAverage: average(quizzes.map((q) => q.bestScore)),
        modules: modules.map((m) => {
          const d = m.lessons.filter((l) => l.done).length;
          const complete = m.lessons.length > 0 && d === m.lessons.length && m.quizzes.filter((q) => q.quiz.requiredToComplete).every((q) => q.passed);
          return { moduleId: m.module.id, title: m.module.title, done: d, total: m.lessons.length, state: complete ? 'Done' : d > 0 ? 'InProgress' : 'NotStarted' };
        }),
        quizzes,
        badges: s.badges(account),
      };
    }
    let attendance = null;
    if (s.modules.includes('RollCall')) {
      const marks = s.events.map((e) => s.records(e.id).get(childId)).filter((r): r is ReportRecord => !!r && r.status !== 'NotYet');
      const present = marks.filter((r) => r.status !== 'Absent' && !r.late).length;
      const late = marks.filter((r) => r.status !== 'Absent' && r.late).length;
      const excused = marks.filter((r) => r.status === 'Absent' && r.excused).length;
      const absent = marks.filter((r) => r.status === 'Absent' && !r.excused).length;
      attendance = { present, late, excused, absent, rate: percent(present + late, marks.length) };
    }
    let mentoring = null;
    if (s.modules.includes('Mentoring')) {
      const mine = s.checkIns.filter((c) => c.organizationId === s.organizationId && c.childId === childId).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
      mentoring = {
        mentorName: s.mentorName(childId),
        checkIns: mine.length,
        latestOn: mine[0]?.date ?? null,
        latestEngagement: mine[0]?.engagement ?? null,
        openFlag: s.flags.some((f) => f.organizationId === s.organizationId && f.childId === childId && f.status === 'Open'),
      };
    }
    return {
      childId,
      name: child.name,
      age: ageOf(child.dateOfBirth),
      programs: programs.map((p) => p.name).sort((a, b) => a.localeCompare(b)),
      hasAccount: !!account,
      learning,
      attendance,
      mentoring,
    };
  }

  /** GET /reports/staff (L2-128) once Mentoring is on and the caller may read reports. */
  staff(s: ReportSource, days: number | null) {
    const from = days ? new Date(new Date(`${s.today}T12:00:00Z`).getTime() - days * 86_400_000).toISOString().slice(0, 10) : null;
    const learningOn = s.modules.includes('Learning');
    const mentors = [...s.mentors]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((m) => {
        const caseload = [...s.youthMentors.values()].filter((id) => id === m.id).length;
        const cohorts = s.programs
          .filter((p) => p.status === 'Active')
          .map((p) => ({ p, team: s.teams.get(p.id) }))
          .filter(({ team }) => team && (team.lead === m.id || team.supporting.includes(m.id)))
          .map(({ p, team }) => ({ programId: p.id, name: p.name, lead: team!.lead === m.id }))
          .sort((a, b) => a.name.localeCompare(b.name));
        return {
          membershipId: m.id,
          name: m.name,
          cohorts,
          caseload,
          checkIns: s.checkIns.filter((c) => c.organizationId === s.organizationId && c.mentorId === m.id && (!from || c.date > from)).length,
          reviews: learningOn ? s.reviews.filter((r) => r.actor === m.name && (!from || r.at.slice(0, 10) >= from)).length : null,
          load: caseload > 8 ? 'Overloaded' : caseload < 4 ? 'Underloaded' : 'Balanced',
        };
      });
    return {
      activeMentors: mentors.length,
      checkIns: mentors.reduce((n, m) => n + m.checkIns, 0),
      reviews: learningOn ? mentors.reduce((n, m) => n + (m.reviews ?? 0), 0) : null,
      averageCaseload: mentors.length ? Math.round((mentors.reduce((n, m) => n + m.caseload, 0) / mentors.length) * 10) / 10 : 0,
      mentors,
    };
  }

  private comparison(
    s: ReportSource,
    learningOn: boolean,
    rollCallOn: boolean,
  ) {
    const all = s.programs
      .filter(
        (p) => p.organizationId === s.organizationId && p.status === "Active",
      )
      .map((p) => this.facts(s, p));
    const active = all.reduce((n, f) => n + f.active.length, 0);
    const ended = all.reduce((n, f) => n + f.ended.length, 0);
    return {
      attendanceRate: rollCallOn
        ? rate(all.flatMap((f) => f.records.map((r) => r.record)))
        : null,
      retentionRate: percent(active, active + ended),
      averageCompletion: learningOn
        ? average(
            all.flatMap((f) =>
              f.active.map((id) => f.learning.get(id)?.completion ?? null),
            ),
          )
        : null,
    };
  }
}
