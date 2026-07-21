import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DashboardComponent, DashboardKpi } from './dashboard.component';
import { TimingService } from '@core/services/timing.service';
import { environment } from '@environments/environment';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';

const mockKpi: DashboardKpi = {
  totalOrders: 10,
  totalCustomers: 5,
  totalRevenue: 1000,
  totalStockItems: 50,
  averageOrderValue: 100,
  topCustomerByRevenue: 'Acme Corp',
  recentOrderCount: 3,
  pendingDeliveries: 2
};

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      imports: [HttpClientTestingModule, CommonModule],
      providers: [TimingService],
      // Suppress errors from child components (ResponseTimeBadge, etc.) not declared here
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.verify();
  });

  /**
   * Validates: Requirements Bug 12
   *
   * When the HTTP response arrives before ngAfterViewInit (or when the canvas
   * *ngIf hasn't yet resolved), `buildChart` must NOT throw a TypeError.
   * The null-guard `if (!this.chartCanvas) return;` is the fix under test.
   */
  it('should not throw when chartCanvas is undefined and HTTP data arrives', fakeAsync(() => {
    httpMock = TestBed.inject(HttpTestingController);

    // detectChanges triggers ngOnInit → loadDashboardData (does NOT call ngAfterViewInit)
    // chartReady stays false; chartCanvas ViewChild is NOT in the DOM because *ngIf="kpiData" is false
    fixture.detectChanges();

    // Ensure chartCanvas is genuinely undefined before the response arrives
    expect(component.chartCanvas).toBeUndefined();

    // Resolve the HTTP call — this triggers the `next` callback which calls buildChart
    // (via pendingChartData path or direct setTimeout path)
    expect(() => {
      httpMock.expectOne(`${environment.apiBaseUrl}/dashboard`).flush(mockKpi);
      tick(0); // drain the setTimeout(..., 0) queued inside the next callback
    }).not.toThrow();
  }));
});
