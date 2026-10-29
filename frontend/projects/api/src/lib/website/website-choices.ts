/** The topics a visitor writes about from the contact page; the server accepts only these (L2-134). */
export const CONTACT_TOPICS = [
  'Programs and enrollment',
  'Volunteering',
  'Giving',
  'Something else',
] as const;

/** How a volunteer would like to help; the server accepts only these. */
export const VOLUNTEER_AREAS = [
  'Homework help',
  'Coaching a sports team',
  'Camp helper',
  'Driving and setup',
  'Wherever I’m needed',
] as const;
