import { Chart } from 'chart.js';

export const CHART_COLORS = [
  '#aaff00', '#00d4ff', '#ff6b6b', '#ffa726', '#ab47bc',
  '#26c6da', '#7e57c2', '#66bb6a', '#ef5350', '#42a5f5'
];

export const CHART_COLORS_TRANSPARENT = CHART_COLORS.map(c => c + '33');

export function applyChartDefaults(): void {
  Chart.defaults.color = '#aaa';
  Chart.defaults.borderColor = '#3a3a3a';
  Chart.defaults.plugins.tooltip.backgroundColor = '#2a2a2a';
  Chart.defaults.plugins.tooltip.titleColor = '#fff';
  Chart.defaults.plugins.tooltip.bodyColor = '#ddd';
  Chart.defaults.plugins.tooltip.borderColor = '#3a3a3a';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.legend.labels.color = '#aaa';
}
