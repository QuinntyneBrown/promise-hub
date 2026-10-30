/** One reminder (L2-157): its kind, what it is about (the tax year, a first name, a benefit), when it is sent and the day it is about. */
export interface LearningBondDateReminder {
  id: string;
  kind: 'Taxes' | 'TurnsSix' | 'TurnsEighteen' | 'Renewal';
  subject: string;
  dueOn: string;
  eventOn: string;
  turnedOff: boolean;
}
