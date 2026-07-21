import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-layout">
      <nav class="sidebar">
        <div class="sidebar-header">
          <h2>Demo Booth</h2>
        </div>
        <ul class="nav-links">
          <li><a routerLink="/dashboard" routerLinkActive="active">Dashboard</a></li>
          <li><a routerLink="/orders" routerLinkActive="active">Orders</a></li>
          <li><a routerLink="/product-search" routerLinkActive="active">Products</a></li>
          <li><a routerLink="/customers" routerLinkActive="active">Customers</a></li>
          <li><a routerLink="/suppliers" routerLinkActive="active">Suppliers</a></li>
          <li><a routerLink="/purchase-orders" routerLinkActive="active">Purchase Orders</a></li>
          <li><a routerLink="/inventory" routerLinkActive="active">Inventory</a></li>
          <li><a routerLink="/invoices" routerLinkActive="active">Invoices</a></li>
          <li><a routerLink="/deliveries" routerLinkActive="active">Deliveries</a></li>
          <li><a routerLink="/warehouse" routerLinkActive="active">Warehouse</a></li>
          <li><a routerLink="/payments" routerLinkActive="active">Payments</a></li>
        </ul>
      </nav>
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      width: 240px;
      background-color: #1a1a1a;
      padding: 1rem 0;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 0 1.5rem 1rem;
      border-bottom: 1px solid #2a2a2a;
      margin-bottom: 1rem;
    }

    .sidebar-header h2 {
      color: #aaff00;
      font-size: 1.25rem;
    }

    .nav-links {
      list-style: none;
      padding: 0;
    }

    .nav-links li a {
      display: block;
      padding: 0.75rem 1.5rem;
      color: #b0b0b0;
      text-decoration: none;
      transition: background-color 0.2s, color 0.2s;
    }

    .nav-links li a:hover {
      background-color: #2a2a2a;
      color: #ffffff;
      text-decoration: none;
    }

    .nav-links li a.active {
      color: #aaff00;
      background-color: #2a2a2a;
      border-left: 3px solid #aaff00;
    }

    .content {
      margin-left: 240px;
      padding: 2rem;
      flex: 1;
    }
  `]
})
export class AppComponent {
  title = 'Demo Booth - AWS Summit Jakarta 2026';
}
