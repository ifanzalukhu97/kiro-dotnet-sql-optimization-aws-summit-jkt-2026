import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { DeliveriesComponent } from './deliveries.component';
import { DeliveryDetailComponent } from './delivery-detail.component';

const routes: Routes = [
  { path: '', component: DeliveriesComponent },
  { path: ':id', component: DeliveryDetailComponent }
];

@NgModule({
  declarations: [DeliveriesComponent, DeliveryDetailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class DeliveriesModule { }
