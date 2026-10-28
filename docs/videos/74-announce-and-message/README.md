# 74 · Announce and message

> **Runtime:** ~5.5 min · **Audience:** program directors, mentors, youth, developers · **Prerequisites:** [10 · Send guardian messages](../10-send-guardian-messages/README.md), [52 · Give guardian consent](../52-give-guardian-consent/README.md), [54 · Manage cohorts](../54-manage-cohorts/README.md), [73 · Use the guardian portal](../73-use-the-guardian-portal/README.md)

**Video:** [74-announce-and-message.mp4](74-announce-and-message.mp4) · [Slides](slides.html) · **Audio:** [74-announce-and-message.mp3](74-announce-and-message.mp3) · [Transcript](script.md)

## Why this video exists

Prompt 74 brings Waypoint's announcements, mentor and youth messaging, minor safeguards and near-real-time delivery into PromiseHub's Messages module (`L2-105` to `L2-108`, ADR 0068). Staff announce to a program or everyone; youth and mentors read in the app and guardians get a Messages text under the SMS cap; a mentor and the youth he mentors write to each other, blocked until a guardian consents for a minor and readable by program directors; events arrive without a reload and carry no words.

## Learning objectives

By the end, the viewer can:

- Compose an announcement for a program and an audience, now or later, and say how guardians receive it.
- Say who reads which announcements in the app and what Mark all read changes.
- Name who may write in a conversation, when it is blocked, and who reads it read only.
- Explain what a real-time event carries and how a page stays in step after a dropped connection.

## Key questions

| Question | What a strong answer includes |
|---|---|
| How do guardians receive an announcement? | A Messages-module message to the enrolled children's households, text or email, under the SMS cap, listed on the guardian portal |
| Who reads an announcement in the app? | Youth accounts of enrolled children and the program's mentors, by audience; only once it is sent |
| Who may write in a conversation? | The youth and the mentor assigned to her child; no other adult |
| When is a conversation blocked? | While a minor's guardian consent is needed or withdrawn: 409 `blocked: consent` both ways |
| What does an event carry? | The youth's id for a conversation, nothing for an announcement; the page fetches the rest |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Messaging/ComposeAnnouncementHandler.cs` | Validation, the guardian copy with `dueAt`, the audit and the event |
| `backend/src/PromiseHub.Application/Messaging/AnnouncementRecipients.cs` | Who an announcement reaches and who may read it |
| `backend/src/PromiseHub.Application/Messaging/ConversationAccess.cs` | Participants, supervisors and the consent block |
| `backend/src/PromiseHub.Api/Endpoints/RealtimeEndpoints.cs` | The event stream |
| `frontend/projects/components/src/lib/message-thread/` | `ph-message-thread` |
| `frontend/projects/messaging/src/lib/` | Announcements, youth announcements, conversations and the conversation pages |
| `shots/desktop-compose.png`, `desktop-announced.png`, `desktop-youth-announcements.png`, `desktop-youth-read.png`, `desktop-youth-live.png` | Announcements on a laptop |
| `shots/desktop-conversations.png`, `desktop-conversation.png`, `desktop-received.png` | Conversations on a laptop, a reply arriving |
| `shots/phone-conversations.png`, `phone-conversation.png`, `phone-announcements.png` | The same on a phone |
| `shots/desktop-blocked.png`, `desktop-failed.png`, `desktop-empty.png`, `desktop-supervisor.png`, `desktop-forbidden.png`, `desktop-messages-off.png` | Safeguards, failed, empty, supervisor, refused and module-off states |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00–00:31 | Introduction | Two ways to talk: announcements and direct messages |
| 00:31–01:03 | Announce | Marisol sends Room 2 to Tutoring youth and guardians |
| 01:03–01:34 | Guardians | The Messages copy, the SMS cap, scheduling, the audit |
| 01:34–02:04 | Read | Sofía's announcements, Mark all read, one arrives live |
| 02:04–02:38 | Conversations | Daniel reads and answers; Sofía's reply arrives |
| 02:38–03:07 | Real time | The event stream, events without words, reconnecting |
| 03:07–03:28 | Phone | Messages in the tab bar, the thread and announcements |
| 03:28–04:04 | Safeguards | Consent block, failed, empty, nothing edited or deleted |
| 04:04–04:29 | Supervisors | Marisol reads only, audited; refused; Messages off |
| 04:29–05:03 | Testing | API and browser tests |
| 05:03–05:34 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/74-announce-and-message --base http://localhost:4317
export PYTHON=python3
node tools/video-audio/generate-audio.mjs docs/videos/74-announce-and-message
node tools/video-build/build-video.mjs docs/videos/74-announce-and-message --check
node tools/video-build/build-video.mjs docs/videos/74-announce-and-message --no-captions
```

## Pitfalls

- A guardian's copy of a scheduled announcement is queued with its deliveries due at the send time; the guardian portal lists it only once it is sent.
- An announcement for all programs reaches youth with an enrolled child, not every youth account.
- Reassigning a youth starts a new conversation with the new mentor; supervisors still read both.
- The fake API answers the event stream as a long poll, so the browser reconnects every response; the real API keeps it open.

## References

- [Server-sent events (WHATWG HTML)](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [EventSource (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
