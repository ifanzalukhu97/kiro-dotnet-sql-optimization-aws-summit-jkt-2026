import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { OrdersComponent } from './orders.component';
import { OrderDetailComponent } from './order-detail.component';

const routes: Routes = [
  { path: '', component: OrdersComponent },
  { path: ':id', component: OrderDetailComponent }
];

@NgModule({
  declarations: [OrdersComponent, OrderDetailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class OrdersModule { }
