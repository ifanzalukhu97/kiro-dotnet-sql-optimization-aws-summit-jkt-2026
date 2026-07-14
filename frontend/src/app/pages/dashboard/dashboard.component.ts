import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TimingService } from '@core/services/timing.service';
import { environment } from '@environments/environment';
import { Chart, BarController, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip);

export interface DashboardKpi {
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  totalStockItems: number;
  averageOrderValue: number;
  topCustomerByRevenue: string;
  recentOrderCount: number;
  pendingDeliveries: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('kpiChart') chartCanvas!: ElementRef<HTMLCanvasElement>;

  kpiData: DashboardKpi | null = null;
  loading = true;
  error: string | null = null;

  responseTime: number | null = null;
  requestFailed = false;

  private chart: Chart | null = null;
  private chartReady = false;
  private pendingChartData: DashboardKpi | null = null;

  constructor(
    private http: HttpClient,
    private timingService: TimingService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.chartReady = true;
    if (this.pendingChartData) {
      this.buildChart(this.pendingChartData);
      this.pendingChartData = null;
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    const startTime = performance.now();

    this.http.get<DashboardKpi>(`${environment.apiBaseUrl}/dashboard`).subscribe({
      next: (data) => {
        const elapsed = Math.round(performance.now() - startTime);
        this.kpiData = data;
        this.loading = false;
        this.responseTime = elapsed;
        this.requestFailed = false;
        this.timingService.setLastResponseTime(elapsed);

        if (this.chartReady) {
          this.buildChart(data);
        } else {
          this.pendingChartData = data;
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load dashboard data. Please check that the backend is running.';
        this.requestFailed = true;
        this.responseTime = null;
        this.timingService.setRequestFailed();
      }
    });
  }

  private buildChart(data: DashboardKpi): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Orders', 'Customers', 'Stock Items', 'Recent Orders', 'Pending'],
        datasets: [{
          data: [
            data.totalOrders,
            data.totalCustomers,
            data.totalStockItems,
            data.recentOrderCount,
            data.pendingDeliveries
          ],
          backgroundColor: [
            'rgba(170, 255, 0, 0.7)',
            'rgba(170, 255, 0, 0.55)',
            'rgba(170, 255, 0, 0.4)',
            'rgba(170, 255, 0, 0.6)',
            'rgba(170, 255, 0, 0.3)'
          ],
          borderColor: '#aaff00',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#2a2a2a',
            titleColor: '#ffffff',
            bodyColor: '#b0b0b0',
            borderColor: '#3a3a3a',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: { color: '#b0b0b0' },
            grid: { color: '#3a3a3a' }
          },
          y: {
            ticks: { color: '#b0b0b0' },
            grid: { color: '#3a3a3a' }
          }
        }
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }
}
