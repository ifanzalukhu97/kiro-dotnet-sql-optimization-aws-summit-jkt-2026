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

      <!-- Revenue Overview -->
      <section class="report-section">
        <h2 class="section-header">Revenue Overview</h2>
        <div class="section-grid revenue-grid">
          <app-report-card
            title="Total Revenue"
            [loading]="totalRevenue.loading"
            [error]="totalRevenue.error"
            [responseTime]="totalRevenue.time">
            <app-revenue-doughnut [data]="totalRevenue.data" *ngIf="totalRevenue.data"></app-revenue-doughnut>
          </app-report-card>

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
              <app-sales-trend-chart [data]="salesTrend.data!" *ngIf="salesTrend.data"></app-sales-trend-chart>
            </div>
          </app-report-card>
        </div>
      </section>

      <!-- Top Performers -->
      <section class="report-section">
        <h2 class="section-header">Top Performers</h2>
        <div class="section-grid three-col">
          <app-report-card
            title="Top 10 Customers"
            [loading]="topCustomers.loading"
            [error]="topCustomers.error"
            [responseTime]="topCustomers.time">
            <app-ranking-bar-chart *ngIf="topCustomers.data" [labels]="getCustomerLabels()" [values]="getCustomerValues()" formatType="currency"></app-ranking-bar-chart>
          </app-report-card>

          <app-report-card
            title="Top 10 Salesman"
            [loading]="topSalesman.loading"
            [error]="topSalesman.error"
            [responseTime]="topSalesman.time">
            <app-ranking-bar-chart *ngIf="topSalesman.data" [labels]="getSalesmanLabels()" [values]="getSalesmanValues()" formatType="currency"></app-ranking-bar-chart>
          </app-report-card>

          <app-report-card
            title="Top 10 Products"
            [loading]="topProducts.loading"
            [error]="topProducts.error"
            [responseTime]="topProducts.time">
            <app-ranking-bar-chart *ngIf="topProducts.data" [labels]="getProductLabels()" [values]="getProductValues()" formatType="currency"></app-ranking-bar-chart>
          </app-report-card>
        </div>
      </section>

      <!-- Customer Insights -->
      <section class="report-section">
        <h2 class="section-header">Customer Insights</h2>
        <div class="section-grid three-col">
          <app-report-card
            title="Customer Activity"
            [loading]="customerActivity.loading"
            [error]="customerActivity.error"
            [responseTime]="customerActivity.time">
            <app-activity-doughnut [data]="customerActivity.data" *ngIf="customerActivity.data"></app-activity-doughnut>
          </app-report-card>

          <app-report-card
            title="Top Outstanding Balances"
            [loading]="topOutstanding.loading"
            [error]="topOutstanding.error"
            [responseTime]="topOutstanding.time">
            <app-ranking-bar-chart *ngIf="topOutstanding.data" [labels]="getOutstandingLabels()" [values]="getOutstandingValues()" formatType="currency"></app-ranking-bar-chart>
          </app-report-card>

          <app-report-card
            title="Dormant Customers"
            [loading]="dormantCustomers.loading"
            [error]="dormantCustomers.error"
            [responseTime]="dormantCustomers.time">
            <app-ranking-bar-chart *ngIf="dormantCustomers.data" [labels]="getDormantLabels()" [values]="getDormantValues()" formatType="days" [colorGradient]="true"></app-ranking-bar-chart>
          </app-report-card>
        </div>
      </section>

      <!-- Inventory -->
      <section class="report-section">
        <h2 class="section-header">Inventory</h2>
        <div class="section-grid two-col">
          <app-report-card
            title="Low Stock Items"
            [loading]="lowStock.loading"
            [error]="lowStock.error"
            [responseTime]="lowStock.time">
            <app-stock-bar-chart [data]="lowStock.data!" [mode]="'low'" *ngIf="lowStock.data"></app-stock-bar-chart>
          </app-report-card>

          <app-report-card
            title="High Stock Items"
            [loading]="highStock.loading"
            [error]="highStock.error"
            [responseTime]="highStock.time">
            <app-stock-bar-chart [data]="highStock.data!" [mode]="'high'" *ngIf="highStock.data"></app-stock-bar-chart>
          </app-report-card>
        </div>
      </section>

      <!-- Categories & Logistics -->
      <section class="report-section">
        <h2 class="section-header">Categories &amp; Logistics</h2>
        <div class="section-grid three-col">
          <app-report-card
            title="Top Stock Groups"
            [loading]="topStockGroups.loading"
            [error]="topStockGroups.error"
            [responseTime]="topStockGroups.time">
            <app-pie-chart *ngIf="topStockGroups.data" [labels]="getStockGroupLabels()" [values]="getStockGroupValues()" formatType="currency"></app-pie-chart>
          </app-report-card>

          <app-report-card
            title="Top Suppliers"
            [loading]="topSuppliers.loading"
            [error]="topSuppliers.error"
            [responseTime]="topSuppliers.time">
            <app-pie-chart *ngIf="topSuppliers.data" [labels]="getSupplierLabels()" [values]="getSupplierValues()" formatType="currency"></app-pie-chart>
          </app-report-card>

          <app-report-card
            title="Top Drivers"
            [loading]="topDrivers.loading"
            [error]="topDrivers.error"
            [responseTime]="topDrivers.time">
            <app-driver-chart [data]="topDrivers.data!" *ngIf="topDrivers.data"></app-driver-chart>
          </app-report-card>
        </div>
      </section>
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

    .report-section {
      margin-bottom: 32px;
    }

    .section-header {
      color: #888;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }

    .section-grid {
      display: grid;
      gap: 16px;
      align-items: stretch;
    }

    .revenue-grid {
      grid-template-columns: 1fr 2fr;
    }

    .three-col {
      grid-template-columns: repeat(3, 1fr);
    }

    .two-col {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 1200px) and (min-width: 769px) {
      .revenue-grid {
        grid-template-columns: 1fr 1fr;
      }

      .three-col {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .section-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Period selector */
    .trend-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

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
  selectedPeriod = 'year';

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

  // Helper methods for chart data mapping
  getCustomerLabels(): string[] { return this.topCustomers.data?.map(c => c.customerName) ?? []; }
  getCustomerValues(): number[] { return this.topCustomers.data?.map(c => c.totalRevenue) ?? []; }
  getSalesmanLabels(): string[] { return this.topSalesman.data?.map(s => s.fullName) ?? []; }
  getSalesmanValues(): number[] { return this.topSalesman.data?.map(s => s.totalRevenue) ?? []; }
  getProductLabels(): string[] { return this.topProducts.data?.map(p => p.stockItemName) ?? []; }
  getProductValues(): number[] { return this.topProducts.data?.map(p => p.totalRevenue) ?? []; }
  getOutstandingLabels(): string[] { return this.topOutstanding.data?.map(o => o.customerName) ?? []; }
  getOutstandingValues(): number[] { return this.topOutstanding.data?.map(o => o.outstandingBalance) ?? []; }
  getDormantLabels(): string[] { return this.dormantCustomers.data?.map(d => d.customerName) ?? []; }
  getDormantValues(): number[] { return this.dormantCustomers.data?.map(d => d.daysSinceLastOrder) ?? []; }
  getStockGroupLabels(): string[] { return this.topStockGroups.data?.map(g => g.stockGroupName) ?? []; }
  getStockGroupValues(): number[] { return this.topStockGroups.data?.map(g => g.totalRevenue) ?? []; }
  getSupplierLabels(): string[] { return this.topSuppliers.data?.map(s => s.supplierName) ?? []; }
  getSupplierValues(): number[] { return this.topSuppliers.data?.map(s => s.totalRevenue) ?? []; }

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
