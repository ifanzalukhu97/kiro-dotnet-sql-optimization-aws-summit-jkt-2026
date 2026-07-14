import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';
import { LookupItem } from '../../core/models/lookup-item';
import { ColumnDef } from '../../shared/models/column-def';

export interface PurchaseOrderListItem {
  purchaseOrderId: number;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  isOrderFinalized: boolean;
  lineCount: number;
}

export interface PurchaseOrderLineItem {
  purchaseOrderLineId: number;
  stockItemId: number;
  stockItemName: string;
  orderedOuters: number;
  receivedOuters: number;
  expectedUnitPricePerOuter: number;
}

export interface PurchaseOrderDetail {
  purchaseOrderId: number;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  isOrderFinalized: boolean;
  lines: PurchaseOrderLineItem[];
}

@Component({
  selector: 'app-purchase-orders',
  templateUrl: './purchase-orders.component.html',
  styleUrls: ['./purchase-orders.component.scss']
})
export class PurchaseOrdersComponent implements OnInit {
  purchaseOrders: PurchaseOrderListItem[] = [];
  suppliers: LookupItem[] = [];
  selectedPurchaseOrder: PurchaseOrderDetail | null = null;

  columns: ColumnDef[] = [
    { key: 'purchaseOrderId', header: 'PO ID', sortable: true, format: 'number' },
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

  responseTime: number | null = null;
  requestFailed = false;
  errorMessage: string | null = null;
  detailLoading = false;

  private supplierId: number | null = null;

  constructor(
    private apiService: ApiService,
    private timingService: TimingService
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

    if (this.supplierId) {
      params['supplierId'] = this.supplierId;
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
      error: () => {
        // Silently handle lookup failure
      }
    });
  }

  onSupplierChange(supplierId: number | null): void {
    this.supplierId = supplierId;
    this.page = 1;
    this.closeDetail();
    this.loadPurchaseOrders();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.closeDetail();
    this.loadPurchaseOrders();
  }

  onRowClick(row: PurchaseOrderListItem): void {
    this.loadPurchaseOrderDetail(row.purchaseOrderId);
  }

  loadPurchaseOrderDetail(purchaseOrderId: number): void {
    this.detailLoading = true;
    this.selectedPurchaseOrder = null;

    this.apiService.getDetail<PurchaseOrderDetail>('purchaseorders', purchaseOrderId).subscribe({
      next: (detail) => {
        this.selectedPurchaseOrder = detail;
        this.detailLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load purchase order detail.';
        this.detailLoading = false;
      }
    });
  }

  closeDetail(): void {
    this.selectedPurchaseOrder = null;
  }
}
