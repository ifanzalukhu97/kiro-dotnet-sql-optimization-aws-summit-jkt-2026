import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { InvoicesComponent } from './invoices.component';
import { InvoiceDetailComponent } from './invoice-detail.component';

const routes: Routes = [
  { path: '', component: InvoicesComponent },
  { path: ':id', component: InvoiceDetailComponent }
];

@NgModule({
  declarations: [InvoicesComponent, InvoiceDetailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class InvoicesModule { }
