import { Component, Input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { TotalRevenue } from '../../models/advanced-report.models';
import { CHART_COLORS } from '../../chart-config';

@Component({
  selector: 'app-revenue-doughnut',
  template: `
    <div class="doughnut-wrapper" *ngIf="data">
      <div class="chart-container">
        <canvas baseChart
          [data]="chartData"
          [options]="chartOptions"
          type="doughnut">
        </canvas>
        <div class="center-overlay">
          <span class="total-label">Total</span>
          <span class="total-value">{{ data.totalRevenue | currency:'USD':'symbol':'1.0-0' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .doughnut-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .chart-container {
      position: relative;
      width: 100%;
      max-width: 220px;
    }

    .center-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      display: flex;
      flex-direction: column;
      pointer-events: none;
    }

    .total-label {
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .total-value {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }
  `]
})
export class RevenueDoughnutComponent {
  @Input() set data(value: TotalRevenue | null) {
    this._data = value;
    if (value) {
      this.updateChart(value);
    }
  }
  get data(): TotalRevenue | null {
    return this._data;
  }

  private _data: TotalRevenue | null = null;

  chartData: ChartData<'doughnut'> = {
    labels: ['Invoice Revenue', 'Order Revenue'],
    datasets: [{
      data: [],
      backgroundColor: [CHART_COLORS[0], CHART_COLORS[1]],
      borderWidth: 0
    }]
  };

  chartOptions: ChartOptions<'doughnut'> = {
    cutout: '70%',
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed || 0;
            return `${ctx.label}: $${value.toLocaleString()}`;
          }
        }
      }
    }
  };

  private updateChart(value: TotalRevenue): void {
    this.chartData = {
      ...this.chartData,
      datasets: [{
        ...this.chartData.datasets[0],
        data: [value.invoiceRevenue, value.orderRevenue]
      }]
    };
  }
}
