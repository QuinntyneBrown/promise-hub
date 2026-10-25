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
