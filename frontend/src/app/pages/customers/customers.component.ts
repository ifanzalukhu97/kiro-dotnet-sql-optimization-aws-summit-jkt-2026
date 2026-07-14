import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { PaginatedResponse } from '../../core/models';
import { ColumnDef } from '../../shared/models/column-def';

export interface CustomerListItem {
  customerId: number;
  customerName: string;
  orderCount: number;
  lastOrderDate: string | null;
  outstandingBalance: number;
  creditLimit: number | null;
}

export interface CustomerDetail {
  customerId: number;
  customerName: string;
  creditLimit: number | null;
  orderCount: number;
  invoiceCount: number;
  outstandingBalance: number;
  recentOrders: RecentOrder[];
  recentTransactions: RecentTransaction[];
}

export interface RecentOrder {
  orderId: number;
  customerName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  lineCount: number;
  totalAmount: number;
}

export interface RecentTransaction {
  customerTransactionId: number;
  transactionDate: string;
  transactionAmount: number;
  outstandingBalance: number;
}

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {
  customers: CustomerListItem[] = [];
  columns: ColumnDef[] = [
    { key: 'customerName', header: 'Customer Name', sortable: true },
    { key: 'orderCount', header: 'Order Count', sortable: true, format: 'number' },
    { key: 'lastOrderDate', header: 'Last Order Date', sortable: true, format: 'date' },
    { key: 'outstandingBalance', header: 'Outstanding Balance', sortable: true, format: 'currency' },
    { key: 'creditLimit', header: 'Credit Limit', sortable: true, format: 'currency' }
  ];

  page = 1;
  pageSize = 20;
  totalCount = 0;
  loading = false;

  responseTime: number | null = null;
  requestFailed = false;
  errorMessage: string | null = null;

  selectedCustomer: CustomerDetail | null = null;
  detailLoading = false;

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

  constructor(
    private apiService: ApiService,
    private timingService: TimingService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();

    this.timingService.responseTime$.subscribe(time => {
      this.responseTime = time;
    });
    this.timingService.requestFailed$.subscribe(failed => {
      this.requestFailed = failed;
    });
  }

  loadCustomers(): void {
    this.loading = true;
    this.errorMessage = null;

    this.apiService.getList<CustomerListItem>('api/customers', {
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: (response: PaginatedResponse<CustomerListItem>) => {
        this.customers = response.data;
        this.totalCount = response.totalCount;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load customers. Please try again.';
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadCustomers();
  }

  onRowClick(row: CustomerListItem): void {
    this.detailLoading = true;
    this.selectedCustomer = null;

    this.apiService.getDetail<CustomerDetail>('api/customers', row.customerId).subscribe({
      next: (detail) => {
        this.selectedCustomer = detail;
        this.detailLoading = false;
      },
      error: () => {
        this.detailLoading = false;
      }
    });
  }

  closeDetail(): void {
    this.selectedCustomer = null;
  }
}
