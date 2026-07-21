import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem, PaginatedResponse } from '../../core/models';
import { ColumnDef } from '../../shared/models/column-def';
import { SortEvent } from '../../shared/components/data-table/data-table.component';

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
  sortBy = '';
  sortDirection = '';

  customers: LookupItem[] = [];
  products: LookupItem[] = [];

  selectedCustomerIds: number[] = [];
  selectedProductIds: number[] = [];
  search = '';
  startDate: string = '';
  endDate: string = '';

  exportFn = () => {
    const params: Record<string, any> = { page: 1, pageSize: 10000 };
    if (this.selectedCustomerIds.length) params['customerId'] = this.selectedCustomerIds.join(',');
    if (this.selectedProductIds.length) params['stockItemId'] = this.selectedProductIds.join(',');
    if (this.startDate) params['startDate'] = this.startDate;
    if (this.endDate) params['endDate'] = this.endDate;
    return this.apiService.getList<SalesReportItem>('salesreport', params).pipe(map(r => r.data));
  };

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

    if (this.search) {
      params['search'] = this.search;
    }
    if (this.selectedCustomerIds.length) {
      params['customerId'] = this.selectedCustomerIds.join(',');
    }
    if (this.selectedProductIds.length) {
      params['stockItemId'] = this.selectedProductIds.join(',');
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

  onSearchChange(term: string): void {
    this.search = term;
    this.page = 1;
    this.loadData();
  }

  onCustomerChange(customerIds: number[]): void {
    this.selectedCustomerIds = customerIds;
    this.page = 1;
    this.loadData();
  }

  onProductChange(productIds: number[]): void {
    this.selectedProductIds = productIds;
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

  onSortChange(event: SortEvent): void {
    this.sortBy = event.column;
    this.sortDirection = event.direction;
    this.page = 1;
    this.loadData();
  }
}
