/** The composer's live count, priced against the SMS cap by the server. */
export interface MessagePreview {
  recipientCount: number;
  textCount: number;
  emailCount: number;
  unreachableCount: number;
  characters: number;
  segments: number;
  totalSegments: number;
  remainingSegments: number;
  fallingBackToEmail: number;
}
