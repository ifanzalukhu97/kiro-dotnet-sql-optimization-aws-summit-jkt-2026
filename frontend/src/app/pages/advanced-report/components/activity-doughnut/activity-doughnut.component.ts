import { Component, Input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { CustomerActivity } from '../../models/advanced-report.models';
import { CHART_COLORS } from '../../chart-config';

@Component({
  selector: 'app-activity-doughnut',
  template: `
    <div class="activity-doughnut">
      <div class="chart-wrapper">
        <canvas baseChart
          [data]="chartData"
          [options]="chartOptions"
          type="doughnut">
        </canvas>
        <div class="center-overlay">
          <span class="percentage">{{ data?.activePercentage ?? 0 }}%</span>
          <span class="label">Active</span>
        </div>
      </div>
      <div class="stat-line">
        <span class="stat-item">
          <span class="dot active-dot"></span>
          {{ data?.activeCustomers ?? 0 }} active
        </span>
        <span class="stat-item">
          <span class="dot inactive-dot"></span>
          {{ data?.inactiveCustomers ?? 0 }} inactive
        </span>
      </div>
    </div>
  `,
  styles: [`
    .activity-doughnut {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .chart-wrapper {
      position: relative;
      width: 100%;
      max-width: 200px;
    }

    .center-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
    }

    .percentage {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
    }

    .label {
      font-size: 12px;
      color: #aaa;
    }

    .stat-line {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #aaa;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .active-dot {
      background: #aaff00;
    }

    .inactive-dot {
      background: #3a3a3a;
    }
  `]
})
export class ActivityDoughnutComponent {
  @Input() data: CustomerActivity | null = null;

  get chartData(): ChartData<'doughnut'> {
    return {
      labels: ['Active', 'Inactive'],
      datasets: [{
        data: [
          this.data?.activeCustomers ?? 0,
          this.data?.inactiveCustomers ?? 0
        ],
        backgroundColor: [CHART_COLORS[0], '#3a3a3a'],
        borderWidth: 0
      }]
    };
  }

  chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: { display: false }
    }
  };
}
