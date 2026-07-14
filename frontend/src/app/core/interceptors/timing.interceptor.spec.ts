import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { TimingInterceptor } from './timing.interceptor';
import { TimingService } from '../services/timing.service';

describe('TimingInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let timingService: TimingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TimingService,
        { provide: HTTP_INTERCEPTORS, useClass: TimingInterceptor, multi: true }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    timingService = TestBed.inject(TimingService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should set response time on successful request', (done) => {
    httpClient.get('/api/test').subscribe(() => {
      timingService.responseTime$.subscribe(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        done();
      });
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ data: 'test' });
  });

  it('should call setRequestFailed on HTTP error', (done) => {
    spyOn(timingService, 'setRequestFailed').and.callThrough();

    httpClient.get('/api/test').subscribe({
      error: () => {
        expect(timingService.setRequestFailed).toHaveBeenCalled();
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });

  it('should measure elapsed time as a positive integer', (done) => {
    httpClient.get('/api/test').subscribe(() => {
      timingService.responseTime$.subscribe(value => {
        expect(value).not.toBeNull();
        expect(Number.isInteger(value!)).toBeTrue();
        expect(value!).toBeGreaterThanOrEqual(0);
        done();
      });
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ result: 'ok' });
  });
});
