import type { Route } from "@playwright/test";
import { NOW } from "./programs";

export type FakeAudience =
  "Youth" | "YouthAndGuardians" | "Guardians" | "Mentors" | "Everyone";

export interface FakeAnnouncement {
  id: string;
  organizationId: string;
  title: string;
  body: string;
  programId: string | null;
  program: string | null;
  audience: FakeAudience;
  sendAt: string;
  sentBy: string;
  sentByRole: string;
  /** Households sent the guardians' copy. */
  households: number;
}

const AUDIENCES: FakeAudience[] = [
  "Youth",
  "YouthAndGuardians",
  "Guardians",
  "Mentors",
  "Everyone",
];

/** Role words as the youth's feed shows who sent an announcement. */
const ROLE: Record<string, string> = {
  Admin: "Admin",
  ProgramDirector: "Program director",
  SiteLead: "Site lead",
  YouthWorker: "Youth worker",
  VolunteerCoordinator: "Volunteer coordinator",
};

export const reachesYouth = (a: FakeAnnouncement) =>
  a.audience === "Youth" ||
  a.audience === "YouthAndGuardians" ||
  a.audience === "Everyone";
export const reachesMentors = (a: FakeAnnouncement) =>
  a.audience === "Mentors" || a.audience === "Everyone";
export const reachesGuardians = (a: FakeAnnouncement) =>
  a.audience === "Guardians" ||
  a.audience === "YouthAndGuardians" ||
  a.audience === "Everyone";

/**
 * Announcements as the API keeps them (L2-105, ADR 0068). FakeApi checks the Messages module and the caller's permission, works out who
 * an announcement reaches (members) and queues the guardians' copy before a call reaches it.
 */
export class FakeAnnouncements {
  readonly rows: FakeAnnouncement[] = [];
  /** `${announcementId}:${membershipId}` for each read. */
  readonly reads = new Set<string>();
  private next = 1;

  /** Answers every compose with 500, to show the failed state. */
  failCompose = false;
  /** Answers every Mark all read with 500. */
  failMarkRead = false;

  seed(
    row: Omit<
      FakeAnnouncement,
      "id" | "organizationId" | "households" | "sentByRole"
    > &
      Partial<FakeAnnouncement>,
  ): FakeAnnouncement {
    const full: FakeAnnouncement = {
      organizationId: "org-harbourview",
      households: 0,
      sentByRole: "ProgramDirector",
      ...row,
      id: row.id ?? `ann-${this.next++}`,
    };
    this.rows.push(full);
    return full;
  }

  /** POST /announcements once the caller may: each field checked as the server does; null when answered with an error. */
  async compose(
    route: Route,
    programName: (id: string) => string | null | undefined,
  ): Promise<Omit<
    FakeAnnouncement,
    "id" | "organizationId" | "sentBy" | "sentByRole" | "households"
  > | null> {
    if (this.failCompose) {
      await route.fulfill({ status: 500 });
      return null;
    }
    const b = route.request().postDataJSON() as Record<string, unknown>;
    const title = typeof b["title"] === "string" ? b["title"].trim() : "";
    const body = typeof b["body"] === "string" ? b["body"].trim() : "";
    const audience = AUDIENCES.includes(b["audience"] as FakeAudience)
      ? (b["audience"] as FakeAudience)
      : null;
    const sendAt =
      typeof b["sendAt"] === "string" && b["sendAt"] ? b["sendAt"] : null;
    const programId =
      typeof b["programId"] === "string" && b["programId"]
        ? b["programId"]
        : null;
    const errors: Record<string, string> = {};
    if (!title) errors["title"] = "Give it a title.";
    else if (title.length > 120) errors["title"] = "Keep it to 120 characters.";
    if (!body) errors["body"] = "Write the announcement.";
    else if (body.length > 2000)
      errors["body"] = "Keep it to 2,000 characters.";
    if (!audience) errors["audience"] = "Choose who hears it.";
    if (sendAt && sendAt < NOW.toISOString())
      errors["sendAt"] = "Pick a time from now on.";
    const program = programId ? programName(programId) : null;
    if (programId && !program) {
      await route.fulfill({ status: 404 });
      return null;
    }
    if (Object.keys(errors).length) {
      await route.fulfill({ status: 422, json: { errors } });
      return null;
    }
    return {
      title,
      body,
      programId,
      program: program ?? null,
      audience: audience!,
      sendAt: sendAt ?? NOW.toISOString(),
    };
  }

  add(row: Omit<FakeAnnouncement, "id">): FakeAnnouncement {
    const full = { ...row, id: `ann-${this.next++}` };
    this.rows.push(full);
    return full;
  }

  /** The staff list row (GET /announcements). */
  row(a: FakeAnnouncement, members: string[]) {
    return {
      id: a.id,
      title: a.title,
      body: a.body,
      program: a.program,
      audience: a.audience,
      status: a.sendAt > NOW.toISOString() ? "Scheduled" : "Sent",
      sendAt: a.sendAt,
      sentBy: a.sentBy,
      recipients: members.length,
      reads: members.filter((m) => this.reads.has(`${a.id}:${m}`)).length,
      households: a.households,
    };
  }

  /** One item of a member's feed (GET /announcements/mine). */
  item(a: FakeAnnouncement, membershipId: string) {
    return {
      id: a.id,
      title: a.title,
      body: a.body,
      from: a.sentBy,
      fromRole: ROLE[a.sentByRole] ?? a.sentByRole,
      sentAt: a.sendAt,
      program: a.program,
      read: this.reads.has(`${a.id}:${membershipId}`),
    };
  }
}
