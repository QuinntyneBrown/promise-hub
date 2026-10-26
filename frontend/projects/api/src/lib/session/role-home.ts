import type { Session } from './session';

/**
 * Where a person lands after signing in (L2-046, ADR 0044): youth on Learning and mentors on Mentoring while that
 * module is on, everyone else on Today. Presentation only; the server decides what each role may read.
 */
export function roleHome(session: Pick<Session, 'role' | 'modules'>): string {
  if (session.role === 'Youth' && session.modules.includes('Learning')) return '/learning';
  if (session.role === 'Mentor' && session.modules.includes('Mentoring')) return '/mentoring';
  return '/';
}
