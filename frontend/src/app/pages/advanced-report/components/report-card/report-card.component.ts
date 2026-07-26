import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-report-card',
  template: `
    <div class="report-card">
      <div class="card-header">
        <h3 class="card-title">{{ title }}</h3>
        <app-response-time-badge
          [timeMs]="responseTime"
          [error]="!!error">
        </app-response-time-badge>
      </div>
      <div class="card-body">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <span>Loading...</span>
        </div>
        <div *ngIf="!loading && error" class="error-state">
          <span class="error-icon">&#9888;</span>
          <span>{{ error }}</span>
        </div>
        <div *ngIf="!loading && !error" class="content-state">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .report-card {
      background: #2a2a2a;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      min-height: 200px;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .card-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #b0b0b0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      gap: 12px;
      color: #888;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #3a3a3a;
      border-top-color: #aaff00;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ff6b6b;
      font-size: 14px;
    }

    .error-icon {
      font-size: 18px;
    }

    .content-state {
      flex: 1;
    }
  `]
})
export class ReportCardComponent {
  @Input() title = '';
  @Input() loading = true;
  @Input() error: string | null = null;
  @Input() responseTime: number | null = null;
}
