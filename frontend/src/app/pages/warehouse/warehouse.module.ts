import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { WarehouseComponent } from './warehouse.component';
import { WarehouseDetailComponent } from './warehouse-detail.component';

const routes: Routes = [
  { path: '', component: WarehouseComponent },
  { path: ':id', component: WarehouseDetailComponent }
];

@NgModule({
  declarations: [WarehouseComponent, WarehouseDetailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class WarehouseModule { }
