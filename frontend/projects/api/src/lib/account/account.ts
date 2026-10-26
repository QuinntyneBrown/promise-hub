/** Your account: who you are here and the state of two-step sign-in. */
export interface Account {
  name: string;
  email: string;
  role: string;
  organization: string;
  mobile: string | null;
  twoStepOn: boolean;
  recoveryCodesLeft: number;
}
