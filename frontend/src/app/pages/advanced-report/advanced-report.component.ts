import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AdvancedReportService } from './advanced-report.service';
import {
  TotalRevenue,
  TopCustomer,
  TopSalesman,
  TopProduct,
  CustomerActivity,
  SalesTrend,
  StockLevel,
  TopOutstanding,
  DormantCustomer,
  TopStockGroup,
  TopSupplier,
  TopDriver
} from './models/advanced-report.models';

interface CardState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  time: number | null;
}

@Component({
  selector: 'app-advanced-report',
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Advanced Report</h1>
      </div>

      <div class="card-grid">
        <!-- Total Revenue -->
        <app-report-card
          title="Total Revenue"
          [loading]="totalRevenue.loading"
          [error]="totalRevenue.error"
          [responseTime]="totalRevenue.time">
          <div class="revenue-content" *ngIf="totalRevenue.data">
            <div class="big-number">{{ formatCurrency(totalRevenue.data.totalRevenue) }}</div>
            <div class="revenue-breakdown">
              <div class="breakdown-item">
                <span class="breakdown-label">Invoice Revenue</span>
                <span class="breakdown-value">{{ formatCurrency(totalRevenue.data.invoiceRevenue) }}</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">Order Revenue</span>
                <span class="breakdown-value">{{ formatCurrency(totalRevenue.data.orderRevenue) }}</span>
              </div>
            </div>
          </div>
        </app-report-card>

        <!-- Top Customers -->
        <app-report-card
          title="Top 10 Customers"
          [loading]="topCustomers.loading"
          [error]="topCustomers.error"
          [responseTime]="topCustomers.time">
          <div class="ranking-list" *ngIf="topCustomers.data">
            <div class="ranking-item" *ngFor="let item of topCustomers.data; let i = index">
              <span class="rank">{{ i + 1 }}</span>
              <span class="name">{{ item.customerName }}</span>
              <span class="metric">{{ formatCurrency(item.totalRevenue) }}</span>
            </div>
          </div>
        </app-report-card>

        <!-- Top Salesman -->
        <app-report-card
          title="Top 10 Salesman"
          [loading]="topSalesman.loading"
          [error]="topSalesman.error"
          [responseTime]="topSalesman.time">
          <div class="ranking-list" *ngIf="topSalesman.data">
            <div class="ranking-item" *ngFor="let item of topSalesman.data; let i = index">
              <span class="rank">{{ i + 1 }}</span>
              <span class="name">{{ item.fullName }}</span>
              <span class="metric">{{ formatCurrency(item.totalRevenue) }}</span>
            </div>
          </div>
        </app-report-card>

        <!-- Top Products -->
        <app-report-card
          title="Top 10 Products"
          [loading]="topProducts.loading"
          [error]="topProducts.error"
          [responseTime]="topProducts.time">
          <div class="ranking-list" *ngIf="topProducts.data">
            <div class="ranking-item" *ngFor="let item of topProducts.data; let i = index">
              <span class="rank">{{ i + 1 }}</span>
              <span class="name">{{ item.stockItemName }}</span>
              <span class="metric">{{ formatCurrency(item.totalRevenue) }}</span>
            </div>
          </div>
        </app-report-card>

        <!-- Customer Activity -->
        <app-report-card
          title="Customer Activity"
          [loading]="customerActivity.loading"
          [error]="customerActivity.error"
          [responseTime]="customerActivity.time">
          <div class="activity-content" *ngIf="customerActivity.data">
            <div class="activity-stat">
              <span class="stat-value">{{ customerActivity.data.totalCustomers }}</span>
              <span class="stat-label">Total</span>
            </div>
            <div class="activity-stat">
              <span class="stat-value accent">{{ customerActivity.data.activeCustomers }}</span>
              <span class="stat-label">Active (90d)</span>
            </div>
            <div class="activity-stat">
              <span class="stat-value">{{ customerActivity.data.inactiveCustomers }}</span>
              <span class="stat-label">Inactive</span>
            </div>
            <div class="activity-percentage">
              <div class="percentage-bar">
                <div class="percentage-fill" [style.width.%]="customerActivity.data.activePercentage"></div>
              </div>
              <span class="percentage-text">{{ customerActivity.data.activePercentage }}% active</span>
            </div>
          </div>
        </app-report-card>

        <!-- Sales Trend -->
        <app-report-card
          title="Sales Trend"
          [loading]="salesTrend.loading"
          [error]="salesTrend.error"
          [responseTime]="salesTrend.time">
          <div class="trend-content" *ngIf="salesTrend.data">
            <div class="period-selector">
              <button
                *ngFor="let p of periods"
                class="period-btn"
                [class.active]="selectedPeriod === p"
                (click)="onPeriodChange(p)">
                {{ p }}
              </button>
            </div>
            <div class="trend-list">
              <div class="trend-item" *ngFor="let item of salesTrend.data">
                <span class="trend-label">{{ item.periodLabel }}</span>
                <span class="trend-revenue">{{ formatCurrency(item.revenue) }}</span>
                <span class="trend-orders">{{ item.orderCount }} orders</span>
              </div>
            </div>
          </div>
        </app-report-card>

        <!-- Low Stock -->
        <app-report-card
          title="Low Stock Items"
          [loading]="lowStock.loading"
          [error]="lowStock.error"
          [responseTime]="lowStock.time">
          <div class="stock-list" *ngIf="lowStock.data">
            <div class="stock-item" *ngFor="let item of lowStock.data"
                 [class.critical]="item.quantityOnHand <= item.reorderLevel">
              <span class="stock-name">{{ item.stockItemName }}</span>
              <span class="stock-qty">{{ item.quantityOnHand }} / {{ item.targetStockLevel }}</span>
            </div>
          </div>
        </app-report-card>

        <!-- High Stock -->
        <app-report-card
          title="High Stock Items"
          [loading]="highStock.loading"
          [error]="highStock.error"
          [responseTime]="highStock.time">
          <div class="stock-list" *ngIf="highStock.data">
            <div class="stock-item" *ngFor="let item of highStock.data">
              <span class="stock-name">{{ item.stockItemName }}</span>
              <span class="stock-qty">{{ item.quantityOnHand }} / {{ item.targetStockLevel }}</span>
            </div>
          </div>
        </app-report-card>

        <!-- Top Outstanding -->
        <app-report-card
          title="Top Outstanding Balances"
          [loading]="topOutstanding.loading"
          [error]="topOutstanding.error"
          [responseTime]="topOutstanding.time">
          <div class="ranking-list" *ngIf="topOutstanding.data">
            <div class="ranking-item" *ngFor="let item of topOutstanding.data; let i = index">
              <span class="rank">{{ i + 1 }}</span>
              <span class="name">{{ item.customerName }}</span>
              <span class="metric">{{ formatCurrency(item.outstandingBalance) }}</span>
            </div>
          </div>
        </app-report-card>

        <!-- Dormant Customers -->
        <app-report-card
          title="Dormant Customers"
          [loading]="dormantCustomers.loading"
          [error]="dormantCustomers.error"
          [responseTime]="dormantCustomers.time">
          <div class="ranking-list" *ngIf="dormantCustomers.data">
            <div class="ranking-item" *ngFor="let item of dormantCustomers.data; let i = index">
              <span class="rank">{{ i + 1 }}</span>
              <span class="name">{{ item.customerName }}</span>
              <span class="metric">{{ item.daysSinceLastOrder }}d ago</span>
            </div>
          </div>
        </app-report-card>

        <!-- Top Stock Groups -->
        <app-report-card
          title="Top Stock Groups"
          [loading]="topStockGroups.loading"
          [error]="topStockGroups.error"
          [responseTime]="topStockGroups.time">
          <div class="ranking-list" *ngIf="topStockGroups.data">
            <div class="ranking-item" *ngFor="let item of topStockGroups.data; let i = index">
              <span class="rank">{{ i + 1 }}</span>
              <span class="name">{{ item.stockGroupName }}</span>
              <span class="metric">{{ formatCurrency(item.totalRevenue) }}</span>
            </div>
          </div>
        </app-report-card>

        <!-- Top Suppliers -->
        <app-report-card
          title="Top Suppliers"
          [loading]="topSuppliers.loading"
          [error]="topSuppliers.error"
          [responseTime]="topSuppliers.time">
          <div class="ranking-list" *ngIf="topSuppliers.data">
            <div class="ranking-item" *ngFor="let item of topSuppliers.data; let i = index">
              <span class="rank">{{ i + 1 }}</span>
              <span class="name">{{ item.supplierName }}</span>
              <span class="metric">{{ formatCurrency(item.totalRevenue) }}</span>
            </div>
          </div>
        </app-report-card>

        <!-- Top Drivers -->
        <app-report-card
          title="Top Drivers"
          [loading]="topDrivers.loading"
          [error]="topDrivers.error"
          [responseTime]="topDrivers.time">
          <div class="ranking-list" *ngIf="topDrivers.data">
            <div class="ranking-item" *ngFor="let item of topDrivers.data; let i = index">
              <span class="rank">{{ i + 1 }}</span>
              <span class="name">{{ item.fullName }}</span>
              <span class="metric">{{ item.deliveryCount }} deliveries</span>
            </div>
          </div>
        </app-report-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;

      h1 {
        margin: 0;
        color: #ffffff;
        font-size: 28px;
        font-weight: 600;
      }
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    @media (max-width: 1200px) {
      .card-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .card-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Revenue card */
    .revenue-content .big-number {
      font-size: 28px;
      font-weight: 700;
      color: #aaff00;
      margin-bottom: 12px;
    }

    .revenue-breakdown {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .breakdown-item {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
    }

    .breakdown-label {
      color: #888;
    }

    .breakdown-value {
      color: #ddd;
    }

    /* Ranking list */
    .ranking-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 280px;
      overflow-y: auto;
    }

    .ranking-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 0;
      font-size: 13px;
    }

    .rank {
      width: 20px;
      text-align: center;
      color: #aaff00;
      font-weight: 600;
    }

    .name {
      flex: 1;
      color: #ddd;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .metric {
      color: #aaa;
      font-size: 12px;
      white-space: nowrap;
    }

    /* Activity card */
    .activity-content {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .activity-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
    }

    .stat-value.accent {
      color: #aaff00;
    }

    .stat-label {
      font-size: 11px;
      color: #888;
      margin-top: 2px;
    }

    .activity-percentage {
      width: 100%;
      margin-top: 8px;
    }

    .percentage-bar {
      height: 6px;
      background: #3a3a3a;
      border-radius: 3px;
      overflow: hidden;
    }

    .percentage-fill {
      height: 100%;
      background: #aaff00;
      border-radius: 3px;
      transition: width 0.3s;
    }

    .percentage-text {
      font-size: 12px;
      color: #aaa;
      margin-top: 4px;
      display: block;
    }

    /* Period selector */
    .period-selector {
      display: flex;
      gap: 4px;
      margin-bottom: 12px;
    }

    .period-btn {
      background: #3a3a3a;
      border: none;
      color: #aaa;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      text-transform: capitalize;
    }

    .period-btn.active {
      background: #aaff00;
      color: #121212;
      font-weight: 600;
    }

    .period-btn:hover:not(.active) {
      background: #444;
      color: #fff;
    }

    /* Trend list */
    .trend-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 220px;
      overflow-y: auto;
    }

    .trend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
    }

    .trend-label {
      width: 80px;
      color: #aaa;
    }

    .trend-revenue {
      flex: 1;
      color: #ddd;
    }

    .trend-orders {
      color: #888;
      font-size: 12px;
    }

    /* Stock list */
    .stock-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 280px;
      overflow-y: auto;
    }

    .stock-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 13px;
    }

    .stock-item.critical {
      .stock-name {
        color: #ff6b6b;
      }
    }

    .stock-name {
      color: #ddd;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 8px;
    }

    .stock-qty {
      color: #aaa;
      font-size: 12px;
      white-space: nowrap;
    }
  `]
})
export class AdvancedReportComponent implements OnInit {
  totalRevenue: CardState<TotalRevenue> = { data: null, loading: true, error: null, time: null };
  topCustomers: CardState<TopCustomer[]> = { data: null, loading: true, error: null, time: null };
  topSalesman: CardState<TopSalesman[]> = { data: null, loading: true, error: null, time: null };
  topProducts: CardState<TopProduct[]> = { data: null, loading: true, error: null, time: null };
  customerActivity: CardState<CustomerActivity> = { data: null, loading: true, error: null, time: null };
  salesTrend: CardState<SalesTrend[]> = { data: null, loading: true, error: null, time: null };
  lowStock: CardState<StockLevel[]> = { data: null, loading: true, error: null, time: null };
  highStock: CardState<StockLevel[]> = { data: null, loading: true, error: null, time: null };
  topOutstanding: CardState<TopOutstanding[]> = { data: null, loading: true, error: null, time: null };
  dormantCustomers: CardState<DormantCustomer[]> = { data: null, loading: true, error: null, time: null };
  topStockGroups: CardState<TopStockGroup[]> = { data: null, loading: true, error: null, time: null };
  topSuppliers: CardState<TopSupplier[]> = { data: null, loading: true, error: null, time: null };
  topDrivers: CardState<TopDriver[]> = { data: null, loading: true, error: null, time: null };

  periods = ['week', 'month', 'year'];
  selectedPeriod = 'month';

  constructor(private reportService: AdvancedReportService) {}

  ngOnInit(): void {
    this.loadAllReports();
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    this.loadReport('salesTrend', () => this.reportService.getSalesTrend(period));
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  private loadAllReports(): void {
    this.loadReport('totalRevenue', () => this.reportService.getTotalRevenue());
    this.loadReport('topCustomers', () => this.reportService.getTopCustomers());
    this.loadReport('topSalesman', () => this.reportService.getTopSalesman());
    this.loadReport('topProducts', () => this.reportService.getTopProducts());
    this.loadReport('customerActivity', () => this.reportService.getCustomerActivity());
    this.loadReport('salesTrend', () => this.reportService.getSalesTrend(this.selectedPeriod));
    this.loadReport('lowStock', () => this.reportService.getLowStock());
    this.loadReport('highStock', () => this.reportService.getHighStock());
    this.loadReport('topOutstanding', () => this.reportService.getTopOutstanding());
    this.loadReport('dormantCustomers', () => this.reportService.getDormantCustomers());
    this.loadReport('topStockGroups', () => this.reportService.getTopStockGroups());
    this.loadReport('topSuppliers', () => this.reportService.getTopSuppliers());
    this.loadReport('topDrivers', () => this.reportService.getTopDrivers());
  }

  private loadReport<T>(key: keyof this, fetchFn: () => Observable<T>): void {
    const start = performance.now();
    (this[key] as CardState<T>) = { data: null, loading: true, error: null, time: null };
    fetchFn().subscribe({
      next: (data) => {
        (this[key] as CardState<T>) = { data, loading: false, error: null, time: Math.round(performance.now() - start) };
      },
      error: () => {
        (this[key] as CardState<T>) = { data: null, loading: false, error: 'Failed to load', time: null };
      }
    });
  }
}
