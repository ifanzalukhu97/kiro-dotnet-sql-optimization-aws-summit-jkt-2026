import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimingService {
  private responseTimeSubject = new BehaviorSubject<number | null>(null);
  private requestFailedSubject = new BehaviorSubject<boolean>(false);

  responseTime$ = this.responseTimeSubject.asObservable();
  requestFailed$ = this.requestFailedSubject.asObservable();

  setLastResponseTime(ms: number): void {
    this.requestFailedSubject.next(false);
    this.responseTimeSubject.next(ms);
  }

  setRequestFailed(): void {
    this.requestFailedSubject.next(true);
    this.responseTimeSubject.next(null);
  }
}
