import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PurchaseOrdersComponent } from './purchase-orders.component';
import { PurchaseOrderDetailComponent } from './purchase-order-detail.component';

const routes: Routes = [
  { path: '', component: PurchaseOrdersComponent },
  { path: ':id', component: PurchaseOrderDetailComponent }
];

@NgModule({
  declarations: [PurchaseOrdersComponent, PurchaseOrderDetailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class PurchaseOrdersModule { }
