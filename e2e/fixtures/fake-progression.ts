import type { Route } from '@playwright/test';
import type { FakeCompetency } from './fake-reviews';

export interface FakeStage {
  id: string;
  organizationId: string;
  position: number;
  name: string;
  description: string;
}

const clean = (v: string | null | undefined): string => (v ?? '').trim();
const stage = (id: string, organizationId: string, position: number, name: string, description: string): FakeStage => ({ id, organizationId, position, name, description });

/**
 * The progression framework as the API answers it (L2-086, ADR 0058): stages in order and the competencies in them, which FakeReviews
 * also gives mentors. Every call reaches it only after FakeApi checked the Learning module and AuthorCurriculum.
 */
export class FakeProgression {
  private nextId = 1;

  constructor(private readonly competencies: () => FakeCompetency[]) {}

  /** The seeded frameworks, as DatabaseSeeder adds them. */
  stages: FakeStage[] = [
    stage('st-explorer', 'org-harbourview', 1, 'Explorer', 'Finding their place in the group'),
    stage('st-contributor', 'org-harbourview', 2, 'Contributor', 'Takes part and helps others take part'),
    stage('st-leader', 'org-harbourview', 3, 'Leader', 'Leads others in the cohort'),
    stage('st-ng-explorer', 'org-northgate', 1, 'Explorer', 'Finding their place in the group'),
    stage('st-ng-contributor', 'org-northgate', 2, 'Contributor', 'Takes part and helps others take part'),
  ];

  stagesOf(org: string): FakeStage[] {
    return this.stages.filter((s) => s.organizationId === org).sort((a, b) => a.position - b.position);
  }

  /** Removes every stage of an organization, for the empty state. */
  clear(org: string): void {
    this.stages = this.stages.filter((s) => s.organizationId !== org);
  }

  /** GET /curriculum/progression. */
  get(route: Route, org: string): Promise<void> {
    const stages = this.stagesOf(org).map((s) => ({
      id: s.id,
      position: s.position,
      name: s.name,
      description: s.description,
      competencies: this.competencies()
        .filter((c) => c.stageId === s.id && !c.removed)
        .map((c) => ({ id: c.id, name: c.name, description: c.description })),
    }));
    return route.fulfill({ json: { stages } });
  }

  private checkStage(body: { name?: string; description?: string }): Record<string, string> {
    const errors: Record<string, string> = {};
    const name = clean(body.name);
    if (!name) errors['name'] = 'Give the stage a name.';
    else if (name.length > 60) errors['name'] = 'Keep the name under 60 characters.';
    if (clean(body.description).length > 200) errors['description'] = 'Keep the description under 200 characters.';
    return errors;
  }

  /** POST /curriculum/progression/stages: added last. */
  addStage(route: Route, org: string): Promise<void> {
    const body = route.request().postDataJSON() as { name?: string; description?: string };
    const errors = this.checkStage(body);
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const id = `st-new-${this.nextId++}`;
    this.stages.push(stage(id, org, this.stagesOf(org).length + 1, clean(body.name), clean(body.description)));
    return route.fulfill({ status: 201, json: { id } });
  }

  /** PUT /curriculum/progression/stages/{id}. */
  updateStage(route: Route, org: string, id: string): Promise<void> {
    const s = this.stages.find((x) => x.id === id && x.organizationId === org);
    if (!s) return route.fulfill({ status: 404 });
    const body = route.request().postDataJSON() as { name?: string; description?: string };
    const errors = this.checkStage(body);
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    Object.assign(s, { name: clean(body.name), description: clean(body.description) });
    return route.fulfill({ status: 204 });
  }

  /** PUT /curriculum/progression/stage-order: every stage once. */
  reorder(route: Route, org: string): Promise<void> {
    const ids = (route.request().postDataJSON() as { stageIds?: string[] }).stageIds ?? [];
    const mine = this.stagesOf(org);
    if (ids.length !== mine.length || new Set(ids).size !== ids.length || !ids.every((id) => mine.some((s) => s.id === id))) {
      return route.fulfill({ status: 422, json: { errors: { stageIds: 'Send every stage once.' } } });
    }
    ids.forEach((id, i) => (mine.find((s) => s.id === id)!.position = i + 1));
    return route.fulfill({ status: 204 });
  }

  /** POST /curriculum/progression/stages/{id}/competencies: after every competency of the organization. */
  addCompetency(route: Route, org: string, stageId: string): Promise<void> {
    if (!this.stages.some((s) => s.id === stageId && s.organizationId === org)) return route.fulfill({ status: 404 });
    const body = route.request().postDataJSON() as { name?: string; description?: string };
    const name = clean(body.name);
    const description = clean(body.description);
    const errors: Record<string, string> = {};
    if (!name) errors['name'] = 'Name the competency.';
    else if (name.length > 80) errors['name'] = 'Keep the name under 80 characters.';
    if (description.length > 300) errors['description'] = 'Keep the description under 300 characters.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const id = `cp-new-${this.nextId++}`;
    this.competencies().push({ id, organizationId: org, stageId, name, description });
    return route.fulfill({ status: 201, json: { id } });
  }

  /** DELETE /curriculum/progression/competencies/{id}: removed; its assessments stay. */
  removeCompetency(route: Route, org: string, id: string): Promise<void> {
    const c = this.competencies().find((x) => x.id === id && x.organizationId === org && !x.removed);
    if (!c) return route.fulfill({ status: 404 });
    c.removed = true;
    return route.fulfill({ status: 204 });
  }
}
