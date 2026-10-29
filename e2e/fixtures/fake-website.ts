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
