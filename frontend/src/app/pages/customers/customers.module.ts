import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { CustomersComponent } from './customers.component';
import { CustomerDetailComponent } from './customer-detail.component';

const routes: Routes = [
  { path: '', component: CustomersComponent },
  { path: ':id', component: CustomerDetailComponent }
];

@NgModule({
  declarations: [CustomersComponent, CustomerDetailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class CustomersModule { }
