/** A current program as a visitor sees it (L2-133): no capacity, counts or children. */
export interface PublicProgram {
  name: string;
  schedule: string | null;
  ages: string | null;
  /** yyyy-mm-dd */
  startsOn: string;
  endsOn: string;
  status: 'Running' | 'Upcoming';
  /** The enrollment link's path while enrollment is open, else null. */
  applyPath: string | null;
  /** The published track it follows, only while Learning is on. */
  track: string | null;
  /** The lead mentor's first name, only while Mentoring is on. */
  leadMentor: string | null;
}
