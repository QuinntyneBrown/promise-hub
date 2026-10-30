/** A document the provider asked for (L2-150 criterion 6): its name, the file chosen if any, and when it was sent. */
export interface LearningBondDocumentRequest {
  id: string;
  name: string;
  fileName: string | null;
  sentAt: string | null;
}
