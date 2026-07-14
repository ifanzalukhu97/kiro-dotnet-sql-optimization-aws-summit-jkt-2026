import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem, PaginatedResponse } from '../../core/models';
import { ColumnDef } from '../../shared/models/column-def';

interface ProductSearchItem {
  stockItemId: number;
  stockItemName: string;
  supplierName: string;
  stockGroupName: string;
  unitPrice: number;
  recommendedRetailPrice: number;
  taxRate: number;
}

@Component({
  selector: 'app-product-search',
  templateUrl: './product-search.component.html',
  styleUrls: ['./product-search.component.scss']
})
export class ProductSearchComponent implements OnInit {
  columns: ColumnDef[] = [
    { key: 'stockItemName', header: 'Stock Item', sortable: true },
    { key: 'supplierName', header: 'Supplier', sortable: true },
    { key: 'stockGroupName', header: 'Stock Group', sortable: true },
    { key: 'unitPrice', header: 'Unit Price', sortable: true, format: 'currency' },
    { key: 'recommendedRetailPrice', header: 'Retail Price', sortable: true, format: 'currency' },
    { key: 'taxRate', header: 'Tax Rate', sortable: true, format: 'number' }
  ];

  data: ProductSearchItem[] = [];
  loading = false;
  page = 1;
  pageSize = 20;
  totalCount = 0;

  suppliers: LookupItem[] = [];
  stockGroups: LookupItem[] = [];

  selectedSupplierId: number | null = null;
  selectedStockGroupId: number | null = null;
  minPrice: string = '';
  maxPrice: string = '';

  responseTime: number | null = null;
  requestFailed = false;
  errorMessage: string | null = null;

  constructor(
    private apiService: ApiService,
    private timingService: TimingService
  ) {}

  ngOnInit(): void {
    this.loadLookups();
    this.loadData();

    this.timingService.responseTime$.subscribe(time => {
      this.responseTime = time;
    });

    this.timingService.requestFailed$.subscribe(failed => {
      this.requestFailed = failed;
    });
  }

  loadLookups(): void {
    this.apiService.getLookup('api/productsearch/suppliers-lookup').subscribe({
      next: (items) => this.suppliers = items,
      error: () => {}
    });

    this.apiService.getLookup('api/productsearch/stockgroups-lookup').subscribe({
      next: (items) => this.stockGroups = items,
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

    if (this.selectedSupplierId) {
      params['supplierId'] = this.selectedSupplierId;
    }
    if (this.selectedStockGroupId) {
      params['stockGroupId'] = this.selectedStockGroupId;
    }
    if (this.minPrice) {
      params['minPrice'] = this.minPrice;
    }
    if (this.maxPrice) {
      params['maxPrice'] = this.maxPrice;
    }

    this.apiService.getList<ProductSearchItem>('api/productsearch', params).subscribe({
      next: (response: PaginatedResponse<ProductSearchItem>) => {
        this.data = response.data;
        this.totalCount = response.totalCount;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load product search data. Please try again.';
      }
    });
  }

  onSupplierChange(supplierId: number | null): void {
    this.selectedSupplierId = supplierId;
    this.page = 1;
    this.loadData();
  }

  onStockGroupChange(stockGroupId: number | null): void {
    this.selectedStockGroupId = stockGroupId;
    this.page = 1;
    this.loadData();
  }

  onMinPriceChange(event: Event): void {
    this.minPrice = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.loadData();
  }

  onMaxPriceChange(event: Event): void {
    this.maxPrice = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.loadData();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadData();
  }
}
