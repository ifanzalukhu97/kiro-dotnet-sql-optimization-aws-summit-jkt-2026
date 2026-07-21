import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { TimingService } from '../../core/services/timing.service';

interface DeliveryDetail {
  invoiceId: number;
  customerName: string;
  driverName: string;
  invoiceDate: string;
  lines: any[];
}

@Component({
  selector: 'app-delivery-detail',
  template: `
    <div class="page-container">
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">&larr; Back to list</button>
        <app-response-time-badge [timeMs]="responseTime" [error]="requestFailed"></app-response-time-badge>
      </div>
      <div *ngIf="loading" class="loading">Loading...</div>
      <div *ngIf="detail" class="detail-content">
        <h1>Delivery #{{ detail.invoiceId }}</h1>
        <div class="detail-info">
          <div class="detail-field"><span class="label">Customer:</span><span class="value">{{ detail.customerName }}</span></div>
          <div class="detail-field"><span class="label">Driver:</span><span class="value">{{ detail.driverName }}</span></div>
          <div class="detail-field"><span class="label">Invoice Date:</span><span class="value">{{ detail.invoiceDate | date:'mediumDate' }}</span></div>
        </div>
        <h3>Delivery Lines</h3>
        <table class="lines-table" *ngIf="detail.lines?.length">
          <thead><tr><th>Product</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
          <tbody>
            <tr *ngFor="let line of detail.lines">
              <td>{{ line.stockItemName }}</td>
              <td>{{ line.description }}</td>
              <td>{{ line.quantity }}</td>
              <td>{{ line.unitPrice | currency }}</td>
              <td>{{ line.extendedPrice | currency }}</td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!detail.lines?.length" class="empty">No delivery lines.</p>
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
    .lines-table { width: 100%; border-collapse: collapse; }
    .lines-table th, .lines-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #3a3a3a; }
    .lines-table th { color: #b0b0b0; font-weight: 500; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    .lines-table td { color: #ffffff; font-size: 14px; }
    .lines-table tbody tr:hover { background: #333333; }
  `]
})
export class DeliveryDetailComponent implements OnInit {
  detail: DeliveryDetail | null = null;
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
    this.apiService.getDetail<DeliveryDetail>('delivery', id).subscribe({
      next: (data) => { this.detail = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  goBack(): void {
    this.router.navigate(['..'], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }
}
