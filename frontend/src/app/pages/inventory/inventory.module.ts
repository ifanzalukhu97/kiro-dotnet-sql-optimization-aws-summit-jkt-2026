import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { InventoryComponent } from './inventory.component';
import { InventoryDetailComponent } from './inventory-detail.component';

const routes: Routes = [
  { path: '', component: InventoryComponent },
  { path: ':id', component: InventoryDetailComponent }
];

@NgModule({
  declarations: [InventoryComponent, InventoryDetailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class InventoryModule { }
