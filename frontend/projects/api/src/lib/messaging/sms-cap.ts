/** This month's SMS segments; at the cap texts pause and email continues. */
export interface SmsCap {
  cap: number;
  used: number;
  remaining: number;
  state: 'Ok' | 'Reached';
  period: string;
}
