# 81 · Explore the public website

> **Runtime:** ~6 min · **Audience:** contributors, product owners and program staff · **Prerequisites:** [79 · Configure the organization](../79-configure-the-organization/README.md), [58 · Apply or refer a youth](../58-apply-or-refer/README.md)

**Video:** [81-explore-the-public-website.mp4](81-explore-the-public-website.mp4) · [Slides](slides.html) · **Audio:** [81-explore-the-public-website.mp3](81-explore-the-public-website.mp3) · [Transcript](script.md)

## Why this video exists

Slice 81 brings Waypoint's public site into PromiseHub as the Public website module: anonymous pages at `/site/{address}` that show only an organization's published programs, learning and mentoring, send applicants to the program's enrollment link, and capture contact messages, volunteer offers and monthly donation pledges for that organization alone (`L2-132` to `L2-134`, ADR 0075).

## Learning objectives

By the end, the viewer can:

- Say how the address chooses the organization and why unknown, suspended and off look the same.
- Name what the content endpoint answers, and what Learning and Mentoring each add only while on.
- Follow Apply to the program's enrollment link.
- Send a contact message, a volunteer offer and a monthly pledge, and say what each stores and refuses.
- Say where card details go and what happens without a payment provider.

## Key questions

| Question | What a strong answer includes |
|---|---|
| How is the tenant chosen? | `PublicSiteResolver` finds the organization by `WebsiteSlug`, refuses a suspended one, resolves the tenant for a visitor and checks Public website; every endpoint goes through it |
| What is published? | Active programs that have not ended, by start date; while Learning is on published tracks and modules with their badge; while Mentoring is on lead mentors' first names; counts of programs and content, never people |
| How does a visitor apply? | Apply opens `/g/enroll/{link}` while enrollment is open and the link exists; one intake (prompt 58) |
| What protects the forms? | Server validation against fixed lists and lengths, plain text shown escaped, five per kind, email and hour (429), audited as the website visitor, stored per organization |
| What happens with a donation? | `IPaymentProvider` answers a hosted checkout; the pledge keeps the provider's reference only; without a provider 503 `unavailable` and nothing stored |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Website/PublicSiteResolver.cs` | The address to the organization, for a visitor |
| `backend/src/PromiseHub.Application/Website/PublicContentHandler.cs` | Published programs, tracks, mentors and counts |
| `backend/src/PromiseHub.Application/Website/WebsiteRequestsHandler.cs`, `WebsiteRequestLimit.cs`, `IPaymentProvider.cs` | Contact, volunteer, donation; the limit; the provider |
| `backend/src/PromiseHub.Api/Endpoints/WebsiteEndpoints.cs` | Anonymous routes |
| `frontend/projects/website/src/lib/` | `SiteLayout`, `SiteLandingPage`, `SiteProgramsPage`, `SiteAboutPage`, `SiteGetInvolvedPage`, `SiteContactPage`, `SitePrivacyPage`, `VolunteerDialog`, `DonationDialog` |
| `frontend/projects/components/src/lib/site-nav/`, `site-footer/` | The frame components |
| `shots/desktop-landing.png`, `desktop-open-now.png`, `desktop-programs.png`, `desktop-tracks.png`, `desktop-apply.png` | Home, programs, tracks, apply |
| `shots/desktop-about.png`, `desktop-contact-invalid.png`, `desktop-contact-sent.png`, `desktop-get-involved.png`, `desktop-volunteer.png`, `desktop-donate.png`, `desktop-donate-confirmed.png` | About, contact, volunteer, give monthly |
| `shots/phone-landing.png`, `phone-programs.png` | A phone |
| `shots/desktop-northgate.png`, `desktop-empty.png`, `desktop-error.png`, `desktop-not-found.png` | Off, empty, error, not found |
| `clips/landing-desktop.mp4`, `programs-desktop.mp4`, `contact-desktop.mp4`, `involved-desktop.mp4`, `site-phone.mp4`, `states-desktop.mp4` | Screen recordings of the running app against a fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:29 | Introduction | Families find a program first |
| 00:29-01:02 | Address | The address chooses the organization; 404 alike |
| 01:02-01:32 | Home | Four steps, counts of programs, open now |
| 01:32-01:56 | Programs | Current programs, Running or Upcoming, Apply |
| 01:56-02:26 | Learning and mentoring | Sections only while each module is on |
| 02:26-02:42 | Apply | The program's enrollment link |
| 02:42-03:14 | About and contact | Promise to families; errors, sent, kept on failure |
| 03:14-03:36 | Volunteer | The screening acknowledgement |
| 03:36-04:02 | Give monthly | Provider checkout, reference only, unavailable |
| 04:02-04:32 | Server rules | Anonymous, validated, limited, audited |
| 04:32-04:42 | Phone | Links wrap, cards stack |
| 04:42-05:07 | Off and states | Northgate, nothing open, Try again, not found |
| 05:07-05:37 | Testing | API and browser tests |
| 05:37-06:09 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/81-explore-the-public-website --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/81-explore-the-public-website
node tools/video-build/build-video.mjs docs/videos/81-explore-the-public-website --no-captions
```

## Pitfalls

- An open program whose enrollment link has not been made yet shows as closed: open enrollment from the program first.
- Public website is off for every organization until an admin turns it on in Settings › Modules, and the address comes from the website profile (L2-126).
- A staff inbox for contact messages, volunteer offers and pledges is deferred; they are in the database and the audit log.
- No real payment provider ships yet; `UnconfiguredPaymentProvider` answers unavailable until one is added (ADR 0075).

## References

- `docs/specs/L2.md`: L2-132 to L2-134, L2-001, L2-005, L2-031, L2-033, L2-126
- `docs/adr/0075-the-public-website-reads-published-content-by-address-and-stores-visitor-requests-per-organization.md`, `docs/adr/0043-merge-waypoint.md`
- `docs/detailed-designs/website/` (navigate-public-site, explore-programs, browse-current-cohorts, view-journey-and-impact, contact-program, register-volunteer-interest, start-donation)
