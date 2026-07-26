import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@shared/shared.module';
import { AdvancedReportComponent } from './advanced-report.component';
import { ReportCardComponent } from './components/report-card/report-card.component';

const routes: Routes = [
  { path: '', component: AdvancedReportComponent }
];

@NgModule({
  declarations: [AdvancedReportComponent, ReportCardComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class AdvancedReportModule { }
