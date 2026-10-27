/** A youth who holds a badge; awardedBy is null when the server awarded it. */
export interface BadgeAward {
  id: string;
  membershipId: string;
  youthName: string;
  awardedAt: string;
  awardedBy: string | null;
}
