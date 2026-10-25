/** One spreadsheet column: its name, a sample value, the field it maps to, and whether it was matched automatically. */
export interface RosterMappingRow {
  column: string;
  sample: string | null;
  value: string;
  matched: boolean;
}
