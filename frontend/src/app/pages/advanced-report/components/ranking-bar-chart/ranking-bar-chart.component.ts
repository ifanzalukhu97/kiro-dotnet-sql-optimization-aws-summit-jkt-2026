import { Component, Input, OnChanges } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { CHART_COLORS } from '../../chart-config';

@Component({
  selector: 'app-ranking-bar-chart',
  template: `
    <div class="chart-container">
      <canvas baseChart
        [type]="'bar'"
        [data]="chartData"
        [options]="chartOptions">
      </canvas>
    </div>
    <div class="overflow-list" *ngIf="overflowItems.length > 0">
      <div class="overflow-item" *ngFor="let item of overflowItems; let i = index">
        <span class="overflow-rank">{{ i + 6 }}</span>
        <span class="overflow-name">{{ item.label }}</span>
        <span class="overflow-value">{{ item.formattedValue }}</span>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      height: 200px;
    }

    .overflow-list {
      margin-top: 12px;
      border-top: 1px solid #3a3a3a;
      padding-top: 8px;
    }

    .overflow-item {
      display: flex;
      align-items: center;
      padding: 4px 0;
      font-size: 12px;
      color: #aaa;
    }

    .overflow-rank {
      width: 20px;
      color: #666;
      font-weight: 600;
    }

    .overflow-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .overflow-value {
      margin-left: 8px;
      color: #ddd;
      font-weight: 500;
    }
  `]
})
export class RankingBarChartComponent implements OnChanges {
  @Input() labels: string[] = [];
  @Input() values: number[] = [];
  @Input() formatType: 'currency' | 'number' | 'days' = 'currency';
  @Input() barColor: string = '#aaff00';
  @Input() colorGradient = false;

  chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'bar'> = {};
  overflowItems: { label: string; formattedValue: string }[] = [];

  ngOnChanges(): void {
    const top5Labels = this.labels.slice(0, 5).map(l => this.truncateLabel(l));
    const top5Values = this.values.slice(0, 5);

    const bgColors = this.colorGradient
      ? this.buildGradientColors(top5Values.length)
      : Array(top5Values.length).fill(this.barColor);

    this.chartData = {
      labels: top5Labels,
      datasets: [{
        data: top5Values,
        backgroundColor: bgColors,
        borderWidth: 0
      }]
    };

    const formatType = this.formatType;
    this.chartOptions = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => this.formatValue(ctx.raw as number)
          }
        }
      },
      scales: {
        x: { grid: { color: '#3a3a3a' }, ticks: { color: '#aaa' } },
        y: { grid: { display: false }, ticks: { color: '#ddd' } }
      }
    };

    // Build overflow list for items beyond top 5
    this.overflowItems = this.labels.slice(5).map((label, i) => ({
      label,
      formattedValue: this.formatValue(this.values[i + 5])
    }));
  }

  private truncateLabel(label: string): string {
    return label.length > 20 ? label.substring(0, 20) + '…' : label;
  }

  private formatValue(value: number): string {
    switch (this.formatType) {
      case 'currency':
        return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      case 'days':
        return value + 'd ago';
      default:
        return value.toLocaleString('en-US');
    }
  }

  private buildGradientColors(count: number): string[] {
    // Gradient from yellow (#ffa726) to red (#ff6b6b)
    if (count <= 1) return ['#ffa726'];
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      return this.interpolateColor('#ffa726', '#ff6b6b', t);
    });
  }

  private interpolateColor(from: string, to: string, t: number): string {
    const f = this.hexToRgb(from);
    const toRgb = this.hexToRgb(to);
    const r = Math.round(f.r + (toRgb.r - f.r) * t);
    const g = Math.round(f.g + (toRgb.g - f.g) * t);
    const b = Math.round(f.b + (toRgb.b - f.b) * t);
    return `rgb(${r},${g},${b})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16)
    };
  }
}
