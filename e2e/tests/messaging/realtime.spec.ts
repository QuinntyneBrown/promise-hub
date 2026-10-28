import { test, expect } from "../../fixtures/test";
import type { FakeApi } from "../../fixtures/fake-api";
import type { ModuleId } from "../../fixtures/seed";
import { ConversationPage } from "../../pages/conversation.page";
import { ConversationsPage } from "../../pages/conversations.page";
import { YouthAnnouncementsPage } from "../../pages/youth-announcements.page";

// Acceptance test. Traces to: L2-107 criteria 1, 3 and 4 (a message or an announcement reaches an open page without a reload, events name
// what changed and the page fetches it, a dropped stream reconnects and fetches again without missing or repeating anything), L2-106,
// L2-105.
const ALL: ModuleId[] = [
  "Roster",
  "Slips",
  "RollCall",
  "QuickCards",
  "Pickup",
  "Messages",
  "Incidents",
  "Reports",
  "Learning",
  "Mentoring",
];

function setUp(api: FakeApi): void {
  api.setModules("org-harbourview", ALL);
  api.assignYouthMentor("c-sofia", "m-daniel");
  api.giveConsent("c-sofia");
  api.conversations.seed({
    youthId: "m-sofia",
    mentorId: "m-daniel",
    senderId: "m-daniel",
    body: "Room 2 at 4:00. See you there.",
    sentAt: "2026-11-05T21:05:00Z",
    readAt: "2026-11-05T21:06:00Z",
  });
}

test.describe("Real time for a mentor", () => {
  test.use({ signedInAs: "m-daniel" });

  test("Given Daniel has Sofía’s conversation open, when she writes, then her message appears at the end, marked new, without a reload", async ({
    page,
    api,
  }) => {
    setUp(api);
    const conversation = new ConversationPage(page);
    await conversation.open("m-sofia");
    await expect(
      conversation.message("Room 2 at 4:00. See you there."),
    ).toBeVisible();

    api.writeAs("m-sofia", "m-sofia", "Can I bring my friend Grace next time?");

    await expect(
      conversation.message("Can I bring my friend Grace next time?"),
    ).toBeVisible();
    await expect(
      conversation.message("Can I bring my friend Grace next time?"),
    ).toHaveAttribute("data-state", "new");
    expect(await conversation.bodies()).toHaveLength(2);
    await conversation.expectAccessible();
  });

  test("Given Daniel has his messages open, when Sofía writes, then her conversation counts it as new", async ({
    page,
    api,
  }) => {
    setUp(api);
    const conversations = new ConversationsPage(page);
    await conversations.open();
    await expect(conversations.row("Sofía Rivera")).toContainText(
      "Room 2 at 4:00",
    );

    api.writeAs("m-sofia", "m-sofia", "Can I bring my friend Grace next time?");

    await expect(conversations.row("Sofía Rivera")).toContainText("1 new");
    await expect(conversations.row("Sofía Rivera")).toContainText(
      "Can I bring my friend Grace next time?",
    );
  });

  test("Given an event is missed, when the stream reconnects, then the conversation is fetched again and nothing shows twice", async ({
    page,
    api,
  }) => {
    setUp(api);
    const conversation = new ConversationPage(page);
    await conversation.open("m-sofia");
    await expect(
      conversation.message("Room 2 at 4:00. See you there."),
    ).toBeVisible();

    api.writeAs("m-sofia", "m-sofia", "Are you there?", { event: false });

    await expect(conversation.message("Are you there?")).toBeVisible({
      timeout: 10_000,
    });
    expect(await conversation.bodies()).toEqual([
      "Room 2 at 4:00. See you there.",
      "Are you there?",
    ]);
  });
});

test.describe("Real time for a youth", () => {
  test.use({ signedInAs: "m-sofia" });

  test("Given Sofía has her announcements open, when Marisol announces to Tutoring youth, then it appears as new without a reload", async ({
    page,
    api,
  }) => {
    setUp(api);
    const announcements = new YouthAnnouncementsPage(page);
    await announcements.open();
    await expect(announcements.emptyState).toBeVisible();

    api.announceNow({
      title: "Tutoring night moves to Room 2",
      body: "Same time, 4:00 pm.",
      programId: "p-tutoring",
      program: "After-School Tutoring",
      audience: "Youth",
      sendAt: "2026-11-05T21:12:00Z",
      sentBy: "Marisol Delgado",
    });

    await expect(
      announcements.item("Tutoring night moves to Room 2"),
    ).toBeVisible();
    await expect(announcements.newBadges).toHaveCount(1);
  });

  test("Given Sofía has her conversation open, when Daniel writes, then it appears without a reload", async ({
    page,
    api,
  }) => {
    setUp(api);
    const conversation = new ConversationPage(page);
    await conversation.open("m-sofia");
    await expect(
      conversation.message("Room 2 at 4:00. See you there."),
    ).toBeVisible();

    api.writeAs("m-daniel", "m-sofia", "Bring your reflection too.");

    await expect(
      conversation.message("Bring your reflection too."),
    ).toBeVisible();
    await expect(
      conversation.message("Bring your reflection too."),
    ).toContainText("Daniel ·");
  });
});
