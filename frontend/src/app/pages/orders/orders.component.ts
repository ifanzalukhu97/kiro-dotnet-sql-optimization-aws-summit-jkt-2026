import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem } from '../../core/models/lookup-item';
import { ColumnDef } from '../../shared/models/column-def';
import { SortEvent } from '../../shared/components/data-table/data-table.component';

interface OrderListItem {
  orderId: number;
  customerName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  lineCount: number;
  totalAmount: number;
}

@Component({
  selector: 'app-orders',
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Orders</h1>
        <div class="header-actions">
          <app-export-csv-button
            [resourceName]="'orders'"
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
          [options]="customers"
          placeholder="All Customers"
          label="Customer"
          [multiple]="true"
          (multiSelectionChange)="onCustomerChange($event)">
        </app-dropdown-filter>
        <app-dropdown-filter
          [options]="products"
          placeholder="All Products"
          label="Product"
          [multiple]="true"
          (multiSelectionChange)="onProductChange($event)">
        </app-dropdown-filter>
        <div class="date-filter">
          <label class="date-label">From</label>
          <input type="date" class="date-input" [value]="startDate" (change)="onStartDateChange($event)">
        </div>
        <div class="date-filter">
          <label class="date-label">To</label>
          <input type="date" class="date-input" [value]="endDate" (change)="onEndDateChange($event)">
        </div>
      </div>

      <app-error-message
        [message]="errorMessage"
        [show]="!!errorMessage">
      </app-error-message>

      <app-data-table
        [columns]="columns"
        [data]="orders"
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
      align-items: flex-end;
    }

    .date-filter {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .date-label {
      font-size: 12px;
      color: #aaa;
    }

    .date-input {
      background: #2a2a2a;
      border: 1px solid #444;
      color: #fff;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      color-scheme: dark;

      &:focus {
        outline: none;
        border-color: #aaff00;
      }
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders: OrderListItem[] = [];
  customers: LookupItem[] = [];
  products: LookupItem[] = [];

  columns: ColumnDef[] = [
    { key: 'orderId', header: 'Order ID', sortable: true, format: 'id' },
    { key: 'customerName', header: 'Customer', sortable: true },
    { key: 'orderDate', header: 'Order Date', sortable: true, format: 'date' },
    { key: 'expectedDeliveryDate', header: 'Expected Delivery', sortable: true, format: 'date' },
    { key: 'lineCount', header: 'Lines', sortable: true, format: 'number' },
    { key: 'totalAmount', header: 'Total Amount', sortable: true, format: 'currency' }
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
  startDate = '';
  endDate = '';
  private selectedCustomerIds: number[] = [];
  private selectedStockItemIds: number[] = [];

  exportFn = () => {
    const params: Record<string, any> = { page: 1, export: 'true' };
    if (this.selectedCustomerIds.length) params['customerId'] = this.selectedCustomerIds.join(',');
    if (this.selectedStockItemIds.length) params['stockItemId'] = this.selectedStockItemIds.join(',');
    if (this.startDate) params['startDate'] = this.startDate;
    if (this.endDate) params['endDate'] = this.endDate;
    return this.apiService.getList<OrderListItem>('orders', params).pipe(map(r => r.data));
  };

  constructor(
    private apiService: ApiService,
    private timingService: TimingService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadCustomerLookup();
    this.loadProductLookup();

    this.timingService.responseTime$.subscribe(time => {
      this.responseTime = time;
    });
    this.timingService.requestFailed$.subscribe(failed => {
      this.requestFailed = failed;
    });
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = null;

    const params: Record<string, any> = {
      page: this.page,
      pageSize: this.pageSize
    };

    if (this.selectedCustomerIds.length) {
      params['customerId'] = this.selectedCustomerIds.join(',');
    }
    if (this.selectedStockItemIds.length) {
      params['stockItemId'] = this.selectedStockItemIds.join(',');
    }
    if (this.search) {
      params['search'] = this.search;
    }
    if (this.startDate) {
      params['startDate'] = this.startDate;
    }
    if (this.endDate) {
      params['endDate'] = this.endDate;
    }
    if (this.sortBy) {
      params['sortBy'] = this.sortBy;
      params['sortDirection'] = this.sortDirection;
    }

    this.apiService.getList<OrderListItem>('orders', params).subscribe({
      next: (response) => {
        this.orders = response.data;
        this.totalCount = response.totalCount;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load orders. Please try again.';
        this.loading = false;
      }
    });
  }

  loadCustomerLookup(): void {
    this.apiService.getLookup('orders/lookup').subscribe({
      next: (items) => {
        this.customers = items;
      },
      error: () => {}
    });
  }

  loadProductLookup(): void {
    this.apiService.getLookup('stockitems/lookup').subscribe({
      next: (items) => {
        this.products = items;
      },
      error: () => {}
    });
  }

  onSearchChange(term: string): void {
    this.search = term;
    this.page = 1;
    this.loadOrders();
  }

  onCustomerChange(customerIds: number[]): void {
    this.selectedCustomerIds = customerIds;
    this.page = 1;
    this.loadOrders();
  }

  onProductChange(stockItemIds: number[]): void {
    this.selectedStockItemIds = stockItemIds;
    this.page = 1;
    this.loadOrders();
  }

  onStartDateChange(event: Event): void {
    this.startDate = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.loadOrders();
  }

  onEndDateChange(event: Event): void {
    this.endDate = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.loadOrders();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadOrders();
  }

  onSortChange(event: SortEvent): void {
    this.sortBy = event.column;
    this.sortDirection = event.direction;
    this.page = 1;
    this.loadOrders();
  }

  onRowClick(row: OrderListItem): void {
    this.router.navigate([row.orderId], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }
}
