import type { OnboardingAnswers } from './onboarding-answers';
import type { OnboardingProgram } from './onboarding-program';

/** A youth's first-run setup and where they are placed; `program` is null until staff place them (L2-059). */
export interface YouthOnboarding extends OnboardingAnswers {
  status: 'not-started' | 'in-progress' | 'completed';
  program: OnboardingProgram | null;
}
