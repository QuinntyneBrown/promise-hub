export interface ImportUpload {
  id: string;
  fileName: string;
  rowCount: number;
  matched: number;
  columns: { name: string; sample: string | null; field: string | null }[];
}
