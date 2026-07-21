import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { SuppliersComponent } from './suppliers.component';
import { SupplierDetailComponent } from './supplier-detail.component';

const routes: Routes = [
  { path: '', component: SuppliersComponent },
  { path: ':id', component: SupplierDetailComponent }
];

@NgModule({
  declarations: [SuppliersComponent, SupplierDetailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class SuppliersModule { }
