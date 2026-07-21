import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';

interface WarehouseDetail {
  stockItemTransactionId: number;
  stockItemName: string;
  transactionDate: string;
  quantity: number;
  quantityOnHand: number;
  reorderLevel: number;
  targetStockLevel: number;
}

@Component({
  selector: 'app-warehouse-detail',
  template: `
    <div class="page-container">
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">&larr; Back to list</button>
        <app-response-time-badge [timeMs]="responseTime" [error]="requestFailed"></app-response-time-badge>
      </div>
      <div *ngIf="loading" class="loading">Loading...</div>
      <div *ngIf="detail" class="detail-content">
        <h1>Stock Transaction #{{ detail.stockItemTransactionId }}</h1>
        <div class="detail-info">
          <div class="detail-field"><span class="label">Stock Item:</span><span class="value">{{ detail.stockItemName }}</span></div>
          <div class="detail-field"><span class="label">Date:</span><span class="value">{{ detail.transactionDate | date:'mediumDate' }}</span></div>
          <div class="detail-field"><span class="label">Quantity:</span><span class="value">{{ detail.quantity }}</span></div>
        </div>
        <div class="detail-info">
          <div class="detail-field"><span class="label">Quantity On Hand:</span><span class="value">{{ detail.quantityOnHand }}</span></div>
          <div class="detail-field"><span class="label">Reorder Level:</span><span class="value">{{ detail.reorderLevel }}</span></div>
          <div class="detail-field"><span class="label">Target Stock Level:</span><span class="value">{{ detail.targetStockLevel }}</span></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .back-btn { background: #2a2a2a; border: 1px solid #3a3a3a; color: #aaff00; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; }
    .back-btn:hover { background: #3a3a3a; }
    .loading { color: #b0b0b0; font-size: 16px; }
    h1 { color: #aaff00; font-size: 24px; margin-bottom: 16px; }
    .detail-info { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 20px; }
    .detail-field .label { color: #b0b0b0; margin-right: 8px; font-size: 14px; }
    .detail-field .value { color: #ffffff; font-size: 14px; }
  `]
})
export class WarehouseDetailComponent implements OnInit {
  detail: WarehouseDetail | null = null;
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
    this.apiService.getDetail<WarehouseDetail>('warehouse', id).subscribe({
      next: (data) => { this.detail = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  goBack(): void {
    this.router.navigate(['..'], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }
}
