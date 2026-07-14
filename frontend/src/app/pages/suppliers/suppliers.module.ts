import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { SuppliersComponent } from './suppliers.component';

const routes: Routes = [
  { path: '', component: SuppliersComponent }
];

@NgModule({
  declarations: [SuppliersComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class SuppliersModule { }
