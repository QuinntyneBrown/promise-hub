// Screen recordings for video 82, the recap of the Waypoint merge (prompts 49 to 81), made with
// tools/video-record/record-clips.mjs against the running frontend. Each clip replays a clip of the video that
// introduced that journey, with that video's fake API (the backend is faked like the e2e suite): Sofía resets her
// password on her phone and lands on Learning (77), opens her Learning home with the work assigned to her (69), her
// journey and progress (65); Daniel opens his mentor dashboard and searches My youth (55) and raises an at-risk flag
// (68); Sofía answers an RSVP (70); and Dana opens Harbourview's public website and its programs (81).
// The source clips also take screenshots for their own videos; here those are skipped, so nothing outside this
// folder is written.
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const videos = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The default export of video NN's clips.mjs. */
async function clipsOf(number) {
  const folder = readdirSync(videos).find((name) => name.startsWith(`${number}-`));
  return (await import(pathToFileURL(join(videos, folder, 'clips', 'clips.mjs')).href)).default;
}

/**
 * The mentor dashboard gained the follow-ups (67) and Check-ins due (79) after video 55 was recorded; its fake answers
 * without them, so they are added here as the real API answers them: nothing to follow up, a 14-day cadence, and the
 * two youth Daniel has not checked in with yet.
 */
const DASHBOARD_SINCE_55 = {
  followUps: [],
  checkInEveryDays: 14,
  checkInsDue: [
    { childId: 'c-sofia', youthName: 'Sofía Rivera', lastCheckIn: null },
    { childId: 'c-yusuf', youthName: 'Yusuf Haddad', lastCheckIn: null },
  ],
};

/** A route whose fulfilled mentor dashboard carries every field the current page reads. */
function currentDashboard(route) {
  return new Proxy(route, {
    get(target, key) {
      if (key === 'fulfill') {
        return (options = {}) => {
          const path = new URL(target.request().url()).pathname;
          if (path === '/api/mentoring/dashboard' && options.json) options = { ...options, json: { ...DASHBOARD_SINCE_55, ...options.json } };
          return target.fulfill(options);
        };
      }
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

/** The demo with screenshots of the iframe skipped and the mentor dashboard brought up to date; everything else is the recorder's own. */
function withoutShots(demo) {
  const page = new Proxy(demo.page, {
    get(target, key) {
      if (key === 'route') return (url, handler, ...rest) => target.route(url, (route, request) => handler(currentDashboard(route), request), ...rest);
      if (key === 'locator') {
        return (selector, ...rest) => {
          const locator = target.locator(selector, ...rest);
          if (selector !== 'iframe') return locator;
          return new Proxy(locator, { get: (l, k) => (k === 'screenshot' ? async () => undefined : Reflect.get(l, k).bind?.(l) ?? Reflect.get(l, k)) });
        };
      }
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  return { ...demo, page };
}

/** Video NN's clip `from`, recorded here as `name`. */
async function replay(number, from, name) {
  const clip = (await clipsOf(number)).find((c) => c.name === from);
  if (!clip) throw new Error(`video ${number} has no clip ${from}`);
  return { ...clip, name, run: (demo) => clip.run(withoutShots(demo)) };
}

export default [
  await replay(77, 'reset-phone', 'reset-phone'),
  await replay(69, 'youth-desktop', 'learning-desktop'),
  await replay(65, 'progress-desktop', 'journey-desktop'),
  await replay(55, 'dashboard-desktop', 'mentor-dashboard-desktop'),
  await replay(68, 'raise-desktop', 'at-risk-desktop'),
  await replay(70, 'youth-desktop', 'rsvp-desktop'),
  await replay(81, 'landing-desktop', 'site-landing-desktop'),
  await replay(81, 'programs-desktop', 'site-programs-desktop'),
];
