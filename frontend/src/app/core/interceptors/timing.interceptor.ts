import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError, timeout } from 'rxjs/operators';
import { TimingService } from '../services/timing.service';

@Injectable()
export class TimingInterceptor implements HttpInterceptor {
  constructor(private timingService: TimingService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const startTime = performance.now();

    return next.handle(req).pipe(
      timeout(10000),
      tap(event => {
        if (event instanceof HttpResponse) {
          const elapsed = Math.round(performance.now() - startTime);
          this.timingService.setLastResponseTime(elapsed);
        }
      }),
      catchError(error => {
        this.timingService.setRequestFailed();
        throw error;
      })
    );
  }
}
