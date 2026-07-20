import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, LookupItem } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getList<T>(endpoint: string, params?: Record<string, any>): Observable<PaginatedResponse<T>> {
    this.guardEndpoint(endpoint);
    const httpParams = this.buildParams(params);
    return this.http.get<PaginatedResponse<T>>(`${this.baseUrl}/${endpoint}`, { params: httpParams });
  }

  getDetail<T>(endpoint: string, id: number): Observable<T> {
    this.guardEndpoint(endpoint);
    return this.http.get<T>(`${this.baseUrl}/${endpoint}/${id}`);
  }

  getLookup(endpoint: string): Observable<LookupItem[]> {
    this.guardEndpoint(endpoint);
    return this.http.get<LookupItem[]>(`${this.baseUrl}/${endpoint}`);
  }

  private buildParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return httpParams;
  }

  private guardEndpoint(endpoint: string): void {
    if (endpoint.startsWith('api/')) {
      throw new Error(
        `ApiService: endpoint "${endpoint}" must not start with "api/" — baseUrl already includes it. Use "${endpoint.replace(/^api\//, '')}" instead.`
      );
    }
  }
}
