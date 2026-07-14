import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PurchaseOrdersComponent } from './purchase-orders.component';

const routes: Routes = [
  { path: '', component: PurchaseOrdersComponent }
];

@NgModule({
  declarations: [PurchaseOrdersComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class PurchaseOrdersModule { }
