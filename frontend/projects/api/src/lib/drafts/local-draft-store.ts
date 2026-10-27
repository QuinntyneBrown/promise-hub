import { Injectable } from '@angular/core';
import type { DraftStore } from './draft-store';
import type { SubmissionDraft } from './submission-draft';

const key = (membershipId: string, assignmentId: string) =>
  `promisehub.draft.${membershipId}.${assignmentId}`;

/** Keeps drafts in localStorage as promisehub.draft.{membership}.{assignment}; when storage is blocked nothing is kept. */
@Injectable()
export class LocalDraftStore implements DraftStore {
  load(membershipId: string, assignmentId: string): SubmissionDraft | null {
    try {
      const raw = localStorage.getItem(key(membershipId, assignmentId));
      return raw ? (JSON.parse(raw) as SubmissionDraft) : null;
    } catch {
      return null;
    }
  }

  save(membershipId: string, assignmentId: string, draft: SubmissionDraft): void {
    try {
      localStorage.setItem(key(membershipId, assignmentId), JSON.stringify(draft));
    } catch {
      // Storage is full or blocked: the page keeps working, without a draft.
    }
  }

  clear(membershipId: string, assignmentId: string): void {
    try {
      localStorage.removeItem(key(membershipId, assignmentId));
    } catch {
      // Storage is blocked: there is no draft to clear.
    }
  }
}
