import { Component, Input, OnChanges } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { CHART_COLORS } from '../../chart-config';

@Component({
  selector: 'app-pie-chart',
  template: `
    <div class="chart-container">
      <canvas baseChart
        [type]="'pie'"
        [data]="chartData"
        [options]="chartOptions">
      </canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class PieChartComponent implements OnChanges {
  @Input() labels: string[] = [];
  @Input() values: number[] = [];
  @Input() formatType: 'currency' | 'number' = 'currency';

  chartData: ChartData<'pie'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'pie'> = {};

  ngOnChanges(): void {
    this.chartData = {
      labels: this.labels,
      datasets: [{
        data: this.values,
        backgroundColor: CHART_COLORS.slice(0, this.values.length),
        borderWidth: 0
      }]
    };

    this.chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#aaa', padding: 12 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = ctx.raw as number;
              const label = ctx.label || '';
              return `${label}: ${this.formatValue(value)}`;
            }
          }
        }
      }
    };
  }

  private formatValue(value: number): string {
    if (this.formatType === 'currency') {
      return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return value.toLocaleString('en-US');
  }
}
