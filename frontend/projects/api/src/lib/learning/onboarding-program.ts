/** The program a youth is placed in, as the setup's program step shows it. */
export interface OnboardingProgram {
  name: string;
  schedule: string | null;
  startsOn: string;
  endsOn: string;
}
