import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem } from '../../core/models/lookup-item';
import { ColumnDef } from '../../shared/models/column-def';
import { SortEvent } from '../../shared/components/data-table/data-table.component';

export interface SupplierListItem {
  supplierId: number;
  supplierName: string;
  categoryName: string;
  purchaseOrderCount: number;
  stockItemCount: number;
}

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.scss']
})
export class SuppliersComponent implements OnInit {
  suppliers: SupplierListItem[] = [];
  categories: LookupItem[] = [];

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
  sortBy = '';
  sortDirection = '';

  responseTime: number | null = null;
  requestFailed = false;
  errorMessage: string | null = null;

  search = '';

  private selectedCategoryIds: number[] = [];

  exportFn = () => {
    const params: Record<string, any> = { page: 1, export: 'true' };
    if (this.selectedCategoryIds.length) params['categoryId'] = this.selectedCategoryIds.join(',');
    return this.apiService.getList<SupplierListItem>('suppliers', params).pipe(map(r => r.data));
  };

  constructor(
    private apiService: ApiService,
    private timingService: TimingService,
    private router: Router,
    private route: ActivatedRoute
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

    if (this.selectedCategoryIds.length) {
      params['categoryId'] = this.selectedCategoryIds.join(',');
    }
    if (this.search) {
      params['search'] = this.search;
    }
    if (this.sortBy) {
      params['sortBy'] = this.sortBy;
      params['sortDirection'] = this.sortDirection;
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
      error: () => {}
    });
  }

  onSearchChange(term: string): void {
    this.search = term;
    this.page = 1;
    this.loadSuppliers();
  }

  onCategoryChange(categoryIds: number[]): void {
    this.selectedCategoryIds = categoryIds;
    this.page = 1;
    this.loadSuppliers();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadSuppliers();
  }

  onSortChange(event: SortEvent): void {
    this.sortBy = event.column;
    this.sortDirection = event.direction;
    this.page = 1;
    this.loadSuppliers();
  }

  onRowClick(row: SupplierListItem): void {
    this.router.navigate([row.supplierId], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }
}
