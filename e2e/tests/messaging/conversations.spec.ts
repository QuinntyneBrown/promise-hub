import { test, expect } from "../../fixtures/test";
import type { FakeApi } from "../../fixtures/fake-api";
import type { ModuleId } from "../../fixtures/seed";
import { ConversationPage } from "../../pages/conversation.page";
import { ConversationsPage } from "../../pages/conversations.page";
import { ShellPage } from "../../pages/shell.page";
import { TodayPage } from "../../pages/today.page";

// Acceptance test. Traces to: L2-106 criteria 1 to 8 and L2-108 criteria 1 to 4 (a mentor and the youth he mentors write to each other,
// what is new, sending and failed, field errors, plain text, nobody else reads or writes, a minor waits for consent, supervisors read only,
// Messages or Mentoring off), L2-035, L2-036.
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

function mentorsSofiaAndNadia(api: FakeApi, consent = true): void {
  api.setModules("org-harbourview", ALL);
  api.assignYouthMentor("c-sofia", "m-daniel");
  api.assignYouthMentor("c-nadia", "m-daniel");
  if (consent) api.giveConsent("c-sofia");
}

function thread(api: FakeApi): void {
  api.conversations.seed({
    youthId: "m-sofia",
    mentorId: "m-daniel",
    senderId: "m-sofia",
    body: "Hi Daniel, I finished the Pick Up the Towel reflection. Can I lead the group one on Thursday?",
    sentAt: "2026-11-04T22:40:00Z",
    readAt: "2026-11-04T23:00:00Z",
  });
  api.conversations.seed({
    youthId: "m-sofia",
    mentorId: "m-daniel",
    senderId: "m-daniel",
    body: "That’s a great idea. Bring the question you liked most and we’ll start with it.",
    sentAt: "2026-11-04T23:02:00Z",
    readAt: "2026-11-05T12:00:00Z",
  });
  api.conversations.seed({
    youthId: "m-sofia",
    mentorId: "m-daniel",
    senderId: "m-sofia",
    body: "Ok! Is it still in Room 2?",
    sentAt: "2026-11-05T20:58:00Z",
  });
}

test.describe("Messages for a mentor", () => {
  test.use({ signedInAs: "m-daniel" });

  test("Given Sofía wrote, when Daniel opens Messages from the tab bar, then her conversation shows 1 new and Nadia’s none yet", async ({
    page,
    api,
  }) => {
    mentorsSofiaAndNadia(api);
    thread(api);
    const shell = new ShellPage(page);
    const today = new TodayPage(page);
    const conversations = new ConversationsPage(page);

    await today.open();
    await shell.openSection("Messages");

    await expect(conversations.heading).toHaveText("Messages");
    expect(await conversations.names()).toEqual([
      "Sofía Rivera",
      "Nadia Haddad",
    ]);
    await expect(conversations.row("Sofía Rivera")).toContainText(
      "Ok! Is it still in Room 2?",
    );
    await expect(conversations.row("Sofía Rivera")).toContainText("1 new");
    await expect(conversations.row("Nadia Haddad")).toContainText(
      "No messages yet",
    );
    await conversations.expectAccessible();
  });

  test("Given the conversation, when Daniel writes back, then it shows at the end as his, and the new count is gone", async ({
    page,
    api,
  }) => {
    mentorsSofiaAndNadia(api);
    thread(api);
    const conversations = new ConversationsPage(page);
    const conversation = new ConversationPage(page);
    await conversations.open();

    await conversations.openConversation("Sofía Rivera");
    await expect(conversation.heading).toHaveText("Sofía Rivera");
    expect(await conversation.bodies()).toHaveLength(3);
    await conversation.expectAccessible();
    await conversation.write("Yes, Room 2 at 4:00. See you there.");

    await expect(
      conversation.message("Yes, Room 2 at 4:00. See you there."),
    ).toContainText("You ·");
    await expect(conversation.field).toHaveValue("");
    expect(api.auditOf("DirectMessage")).toEqual([
      expect.objectContaining({
        summary: "Message from Daniel Osei to Sofía Rivera",
      }),
    ]);
    await conversation.expectAccessible();
  });

  test("Given words that look like markup, then they are shown as text", async ({
    page,
    api,
  }) => {
    mentorsSofiaAndNadia(api);
    const conversation = new ConversationPage(page);
    await conversation.open("m-nadia");

    await expect(conversation.emptyState).toHaveText("Say hi to Nadia");
    await conversation.write("<b>Room 2</b> & <i>bring water</i>");

    await expect(
      conversation.message("<b>Room 2</b> & <i>bring water</i>"),
    ).toBeVisible();
  });

  test("Given the send fails, then the message is kept as Not sent and Try again sends it", async ({
    page,
    api,
  }) => {
    mentorsSofiaAndNadia(api);
    thread(api);
    api.conversations.failSends = true;
    const conversation = new ConversationPage(page);
    await conversation.open("m-sofia");

    await conversation.write("Of course, tell her to come at 4.");
    await expect(conversation.notSent).toBeVisible();
    await conversation.expectAccessible();
    api.conversations.failSends = false;
    await conversation.tryAgain();

    await expect(conversation.notSent).toBeHidden();
    await expect(
      conversation.message("Of course, tell her to come at 4."),
    ).toContainText("You ·");
  });

  test("Given a message over 2,000 characters, then the field says so and keeps it", async ({
    page,
    api,
  }) => {
    mentorsSofiaAndNadia(api);
    const conversation = new ConversationPage(page);
    await conversation.open("m-nadia");

    await conversation.write("a".repeat(2001));

    await expect(
      conversation.text("Keep it to 2,000 characters."),
    ).toBeVisible();
    await expect(conversation.field).toHaveValue("a".repeat(2001));
  });

  test("Given Sofía has no guardian consent yet, then her conversation waits for it and Daniel cannot write", async ({
    page,
    api,
  }) => {
    mentorsSofiaAndNadia(api, false);
    const conversations = new ConversationsPage(page);
    const conversation = new ConversationPage(page);
    await conversations.open();

    await expect(conversations.row("Sofía Rivera")).toContainText(
      "Waiting for consent",
    );
    await conversations.openConversation("Sofía Rivera");

    await expect(conversation.blockedAlert).toBeVisible();
    await expect(conversation.field).toBeDisabled();
    await expect(conversation.sendButton).toBeDisabled();
    expect(await conversation.apiStatus("m-sofia")).toBe(409);
    await conversation.expectAccessible();
  });

  test("Given Hana’s youth, then Daniel is refused her conversation", async ({
    page,
    api,
  }) => {
    mentorsSofiaAndNadia(api);
    api.assignYouthMentor("c-nadia", "m-hana");
    const conversation = new ConversationPage(page);
    await conversation.open("m-nadia");

    await expect(conversation.forbidden).toBeVisible();
    expect(await conversation.apiStatus("m-nadia")).toBe(403);
    await conversation.expectAccessible();
  });

  test("Given a phone, then the conversation and its composer fit without sideways scrolling", async ({
    page,
    api,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    mentorsSofiaAndNadia(api);
    thread(api);
    const conversation = new ConversationPage(page);
    await conversation.open("m-sofia");

    await expect(
      conversation.message("Ok! Is it still in Room 2?"),
    ).toBeVisible();
    await conversation.expectNoHorizontalScroll();
  });
});

test.describe("Messages for a mentor with no youth accounts", () => {
  test.use({ signedInAs: "m-hana" });

  test("Given Hana mentors nobody with a youth account, then she is told how conversations start", async ({
    page,
    api,
  }) => {
    api.setModules("org-harbourview", ALL);
    const conversations = new ConversationsPage(page);
    await conversations.open();

    await expect(conversations.emptyState).toBeVisible();
    await conversations.expectAccessible();
  });
});

test.describe("Messages for a youth", () => {
  test.use({ signedInAs: "m-sofia" });

  test("Given her mentor wrote, when Sofía opens Messages, then she reads Daniel’s conversation and replies", async ({
    page,
    api,
  }) => {
    mentorsSofiaAndNadia(api);
    thread(api);
    api.conversations.seed({
      youthId: "m-sofia",
      mentorId: "m-daniel",
      senderId: "m-daniel",
      body: "Yes, Room 2 at 4:00. See you there.",
      sentAt: "2026-11-05T21:05:00Z",
    });
    const shell = new ShellPage(page);
    const today = new TodayPage(page);
    const conversations = new ConversationsPage(page);
    const conversation = new ConversationPage(page);

    await today.open();
    await shell.openSection("Messages");
    expect(await conversations.names()).toEqual(["Daniel Osei"]);
    await expect(conversations.row("Daniel Osei")).toContainText("1 new");
    await conversations.openConversation("Daniel Osei");

    await expect(conversation.heading).toHaveText("Daniel Osei");
    await conversation.write("See you!");
    await expect(conversation.message("See you!")).toContainText("You ·");
    await conversation.expectAccessible();
  });
});

test.describe("Mentor conversations for a program director", () => {
  test.use({ signedInAs: "m-marisol" });

  test("Given Daniel and Sofía’s conversation, when Marisol opens Mentor conversations, then she reads it read only and the opening is audited", async ({
    page,
    api,
  }) => {
    mentorsSofiaAndNadia(api);
    thread(api);
    const shell = new ShellPage(page);
    const today = new TodayPage(page);
    const conversations = new ConversationsPage(page);
    const conversation = new ConversationPage(page);

    await today.open();
    await shell.openMenu();
    await shell.goToFromMenu("Mentor conversations");
    await expect(conversations.heading).toHaveText("Mentor conversations");
    await expect(conversations.row("Sofía Rivera")).toContainText(
      "With Daniel Osei",
    );
    await conversations.openConversation("Sofía Rivera");

    await expect(conversation.heading).toHaveText(
      "Sofía Rivera and Daniel Osei",
    );
    expect(await conversation.bodies()).toHaveLength(3);
    await expect(conversation.field).toHaveCount(0);
    expect(api.auditOf("Conversation")).toHaveLength(1);
    expect(await conversation.apiStatus("m-sofia")).toBe(403);
    await conversation.expectAccessible();
  });
});

test.describe("Messages for staff who are not supervisors", () => {
  test.use({ signedInAs: "m-aisha" });

  test("Given a youth worker, then the server refuses her and she is told who writes here", async ({
    page,
    api,
  }) => {
    api.setModules("org-harbourview", ALL);
    const conversations = new ConversationsPage(page);
    await conversations.open();

    await expect(conversations.forbidden).toBeVisible();
    await conversations.expectAccessible();
  });
});

test.describe("Messages with a module off", () => {
  test.use({ signedInAs: "m-daniel" });

  for (const off of ["Messages", "Mentoring"] as const) {
    test(`Given ${off} off, then Messages is not in his navigation, the route goes to Today and the API answers 404`, async ({
      page,
      api,
    }) => {
      api.setModules(
        "org-harbourview",
        ALL.filter((m) => m !== off),
      );
      const shell = new ShellPage(page);
      const today = new TodayPage(page);
      const conversations = new ConversationsPage(page);

      await page.goto("/conversations");

      await expect(page).toHaveURL(/\/$/);
      await expect(today.heading).toBeVisible();
      expect(await shell.visibleNavigationLabels()).not.toContain("Messages");
      expect(await conversations.apiStatus()).toBe(404);
    });
  }
});
