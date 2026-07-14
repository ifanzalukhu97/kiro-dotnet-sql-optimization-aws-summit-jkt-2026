import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem, PaginatedResponse } from '../../core/models';
import { ColumnDef } from '../../shared/models/column-def';

export interface InvoiceListItem {
  invoiceId: number;
  customerName: string;
  invoiceDate: string;
  lineCount: number;
  totalAmount: number;
  totalDryItems: number;
  totalChillerItems: number;
}

export interface InvoiceLineItem {
  invoiceLineId: number;
  stockItemId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  extendedPrice: number;
}

export interface InvoiceDetail {
  invoiceId: number;
  customerName: string;
  invoiceDate: string;
  totalDryItems: number;
  totalChillerItems: number;
  lines: InvoiceLineItem[];
}

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss']
})
export class InvoicesComponent implements OnInit, OnDestroy {
  columns: ColumnDef[] = [
    { key: 'invoiceId', header: 'Invoice ID', sortable: true, format: 'number' },
    { key: 'customerName', header: 'Customer', sortable: true },
    { key: 'invoiceDate', header: 'Invoice Date', sortable: true, format: 'date' },
    { key: 'lineCount', header: 'Lines', sortable: true, format: 'number' },
    { key: 'totalAmount', header: 'Total Amount', sortable: true, format: 'currency' },
    { key: 'totalDryItems', header: 'Dry Items', sortable: true, format: 'number' },
    { key: 'totalChillerItems', header: 'Chiller Items', sortable: true, format: 'number' }
  ];

  data: InvoiceListItem[] = [];
  loading = false;
  page = 1;
  pageSize = 20;
  totalCount = 0;

  customers: LookupItem[] = [];

  selectedCustomerId: number | null = null;
  startDate: string = '';
  endDate: string = '';

  responseTime: number | null = null;
  requestFailed = false;
  errorMessage: string | null = null;

  selectedInvoice: InvoiceDetail | null = null;

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
    this.apiService.getLookup('orders/lookup').subscribe({
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
    if (this.startDate) {
      params['startDate'] = this.startDate;
    }
    if (this.endDate) {
      params['endDate'] = this.endDate;
    }

    this.apiService.getList<InvoiceListItem>('invoices', params).subscribe({
      next: (response: PaginatedResponse<InvoiceListItem>) => {
        this.data = response.data;
        this.totalCount = response.totalCount;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load invoices. Please try again.';
      }
    });
  }

  onCustomerChange(customerId: number | null): void {
    this.selectedCustomerId = customerId;
    this.page = 1;
    this.closeDetail();
    this.loadData();
  }

  onStartDateChange(event: Event): void {
    this.startDate = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.closeDetail();
    this.loadData();
  }

  onEndDateChange(event: Event): void {
    this.endDate = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.closeDetail();
    this.loadData();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.closeDetail();
    this.loadData();
  }

  onRowClick(row: InvoiceListItem): void {
    this.loadInvoiceDetail(row.invoiceId);
  }

  loadInvoiceDetail(invoiceId: number): void {
    this.apiService.getDetail<InvoiceDetail>('invoices', invoiceId).subscribe({
      next: (detail) => {
        this.selectedInvoice = detail;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load invoice detail.';
      }
    });
  }

  closeDetail(): void {
    this.selectedInvoice = null;
  }
}
