import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem } from '../../core/models/lookup-item';
import { ColumnDef } from '../../shared/models/column-def';

export interface SupplierListItem {
  supplierId: number;
  supplierName: string;
  categoryName: string;
  purchaseOrderCount: number;
  stockItemCount: number;
}

export interface SupplierDetail {
  supplierId: number;
  supplierName: string;
  categoryName: string;
  recentPurchaseOrders: RecentPurchaseOrder[];
  stockItems: StockItemLookup[];
}

export interface RecentPurchaseOrder {
  purchaseOrderId: number;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  isOrderFinalized: boolean;
  lineCount: number;
}

export interface StockItemLookup {
  id: number;
  name: string;
}

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.scss']
})
export class SuppliersComponent implements OnInit {
  suppliers: SupplierListItem[] = [];
  categories: LookupItem[] = [];
  selectedSupplier: SupplierDetail | null = null;

  columns: ColumnDef[] = [
    { key: 'supplierName', header: 'Supplier Name', sortable: true },
    { key: 'categoryName', header: 'Category', sortable: true },
    { key: 'purchaseOrderCount', header: 'Purchase Orders', sortable: true, format: 'number' },
    { key: 'stockItemCount', header: 'Stock Items', sortable: true, format: 'number' }
  ];

  page = 1;
  pageSize = 20;
  totalCount = 0;
  loading = false;

  responseTime: number | null = null;
  requestFailed = false;
  errorMessage: string | null = null;
  detailLoading = false;

  private categoryId: number | null = null;

  constructor(
    private apiService: ApiService,
    private timingService: TimingService
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadCategoryLookup();

    this.timingService.responseTime$.subscribe(time => {
      this.responseTime = time;
    });
    this.timingService.requestFailed$.subscribe(failed => {
      this.requestFailed = failed;
    });
  }

  loadSuppliers(): void {
    this.loading = true;
    this.errorMessage = null;

    const params: Record<string, any> = {
      page: this.page,
      pageSize: this.pageSize
    };

    if (this.categoryId) {
      params['categoryId'] = this.categoryId;
    }

    this.apiService.getList<SupplierListItem>('suppliers', params).subscribe({
      next: (response) => {
        this.suppliers = response.data;
        this.totalCount = response.totalCount;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load suppliers. Please try again.';
        this.loading = false;
      }
    });
  }

  loadCategoryLookup(): void {
    this.apiService.getLookup('suppliers/lookup').subscribe({
      next: (items) => {
        this.categories = items;
      },
      error: () => {
        // Silently handle lookup failure
      }
    });
  }

  onCategoryChange(categoryId: number | null): void {
    this.categoryId = categoryId;
    this.page = 1;
    this.closeDetail();
    this.loadSuppliers();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.closeDetail();
    this.loadSuppliers();
  }

  onRowClick(row: SupplierListItem): void {
    this.loadSupplierDetail(row.supplierId);
  }

  loadSupplierDetail(supplierId: number): void {
    this.detailLoading = true;
    this.selectedSupplier = null;

    this.apiService.getDetail<SupplierDetail>('suppliers', supplierId).subscribe({
      next: (detail) => {
        this.selectedSupplier = detail;
        this.detailLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load supplier detail.';
        this.detailLoading = false;
      }
    });
  }

  closeDetail(): void {
    this.selectedSupplier = null;
  }
}
