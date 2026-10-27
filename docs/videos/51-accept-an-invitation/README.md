# 51 · Accept an invitation as a youth or mentor

> **Runtime:** ~4 min · **Audience:** contributors, product owners and program staff who set up youth and mentors · **Prerequisites:** [30 · Start an invited shift](../30-start-an-invited-shift/README.md), [50 · Sign in as a youth or mentor](../50-sign-in-as-youth-or-mentor/README.md)

**Video:** [51-accept-an-invitation.mp4](51-accept-an-invitation.mp4) · [Slides](slides.html) · **Audio:** [51-accept-an-invitation.mp3](51-accept-an-invitation.mp3) · [Transcript](script.md)

## Why this video exists

Slice 51 lets an admin invite a youth from the child record and a mentor or volunteer from Staff and roles with the same staff invitation, gives every password one rule, and lets an expired link ask for a new one that an admin resends (`L2-051` to `L2-054`, ADR 0045).

## Learning objectives

By the end, the viewer can:

- Say where each role is invited from and where it lands after accepting.
- Explain when the Youth account card shows and what the server answers when Learning is off.
- State the password rule and where it applies.
- Follow an expired link from the request to the resend.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who can invite a youth? | Admins, from a child aged 12 to 18, while Learning is on; 404 otherwise, 403 for other roles |
| What does accepting a youth invitation create? | A Youth membership linked to that child; lands on Learning |
| What is the password rule? | 12 to 128 characters, not containing the email's name; same on accept and reset |
| What happens to an expired link? | 410 "expired"; one anonymous request, recorded once, notifies admins; Resend issues a fresh link |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/households/src/lib/child/child-page.html` | The Youth account card |
| `frontend/projects/households/src/lib/invite-youth/invite-youth-dialog.ts` | The invite-youth dialog |
| `frontend/projects/account/src/lib/accept-invite/accept-invite-page.ts` | Role home after joining, the expired state |
| `backend/src/PromiseHub.Application/Staff/YouthInvitationHandler.cs` | Age and duplicate rules |
| `backend/src/PromiseHub.Application/Identity/PasswordPolicy.cs` | The password rule |
| `docs/adr/0045-one-invitation-for-every-role.md` | The decisions |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:18 | Introduction | What the video covers |
| 00:18-00:43 | One invitation | One table, a `ChildId` for youth |
| 00:43-01:43 | Youth | Clip: Tom invites Yusuf; empty and invited screenshots |
| 01:43-01:59 | Mentors | Mentor, volunteer and youth answers |
| 01:59-02:26 | Accepting | Clips: Yusuf on a phone, Grace on a laptop |
| 02:26-03:04 | Expired | Clips: the expired page, Resend on Staff and roles |
| 03:04-03:40 | Testing | What the tests prove; phone and laptop screenshots |
| 03:40-03:59 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/51-accept-an-invitation --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/51-accept-an-invitation
node tools/video-build/build-video.mjs docs/videos/51-accept-an-invitation --no-captions
```

## Pitfalls

- A youth comes from the child record only; inviting the Youth role from Staff and roles is refused.
- An expired youth invitation still blocks a second one for that child: resend it instead.
- The request for a new link works only for an expired link; open, withdrawn, used and unknown tokens answer 404.

## References

- `docs/specs/L2.md` (`L2-051` to `L2-054`)
- `docs/detailed-designs/staff/issue-invitations/README.md`, `staff/manage-pending-invitations`, `identity/accept-invitation`, `identity/set-secure-password`, `identity/replace-expired-invitation`
