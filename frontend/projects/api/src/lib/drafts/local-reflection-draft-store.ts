import { Injectable } from '@angular/core';
import type { ReflectionDraft } from './reflection-draft';
import type { ReflectionDraftStore } from './reflection-draft-store';

const key = (membershipId: string, lessonId: string) =>
  `promisehub.reflection-draft.${membershipId}.${lessonId}`;

/** Keeps reflection drafts in localStorage as promisehub.reflection-draft.{membership}.{lesson}; when storage is blocked nothing is kept. */
@Injectable()
export class LocalReflectionDraftStore implements ReflectionDraftStore {
  load(membershipId: string, lessonId: string): ReflectionDraft | null {
    try {
      const raw = localStorage.getItem(key(membershipId, lessonId));
      return raw ? (JSON.parse(raw) as ReflectionDraft) : null;
    } catch {
      return null;
    }
  }

  save(membershipId: string, lessonId: string, draft: ReflectionDraft): void {
    try {
      localStorage.setItem(key(membershipId, lessonId), JSON.stringify(draft));
    } catch {
      // Storage is full or blocked: the page keeps working, without a draft.
    }
  }

  clear(membershipId: string, lessonId: string): void {
    try {
      localStorage.removeItem(key(membershipId, lessonId));
    } catch {
      // Storage is blocked: there is no draft to clear.
    }
  }
}
