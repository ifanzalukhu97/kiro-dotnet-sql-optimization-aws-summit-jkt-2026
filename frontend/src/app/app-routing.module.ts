import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'orders',
    loadChildren: () => import('./pages/orders/orders.module').then(m => m.OrdersModule)
  },
  {
    path: 'product-search',
    loadChildren: () => import('./pages/product-search/product-search.module').then(m => m.ProductSearchModule)
  },
  {
    path: 'customers',
    loadChildren: () => import('./pages/customers/customers.module').then(m => m.CustomersModule)
  },
  {
    path: 'suppliers',
    loadChildren: () => import('./pages/suppliers/suppliers.module').then(m => m.SuppliersModule)
  },
  {
    path: 'purchase-orders',
    loadChildren: () => import('./pages/purchase-orders/purchase-orders.module').then(m => m.PurchaseOrdersModule)
  },
  {
    path: 'inventory',
    loadChildren: () => import('./pages/inventory/inventory.module').then(m => m.InventoryModule)
  },
  {
    path: 'invoices',
    loadChildren: () => import('./pages/invoices/invoices.module').then(m => m.InvoicesModule)
  },
  {
    path: 'deliveries',
    loadChildren: () => import('./pages/deliveries/deliveries.module').then(m => m.DeliveriesModule)
  },
  {
    path: 'warehouse',
    loadChildren: () => import('./pages/warehouse/warehouse.module').then(m => m.WarehouseModule)
  },
  {
    path: 'payments',
    loadChildren: () => import('./pages/payments/payments.module').then(m => m.PaymentsModule)
  },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
