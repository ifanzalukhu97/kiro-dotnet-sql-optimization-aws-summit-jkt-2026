import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { PaginatedResponse } from '../../core/models';
import { ColumnDef } from '../../shared/models/column-def';
import { SortEvent } from '../../shared/components/data-table/data-table.component';

export interface CustomerListItem {
  customerId: number;
  customerName: string;
  orderCount: number;
  lastOrderDate: string | null;
  outstandingBalance: number;
  creditLimit: number | null;
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
  sortBy = '';
  sortDirection = '';

  responseTime: number | null = null;
  requestFailed = false;
  errorMessage: string | null = null;

  search = '';

  exportFn = () => {
    const params: Record<string, any> = { page: 1, pageSize: 10000 };
    return this.apiService.getList<CustomerListItem>('customers', params).pipe(map(r => r.data));
  };

  constructor(
    private apiService: ApiService,
    private timingService: TimingService,
    private router: Router,
    private route: ActivatedRoute
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

    this.apiService.getList<CustomerListItem>('customers', {
      page: this.page,
      pageSize: this.pageSize,
      ...(this.search ? { search: this.search } : {}),
      ...(this.sortBy ? { sortBy: this.sortBy, sortDirection: this.sortDirection } : {})
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

  onSearchChange(term: string): void {
    this.search = term;
    this.page = 1;
    this.loadCustomers();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadCustomers();
  }

  onSortChange(event: SortEvent): void {
    this.sortBy = event.column;
    this.sortDirection = event.direction;
    this.page = 1;
    this.loadCustomers();
  }

  onRowClick(row: CustomerListItem): void {
    this.router.navigate([row.customerId], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }
}
