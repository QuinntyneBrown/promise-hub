import type { Route } from '@playwright/test';
import type { FakeCurriculum } from './fake-curriculum';
import type { FakeCompetency } from './fake-reviews';
import type { Membership } from './seed';

export type BadgeKind = 'Automatic' | 'Manual';
export type BadgeRule = 'LessonCompleted' | 'ModuleCompleted' | 'QuizPassed' | 'AssignmentAccepted';

export interface FakeBadge {
  id: string;
  organizationId: string;
  name: string;
  icon: string;
  description: string | null;
  kind: BadgeKind;
  rule: BadgeRule | null;
  targetId: string | null;
  competencyId: string | null;
  deleted: boolean;
}

export interface FakeBadgeAward {
  id: string;
  organizationId: string;
  badgeId: string;
  membershipId: string;
  awardedAt: string;
  awardedBy: string | null;
}

/** What a youth has done, as the learning fakes know it. */
export interface BadgeProgress {
  lessonDone: (lessonId: string) => boolean;
  quizPassed: (quizId: string) => boolean;
  accepted: (assignmentId: string) => boolean;
}

const ICONS = ['star', 'award', 'heart', 'flag', 'book', 'sparkle', 'people', 'check'];
const RULES: BadgeRule[] = ['LessonCompleted', 'ModuleCompleted', 'QuizPassed', 'AssignmentAccepted'];
const NOUN: Record<BadgeRule, string> = {
  LessonCompleted: 'lesson',
  ModuleCompleted: 'module',
  QuizPassed: 'quiz',
  AssignmentAccepted: 'assignment',
};
const clean = (v: string | null | undefined): string | null => (v && v.trim() ? v.trim() : null);

const badge = (
  id: string,
  name: string,
  icon: string,
  description: string,
  kind: BadgeKind,
  rule: BadgeRule | null,
  targetId: string | null,
  competencyId: string | null,
): FakeBadge => ({
  id,
  organizationId: 'org-harbourview',
  name,
  icon,
  description,
  kind,
  rule,
  targetId,
  competencyId,
  deleted: false,
});

/**
 * Badges and their awards as the API answers them (L2-084, L2-085, ADR 0058). Every call reaches it only after FakeApi checked the Learning
 * module and AuthorCurriculum, and it sees only the caller's organization.
 */
export class FakeBadges {
  private nextId = 1;

  constructor(
    private readonly curriculum: FakeCurriculum,
    private readonly competencies: () => FakeCompetency[],
    private readonly memberships: () => Membership[],
  ) {}

  /** Harbourview's badges, as in the curriculum-badge mocks. */
  badges: FakeBadge[] = [
    badge('b-first', 'First Steps', 'star', 'Finished a first lesson.', 'Automatic', 'LessonCompleted', 'l-towel', null),
    badge('b-servant', 'Servant Heart', 'heart', 'Finished Leading by Serving.', 'Automatic', 'ModuleCompleted', 'cm-serving', 'cp-serves'),
    badge('b-quiz', 'Quiz Champion', 'award', 'Passed the Leading by Serving quiz.', 'Automatic', 'QuizPassed', 'qz-serving', null),
    badge('b-served', 'Served Someone', 'check', 'Had Serve someone this week accepted.', 'Automatic', 'AssignmentAccepted', 'as-serve', 'cp-serves'),
    badge('b-speaks', 'Speaks Up', 'flag', 'Shared an idea with the whole group.', 'Manual', null, null, 'cp-speaks'),
    badge('b-encourager', 'Encourager', 'sparkle', 'Lifted someone up in the group.', 'Manual', null, null, null),
  ];

  awards: FakeBadgeAward[] = [
    {
      id: 'ba-1',
      organizationId: 'org-harbourview',
      badgeId: 'b-first',
      membershipId: 'm-sofia',
      awardedAt: '2026-11-02T16:00:00Z',
      awardedBy: null,
    },
    {
      id: 'ba-2',
      organizationId: 'org-harbourview',
      badgeId: 'b-first',
      membershipId: 'm-nadia',
      awardedAt: '2026-11-03T16:00:00Z',
      awardedBy: null,
    },
    {
      id: 'ba-3',
      organizationId: 'org-harbourview',
      badgeId: 'b-servant',
      membershipId: 'm-sofia',
      awardedAt: '2026-11-05T15:00:00Z',
      awardedBy: null,
    },
    {
      id: 'ba-4',
      organizationId: 'org-harbourview',
      badgeId: 'b-served',
      membershipId: 'm-sofia',
      awardedAt: '2026-11-04T20:00:00Z',
      awardedBy: null,
    },
    {
      id: 'ba-5',
      organizationId: 'org-harbourview',
      badgeId: 'b-speaks',
      membershipId: 'm-sofia',
      awardedAt: '2026-11-04T18:00:00Z',
      awardedBy: 'Marisol Delgado',
    },
  ];

  /** Adds a badge of Harbourview, as a program director would. */
  add(b: Pick<FakeBadge, 'id' | 'name' | 'icon' | 'kind'> & Partial<FakeBadge>): void {
    this.badges.push({ organizationId: 'org-harbourview', description: null, rule: null, targetId: null, competencyId: null, deleted: false, ...b });
  }

  /** The youth memberships holding a badge. */
  holders(badgeId: string): string[] {
    return this.awards.filter((a) => a.badgeId === badgeId).map((a) => a.membershipId);
  }

  find(id: string): FakeBadge | undefined {
    return this.badges.find((b) => b.id === id);
  }

  /** Removes every badge of an organization, for the empty state. */
  clear(organizationId: string): void {
    this.badges = this.badges.filter((b) => b.organizationId !== organizationId);
  }

  private live(org: string, id: string): FakeBadge | undefined {
    return this.badges.find((b) => b.id === id && b.organizationId === org && !b.deleted);
  }

  private targetTitle(b: FakeBadge): string | null {
    if (!b.targetId) return null;
    const c = this.curriculum;
    return (
      c.lessons.find((l) => l.id === b.targetId)?.title ??
      c.modules.find((m) => m.id === b.targetId)?.title ??
      c.assessments.quizzes.find((q) => q.id === b.targetId)?.title ??
      c.assessments.assignments.find((a) => a.id === b.targetId)?.title ??
      null
    );
  }

  private competencyName(id: string | null): string | null {
    return id ? (this.competencies().find((c) => c.id === id)?.name ?? null) : null;
  }

  private summary(b: FakeBadge) {
    return {
      id: b.id,
      name: b.name,
      icon: b.icon,
      description: b.description,
      kind: b.kind,
      rule: b.rule,
      targetId: b.targetId,
      targetTitle: this.targetTitle(b),
      competencyId: b.competencyId,
      competencyName: this.competencyName(b.competencyId),
      earnedCount: this.awards.filter((a) => a.badgeId === b.id).length,
    };
  }

  /** GET /curriculum/badges. */
  list(route: Route, org: string): Promise<void> {
    const badges = this.badges.filter((b) => b.organizationId === org && !b.deleted);
    const ids = new Set(badges.map((b) => b.id));
    const awards = this.awards.filter((a) => ids.has(a.badgeId));
    return route.fulfill({
      json: {
        badges: badges.map((b) => this.summary(b)),
        awards: awards.length,
        youth: new Set(awards.map((a) => a.membershipId)).size,
      },
    });
  }

  /** GET /curriculum/badges/options. */
  options(route: Route, org: string): Promise<void> {
    const c = this.curriculum;
    const tracks = c.tracks.filter((t) => t.organizationId === org);
    const modules = tracks.flatMap((t) =>
      c.modules
        .filter((m) => m.trackId === t.id)
        .sort((a, b) => a.position - b.position)
        .map((m) => ({ m, track: t.name })),
    );
    const moduleTitle = (id: string) => c.modules.find((m) => m.id === id)?.title ?? '';
    const moduleIds = modules.map((x) => x.m.id);
    return route.fulfill({
      json: {
        lessons: moduleIds.flatMap((id) =>
          c.lessonsOf(id).map((l) => ({
            id: l.id,
            title: `${moduleTitle(id)} · ${l.title}`,
          })),
        ),
        modules: modules.map((x) => ({
          id: x.m.id,
          title: `${x.track} · ${x.m.title}`,
        })),
        quizzes: c.assessments.quizzes
          .filter((q) => moduleIds.includes(q.moduleId))
          .map((q) => ({
            id: q.id,
            title: `${moduleTitle(q.moduleId)} · ${q.title}`,
          })),
        assignments: c.assessments.assignments
          .filter((a) => moduleIds.includes(a.moduleId))
          .map((a) => ({
            id: a.id,
            title: `${moduleTitle(a.moduleId)} · ${a.title}`,
          })),
        competencies: this.competencies()
          .filter((x) => x.organizationId === org && !x.removed)
          .map((x) => ({ id: x.id, name: x.name })),
      },
    });
  }

  /** GET /curriculum/badges/{id}. */
  get(route: Route, org: string, id: string): Promise<void> {
    const b = this.live(org, id);
    if (!b) return route.fulfill({ status: 404 });
    const name = (mid: string) => this.memberships().find((m) => m.id === mid)?.personName ?? '';
    const awards = this.awards
      .filter((a) => a.badgeId === id)
      .sort((x, y) => y.awardedAt.localeCompare(x.awardedAt))
      .map((a) => ({
        id: a.id,
        membershipId: a.membershipId,
        youthName: name(a.membershipId),
        awardedAt: a.awardedAt,
        awardedBy: a.awardedBy,
      }));
    const held = new Set(awards.map((a) => a.membershipId));
    const youth = this.memberships()
      .filter((m) => m.organizationId === org && m.role === 'Youth' && !held.has(m.id))
      .sort((x, y) => x.personName.localeCompare(y.personName))
      .map((m) => ({ membershipId: m.id, name: m.personName }));
    const { earnedCount: _, ...rest } = this.summary(b);
    return route.fulfill({ json: { ...rest, awards, youth } });
  }

  private check(
    org: string,
    body: Record<string, unknown>,
  ): {
    errors: Record<string, string>;
    fields?: Omit<FakeBadge, 'id' | 'organizationId' | 'deleted'>;
  } {
    const errors: Record<string, string> = {};
    const name = clean(body['name'] as string);
    const description = clean(body['description'] as string);
    if (!name) errors['name'] = 'Give the badge a name.';
    else if (name.length > 60) errors['name'] = 'Keep the name under 60 characters.';
    if ((description?.length ?? 0) > 200) errors['description'] = 'Keep the description under 200 characters.';
    const icon = body['icon'] as string;
    if (!ICONS.includes(icon)) errors['icon'] = 'Choose an icon.';
    const kind = body['kind'] as BadgeKind;
    if (kind !== 'Automatic' && kind !== 'Manual') errors['kind'] = 'Choose how it’s earned.';
    let rule: BadgeRule | null = null;
    let targetId: string | null = null;
    if (kind === 'Automatic') {
      rule = RULES.includes(body['rule'] as BadgeRule) ? (body['rule'] as BadgeRule) : null;
      if (!rule) errors['rule'] = 'Choose a rule.';
      else {
        targetId = (body['targetId'] as string) ?? null;
        const c = this.curriculum;
        const orgModules = c.modules.filter((m) => c.tracks.some((t) => t.id === m.trackId && t.organizationId === org)).map((m) => m.id);
        const exists = {
          LessonCompleted: () => c.lessons.some((l) => l.id === targetId && !l.deleted && orgModules.includes(l.moduleId)),
          ModuleCompleted: () => orgModules.includes(targetId ?? ''),
          QuizPassed: () => c.assessments.quizzes.some((q) => q.id === targetId && q.organizationId === org),
          AssignmentAccepted: () => c.assessments.assignments.some((a) => a.id === targetId && a.organizationId === org),
        }[rule]();
        if (!targetId || !exists) errors['targetId'] = `Choose the ${NOUN[rule]} that earns it.`;
      }
    }
    const competencyId = (body['competencyId'] as string) ?? null;
    if (competencyId && !this.competencies().some((x) => x.id === competencyId && x.organizationId === org && !x.removed)) {
      errors['competencyId'] = 'Choose a competency of the progression framework.';
    }
    if (Object.keys(errors).length) return { errors };
    return {
      errors,
      fields: {
        name: name!,
        icon,
        description,
        kind,
        rule,
        targetId: kind === 'Automatic' ? targetId : null,
        competencyId,
      },
    };
  }

  /** POST /curriculum/badges. */
  create(route: Route, org: string): Promise<void> {
    const { errors, fields } = this.check(org, route.request().postDataJSON() as Record<string, unknown>);
    if (!fields) return route.fulfill({ status: 422, json: { errors } });
    const id = `b-new-${this.nextId++}`;
    this.badges.push({ id, organizationId: org, deleted: false, ...fields });
    return route.fulfill({ status: 201, json: { id } });
  }

  /** PUT /curriculum/badges/{id}. */
  update(route: Route, org: string, id: string): Promise<void> {
    const b = this.live(org, id);
    if (!b) return route.fulfill({ status: 404 });
    const { errors, fields } = this.check(org, route.request().postDataJSON() as Record<string, unknown>);
    if (!fields) return route.fulfill({ status: 422, json: { errors } });
    Object.assign(b, fields);
    return route.fulfill({ status: 204 });
  }

  /** DELETE /curriculum/badges/{id}: the badge is marked deleted; its awards are kept. */
  remove(route: Route, org: string, id: string): Promise<void> {
    const b = this.live(org, id);
    if (!b) return route.fulfill({ status: 404 });
    b.deleted = true;
    return route.fulfill({ status: 204 });
  }

  /** POST /curriculum/badges/{id}/awards: a badge by hand, to an active youth of the organization, once; answers the youth to notify. */
  award(route: Route, org: string, id: string, by: string, at: string): Promise<{ membershipId: string; badge: string } | null> {
    const b = this.live(org, id);
    if (!b) return route.fulfill({ status: 404 }).then(() => null);
    if (b.kind !== 'Manual') return route.fulfill({ status: 409, json: { code: 'automatic' } }).then(() => null);
    const membershipId = (route.request().postDataJSON() as { membershipId: string | null }).membershipId;
    const youth = this.memberships().find((m) => m.id === membershipId && m.organizationId === org && m.role === 'Youth');
    if (!youth) return route.fulfill({ status: 422, json: { errors: { membershipId: 'Choose a youth of your organization.' } } }).then(() => null);
    if (this.awards.some((a) => a.badgeId === id && a.membershipId === youth.id)) return route.fulfill({ status: 409, json: { code: 'already-awarded' } }).then(() => null);
    const award = { id: `ba-new-${this.nextId++}`, organizationId: org, badgeId: id, membershipId: youth.id, awardedAt: at, awardedBy: by };
    this.awards.push(award);
    return route.fulfill({ status: 201, json: { id: award.id } }).then(() => ({ membershipId: youth.id, badge: b.name }));
  }

  /**
   * Awards the youth every automatic badge she now meets and does not hold (L2-085, ADR 0058), as BadgeAwarder does after each learning
   * event; answers the names of the badges awarded so FakeApi can notify her.
   */
  evaluate(org: string, membershipId: string, progress: BadgeProgress, at: string): string[] {
    const c = this.curriculum;
    const moduleDone = (moduleId: string): boolean => {
      const module = c.modules.find((m) => m.id === moduleId);
      if (!module || module.status !== 'Published') return false;
      const lessons = c.lessons.filter((l) => l.moduleId === moduleId && l.status === 'Published' && !l.deleted);
      const required = c.assessments.quizzes.filter((q) => q.moduleId === moduleId && q.status === 'Published' && q.requiredToComplete);
      return lessons.length > 0 && lessons.every((l) => progress.lessonDone(l.id)) && required.every((q) => progress.quizPassed(q.id));
    };
    const meets: Record<BadgeRule, (id: string) => boolean> = {
      LessonCompleted: progress.lessonDone,
      ModuleCompleted: moduleDone,
      QuizPassed: progress.quizPassed,
      AssignmentAccepted: progress.accepted,
    };
    const held = new Set(this.awards.filter((a) => a.membershipId === membershipId).map((a) => a.badgeId));
    const earned = this.badges.filter((b) => b.organizationId === org && !b.deleted && b.kind === 'Automatic' && b.rule && b.targetId && !held.has(b.id) && meets[b.rule](b.targetId));
    for (const b of earned) this.awards.push({ id: `ba-new-${this.nextId++}`, organizationId: org, badgeId: b.id, membershipId, awardedAt: at, awardedBy: null });
    return earned.map((b) => b.name);
  }
}
