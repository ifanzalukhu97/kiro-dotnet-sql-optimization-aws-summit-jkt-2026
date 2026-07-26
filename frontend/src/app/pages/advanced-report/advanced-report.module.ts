import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { SharedModule } from '@shared/shared.module';
import { AdvancedReportComponent } from './advanced-report.component';
import { ReportCardComponent } from './components/report-card/report-card.component';
import { RankingBarChartComponent } from './components/ranking-bar-chart/ranking-bar-chart.component';
import { StockBarChartComponent } from './components/stock-bar-chart/stock-bar-chart.component';
import { ActivityDoughnutComponent } from './components/activity-doughnut/activity-doughnut.component';
import { PieChartComponent } from './components/pie-chart/pie-chart.component';
import { RevenueDoughnutComponent } from './components/revenue-doughnut/revenue-doughnut.component';
import { SalesTrendChartComponent } from './components/sales-trend-chart/sales-trend-chart.component';
import { DriverChartComponent } from './components/driver-chart/driver-chart.component';
import { applyChartDefaults } from './chart-config';

applyChartDefaults();

const routes: Routes = [
  { path: '', component: AdvancedReportComponent }
];

@NgModule({
  declarations: [
    AdvancedReportComponent,
    ReportCardComponent,
    RankingBarChartComponent,
    StockBarChartComponent,
    ActivityDoughnutComponent,
    PieChartComponent,
    RevenueDoughnutComponent,
    SalesTrendChartComponent,
    DriverChartComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    NgChartsModule
  ]
})
export class AdvancedReportModule { }
