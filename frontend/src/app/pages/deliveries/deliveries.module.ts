import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { DeliveriesComponent } from './deliveries.component';

const routes: Routes = [
  { path: '', component: DeliveriesComponent }
];

@NgModule({
  declarations: [DeliveriesComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class DeliveriesModule { }
