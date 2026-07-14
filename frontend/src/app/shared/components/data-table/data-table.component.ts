import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ColumnDef } from '../../models/column-def';

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc' | '';
}

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnChanges {
  @Input() columns: ColumnDef[] = [];
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() page = 1;
  @Input() pageSize = 20;
  @Input() totalCount = 0;

  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<SortEvent>();
  @Output() rowClick = new EventEmitter<any>();

  sortColumn = '';
  sortDirection: 'asc' | 'desc' | '' = '';

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.page;

    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(total, start + 4);
      } else if (end === total) {
        start = Math.max(1, end - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      // Data updated externally
    }
  }

  onSort(column: ColumnDef): void {
    if (!column.sortable) {
      return;
    }

    if (this.sortColumn === column.key) {
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else if (this.sortDirection === 'desc') {
        this.sortDirection = '';
        this.sortColumn = '';
      } else {
        this.sortDirection = 'asc';
      }
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }

    this.sortChange.emit({
      column: this.sortColumn,
      direction: this.sortDirection
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) {
      return;
    }
    this.pageChange.emit(page);
  }

  previousPage(): void {
    this.goToPage(this.page - 1);
  }

  nextPage(): void {
    this.goToPage(this.page + 1);
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  formatValue(value: any, format?: 'currency' | 'date' | 'number' | 'text'): string {
    if (value === null || value === undefined) {
      return '—';
    }

    switch (format) {
      case 'currency':
        return '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      case 'date':
        return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      case 'number':
        return Number(value).toLocaleString('en-US');
      case 'text':
      default:
        return String(value);
    }
  }

  getSortIndicator(column: ColumnDef): string {
    if (!column.sortable) {
      return '';
    }
    if (this.sortColumn === column.key) {
      return this.sortDirection === 'asc' ? '▲' : this.sortDirection === 'desc' ? '▼' : '⇅';
    }
    return '⇅';
  }
}
