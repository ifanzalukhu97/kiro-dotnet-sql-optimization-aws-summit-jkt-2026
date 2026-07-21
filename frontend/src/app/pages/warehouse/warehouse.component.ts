import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem } from '../../core/models/lookup-item';
import { ColumnDef } from '../../shared/models/column-def';
import { SortEvent } from '../../shared/components/data-table/data-table.component';

interface WarehouseTransactionListItem {
  stockItemTransactionId: number;
  stockItemName: string;
  transactionOccurredWhen: string;
  quantity: number;
  quantityOnHand: number;
}

@Component({
  selector: 'app-warehouse',
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Warehouse</h1>
        <div class="header-actions">
          <app-export-csv-button
            [resourceName]="'warehouse'"
            [columns]="columns"
            [fetchFn]="exportFn"
            [totalCount]="totalCount">
          </app-export-csv-button>
          <app-response-time-badge
            [timeMs]="responseTime"
            [error]="requestFailed">
          </app-response-time-badge>
        </div>
      </div>

      <div class="filter-bar">
        <app-search-input (searchChange)="onSearchChange($event)"></app-search-input>
        <app-dropdown-filter
          [options]="stockItems"
          placeholder="All Stock Items"
          label="Stock Item"
          [multiple]="true"
          (multiSelectionChange)="onStockItemChange($event)">
        </app-dropdown-filter>
      </div>

      <app-error-message
        [message]="errorMessage"
        [show]="!!errorMessage">
      </app-error-message>

      <app-data-table
        [columns]="columns"
        [data]="transactions"
        [loading]="loading"
        [page]="page"
        [pageSize]="pageSize"
        [totalCount]="totalCount"
        (pageChange)="onPageChange($event)"
        (sortChange)="onSortChange($event)"
        (rowClick)="onRowClick($event)">
      </app-data-table>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;

      h1 {
        margin: 0;
        color: #ffffff;
        font-size: 28px;
        font-weight: 600;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }

    .filter-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
  `]
})
export class WarehouseComponent implements OnInit {
  transactions: WarehouseTransactionListItem[] = [];
  stockItems: LookupItem[] = [];

  columns: ColumnDef[] = [
    { key: 'stockItemName', header: 'Stock Item', sortable: true },
    { key: 'transactionOccurredWhen', header: 'Transaction Date', sortable: true, format: 'date' },
    { key: 'quantity', header: 'Quantity', sortable: true, format: 'number' },
    { key: 'quantityOnHand', header: 'Quantity On Hand', sortable: true, format: 'number' }
  ];

  page = 1;
  pageSize = 20;
  totalCount = 0;
  loading = false;
  sortBy = '';
  sortDirection = '';

  responseTime: number | null = null;
  requestFailed = false;
  errorMessage: string | null = null;

  search = '';

  private selectedStockItemIds: number[] = [];

  exportFn = () => {
    const params: Record<string, any> = { page: 1, pageSize: 10000 };
    if (this.selectedStockItemIds.length) params['stockItemId'] = this.selectedStockItemIds.join(',');
    return this.apiService.getList<WarehouseTransactionListItem>('warehouse', params).pipe(map(r => r.data));
  };

  constructor(
    private apiService: ApiService,
    private timingService: TimingService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.loadStockItemLookup();

    this.timingService.responseTime$.subscribe(time => {
      this.responseTime = time;
    });
    this.timingService.requestFailed$.subscribe(failed => {
      this.requestFailed = failed;
    });
  }

  loadTransactions(): void {
    this.loading = true;
    this.errorMessage = null;

    const params: Record<string, any> = {
      page: this.page,
      pageSize: this.pageSize
    };

    if (this.selectedStockItemIds.length) {
      params['stockItemId'] = this.selectedStockItemIds.join(',');
    }
    if (this.search) {
      params['search'] = this.search;
    }
    if (this.sortBy) {
      params['sortBy'] = this.sortBy;
      params['sortDirection'] = this.sortDirection;
    }

    this.apiService.getList<WarehouseTransactionListItem>('warehouse', params).subscribe({
      next: (response) => {
        this.transactions = response.data;
        this.totalCount = response.totalCount;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load warehouse transactions. Please try again.';
        this.loading = false;
      }
    });
  }

  loadStockItemLookup(): void {
    this.apiService.getLookup('stockitems/lookup').subscribe({
      next: (items) => {
        this.stockItems = items;
      },
      error: () => {}
    });
  }

  onSearchChange(term: string): void {
    this.search = term;
    this.page = 1;
    this.loadTransactions();
  }

  onStockItemChange(stockItemIds: number[]): void {
    this.selectedStockItemIds = stockItemIds;
    this.page = 1;
    this.loadTransactions();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadTransactions();
  }

  onSortChange(event: SortEvent): void {
    this.sortBy = event.column;
    this.sortDirection = event.direction;
    this.page = 1;
    this.loadTransactions();
  }

  onRowClick(row: WarehouseTransactionListItem): void {
    this.router.navigate([row.stockItemTransactionId], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }
}
