/** The report for a program and period; age counts read "<5" when masked. */
export interface Report {
  childrenServed: number;
  attendanceRate: number;
  sessionsDelivered: number;
  slipsSigned: number;
  ages: { band: string; count: string }[];
  programs: { id: string; name: string; attendanceRate: number | null }[];
  languages: { language: string; households: number }[];
  masked: boolean;
  surveyResponses: number;
  surveyAverage: number | null;
}
