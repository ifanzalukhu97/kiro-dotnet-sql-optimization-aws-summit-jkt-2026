import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem, PaginatedResponse } from '../../core/models';
import { ColumnDef } from '../../shared/models/column-def';
import { SortEvent } from '../../shared/components/data-table/data-table.component';

export interface DeliveryListItem {
  invoiceId: number;
  customerName: string;
  driverName: string;
  invoiceDate: string;
  lineCount: number;
  totalAmount: number;
}

@Component({
  selector: 'app-deliveries',
  templateUrl: './deliveries.component.html',
  styleUrls: ['./deliveries.component.scss']
})
export class DeliveriesComponent implements OnInit, OnDestroy {
  columns: ColumnDef[] = [
    { key: 'invoiceId', header: 'Invoice ID', sortable: true, format: 'id' },
    { key: 'customerName', header: 'Customer', sortable: true },
    { key: 'driverName', header: 'Driver', sortable: true },
    { key: 'invoiceDate', header: 'Invoice Date', sortable: true, format: 'date' },
    { key: 'lineCount', header: 'Lines', sortable: true, format: 'number' },
    { key: 'totalAmount', header: 'Total Amount', sortable: true, format: 'currency' }
  ];

  data: DeliveryListItem[] = [];
  loading = false;
  page = 1;
  pageSize = 20;
  totalCount = 0;
  sortBy = '';
  sortDirection = '';

  drivers: LookupItem[] = [];

  selectedDriverIds: number[] = [];
  search = '';
  startDate: string = '';
  endDate: string = '';

  exportFn = () => {
    const params: Record<string, any> = { page: 1, pageSize: 10000 };
    if (this.selectedDriverIds.length) params['driverId'] = this.selectedDriverIds.join(',');
    if (this.startDate) params['startDate'] = this.startDate;
    if (this.endDate) params['endDate'] = this.endDate;
    return this.apiService.getList<DeliveryListItem>('delivery', params).pipe(map(r => r.data));
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
    this.apiService.getLookup('delivery/lookup').subscribe({
      next: (items) => this.drivers = items,
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

    if (this.selectedDriverIds.length) {
      params['driverId'] = this.selectedDriverIds.join(',');
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

    this.apiService.getList<DeliveryListItem>('delivery', params).subscribe({
      next: (response: PaginatedResponse<DeliveryListItem>) => {
        this.data = response.data;
        this.totalCount = response.totalCount;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load deliveries. Please try again.';
      }
    });
  }

  onSearchChange(term: string): void {
    this.search = term;
    this.page = 1;
    this.loadData();
  }

  onDriverChange(driverIds: number[]): void {
    this.selectedDriverIds = driverIds;
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

  onRowClick(row: DeliveryListItem): void {
    this.router.navigate([row.invoiceId], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }
}
