import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { SalesReportComponent } from './sales-report.component';

const routes: Routes = [
  { path: '', component: SalesReportComponent }
];

@NgModule({
  declarations: [SalesReportComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class SalesReportModule { }
