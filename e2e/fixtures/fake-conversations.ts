import type { Route } from "@playwright/test";
import { NOW } from "./programs";

export interface FakeDirectMessage {
  id: string;
  organizationId: string;
  youthId: string;
  mentorId: string;
  senderId: string;
  body: string;
  sentAt: string;
  readAt: string | null;
}

/**
 * Direct messages between a mentor and a youth as the API keeps them (L2-106, L2-108, ADR 0068). FakeApi checks the modules, the caller's
 * standing and the consent gate before a call reaches it; tests seed messages and make the other side reply.
 */
export class FakeConversations {
  readonly rows: FakeDirectMessage[] = [];
  private next = 1;

  /** Answers every send with 500, to show the failed state. */
  failSends = false;

  seed(
    row: Omit<FakeDirectMessage, "id" | "organizationId" | "readAt"> &
      Partial<FakeDirectMessage>,
  ): FakeDirectMessage {
    const full: FakeDirectMessage = {
      organizationId: "org-harbourview",
      readAt: null,
      ...row,
      id: row.id ?? `dm-${this.next++}`,
    };
    this.rows.push(full);
    return full;
  }

  /** POST /conversations/{youthId}/messages once the caller may write: 1 to 2,000 characters. */
  async send(
    route: Route,
    organizationId: string,
    youthId: string,
    mentorId: string,
    senderId: string,
  ): Promise<FakeDirectMessage | null> {
    if (this.failSends) {
      await route.fulfill({ status: 500 });
      return null;
    }
    const b = route.request().postDataJSON() as { body?: string };
    const body = (b.body ?? "").trim();
    if (!body || body.length > 2000) {
      await route.fulfill({
        status: 422,
        json: {
          errors: {
            body: body ? "Keep it to 2,000 characters." : "Write a message.",
          },
        },
      });
      return null;
    }
    const sentAt = new Date(
      Math.max(
        NOW.getTime(),
        ...this.rows.map((r) => new Date(r.sentAt).getTime() + 60_000),
      ),
    ).toISOString();
    return this.seed({
      organizationId,
      youthId,
      mentorId,
      senderId,
      body,
      sentAt,
    });
  }

  of(youthId: string, mentorId?: string): FakeDirectMessage[] {
    return this.rows
      .filter(
        (r) => r.youthId === youthId && (!mentorId || r.mentorId === mentorId),
      )
      .sort((a, z) => a.sentAt.localeCompare(z.sentAt));
  }
}
