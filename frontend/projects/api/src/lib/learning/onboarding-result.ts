import type { LoadResult } from '../load-result';
import type { YouthOnboarding } from './youth-onboarding';

/** The setup, or the consent gate (403 consent-required, L2-056), or why it couldn't load. */
export type OnboardingResult =
  LoadResult<YouthOnboarding> | { status: 'consent-required'; consentAge: number };
