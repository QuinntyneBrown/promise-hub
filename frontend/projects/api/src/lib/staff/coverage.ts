import type { Role } from '../session/role';

/** Upcoming sessions with who works them, and the people who can be assigned (page: coverage). */
export interface Coverage {
  sessions: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string;
    place: string | null;
    staff: { id: string; name: string; role: Role }[];
    gap: boolean;
  }[];
  people: { id: string; name: string; role: Role }[];
}
