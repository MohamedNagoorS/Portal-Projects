import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private baseUrl = 'http://localhost:4000/api';

  // Cache storage
  private profileCache: any = null;
  private leaveCache: any = null;
  private payslipCache: any = null;

  constructor(private http: HttpClient) { }

  getProfile(id: string, forceRefresh: boolean = false): Observable<any> {
    if (this.profileCache && !forceRefresh) {
      console.log('Returning cached profile');
      return of(this.profileCache);
    }
    console.log('Fetching profile for:', id);
    return this.http.get(`${this.baseUrl}/profile?empId=${id}`).pipe(
      tap(res => {
        console.log('Profile Response:', res);
        this.profileCache = res;
      }, err => console.error('Profile Error:', err))
    );
  }

  getLeaveRequests(id: string, forceRefresh: boolean = false): Observable<any> {
    if (this.leaveCache && !forceRefresh) {
      console.log('Returning cached leave requests');
      return of(this.leaveCache);
    }
    console.log('Fetching leave requests for:', id);
    return this.http.get(`${this.baseUrl}/leave-request?empId=${id}`).pipe(
      tap(res => {
        console.log('Leave Response:', res);
        this.leaveCache = res;
      }, err => console.error('Leave Error:', err))
    );
  }

  getPayslips(id: string, forceRefresh: boolean = false): Observable<any> {
    if (this.payslipCache && !forceRefresh) {
      console.log('Returning cached payslips');
      return of(this.payslipCache);
    }
    console.log('Fetching payslips for:', id);
    return this.http.get(`${this.baseUrl}/payslip?empId=${id}`).pipe(
      tap(res => {
        console.log('Payslip Response:', res);
        this.payslipCache = res;
      }, err => console.error('Payslip Error:', err))
    );
  }

  getPayslipPdf(employeeId: string): Observable<Blob> {
    const url = `${this.baseUrl}/payslip-pdf?empId=${employeeId}`;
    console.log('Fetching Payslip PDF from:', url);
    return this.http.get(url, { responseType: 'blob' });
  }

  sendPayslipEmail(empId: string, wageType: string, email: string): Observable<any> {
    const url = `${this.baseUrl}/send-payslip-email`;
    console.log('Sending Payslip Email via:', url);
    return this.http.post(url, { empId, wageType, email });
  }

  clearCache() {
    this.profileCache = null;
    this.leaveCache = null;
    this.payslipCache = null;
  }
}
