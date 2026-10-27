/** “both attempts” for two, otherwise “all 3 attempts”, as the mocks write it. */
export function attemptsWord(allowed: number): string {
  return allowed === 2
    ? 'both attempts'
    : allowed === 1
      ? 'your attempt'
      : `all ${allowed} attempts`;
}
