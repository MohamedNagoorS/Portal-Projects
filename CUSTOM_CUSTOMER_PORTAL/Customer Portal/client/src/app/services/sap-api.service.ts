import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { mockData } from '../../assets/mock/mock-data';

export interface ApiResponse<T = any> {
  data: T;
  error?: string;
  fault?: any;
  tid?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SapApiService {
  constructor(private http: HttpClient) {}

  /**
   * Get customer profile
   */
  getProfile(customerId: string): Observable<ApiResponse> {
    if (environment.useMock) {
      return of({ data: mockData.profile });
    }
    return this.http.get<ApiResponse>(`/api/profile/${customerId}`);
  }

  /**
   * Get customer inquiries
   */
  getInquiry(customerId: string): Observable<ApiResponse> {
    if (environment.useMock) {
      return of({ data: mockData.inquiry });
    }
    return this.http.get<ApiResponse>(`/api/inquiry/${customerId}`);
  }

  /**
   * Get sales orders
   */
  getSalesOrder(customerId: string): Observable<ApiResponse> {
    if (environment.useMock) {
      return of({ data: mockData.salesorder });
    }
    return this.http.get<ApiResponse>(`/api/salesorder/${customerId}`);
  }

  /**
   * Get deliveries
   */
  getDeliveries(customerId: string): Observable<ApiResponse> {
    if (environment.useMock) {
      return of({ data: mockData.deliveries });
    }
    return this.http.get<ApiResponse>(`/api/deliveries/${customerId}`);
  }

  /**
   * Get invoices
   */
  getInvoices(customerId: string): Observable<ApiResponse> {
    if (environment.useMock) {
      return of({ data: mockData.invoices });
    }
    return this.http.get<ApiResponse>(`/api/invoices/${customerId}`);
  }

  /**
   * Get payment aging
   */
  getAging(customerId: string): Observable<ApiResponse> {
    if (environment.useMock) {
      return of({ data: mockData.aging });
    }
    return this.http.get<ApiResponse>(`/api/aging/${customerId}`);
  }

  /**
   * Get memos
   */
  getMemos(customerId: string): Observable<ApiResponse> {
    if (environment.useMock) {
      return of({ data: mockData.memos });
    }
    return this.http.get<ApiResponse>(`/api/memos/${customerId}`);
  }

  /**
   * Get sales summary
   */
  getSalesSummary(customerId: string): Observable<ApiResponse> {
    if (environment.useMock) {
      return of({ data: mockData.salesSummary });
    }
    return this.http.get<ApiResponse>(`/api/sales-summary/${customerId}`);
  }

  /**
   * Get dashboard data (aggregated)
   */
  getDashboard(customerId: string): Observable<ApiResponse> {
    if (environment.useMock) {
      return of({ data: mockData.dashboard });
    }
    return this.http.get<ApiResponse>(`/api/dashboard/${customerId}`);
  }

  /**
   * Get Invoice PDF Base64
   * This calls the new endpoint we created in server.js
   */
  getInvoicePdf(invoiceId: string): Observable<ApiResponse> {
    if (environment.useMock) {
      return of({ data: { base64: '' } }); 
    }
    // Force it to go to the backend port 4000
    return this.http.get<ApiResponse>(`http://localhost:4000/api/invoice-pdf/${invoiceId}`);
  }
  
}