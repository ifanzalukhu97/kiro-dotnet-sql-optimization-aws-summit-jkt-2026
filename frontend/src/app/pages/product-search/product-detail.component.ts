import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';

interface ProductDetail {
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
  selector: 'app-product-detail',
  template: `
    <div class="page-container">
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">&larr; Back to list</button>
        <app-response-time-badge [timeMs]="responseTime" [error]="requestFailed"></app-response-time-badge>
      </div>
      <div *ngIf="loading" class="loading">Loading...</div>
      <div *ngIf="detail" class="detail-content">
        <h1>Product #{{ detail.stockItemId }}</h1>
        <div class="detail-info">
          <div class="detail-field"><span class="label">Name:</span><span class="value">{{ detail.stockItemName }}</span></div>
          <div class="detail-field"><span class="label">Supplier:</span><span class="value">{{ detail.supplierName }}</span></div>
          <div class="detail-field"><span class="label">Unit Price:</span><span class="value">{{ detail.unitPrice | currency }}</span></div>
          <div class="detail-field"><span class="label">Recommended Retail Price:</span><span class="value">{{ detail.recommendedRetailPrice | currency }}</span></div>
          <div class="detail-field"><span class="label">Tax Rate:</span><span class="value">{{ detail.taxRate }}%</span></div>
          <div class="detail-field"><span class="label">Typical Weight:</span><span class="value">{{ detail.typicalWeightPerUnit }} kg</span></div>
          <div class="detail-field"><span class="label">Quantity On Hand:</span><span class="value">{{ detail.quantityOnHand }}</span></div>
          <div class="detail-field"><span class="label">Reorder Level:</span><span class="value">{{ detail.reorderLevel }}</span></div>
          <div class="detail-field"><span class="label">Target Stock Level:</span><span class="value">{{ detail.targetStockLevel }}</span></div>
        </div>
        <h3>Stock Groups</h3>
        <ul class="stock-groups" *ngIf="detail.stockGroups?.length">
          <li *ngFor="let group of detail.stockGroups">{{ group }}</li>
        </ul>
        <p *ngIf="!detail.stockGroups?.length" class="empty">No stock groups.</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .back-btn { background: #2a2a2a; border: 1px solid #3a3a3a; color: #aaff00; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; }
    .back-btn:hover { background: #3a3a3a; }
    .loading { color: #b0b0b0; font-size: 16px; }
    .empty { color: #b0b0b0; font-size: 14px; }
    h1 { color: #aaff00; font-size: 24px; margin-bottom: 16px; }
    h3 { color: #ffffff; margin: 20px 0 12px; font-size: 16px; }
    .detail-info { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 20px; }
    .detail-field .label { color: #b0b0b0; margin-right: 8px; font-size: 14px; }
    .detail-field .value { color: #ffffff; font-size: 14px; }
    .stock-groups { list-style: none; padding: 0; margin: 0; }
    .stock-groups li { color: #ffffff; font-size: 14px; padding: 6px 12px; border-bottom: 1px solid #3a3a3a; }
    .stock-groups li:hover { background: #333333; }
  `]
})
export class ProductDetailComponent implements OnInit {
  detail: ProductDetail | null = null;
  loading = true;
  responseTime: number | null = null;
  requestFailed = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private timingService: TimingService
  ) {}

  ngOnInit(): void {
    this.timingService.responseTime$.subscribe(t => this.responseTime = t);
    this.timingService.requestFailed$.subscribe(f => this.requestFailed = f);
    this.route.params.subscribe(params => {
      this.loadDetail(+params['id']);
    });
  }

  loadDetail(id: number): void {
    this.loading = true;
    this.apiService.getDetail<ProductDetail>('stockitems', id).subscribe({
      next: (data) => { this.detail = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  goBack(): void {
    this.router.navigate(['..'], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }
}
