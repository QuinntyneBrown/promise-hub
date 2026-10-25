import type { Page, Route } from '@playwright/test';
import { memberships, organizations } from './seed';

type Handler = (route: Route, params: Record<string, string>) => Promise<void>;

/**
 * Answers the real API's contracts from seeded in-memory data. The session is the
 * membership the test signed in as; the tenant always comes from it, never from the request.
 * Any request the fake does not route is recorded and fails the test.
 */
export class FakeApi {
  readonly unrouted: string[] = [];
  private failures = new Map<string, number>();

  constructor(private membershipId: string | null) {}

  /** Makes the next calls to a route answer with the given status, as the real API would on a fault. */
  failNext(path: string, status: number): void {
    this.failures.set(path, status);
  }

  async install(page: Page, appOrigin: string): Promise<void> {
    await page.route(
      (url) => url.origin !== appOrigin,
      (route) => this.reject(route),
    );
    await page.route(`${appOrigin}/api/**`, (route) => this.handle(route));
  }

  private readonly routes: [string, RegExp, Handler][] = [['GET', /^\/api\/me$/, (route) => this.me(route)]];

  private async handle(route: Route): Promise<void> {
    const url = new URL(route.request().url());
    const failure = this.failures.get(url.pathname);
    if (failure) {
      return route.fulfill({ status: failure });
    }
    for (const [method, pattern, handler] of this.routes) {
      const match = pattern.exec(url.pathname);
      if (match && route.request().method() === method) {
        return handler(route, match.groups ?? {});
      }
    }
    return this.reject(route);
  }

  private async me(route: Route): Promise<void> {
    const membership = memberships.find((m) => m.id === this.membershipId);
    if (!membership) {
      return route.fulfill({ status: 401 });
    }
    const organization = organizations.find((o) => o.id === membership.organizationId)!;
    return route.fulfill({
      json: {
        personName: membership.personName,
        role: membership.role,
        organizationId: organization.id,
        organizationName: organization.name,
        plan: organization.plan,
      },
    });
  }

  private async reject(route: Route): Promise<void> {
    this.unrouted.push(`${route.request().method()} ${route.request().url()}`);
    await route.fulfill({ status: 599, body: 'Unrouted request in the fake API' });
  }
}
