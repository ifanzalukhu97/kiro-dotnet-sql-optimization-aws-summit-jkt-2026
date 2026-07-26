import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { SalesTrend } from '../../models/advanced-report.models';
import { CHART_COLORS, CHART_COLORS_TRANSPARENT } from '../../chart-config';

@Component({
  selector: 'app-sales-trend-chart',
  template: `
    <div class="chart-wrapper" *ngIf="data?.length">
      <canvas baseChart
        [data]="chartData"
        [options]="chartOptions"
        type="line">
      </canvas>
    </div>
  `,
  styles: [`
    .chart-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 220px;
    }
  `]
})
export class SalesTrendChartComponent implements OnChanges {
  @Input() data: SalesTrend[] = [];

  chartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y ?? 0;
            if (ctx.datasetIndex === 0) {
              return `Revenue: $${val.toLocaleString()}`;
            }
            return `Orders: ${val.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Revenue' },
        ticks: {
          callback: (value) => `$${Number(value).toLocaleString()}`
        }
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'Orders' },
        grid: { drawOnChartArea: false }
      }
    },
    elements: {
      line: { tension: 0.3 }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data?.length) {
      this.chartData = {
        labels: this.data.map(d => d.periodLabel),
        datasets: [
          {
            label: 'Revenue',
            data: this.data.map(d => d.revenue),
            borderColor: CHART_COLORS[0],
            backgroundColor: CHART_COLORS_TRANSPARENT[0],
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Order Count',
            data: this.data.map(d => d.orderCount),
            borderColor: CHART_COLORS[1],
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            fill: false,
            yAxisID: 'y1'
          }
        ]
      };
    }
  }
}
