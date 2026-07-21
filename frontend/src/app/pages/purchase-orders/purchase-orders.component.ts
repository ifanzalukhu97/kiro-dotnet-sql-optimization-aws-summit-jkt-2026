import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem } from '../../core/models/lookup-item';
import { ColumnDef } from '../../shared/models/column-def';
import { SortEvent } from '../../shared/components/data-table/data-table.component';

export interface PurchaseOrderListItem {
  purchaseOrderId: number;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  isOrderFinalized: boolean;
  lineCount: number;
}

@Component({
  selector: 'app-purchase-orders',
  templateUrl: './purchase-orders.component.html',
  styleUrls: ['./purchase-orders.component.scss']
})
export class PurchaseOrdersComponent implements OnInit {
  purchaseOrders: PurchaseOrderListItem[] = [];
  suppliers: LookupItem[] = [];

  columns: ColumnDef[] = [
    { key: 'purchaseOrderId', header: 'PO ID', sortable: true, format: 'id' },
    { key: 'supplierName', header: 'Supplier', sortable: true },
    { key: 'orderDate', header: 'Order Date', sortable: true, format: 'date' },
    { key: 'expectedDeliveryDate', header: 'Expected Delivery', sortable: true, format: 'date' },
    { key: 'isOrderFinalized', header: 'Finalized', sortable: true },
    { key: 'lineCount', header: 'Lines', sortable: true, format: 'number' }
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

  private selectedSupplierIds: number[] = [];

  exportFn = () => {
    const params: Record<string, any> = { page: 1, export: 'true' };
    if (this.selectedSupplierIds.length) params['supplierId'] = this.selectedSupplierIds.join(',');
    return this.apiService.getList<PurchaseOrderListItem>('purchaseorders', params).pipe(map(r => r.data));
  };

  constructor(
    private apiService: ApiService,
    private timingService: TimingService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadPurchaseOrders();
    this.loadSupplierLookup();

    this.timingService.responseTime$.subscribe(time => {
      this.responseTime = time;
    });
    this.timingService.requestFailed$.subscribe(failed => {
      this.requestFailed = failed;
    });
  }

  loadPurchaseOrders(): void {
    this.loading = true;
    this.errorMessage = null;

    const params: Record<string, any> = {
      page: this.page,
      pageSize: this.pageSize
    };

    if (this.selectedSupplierIds.length) {
      params['supplierId'] = this.selectedSupplierIds.join(',');
    }
    if (this.search) {
      params['search'] = this.search;
    }
    if (this.sortBy) {
      params['sortBy'] = this.sortBy;
      params['sortDirection'] = this.sortDirection;
    }

    this.apiService.getList<PurchaseOrderListItem>('purchaseorders', params).subscribe({
      next: (response) => {
        this.purchaseOrders = response.data;
        this.totalCount = response.totalCount;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load purchase orders. Please try again.';
        this.loading = false;
      }
    });
  }

  loadSupplierLookup(): void {
    this.apiService.getLookup('suppliers/lookup').subscribe({
      next: (items) => {
        this.suppliers = items;
      },
      error: () => {}
    });
  }

  onSearchChange(term: string): void {
    this.search = term;
    this.page = 1;
    this.loadPurchaseOrders();
  }

  onSupplierChange(supplierIds: number[]): void {
    this.selectedSupplierIds = supplierIds;
    this.page = 1;
    this.loadPurchaseOrders();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadPurchaseOrders();
  }

  onSortChange(event: SortEvent): void {
    this.sortBy = event.column;
    this.sortDirection = event.direction;
    this.page = 1;
    this.loadPurchaseOrders();
  }

  onRowClick(row: PurchaseOrderListItem): void {
    this.router.navigate([row.purchaseOrderId], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }
}
