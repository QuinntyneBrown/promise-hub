import type { Role } from '../session/role';
import type { PersonRow } from './person-row';

/** One page of the people directory with the roles and programs a filter may name (L2-112). */
export interface PeoplePage {
  items: PersonRow[];
  total: number;
  page: number;
  pageSize: number;
  roles: Role[];
  programs: { id: string; name: string }[];
}
