import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PaymentsComponent } from './payments.component';
import { PaymentDetailComponent } from './payment-detail.component';

const routes: Routes = [
  { path: '', component: PaymentsComponent },
  { path: ':id', component: PaymentDetailComponent }
];

@NgModule({
  declarations: [PaymentsComponent, PaymentDetailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class PaymentsModule { }
