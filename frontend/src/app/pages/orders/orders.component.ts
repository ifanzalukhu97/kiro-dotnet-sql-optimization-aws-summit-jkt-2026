import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem } from '../../core/models/lookup-item';
import { ColumnDef } from '../../shared/models/column-def';

interface OrderListItem {
  orderId: number;
  customerName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  lineCount: number;
  totalAmount: number;
}

interface OrderLineItem {
  orderLineId: number;
  stockItemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderDetail {
  orderId: number;
  customerName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  lines: OrderLineItem[];
}

@Component({
  selector: 'app-orders',
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Orders</h1>
        <app-response-time-badge
          [timeMs]="responseTime"
          [error]="requestFailed">
        </app-response-time-badge>
      </div>

      <div class="filter-bar">
        <app-dropdown-filter
          [options]="customers"
          placeholder="All Customers"
          label="Customer"
          (selectionChange)="onCustomerChange($event)">
        </app-dropdown-filter>
        <app-dropdown-filter
          [options]="products"
          placeholder="All Products"
          label="Product"
          (selectionChange)="onProductChange($event)">
        </app-dropdown-filter>
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
        (rowClick)="onRowClick($event)">
      </app-data-table>

      <div class="detail-panel" *ngIf="selectedOrder">
        <div class="detail-header">
          <h2>Order #{{ selectedOrder.orderId }}</h2>
          <button class="close-btn" (click)="closeDetail()">&times;</button>
        </div>
        <div class="detail-info">
          <div class="detail-field">
            <span class="label">Customer:</span>
            <span class="value">{{ selectedOrder.customerName }}</span>
          </div>
          <div class="detail-field">
            <span class="label">Order Date:</span>
            <span class="value">{{ selectedOrder.orderDate | date:'mediumDate' }}</span>
          </div>
          <div class="detail-field">
            <span class="label">Expected Delivery:</span>
            <span class="value">{{ selectedOrder.expectedDeliveryDate | date:'mediumDate' }}</span>
          </div>
        </div>
        <div class="detail-lines">
          <h3>Order Lines</h3>
          <table class="lines-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let line of selectedOrder.lines">
                <td>{{ line.stockItemName }}</td>
                <td>{{ line.description }}</td>
                <td>{{ line.quantity }}</td>
                <td>{{ line.unitPrice | currency }}</td>
                <td>{{ line.totalPrice | currency }}</td>
              </tr>
            </tbody>
          </table>
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
      margin-bottom: 20px;
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

    .detail-lines {
      h3 {
        color: #ffffff;
        margin-bottom: 12px;
        font-size: 16px;
      }
    }

    .lines-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 10px 12px;
        text-align: left;
        border-bottom: 1px solid #3a3a3a;
      }

      th {
        color: #b0b0b0;
        font-weight: 500;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      td {
        color: #ffffff;
        font-size: 14px;
      }

      tbody tr:hover {
        background: #333333;
      }
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders: OrderListItem[] = [];
  customers: LookupItem[] = [];
  products: LookupItem[] = [];
  selectedOrder: OrderDetail | null = null;

  columns: ColumnDef[] = [
    { key: 'orderId', header: 'Order ID', sortable: true, format: 'number' },
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

  responseTime: number | null = null;
  requestFailed = false;
  errorMessage: string | null = null;

  private customerId: number | null = null;
  private stockItemId: number | null = null;

  constructor(
    private apiService: ApiService,
    private timingService: TimingService
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

    if (this.customerId) {
      params['customerId'] = this.customerId;
    }
    if (this.stockItemId) {
      params['stockItemId'] = this.stockItemId;
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
      error: () => {
        // Silently handle lookup failure
      }
    });
  }

  loadProductLookup(): void {
    this.apiService.getLookup('stockitems/lookup').subscribe({
      next: (items) => {
        this.products = items;
      },
      error: () => {
        // Silently handle lookup failure
      }
    });
  }

  onCustomerChange(customerId: number | null): void {
    this.customerId = customerId;
    this.page = 1;
    this.closeDetail();
    this.loadOrders();
  }

  onProductChange(stockItemId: number | null): void {
    this.stockItemId = stockItemId;
    this.page = 1;
    this.closeDetail();
    this.loadOrders();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.closeDetail();
    this.loadOrders();
  }

  onRowClick(row: OrderListItem): void {
    this.loadOrderDetail(row.orderId);
  }

  loadOrderDetail(orderId: number): void {
    this.apiService.getDetail<OrderDetail>('orders', orderId).subscribe({
      next: (detail) => {
        this.selectedOrder = detail;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load order detail.';
      }
    });
  }

  closeDetail(): void {
    this.selectedOrder = null;
  }
}
