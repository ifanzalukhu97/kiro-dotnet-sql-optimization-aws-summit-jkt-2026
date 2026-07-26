import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { TopDriver } from '../../models/advanced-report.models';
import { CHART_COLORS } from '../../chart-config';

@Component({
  selector: 'app-driver-chart',
  template: `
    <div class="chart-wrapper" *ngIf="data?.length">
      <canvas baseChart
        [data]="chartData"
        [options]="chartOptions"
        type="bar">
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
export class DriverChartComponent implements OnChanges {
  @Input() data: TopDriver[] = [];

  chartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  chartOptions: ChartOptions<'bar'> = {
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
            if (ctx.datasetIndex === 1) {
              return `Revenue: $${val.toLocaleString()}`;
            }
            return `Deliveries: ${val.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Deliveries' }
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'Revenue' },
        grid: { drawOnChartArea: false },
        ticks: {
          callback: (value) => `$${Number(value).toLocaleString()}`
        }
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data?.length) {
      this.chartData = {
        labels: this.data.map(d => d.fullName.length > 20 ? d.fullName.substring(0, 20) + '…' : d.fullName),
        datasets: [
          {
            label: 'Deliveries',
            data: this.data.map(d => d.deliveryCount),
            backgroundColor: CHART_COLORS[0],
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Revenue',
            data: this.data.map(d => d.totalRevenueDelivered),
            borderColor: CHART_COLORS[1],
            backgroundColor: CHART_COLORS[1],
            yAxisID: 'y1',
            pointRadius: 4
          } as any
        ]
      };
    }
  }
}
