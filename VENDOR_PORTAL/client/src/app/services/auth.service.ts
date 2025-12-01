import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, map, delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  VENDOR_ID: string;
  PASSCODE: string;
}

export interface LoginResponse {
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'sap_user';
  private readonly VENDOR_ID_KEY = 'vendor_id';

  constructor(private http: HttpClient) { }

  /**
   * Login to SAP system
   */
  login(vendorId: string, passcode: string): Observable<LoginResponse> {
    const body: LoginRequest = {
      VENDOR_ID: vendorId,
      PASSCODE: passcode
    };

    if (environment.useMock) {
      // Mock login - accept dummy credentials
      // Valid credentials: VEND001 / demo123
      const validCredentials = [
        { id: 'VEND001', pass: 'demo123' },
        { id: '100000', pass: 'PASS' } // From sample
      ];

      const isValid = validCredentials.some(
        cred => cred.id.toUpperCase() === vendorId.toUpperCase() && cred.pass === passcode
      );

      if (isValid) {
        return of({ data: { STATUS: 'Login Sucess' } }).pipe(
          tap(() => {
            localStorage.setItem(this.STORAGE_KEY, 'authenticated');
            localStorage.setItem(this.VENDOR_ID_KEY, vendorId.toUpperCase());
          })
        );
      } else {
        // Simulate error response with delay
        return throwError(() => ({
          error: {
            fault: {
              faultstring: 'Invalid vendor ID or password'
            }
          }
        })).pipe(delay(500)); // Simulate network delay
      }
    }

    return this.http.post<LoginResponse>('/api/login', body).pipe(
      tap((response) => {
        if (response.data) {
          localStorage.setItem(this.STORAGE_KEY, 'authenticated');
          localStorage.setItem(this.VENDOR_ID_KEY, vendorId);
        }
      }),
      catchError((error) => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  /**
   * Logout from the system
   */
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.VENDOR_ID_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'authenticated';
  }

  /**
   * Get current vendor ID
   */
  getVendorId(): string | null {
    return localStorage.getItem(this.VENDOR_ID_KEY);
  }
}
