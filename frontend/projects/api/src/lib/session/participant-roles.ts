import type { Role } from './role';

/** The participant roles that use their own sections, never the staff app (ADR 0043). */
export const PARTICIPANT_ROLES: readonly Role[] = ['Youth', 'Mentor', 'Volunteer'];
