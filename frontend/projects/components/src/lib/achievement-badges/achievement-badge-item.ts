/** One badge of a collection: its stored icon, name, the caption saying when or what earns it, and whether it is still locked. */
export interface AchievementBadgeItem {
  key: string;
  icon: string;
  name: string;
  caption: string;
  locked: boolean;
}
