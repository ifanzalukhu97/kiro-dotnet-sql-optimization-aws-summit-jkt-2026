import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem, PaginatedResponse } from '../../core/models';
import { ColumnDef } from '../../shared/models/column-def';
import { SortEvent } from '../../shared/components/data-table/data-table.component';

export interface PaymentListItem {
  customerTransactionId: number;
  customerName: string;
  transactionDate: string;
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
    { key: 'customerTransactionId', header: 'Transaction ID', sortable: true, format: 'id' },
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
  sortBy = '';
  sortDirection = '';

  customers: LookupItem[] = [];

  selectedCustomerIds: number[] = [];
  search = '';

  exportFn = () => {
    const params: Record<string, any> = { page: 1, pageSize: 10000 };
    if (this.selectedCustomerIds.length) params['customerId'] = this.selectedCustomerIds.join(',');
    return this.apiService.getList<PaymentListItem>('payment', params).pipe(map(r => r.data));
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

    if (this.selectedCustomerIds.length) {
      params['customerId'] = this.selectedCustomerIds.join(',');
    }
    if (this.search) {
      params['search'] = this.search;
    }
    if (this.sortBy) {
      params['sortBy'] = this.sortBy;
      params['sortDirection'] = this.sortDirection;
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

  onRowClick(row: PaymentListItem): void {
    this.router.navigate([row.customerTransactionId], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }
}
