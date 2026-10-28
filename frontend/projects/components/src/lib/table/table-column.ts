export interface TableColumn {
  key: string;
  label: string;
  /** A count or a rate: right-aligned with tabular figures (design system: table, numeric column). */
  numeric?: boolean;
  /** Dropped below 640px (design system: table, hide-sm); the row must still make sense without it. */
  hideOnPhone?: boolean;
}
