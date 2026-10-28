/** The directory's filters (page: people); empty strings mean any. */
export interface PeopleQuery {
  q: string;
  role: string;
  status: string;
  programId: string;
  page: number;
}
