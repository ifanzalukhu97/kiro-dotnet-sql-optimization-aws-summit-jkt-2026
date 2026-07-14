import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem, PaginatedResponse } from '../../core/models';
import { ColumnDef } from '../../shared/models/column-def';

export interface SalesReportItem {
  invoiceLineId: number;
  invoiceDate: string;
  customerName: string;
  stockItemName: string;
  quantity: number;
  unitPrice: number;
  extendedPrice: number;
}

@Component({
  selector: 'app-sales-report',
  templateUrl: './sales-report.component.html',
  styleUrls: ['./sales-report.component.scss']
})
export class SalesReportComponent implements OnInit, OnDestroy {
  columns: ColumnDef[] = [
    { key: 'invoiceDate', header: 'Invoice Date', sortable: true, format: 'date' },
    { key: 'customerName', header: 'Customer', sortable: true },
    { key: 'stockItemName', header: 'Product', sortable: true },
    { key: 'quantity', header: 'Quantity', sortable: true, format: 'number' },
    { key: 'unitPrice', header: 'Unit Price', sortable: true, format: 'currency' },
    { key: 'extendedPrice', header: 'Extended Price', sortable: true, format: 'currency' }
  ];

  data: SalesReportItem[] = [];
  loading = false;
  page = 1;
  pageSize = 20;
  totalCount = 0;

  customers: LookupItem[] = [];
  products: LookupItem[] = [];

  selectedCustomerId: number | null = null;
  selectedProductId: number | null = null;
  startDate: string = '';
  endDate: string = '';

  responseTime: number | null = null;
  requestFailed = false;
  errorMessage: string | null = null;

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

    this.apiService.getLookup('stockitems/lookup').subscribe({
      next: (items) => this.products = items,
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
    if (this.selectedProductId) {
      params['stockItemId'] = this.selectedProductId;
    }
    if (this.startDate) {
      params['startDate'] = this.startDate;
    }
    if (this.endDate) {
      params['endDate'] = this.endDate;
    }

    this.apiService.getList<SalesReportItem>('salesreport', params).subscribe({
      next: (response: PaginatedResponse<SalesReportItem>) => {
        this.data = response.data;
        this.totalCount = response.totalCount;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to load sales report data. Please try again.';
      }
    });
  }

  onCustomerChange(customerId: number | null): void {
    this.selectedCustomerId = customerId;
    this.page = 1;
    this.loadData();
  }

  onProductChange(productId: number | null): void {
    this.selectedProductId = productId;
    this.page = 1;
    this.loadData();
  }

  onStartDateChange(event: Event): void {
    this.startDate = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.loadData();
  }

  onEndDateChange(event: Event): void {
    this.endDate = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.loadData();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadData();
  }
}
