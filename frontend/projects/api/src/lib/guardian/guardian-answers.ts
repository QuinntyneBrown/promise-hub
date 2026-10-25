/** A typed name and the answers to the slip's questions. */
export interface GuardianAnswers {
  name: string;
  photos: boolean | null;
  lunch: 'pack' | 'provide' | null;
  swimming: 'yes' | 'float' | 'no' | null;
}
