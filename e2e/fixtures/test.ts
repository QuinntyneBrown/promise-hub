import { test as base, expect } from "@playwright/test";
import { FakeApi } from "./fake-api";
import type { MembershipId } from "./seed";

interface Fixtures {
  signedInAs: MembershipId | null;
  api: FakeApi;
}

/** Every test runs against the fake API. A request it does not route fails the test loudly. */
export const test = base.extend<Fixtures>({
  signedInAs: ["m-jaylen", { option: true }],
  api: [
    async ({ page, signedInAs, baseURL }, use) => {
      const api = new FakeApi(signedInAs);
      await api.install(page, new URL(baseURL!).origin);
      await use(api);
      expect(api.unrouted, "requests the fake API does not route").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
