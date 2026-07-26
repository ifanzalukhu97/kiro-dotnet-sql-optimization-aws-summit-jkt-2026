import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  TotalRevenue,
  TopCustomer,
  TopSalesman,
  TopProduct,
  CustomerActivity,
  SalesTrend,
  StockLevel,
  TopOutstanding,
  DormantCustomer,
  TopStockGroup,
  TopSupplier,
  TopDriver
} from './models/advanced-report.models';

@Injectable({ providedIn: 'root' })
export class AdvancedReportService {
  private baseUrl = `${environment.apiBaseUrl}/advancedreport`;

  constructor(private http: HttpClient) {}

  getTotalRevenue(): Observable<TotalRevenue> {
    return this.http.get<TotalRevenue>(`${this.baseUrl}/total-revenue`);
  }

  getTopCustomers(): Observable<TopCustomer[]> {
    return this.http.get<TopCustomer[]>(`${this.baseUrl}/top-customers`);
  }

  getTopSalesman(): Observable<TopSalesman[]> {
    return this.http.get<TopSalesman[]>(`${this.baseUrl}/top-salesman`);
  }

  getTopProducts(): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`${this.baseUrl}/top-products`);
  }

  getCustomerActivity(): Observable<CustomerActivity> {
    return this.http.get<CustomerActivity>(`${this.baseUrl}/customer-activity`);
  }

  getSalesTrend(period: string = 'month'): Observable<SalesTrend[]> {
    return this.http.get<SalesTrend[]>(`${this.baseUrl}/sales-trend`, { params: { period } });
  }

  getLowStock(): Observable<StockLevel[]> {
    return this.http.get<StockLevel[]>(`${this.baseUrl}/low-stock`);
  }

  getHighStock(): Observable<StockLevel[]> {
    return this.http.get<StockLevel[]>(`${this.baseUrl}/high-stock`);
  }

  getTopOutstanding(): Observable<TopOutstanding[]> {
    return this.http.get<TopOutstanding[]>(`${this.baseUrl}/top-outstanding`);
  }

  getDormantCustomers(): Observable<DormantCustomer[]> {
    return this.http.get<DormantCustomer[]>(`${this.baseUrl}/dormant-customers`);
  }

  getTopStockGroups(): Observable<TopStockGroup[]> {
    return this.http.get<TopStockGroup[]>(`${this.baseUrl}/top-stock-groups`);
  }

  getTopSuppliers(): Observable<TopSupplier[]> {
    return this.http.get<TopSupplier[]>(`${this.baseUrl}/top-suppliers`);
  }

  getTopDrivers(): Observable<TopDriver[]> {
    return this.http.get<TopDriver[]>(`${this.baseUrl}/top-drivers`);
  }
}
