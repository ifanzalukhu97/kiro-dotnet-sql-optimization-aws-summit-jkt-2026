import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { ColumnDef } from '@shared/models/column-def';

function escapeCsvValue(value: any): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function generateCsv(data: any[], columns: ColumnDef[]): string {
  const header = columns.map(c => escapeCsvValue(c.header)).join(',');
  const rows = data.map(row =>
    columns.map(c => escapeCsvValue(row[c.key])).join(',')
  );
  return [header, ...rows].join('\r\n');
}

@Component({
  selector: 'app-export-csv-button',
  template: `
    <button class="export-btn" (click)="export()" [disabled]="loading">
      {{ loading ? 'Exporting...' : 'Export CSV' }}
    </button>
    <span class="export-error" *ngIf="errorMessage">{{ errorMessage }}</span>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .export-btn {
      background: #2a2a2a;
      color: #aaff00;
      border: 1px solid #aaff00;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .export-btn:hover:not(:disabled) {
      background: #333;
    }
    .export-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .export-error {
      color: #ff4444;
      font-size: 12px;
    }
  `]
})
export class ExportCsvButtonComponent {
  @Input() resourceName = 'data';
  @Input() columns: ColumnDef[] = [];
  @Input() fetchFn!: () => Observable<any[]>;
  @Input() totalCount?: number;

  loading = false;
  errorMessage: string | null = null;

  export(): void {
    if (!this.fetchFn || this.loading) return;
    if (this.totalCount && this.totalCount > 10000) {
      const ok = confirm(`This will export ${this.totalCount.toLocaleString()} records. Continue?`);
      if (!ok) return;
    }
    this.loading = true;
    this.errorMessage = null;
    this.fetchFn().subscribe({
      next: (data) => {
        const csv = generateCsv(data, this.columns);
        const date = new Date().toISOString().slice(0, 10);
        const filename = `${this.resourceName}-export-${date}.csv`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Export failed. The dataset may be too large or the server timed out.';
      }
    });
  }
}
