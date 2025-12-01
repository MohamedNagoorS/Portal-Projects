import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
// import { mockData } from '../../assets/mock/mock-data'; // Mock data structure mismatch

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
    constructor(private http: HttpClient) { }

    /**
     * Get vendor profile
     */
    getProfile(vendorId: string): Observable<ApiResponse> {
        if (environment.useMock) {
            return of({ data: {} });
        }
        return this.http.get<ApiResponse>(`/api/profile/${vendorId}`);
    }

    /**
     * Get vendor quotations (mapped from Inquiry)
     */
    getQuotations(vendorId: string): Observable<ApiResponse> {
        if (environment.useMock) {
            return of({ data: {} });
        }
        return this.http.get<ApiResponse>(`/api/quotations/${vendorId}`);
    }

    /**
     * Get purchase orders (mapped from Sales Order)
     */
    getPurchaseOrders(vendorId: string): Observable<ApiResponse> {
        if (environment.useMock) {
            return of({ data: {} });
        }
        return this.http.get<ApiResponse>(`/api/purchase-orders/${vendorId}`);
    }

    /**
     * Get goods receipts (mapped from Deliveries)
     */
    getGoodsReceipts(vendorId: string): Observable<ApiResponse> {
        if (environment.useMock) {
            return of({ data: {} });
        }
        return this.http.get<ApiResponse>(`/api/goods-receipts/${vendorId}`);
    }

    /**
     * Get invoices
     */
    getInvoices(vendorId: string): Observable<ApiResponse> {
        if (environment.useMock) {
            return of({ data: {} });
        }
        return this.http.get<ApiResponse>(`/api/invoices/${vendorId}`);
    }

    /**
     * Get payments and aging
     */
    getPayments(vendorId: string): Observable<ApiResponse> {
        if (environment.useMock) {
            return of({ data: {} });
        }
        return this.http.get<ApiResponse>(`/api/payments/${vendorId}`);
    }

    /**
     * Get memos
     */
    getMemos(vendorId: string): Observable<ApiResponse> {
        if (environment.useMock) {
            return of({ data: {} });
        }
        return this.http.get<ApiResponse>(`/api/memos/${vendorId}`);
    }

    /**
     * Get dashboard data (aggregated)
     */
    getDashboard(vendorId: string): Observable<ApiResponse> {
        if (environment.useMock) {
            return of({ data: {} });
        }
        return this.http.get<ApiResponse>(`/api/dashboard/${vendorId}`);
    }

    /**
     * Get Invoice PDF Base64 for a vendor invoice
     */
    getInvoicePdf(vendorId: string, invoiceId: string): Observable<ApiResponse> {
        if (environment.useMock) {
            return of({ data: { base64: '' } });
        }
        return this.http.get<ApiResponse>(`/api/invoice/${vendorId}/${invoiceId}/pdf`);
    }

    // /**
    //  * Get Invoice PDF Base64
    //  */
    // getInvoicePdf(invoiceId: string): Observable<ApiResponse> {
    //   if (environment.useMock) {
    //     return of({ data: { base64: '' } }); 
    //   }
    //   return this.http.get<ApiResponse>(`http://localhost:4000/api/invoice-pdf/${invoiceId}`);
    // }

}