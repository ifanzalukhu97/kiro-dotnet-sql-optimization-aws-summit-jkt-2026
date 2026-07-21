import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { TimingService } from '@core/services/timing.service';

/**
 * Verifies every page component passes correct endpoint strings to ApiService
 * (no 'api/' prefix, since baseUrl already includes /api).
 *
 * These tests catch the double-prefix bug at unit test time.
 */

const mockPaginatedResponse = { data: [], page: 1, pageSize: 20, totalCount: 0 };
const mockLookupResponse: any[] = [];

function setupTestBed(component: any, declarations: any[] = []) {
  return TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule],
    declarations: [component, ...declarations],
    providers: [
      {
        provide: ApiService,
        useValue: jasmine.createSpyObj('ApiService', ['getList', 'getDetail', 'getLookup'])
      },
      TimingService
    ],
    schemas: [NO_ERRORS_SCHEMA]
  });
}

function getMockApiService(): jasmine.SpyObj<ApiService> {
  const api = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  api.getList.and.returnValue(of(mockPaginatedResponse) as any);
  api.getDetail.and.returnValue(of({}) as any);
  api.getLookup.and.returnValue(of(mockLookupResponse) as any);
  return api;
}

describe('Page component endpoint URLs', () => {

  afterEach(() => TestBed.resetTestingModule());

  describe('CustomersComponent', () => {
    it('should call getList with "customers" (not "api/customers")', async () => {
      const { CustomersComponent } = await import('./customers/customers.component');
      setupTestBed(CustomersComponent).compileComponents();
      const api = getMockApiService();
      const fixture = TestBed.createComponent(CustomersComponent);
      fixture.componentInstance.ngOnInit();

      expect(api.getList).toHaveBeenCalledWith('customers', jasmine.objectContaining({ page: 1 }));
      const endpoint = api.getList.calls.mostRecent().args[0];
      expect(endpoint).not.toMatch(/^api\//);
    });

    it('should navigate to detail route on row click', async () => {
      const { CustomersComponent } = await import('./customers/customers.component');
      setupTestBed(CustomersComponent).compileComponents();
      const fixture = TestBed.createComponent(CustomersComponent);
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      fixture.componentInstance.onRowClick({ customerId: 1 } as any);

      expect(router.navigate).toHaveBeenCalledWith([1], jasmine.any(Object));
    });
  });

  describe('ProductSearchComponent', () => {
    it('should call getList with "productsearch"', async () => {
      const { ProductSearchComponent } = await import('./product-search/product-search.component');
      setupTestBed(ProductSearchComponent).compileComponents();
      const api = getMockApiService();
      const fixture = TestBed.createComponent(ProductSearchComponent);
      fixture.componentInstance.ngOnInit();

      expect(api.getList).toHaveBeenCalledWith('productsearch', jasmine.any(Object));
      const endpoint = api.getList.calls.mostRecent().args[0];
      expect(endpoint).not.toMatch(/^api\//);
    });

    it('should call getLookup with "productsearch/suppliers-lookup"', async () => {
      const { ProductSearchComponent } = await import('./product-search/product-search.component');
      setupTestBed(ProductSearchComponent).compileComponents();
      const api = getMockApiService();
      const fixture = TestBed.createComponent(ProductSearchComponent);
      fixture.componentInstance.ngOnInit();

      const lookupCalls = api.getLookup.calls.allArgs().map(a => a[0]);
      expect(lookupCalls).toContain('productsearch/suppliers-lookup');
      expect(lookupCalls).toContain('productsearch/stockgroups-lookup');
      lookupCalls.forEach(ep => expect(ep).not.toMatch(/^api\//));
    });
  });

  describe('OrdersComponent', () => {
    it('should call getList with "orders"', async () => {
      const { OrdersComponent } = await import('./orders/orders.component');
      setupTestBed(OrdersComponent).compileComponents();
      const api = getMockApiService();
      const fixture = TestBed.createComponent(OrdersComponent);
      fixture.componentInstance.ngOnInit();

      expect(api.getList).toHaveBeenCalledWith('orders', jasmine.any(Object));
      const endpoint = api.getList.calls.mostRecent().args[0];
      expect(endpoint).not.toMatch(/^api\//);
    });

    it('should call getLookup with "orders/lookup" and "stockitems/lookup"', async () => {
      const { OrdersComponent } = await import('./orders/orders.component');
      setupTestBed(OrdersComponent).compileComponents();
      const api = getMockApiService();
      const fixture = TestBed.createComponent(OrdersComponent);
      fixture.componentInstance.ngOnInit();

      const lookupCalls = api.getLookup.calls.allArgs().map(a => a[0]);
      expect(lookupCalls).toContain('orders/lookup');
      expect(lookupCalls).toContain('stockitems/lookup');
      lookupCalls.forEach(ep => expect(ep).not.toMatch(/^api\//));
    });
  });

  describe('SuppliersComponent', () => {
    it('should call getList with "suppliers"', async () => {
      const { SuppliersComponent } = await import('./suppliers/suppliers.component');
      setupTestBed(SuppliersComponent).compileComponents();
      const api = getMockApiService();
      const fixture = TestBed.createComponent(SuppliersComponent);
      fixture.componentInstance.ngOnInit();

      expect(api.getList).toHaveBeenCalledWith('suppliers', jasmine.any(Object));
      const endpoint = api.getList.calls.mostRecent().args[0];
      expect(endpoint).not.toMatch(/^api\//);
    });
  });

  describe('InvoicesComponent', () => {
    it('should call getList with "invoices"', async () => {
      const { InvoicesComponent } = await import('./invoices/invoices.component');
      setupTestBed(InvoicesComponent).compileComponents();
      const api = getMockApiService();
      const fixture = TestBed.createComponent(InvoicesComponent);
      fixture.componentInstance.ngOnInit();

      expect(api.getList).toHaveBeenCalledWith('invoices', jasmine.any(Object));
      const endpoint = api.getList.calls.mostRecent().args[0];
      expect(endpoint).not.toMatch(/^api\//);
    });
  });

  describe('DeliveriesComponent', () => {
    it('should call getList with "delivery"', async () => {
      const { DeliveriesComponent } = await import('./deliveries/deliveries.component');
      setupTestBed(DeliveriesComponent).compileComponents();
      const api = getMockApiService();
      const fixture = TestBed.createComponent(DeliveriesComponent);
      fixture.componentInstance.ngOnInit();

      expect(api.getList).toHaveBeenCalledWith('delivery', jasmine.any(Object));
      const endpoint = api.getList.calls.mostRecent().args[0];
      expect(endpoint).not.toMatch(/^api\//);
    });

    it('should call getLookup with "delivery/lookup"', async () => {
      const { DeliveriesComponent } = await import('./deliveries/deliveries.component');
      setupTestBed(DeliveriesComponent).compileComponents();
      const api = getMockApiService();
      const fixture = TestBed.createComponent(DeliveriesComponent);
      fixture.componentInstance.ngOnInit();

      const lookupCalls = api.getLookup.calls.allArgs().map(a => a[0]);
      expect(lookupCalls).toContain('delivery/lookup');
      lookupCalls.forEach(ep => expect(ep).not.toMatch(/^api\//));
    });
  });

  describe('PaymentsComponent', () => {
    it('should call getList with "payment"', async () => {
      const { PaymentsComponent } = await import('./payments/payments.component');
      setupTestBed(PaymentsComponent).compileComponents();
      const api = getMockApiService();
      const fixture = TestBed.createComponent(PaymentsComponent);
      fixture.componentInstance.ngOnInit();

      expect(api.getList).toHaveBeenCalledWith('payment', jasmine.any(Object));
      const endpoint = api.getList.calls.mostRecent().args[0];
      expect(endpoint).not.toMatch(/^api\//);
    });
  });

  describe('PurchaseOrdersComponent', () => {
    it('should call getList with "purchaseorders"', async () => {
      const { PurchaseOrdersComponent } = await import('./purchase-orders/purchase-orders.component');
      setupTestBed(PurchaseOrdersComponent).compileComponents();
      const api = getMockApiService();
      const fixture = TestBed.createComponent(PurchaseOrdersComponent);
      fixture.componentInstance.ngOnInit();

      expect(api.getList).toHaveBeenCalledWith('purchaseorders', jasmine.any(Object));
      const endpoint = api.getList.calls.mostRecent().args[0];
      expect(endpoint).not.toMatch(/^api\//);
    });
  });

  describe('WarehouseComponent', () => {
    it('should call getList with "warehouse"', async () => {
      const { WarehouseComponent } = await import('./warehouse/warehouse.component');
      setupTestBed(WarehouseComponent).compileComponents();
      const api = getMockApiService();
      const fixture = TestBed.createComponent(WarehouseComponent);
      fixture.componentInstance.ngOnInit();

      expect(api.getList).toHaveBeenCalledWith('warehouse', jasmine.any(Object));
      const endpoint = api.getList.calls.mostRecent().args[0];
      expect(endpoint).not.toMatch(/^api\//);
    });
  });

  describe('InventoryComponent', () => {
    it('should call getList with "stockitems"', async () => {
      const { InventoryComponent } = await import('./inventory/inventory.component');
      setupTestBed(InventoryComponent).compileComponents();
      const api = getMockApiService();
      const fixture = TestBed.createComponent(InventoryComponent);
      fixture.componentInstance.ngOnInit();

      expect(api.getList).toHaveBeenCalledWith('stockitems', jasmine.any(Object));
      const endpoint = api.getList.calls.mostRecent().args[0];
      expect(endpoint).not.toMatch(/^api\//);
    });
  });
});
