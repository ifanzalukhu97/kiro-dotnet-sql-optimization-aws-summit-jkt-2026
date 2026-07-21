import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem, PaginatedResponse } from '../../core/models';
import { ColumnDef } from '../../shared/models/column-def';
import { SortEvent } from '../../shared/components/data-table/data-table.component';

export interface InvoiceListItem {
  invoiceId: number;
  customerName: string;
  invoiceDate: string;
  lineCount: number;
  totalAmount: number;
  totalDryItems: number;
  totalChillerItems: number;
}

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss']
})
export class InvoicesComponent implements OnInit, OnDestroy {
  columns: ColumnDef[] = [
    { key: 'invoiceId', header: 'Invoice ID', sortable: true, format: 'id' },
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
  sortBy = '';
  sortDirection = '';

  customers: LookupItem[] = [];

  selectedCustomerIds: number[] = [];
  search = '';
  startDate: string = '';
  endDate: string = '';

  exportFn = () => {
    const params: Record<string, any> = { page: 1, export: 'true' };
    if (this.selectedCustomerIds.length) params['customerId'] = this.selectedCustomerIds.join(',');
    if (this.startDate) params['startDate'] = this.startDate;
    if (this.endDate) params['endDate'] = this.endDate;
    return this.apiService.getList<InvoiceListItem>('invoices', params).pipe(map(r => r.data));
  };

  responseTime: number | null = null;
  requestFailed = false;
  errorMessage: string | null = null;

  private subscriptions = new Subscription();

  constructor(
    private apiService: ApiService,
    private timingService: TimingService,
    private router: Router,
    private route: ActivatedRoute
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

    if (this.selectedCustomerIds.length) {
      params['customerId'] = this.selectedCustomerIds.join(',');
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

  onRowClick(row: InvoiceListItem): void {
    this.router.navigate([row.invoiceId], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }
}
