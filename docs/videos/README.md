# Videos

Narrated walkthroughs made with the `creating-narrated-videos` skill
(`.claude/skills/creating-narrated-videos/SKILL.md`). Each folder holds the text the
video is built from (`script.md`, `slides.html`, `README.md` outline), any screen
recordings it plays (`clips/`, recorded from `clips/clips.mjs`) and the generated
`NN-topic.mp3` and `NN-topic.mp4`.

| # | Video | Runtime | Covers |
|---|---|---|---|
| 01 | [The walking skeleton](01-walking-skeleton/README.md) | ~3.5 min | Tenancy, migrate and seed, audit recording, the shell |
| 02 | [Sign in securely](02-sign-in-securely/README.md) | ~3 min | Sign-in, lockout, the code step, sessions and server-side roles |
| 03 | [Configure modules](03-configure-modules/README.md) | ~3 min | Settings › Modules, dependencies, module gates and navigation |
| 04 | [Maintain households](04-maintain-households/README.md) | ~3 min | Families, guardians, children, medical details and who sees them |
| 05 | [Create programs and events](05-create-programs-and-events/README.md) | ~3 min | Programs, rosters, archiving, events, draft slips and cancellations |
| 06 | [Check children in](06-check-children-in/README.md) | ~3 min | One-tap check-in, absences, walk-ins and Today's sessions |
| 07 | [Read a Quick Card](07-read-a-quick-card/README.md) | ~2.5 min | The allergy alert first, tap-to-call, restricted medical details and audited opens |
| 08 | [Sign children out](08-sign-children-out/README.md) | ~2.5 min | Approved adults, someone else with the guardian's okay by phone, and audited sign-outs |
| 09 | [Record attendance as a youth worker](09-record-attendance-as-youth-worker/README.md) | ~2.5 min | Staff assigned per session; youth workers run only their own, refused on the server |
| 10 | [Send guardian messages](10-send-guardian-messages/README.md) | ~3.5 min | Compose by program or event, a live count and SMS price, per-household delivery, the SMS cap |
| 11 | [Send permission slips](11-send-permission-slips/README.md) | ~3 min | Write, send or schedule, track answers per child, material edits re-open signing |
| 12 | [Sign a permission slip](12-sign-a-permission-slip/README.md) | ~3 min | A texted link and a six-digit code, the family's language, typed-name signing and decline |
| 13 | [Resolve missing slips](13-resolve-missing-slips/README.md) | ~3 min | Scheduled reminders once per slot, day-of clearance, tablet signing and texting the unsigned |
| 14 | [Import a roster](14-import-a-roster/README.md) | ~3 min | CSV or XLSX upload, column mapping, duplicates and gaps reviewed, families created in one audited go |
| 15 | [Enroll a child](15-enroll-a-child/README.md) | ~3 min | One enrollment link per program, a code to the typed contact, household and children, review before the roster |
| 16 | [Review enrollment](16-review-enrollment/README.md) | ~2 min | Accept, waitlist or decline enrollments one by one or in bulk, with every guardian texted |

## Making or updating a video

Run from the repository root. Generated timing, slide renders and recordings go
to `.cache/` (ignored by git).

```powershell
# 1. Narration: script.md → NN-topic.mp3 and .cache/videos/NN-topic/timing.json
$env:PYTHON = "python"
python -m pip install edge-tts                        # free Edge read-aloud, needs internet
node tools/video-audio/generate-audio.mjs docs/videos/NN-topic --dry-run
node tools/video-audio/generate-audio.mjs docs/videos/NN-topic

# 2. Screen recordings of the real app (optional; the app must be running)
node tools/video-record/record-clips.mjs docs/videos/NN-topic [--base http://localhost:4200] [--only clip-name]

# 3. Video: check cues, look at the slides, then encode
node tools/video-build/build-video.mjs docs/videos/NN-topic --check
node tools/video-build/build-video.mjs docs/videos/NN-topic --slides-only
node tools/video-build/build-video.mjs docs/videos/NN-topic --no-captions   # captions only when asked for
```

The tools need Node 22, Python 3 with `edge-tts`, ffmpeg with libx264 and libass,
and the Playwright package installed in `frontend/` or `e2e/` (`EDGE_PATH`,
`FFMPEG_PATH` and `PYTHON` override them). Acronyms are spoken through
`tools/video-audio/pronunciations.json`; a folder can add its own
`pronunciations.json`.

### Slides

`slides.html` uses the shared `assets/slides.css` and `assets/slides.js`, which read
the design-system tokens by role. Every slide after the first has a `data-cue`
copied verbatim from `script.md`; it appears when the narration reaches that phrase.
A slide with `data-clip="clips/x.mp4"` and a `<video class="clip">` (or
`class="clip phone"`) plays that recording in the box.

### Background music (mandatory)

Every video has background music, `assets/music/on-the-beach-intro-outro.mp3`, named in every deck with
`<body data-music="../assets/music/on-the-beach-intro-outro.mp3">`. The builder lays
it under the narration, looped, at −10.8 dB with a fade in, holds the last slide 3 s
so the music fades out, and fails a deck that names no music. Source and licence are
in `assets/music/README.md`.
