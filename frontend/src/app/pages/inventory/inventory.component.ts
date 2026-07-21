import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem } from '../../core/models/lookup-item';
import { ColumnDef } from '../../shared/models/column-def';
import { SortEvent } from '../../shared/components/data-table/data-table.component';

export interface StockItemListItem {
  stockItemId: number;
  stockItemName: string;
  supplierName: string;
  unitPrice: number;
  recommendedRetailPrice: number;
  quantityOnHand: number;
}

export interface StockItemDetail {
  stockItemId: number;
  stockItemName: string;
  supplierName: string;
  unitPrice: number;
  recommendedRetailPrice: number;
  taxRate: number;
  typicalWeightPerUnit: number;
  quantityOnHand: number;
  reorderLevel: number;
  targetStockLevel: number;
  stockGroups: string[];
}

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  stockItems: StockItemListItem[] = [];
  suppliers: LookupItem[] = [];
  categories: LookupItem[] = [];
  selectedStockItem: StockItemDetail | null = null;

  columns: ColumnDef[] = [
    { key: 'stockItemName', header: 'Stock Item Name', sortable: true },
    { key: 'supplierName', header: 'Supplier', sortable: true },
    { key: 'unitPrice', header: 'Unit Price', sortable: true, format: 'currency' },
    { key: 'recommendedRetailPrice', header: 'Retail Price', sortable: true, format: 'currency' },
    { key: 'quantityOnHand', header: 'Qty On Hand', sortable: true, format: 'number' }
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
  detailLoading = false;

  search = '';

  private selectedSupplierIds: number[] = [];
  private selectedCategoryIds: number[] = [];

  exportFn = () => {
    const params: Record<string, any> = { page: 1, pageSize: 10000 };
    if (this.selectedSupplierIds.length) params['supplierId'] = this.selectedSupplierIds.join(',');
    return this.apiService.getList<StockItemListItem>('stockitems', params).pipe(map(r => r.data));
  };

  constructor(
    private apiService: ApiService,
    private timingService: TimingService
  ) {}

  ngOnInit(): void {
    this.loadStockItems();
    this.loadSupplierLookup();
    this.loadCategoryLookup();

    this.timingService.responseTime$.subscribe(time => {
      this.responseTime = time;
    });
    this.timingService.requestFailed$.subscribe(failed => {
      this.requestFailed = failed;
    });
  }

  loadStockItems(): void {
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

    this.apiService.getList<StockItemListItem>('stockitems', params).subscribe({
      next: (response) => {
        this.stockItems = response.data;
        this.totalCount = response.totalCount;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load stock items. Please try again.';
        this.loading = false;
      }
    });
  }

  loadSupplierLookup(): void {
    this.apiService.getLookup('productsearch/suppliers-lookup').subscribe({
      next: (items) => {
        this.suppliers = items;
      },
      error: () => {
        // Silently handle lookup failure
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

  onSearchChange(term: string): void {
    this.search = term;
    this.page = 1;
    this.closeDetail();
    this.loadStockItems();
  }

  onSupplierChange(supplierIds: number[]): void {
    this.selectedSupplierIds = supplierIds;
    this.page = 1;
    this.closeDetail();
    this.loadStockItems();
  }

  onCategoryChange(categoryIds: number[]): void {
    this.selectedCategoryIds = categoryIds;
    this.page = 1;
    this.closeDetail();
    this.loadStockItems();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.closeDetail();
    this.loadStockItems();
  }

  onSortChange(event: SortEvent): void {
    this.sortBy = event.column;
    this.sortDirection = event.direction;
    this.page = 1;
    this.closeDetail();
    this.loadStockItems();
  }

  onRowClick(row: StockItemListItem): void {
    this.loadStockItemDetail(row.stockItemId);
  }

  loadStockItemDetail(stockItemId: number): void {
    this.detailLoading = true;
    this.selectedStockItem = null;

    this.apiService.getDetail<StockItemDetail>('stockitems', stockItemId).subscribe({
      next: (detail) => {
        this.selectedStockItem = detail;
        this.detailLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load stock item detail.';
        this.detailLoading = false;
      }
    });
  }

  closeDetail(): void {
    this.selectedStockItem = null;
  }
}
