import type { Route } from "@playwright/test";

export type ContentStatus = "Draft" | "InReview" | "Published";

export interface FakeTrack {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  description: string | null;
  status: ContentStatus;
}

export interface FakeModule {
  id: string;
  organizationId: string;
  trackId: string;
  title: string;
  description: string | null;
  prerequisiteModuleId: string | null;
  anchor: string | null;
  position: number;
  status: ContentStatus;
}

const clean = (v: string | null | undefined): string | null =>
  v && v.trim() ? v.trim() : null;
const invalid = (route: Route, field: string, message: string) =>
  route.fulfill({ status: 422, json: { errors: { [field]: message } } });

function keyFrom(name: string): string {
  return name
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

function sameSet(sent: string[] | undefined, current: string[]): boolean {
  return (
    !!sent &&
    sent.length === current.length &&
    new Set(sent).size === sent.length &&
    sent.every((id) => current.includes(id))
  );
}

/**
 * Curriculum authoring as the API answers it (L2-066, L2-067, ADR 0050): tracks, their ordered modules and lessons. Every call
 * reaches it only after FakeApi checked the Learning module and AuthorCurriculum, and it sees only the caller's organization.
 */
export class FakeCurriculum {
  private nextId = 1;
  tracks: FakeTrack[] = [
    {
      id: "t-leadership",
      organizationId: "org-harbourview",
      name: "Leadership Foundations",
      key: "leadership",
      description: "Growing as a leader at home, at school and in the cohort.",
      status: "Published",
    },
    {
      id: "t-digital",
      organizationId: "org-harbourview",
      name: "Digital Skills",
      key: "digital",
      description: "Using technology safely and creatively.",
      status: "Draft",
    },
  ];
  modules: FakeModule[] = [
    {
      id: "cm-knowing",
      organizationId: "org-harbourview",
      trackId: "t-leadership",
      title: "Knowing Yourself",
      description: "Strengths, values and the people around you.",
      prerequisiteModuleId: null,
      anchor: null,
      position: 1,
      status: "Published",
    },
    {
      id: "cm-serving",
      organizationId: "org-harbourview",
      trackId: "t-leadership",
      title: "Leading by Serving",
      description:
        "Putting others first and using influence to build people up.",
      prerequisiteModuleId: "cm-knowing",
      anchor: "“The best leaders are the ones who carry the bags.”",
      position: 2,
      status: "InReview",
    },
    {
      id: "cm-speaking",
      organizationId: "org-harbourview",
      trackId: "t-leadership",
      title: "Speaking Up",
      description: null,
      prerequisiteModuleId: null,
      anchor: null,
      position: 3,
      status: "Draft",
    },
    {
      id: "cm-online",
      organizationId: "org-harbourview",
      trackId: "t-digital",
      title: "Staying Safe Online",
      description: null,
      prerequisiteModuleId: null,
      anchor: null,
      position: 1,
      status: "Draft",
    },
  ];

  /** Removes every track of an organization, for the empty state. */
  clear(organizationId: string): void {
    const ids = new Set(
      this.tracks
        .filter((t) => t.organizationId === organizationId)
        .map((t) => t.id),
    );
    this.tracks = this.tracks.filter((t) => !ids.has(t.id));
    this.modules = this.modules.filter((m) => !ids.has(m.trackId));
  }

  private orderedModules(trackId: string): FakeModule[] {
    return this.modules
      .filter((m) => m.trackId === trackId)
      .sort((a, b) => a.position - b.position);
  }

  /** GET /curriculum. */
  list(route: Route, org: string): Promise<void> {
    const tracks = this.tracks
      .filter((t) => t.organizationId === org)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => ({
        id: t.id,
        name: t.name,
        key: t.key,
        description: t.description,
        status: t.status,
        modules: this.orderedModules(t.id).map((m) => ({
          id: m.id,
          title: m.title,
          status: m.status,
          lessonCount: 0,
        })),
      }));
    return route.fulfill({ json: { tracks } });
  }

  /** POST /curriculum/tracks. */
  createTrack(route: Route, org: string): Promise<void> {
    const b = route.request().postDataJSON() as {
      name?: string;
      key?: string;
      description?: string;
      publish?: boolean;
    };
    const name = clean(b.name);
    if (!name) return invalid(route, "name", "Give the track a name.");
    if (name.length > 80)
      return invalid(route, "name", "Keep the name under 80 characters.");
    const key = clean(b.key) ?? keyFrom(name);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(key) || key.length > 40)
      return invalid(
        route,
        "key",
        "Use lowercase letters, numbers and hyphens.",
      );
    if (this.tracks.some((t) => t.organizationId === org && t.key === key))
      return invalid(route, "key", "Another track already uses this key.");
    const id = `t-${this.nextId++}`;
    this.tracks.push({
      id,
      organizationId: org,
      name,
      key,
      description: clean(b.description),
      status: b.publish ? "Published" : "Draft",
    });
    return route.fulfill({ status: 201, json: { id } });
  }

  /** PUT /curriculum/tracks/{id}/module-order. */
  reorderModules(route: Route, org: string, trackId: string): Promise<void> {
    if (!this.tracks.some((t) => t.id === trackId && t.organizationId === org))
      return route.fulfill({ status: 404 });
    const { moduleIds } = route.request().postDataJSON() as {
      moduleIds?: string[];
    };
    const modules = this.orderedModules(trackId);
    if (
      !sameSet(
        moduleIds,
        modules.map((m) => m.id),
      )
    )
      return invalid(
        route,
        "moduleIds",
        "Send every module of the track once.",
      );
    moduleIds!.forEach(
      (id, i) => (modules.find((m) => m.id === id)!.position = i + 1),
    );
    return route.fulfill({ status: 204 });
  }

  /** POST /curriculum/modules. */
  createModule(route: Route, org: string): Promise<void> {
    const b = route.request().postDataJSON() as {
      trackId: string;
      title?: string;
      description?: string;
    };
    if (
      !this.tracks.some((t) => t.id === b.trackId && t.organizationId === org)
    )
      return route.fulfill({ status: 404 });
    const title = clean(b.title);
    if (!title) return invalid(route, "title", "Give the module a name.");
    const id = `cm-${this.nextId++}`;
    this.modules.push({
      id,
      organizationId: org,
      trackId: b.trackId,
      title,
      description: clean(b.description),
      prerequisiteModuleId: null,
      anchor: null,
      position: this.orderedModules(b.trackId).length + 1,
      status: "Draft",
    });
    return route.fulfill({ status: 201, json: { id } });
  }

  private module(org: string, id: string): FakeModule | undefined {
    return this.modules.find((m) => m.id === id && m.organizationId === org);
  }

  /** GET /curriculum/modules/{id}. */
  getModule(route: Route, org: string, id: string): Promise<void> {
    const m = this.module(org, id);
    if (!m) return route.fulfill({ status: 404 });
    const track = this.tracks.find((t) => t.id === m.trackId)!;
    const siblings = this.orderedModules(m.trackId);
    return route.fulfill({
      json: {
        id: m.id,
        trackId: track.id,
        trackName: track.name,
        title: m.title,
        description: m.description,
        prerequisiteModuleId: m.prerequisiteModuleId,
        anchor: m.anchor,
        status: m.status,
        position: m.position,
        moduleCount: siblings.length,
        earlierModules: siblings
          .filter((s) => s.position < m.position)
          .map((s) => ({ id: s.id, title: s.title })),
      },
    });
  }

  /** PUT /curriculum/modules/{id}. */
  updateModule(route: Route, org: string, id: string): Promise<void> {
    const m = this.module(org, id);
    if (!m) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as {
      title?: string;
      description?: string;
      prerequisiteModuleId?: string | null;
      anchor?: string;
    };
    const title = clean(b.title);
    if (!title) return invalid(route, "title", "Give the module a name.");
    const prerequisite = b.prerequisiteModuleId ?? null;
    if (
      prerequisite &&
      !this.modules.some(
        (x) =>
          x.id === prerequisite &&
          x.trackId === m.trackId &&
          x.position < m.position,
      )
    ) {
      return invalid(
        route,
        "prerequisiteModuleId",
        "Choose a module that comes before this one.",
      );
    }
    Object.assign(m, {
      title,
      description: clean(b.description),
      prerequisiteModuleId: prerequisite,
      anchor: clean(b.anchor),
    });
    return route.fulfill({ status: 204 });
  }
}
