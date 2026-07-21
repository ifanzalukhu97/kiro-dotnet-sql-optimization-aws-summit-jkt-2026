import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ProductSearchComponent } from './product-search.component';
import { ProductDetailComponent } from './product-detail.component';

const routes: Routes = [
  { path: '', component: ProductSearchComponent },
  { path: ':id', component: ProductDetailComponent }
];

@NgModule({
  declarations: [ProductSearchComponent, ProductDetailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class ProductSearchModule { }
