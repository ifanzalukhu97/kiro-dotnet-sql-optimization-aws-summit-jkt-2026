import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem, PaginatedResponse } from '../../core/models';
import { ColumnDef } from '../../shared/models/column-def';

export interface DeliveryListItem {
  invoiceId: number;
  customerName: string;
  driverName: string;
  invoiceDate: string;
  lineCount: number;
  totalAmount: number;
}

export interface DeliveryLineItem {
  invoiceLineId: number;
  stockItemId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  extendedPrice: number;
}

export interface DeliveryDetail {
  invoiceId: number;
  customerName: string;
  driverName: string;
  invoiceDate: string;
  totalDryItems: number;
  totalChillerItems: number;
  lines: DeliveryLineItem[];
}

@Component({
  selector: 'app-deliveries',
  templateUrl: './deliveries.component.html',
  styleUrls: ['./deliveries.component.scss']
})
export class DeliveriesComponent implements OnInit, OnDestroy {
  columns: ColumnDef[] = [
    { key: 'invoiceId', header: 'Invoice ID', sortable: true, format: 'number' },
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

  drivers: LookupItem[] = [];

  selectedDriverId: number | null = null;
  startDate: string = '';
  endDate: string = '';

  responseTime: number | null = null;
  requestFailed = false;
  errorMessage: string | null = null;

  selectedDelivery: DeliveryDetail | null = null;

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

    if (this.selectedDriverId) {
      params['driverId'] = this.selectedDriverId;
    }
    if (this.startDate) {
      params['startDate'] = this.startDate;
    }
    if (this.endDate) {
      params['endDate'] = this.endDate;
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

  onDriverChange(driverId: number | null): void {
    this.selectedDriverId = driverId;
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

  onRowClick(row: DeliveryListItem): void {
    this.loadDeliveryDetail(row.invoiceId);
  }

  loadDeliveryDetail(invoiceId: number): void {
    this.apiService.getDetail<DeliveryDetail>('delivery', invoiceId).subscribe({
      next: (detail) => {
        this.selectedDelivery = detail;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load delivery detail.';
      }
    });
  }

  closeDetail(): void {
    this.selectedDelivery = null;
  }
}
