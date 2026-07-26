import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { StockLevel } from '../../models/advanced-report.models';
import { CHART_COLORS } from '../../chart-config';

@Component({
  selector: 'app-stock-bar-chart',
  template: `
    <div class="chart-container" *ngIf="chartData.datasets.length">
      <canvas baseChart
        [data]="chartData"
        [options]="chartOptions"
        type="bar">
      </canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 300px;
    }
  `]
})
export class StockBarChartComponent implements OnChanges {
  @Input() data: StockLevel[] = [];
  @Input() mode: 'low' | 'high' = 'low';

  chartData: ChartData<'bar'> = { labels: [], datasets: [] };

  chartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    },
    scales: {
      x: { grid: { color: '#3a3a3a' } },
      y: { grid: { color: '#3a3a3a' } }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['mode']) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    if (!this.data || !this.data.length) {
      this.chartData = { labels: [], datasets: [] };
      return;
    }

    const labels = this.data.map(d =>
      d.stockItemName.length > 20 ? d.stockItemName.substring(0, 20) + '…' : d.stockItemName
    );

    if (this.mode === 'low') {
      const bgColors = this.data.map(d =>
        d.quantityOnHand <= d.reorderLevel ? '#ff6b6b' : CHART_COLORS[0]
      );
      this.chartData = {
        labels,
        datasets: [
          {
            label: 'Qty on Hand',
            data: this.data.map(d => d.quantityOnHand),
            backgroundColor: bgColors
          },
          {
            label: 'Reorder Level',
            data: this.data.map(d => d.reorderLevel),
            backgroundColor: '#3a3a3a',
            borderColor: '#888',
            borderWidth: 2
          }
        ]
      };
    } else {
      this.chartData = {
        labels,
        datasets: [
          {
            label: 'Qty on Hand',
            data: this.data.map(d => d.quantityOnHand),
            backgroundColor: CHART_COLORS[0]
          },
          {
            label: 'Target Stock Level',
            data: this.data.map(d => d.targetStockLevel),
            backgroundColor: '#3a3a3a',
            borderColor: '#888',
            borderWidth: 2
          }
        ]
      };
    }
  }
}
