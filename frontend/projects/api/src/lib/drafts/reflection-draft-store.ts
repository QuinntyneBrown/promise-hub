import type { ReflectionDraft } from './reflection-draft';

/** Reflection drafts kept on this device per membership and lesson (L2-079 criterion 5, ADR 0060); never sent to the server. */
export interface ReflectionDraftStore {
  load(membershipId: string, lessonId: string): ReflectionDraft | null;
  save(membershipId: string, lessonId: string, draft: ReflectionDraft): void;
  clear(membershipId: string, lessonId: string): void;
}
