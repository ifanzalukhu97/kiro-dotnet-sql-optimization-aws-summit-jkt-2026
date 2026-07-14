import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem } from '../../core/models/lookup-item';
import { ColumnDef } from '../../shared/models/column-def';

interface WarehouseTransactionListItem {
  stockItemTransactionId: number;
  stockItemName: string;
  transactionOccurredWhen: string;
  quantity: number;
  quantityOnHand: number;
}

interface WarehouseTransactionDetail {
  stockItemTransactionId: number;
  stockItemId: number;
  stockItemName: string;
  transactionOccurredWhen: string;
  quantity: number;
  quantityOnHand: number;
  reorderLevel: number;
  targetStockLevel: number;
}

@Component({
  selector: 'app-warehouse',
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Warehouse</h1>
        <app-response-time-badge
          [timeMs]="responseTime"
          [error]="requestFailed">
        </app-response-time-badge>
      </div>

      <div class="filter-bar">
        <app-dropdown-filter
          [options]="stockItems"
          placeholder="All Stock Items"
          label="Stock Item"
          (selectionChange)="onStockItemChange($event)">
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
        (rowClick)="onRowClick($event)">
      </app-data-table>

      <div class="detail-panel" *ngIf="selectedTransaction">
        <div class="detail-header">
          <h2>Transaction #{{ selectedTransaction.stockItemTransactionId }}</h2>
          <button class="close-btn" (click)="closeDetail()">&times;</button>
        </div>
        <div class="detail-info">
          <div class="detail-field">
            <span class="label">Stock Item:</span>
            <span class="value">{{ selectedTransaction.stockItemName }}</span>
          </div>
          <div class="detail-field">
            <span class="label">Transaction Date:</span>
            <span class="value">{{ selectedTransaction.transactionOccurredWhen | date:'mediumDate' }}</span>
          </div>
          <div class="detail-field">
            <span class="label">Quantity:</span>
            <span class="value">{{ selectedTransaction.quantity }}</span>
          </div>
          <div class="detail-field">
            <span class="label">Quantity On Hand:</span>
            <span class="value">{{ selectedTransaction.quantityOnHand }}</span>
          </div>
          <div class="detail-field">
            <span class="label">Reorder Level:</span>
            <span class="value">{{ selectedTransaction.reorderLevel }}</span>
          </div>
          <div class="detail-field">
            <span class="label">Target Stock Level:</span>
            <span class="value">{{ selectedTransaction.targetStockLevel }}</span>
          </div>
        </div>
      </div>
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
    }

    .filter-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .detail-panel {
      margin-top: 24px;
      background: #2a2a2a;
      border-radius: 8px;
      padding: 24px;
      border: 1px solid #3a3a3a;
    }

    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      h2 {
        margin: 0;
        color: #aaff00;
        font-size: 20px;
      }
    }

    .close-btn {
      background: none;
      border: none;
      color: #b0b0b0;
      font-size: 24px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;

      &:hover {
        color: #ffffff;
        background: #3a3a3a;
      }
    }

    .detail-info {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .detail-field {
      .label {
        color: #b0b0b0;
        margin-right: 8px;
        font-size: 14px;
      }

      .value {
        color: #ffffff;
        font-size: 14px;
      }
    }
  `]
})
export class WarehouseComponent implements OnInit {
  transactions: WarehouseTransactionListItem[] = [];
  stockItems: LookupItem[] = [];
  selectedTransaction: WarehouseTransactionDetail | null = null;

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

  responseTime: number | null = null;
  requestFailed = false;
  errorMessage: string | null = null;

  private stockItemId: number | null = null;

  constructor(
    private apiService: ApiService,
    private timingService: TimingService
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

    if (this.stockItemId) {
      params['stockItemId'] = this.stockItemId;
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
      error: () => {
        // Silently handle lookup failure
      }
    });
  }

  onStockItemChange(stockItemId: number | null): void {
    this.stockItemId = stockItemId;
    this.page = 1;
    this.closeDetail();
    this.loadTransactions();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.closeDetail();
    this.loadTransactions();
  }

  onRowClick(row: WarehouseTransactionListItem): void {
    this.loadTransactionDetail(row.stockItemTransactionId);
  }

  loadTransactionDetail(transactionId: number): void {
    this.apiService.getDetail<WarehouseTransactionDetail>('warehouse', transactionId).subscribe({
      next: (detail) => {
        this.selectedTransaction = detail;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load transaction detail.';
      }
    });
  }

  closeDetail(): void {
    this.selectedTransaction = null;
  }
}
