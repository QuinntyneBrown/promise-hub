import type { AnnouncementAudience } from '@promisehub/api';
import type { RadioOption } from '@promisehub/components';

/** How each audience reads on a list (L2-105). */
export const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  Youth: 'Youth',
  YouthAndGuardians: 'Youth and guardians',
  Guardians: 'Guardians',
  Mentors: 'Mentors',
  Everyone: 'Everyone',
};

/** Who hears it, with what each choice means (dialog: compose-announcement). */
export const AUDIENCE_OPTIONS: RadioOption[] = [
  { value: 'Youth', label: 'Youth', hint: 'Youth with an account in the program' },
  {
    value: 'YouthAndGuardians',
    label: 'Youth and guardians',
    hint: 'Youth in the app; guardians by text or email',
  },
  { value: 'Guardians', label: 'Guardians', hint: 'By text, or email when there’s no mobile' },
  { value: 'Mentors', label: 'Mentors', hint: 'Mentors of the program, in the app' },
  { value: 'Everyone', label: 'Everyone', hint: 'Youth, mentors and guardians' },
];
