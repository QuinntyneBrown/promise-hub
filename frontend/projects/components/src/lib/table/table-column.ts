export interface TableColumn {
  key: string;
  label: string;
  /** A count or a rate: right-aligned with tabular figures (design system: table, numeric column). */
  numeric?: boolean;
}
