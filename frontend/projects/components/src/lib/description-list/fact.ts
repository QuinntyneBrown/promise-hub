export interface Fact {
  /** A stable key, used as the test id "fact-{key}". */
  key: string;
  term: string;
  value: string;
}
