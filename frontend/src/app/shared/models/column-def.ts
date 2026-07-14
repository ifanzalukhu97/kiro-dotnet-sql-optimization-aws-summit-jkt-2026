export interface ColumnDef {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  format?: 'currency' | 'date' | 'number' | 'text';
}
