import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '@environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('guardEndpoint — rejects endpoints starting with api/', () => {
    it('getList should throw if endpoint starts with api/', () => {
      expect(() => service.getList('api/customers', { page: 1 }).subscribe())
        .toThrowError(/must not start with "api\/"/);
    });

    it('getDetail should throw if endpoint starts with api/', () => {
      expect(() => service.getDetail('api/customers', 1).subscribe())
        .toThrowError(/must not start with "api\/"/);
    });

    it('getLookup should throw if endpoint starts with api/', () => {
      expect(() => service.getLookup('api/productsearch/suppliers-lookup').subscribe())
        .toThrowError(/must not start with "api\/"/);
    });

    it('should suggest the corrected endpoint in error message', () => {
      expect(() => service.getList('api/orders', {}).subscribe())
        .toThrowError(/Use "orders" instead/);
    });
  });

  describe('valid endpoints — no api/ prefix', () => {
    it('getList should call correct URL', () => {
      service.getList('customers', { page: 1, pageSize: 20 }).subscribe();
      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/customers?page=1&pageSize=20`
      );
      expect(req.request.method).toBe('GET');
    });

    it('getDetail should call correct URL', () => {
      service.getDetail('orders', 42).subscribe();
      const req = httpMock.expectOne(`${environment.apiBaseUrl}/orders/42`);
      expect(req.request.method).toBe('GET');
    });

    it('getLookup should call correct URL', () => {
      service.getLookup('productsearch/suppliers-lookup').subscribe();
      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/productsearch/suppliers-lookup`
      );
      expect(req.request.method).toBe('GET');
    });
  });
});
