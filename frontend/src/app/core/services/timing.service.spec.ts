import { TestBed } from '@angular/core/testing';
import { TimingService } from './timing.service';

describe('TimingService', () => {
  let service: TimingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initially emit null for responseTime$', (done) => {
    service.responseTime$.subscribe(value => {
      expect(value).toBeNull();
      done();
    });
  });

  it('should initially emit false for requestFailed$', (done) => {
    service.requestFailed$.subscribe(value => {
      expect(value).toBeFalse();
      done();
    });
  });

  it('should emit the response time when setLastResponseTime is called', (done) => {
    service.setLastResponseTime(150);
    service.responseTime$.subscribe(value => {
      expect(value).toBe(150);
      done();
    });
  });

  it('should reset requestFailed to false when setLastResponseTime is called', (done) => {
    service.setRequestFailed();
    service.setLastResponseTime(200);
    service.requestFailed$.subscribe(value => {
      expect(value).toBeFalse();
      done();
    });
  });

  it('should emit true for requestFailed$ when setRequestFailed is called', (done) => {
    service.setRequestFailed();
    service.requestFailed$.subscribe(value => {
      expect(value).toBeTrue();
      done();
    });
  });

  it('should emit null for responseTime$ when setRequestFailed is called', (done) => {
    service.setLastResponseTime(100);
    service.setRequestFailed();
    service.responseTime$.subscribe(value => {
      expect(value).toBeNull();
      done();
    });
  });
});
