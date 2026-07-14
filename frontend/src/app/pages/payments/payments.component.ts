import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem, PaginatedResponse } from '../../core/models';
import { ColumnDef } from '../../shared/models/column-def';

export interface PaymentListItem {
  customerTransactionId: number;
  customerName: string;
  transactionDate: string;
  transactionAmount: number;
  outstandingBalance: number;
}

export interface PaymentDetail {
  customerTransactionId: number;
  customerId: number;
  customerName: string;
  transactionDate: string;
  amountExcludingTax: number;
  taxAmount: number;
  transactionAmount: number;
  outstandingBalance: number;
}

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss']
})
export class PaymentsComponent implements OnInit, OnDestroy {
  columns: ColumnDef[] = [
    { key: 'customerTransactionId', header: 'Transaction ID', sortable: true, format: 'number' },
    { key: 'customerName', header: 'Customer', sortable: true },
    { key: 'transactionDate', header: 'Transaction Date', sortable: true, format: 'date' },
    { key: 'transactionAmount', header: 'Amount', sortable: true, format: 'currency' },
    { key: 'outstandingBalance', header: 'Outstanding Balance', sortable: true, format: 'currency' }
  ];

  data: PaymentListItem[] = [];
  loading = false;
  page = 1;
  pageSize = 20;
  totalCount = 0;

  customers: LookupItem[] = [];

  selectedCustomerId: number | null = null;

  responseTime: number | null = null;
  requestFailed = false;
  errorMessage: string | null = null;

  selectedPayment: PaymentDetail | null = null;

  private subscriptions = new Subscription();

  constructor(
    private apiService: ApiService,
    private timingService: TimingService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.timingService.responseTime$.subscribe(time => this.responseTime = time)
    );
    this.subscriptions.add(
      this.timingService.requestFailed$.subscribe(failed => this.requestFailed = failed)
    );

    this.loadLookups();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadLookups(): void {
    this.apiService.getLookup('payment/lookup').subscribe({
      next: (items) => this.customers = items,
      error: () => {}
    });
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = null;

    const params: Record<string, any> = {
      page: this.page,
      pageSize: this.pageSize
    };

    if (this.selectedCustomerId) {
      params['customerId'] = this.selectedCustomerId;
    }

    this.apiService.getList<PaymentListItem>('payment', params).subscribe({
      next: (response: PaginatedResponse<PaymentListItem>) => {
        this.data = response.data;
        this.totalCount = response.totalCount;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load payments. Please try again.';
      }
    });
  }

  onCustomerChange(customerId: number | null): void {
    this.selectedCustomerId = customerId;
    this.page = 1;
    this.closeDetail();
    this.loadData();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.closeDetail();
    this.loadData();
  }

  onRowClick(row: PaymentListItem): void {
    this.loadPaymentDetail(row.customerTransactionId);
  }

  loadPaymentDetail(transactionId: number): void {
    this.apiService.getDetail<PaymentDetail>('payment', transactionId).subscribe({
      next: (detail) => {
        this.selectedPayment = detail;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load payment detail.';
      }
    });
  }

  closeDetail(): void {
    this.selectedPayment = null;
  }
}
