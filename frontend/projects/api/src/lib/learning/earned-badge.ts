/** A badge the youth holds, with when and, for one awarded by hand, who awarded it. */
export interface EarnedBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  awardedAt: string;
  awardedBy: string | null;
}
