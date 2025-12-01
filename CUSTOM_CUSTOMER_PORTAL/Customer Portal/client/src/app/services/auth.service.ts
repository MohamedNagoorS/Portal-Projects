import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, map, delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  CUSTOMER_ID: string;
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
  private readonly CUSTOMER_ID_KEY = 'customer_id';

  constructor(private http: HttpClient) {}

  /**
   * Login to SAP system
   */
  login(customerId: string, passcode: string): Observable<LoginResponse> {
    const body: LoginRequest = {
      CUSTOMER_ID: customerId,
      PASSCODE: passcode
    };

    if (environment.useMock) {
      // Mock login - accept dummy credentials
      // Valid credentials: CUST001 / demo123 or DEMO001 / demo123
      const validCredentials = [
        { id: 'CUST001', pass: 'demo123' },
        { id: 'DEMO001', pass: 'demo123' }
      ];
      
      const isValid = validCredentials.some(
        cred => cred.id.toUpperCase() === customerId.toUpperCase() && cred.pass === passcode
      );

      if (isValid) {
        return of({ data: { SUCCESS: 'X', MESSAGE: 'Login successful' } }).pipe(
          tap(() => {
            localStorage.setItem(this.STORAGE_KEY, 'authenticated');
            localStorage.setItem(this.CUSTOMER_ID_KEY, customerId.toUpperCase());
          })
        );
      } else {
        // Simulate error response with delay
        return throwError(() => ({
          error: {
            fault: {
              faultstring: 'Invalid customer ID or password'
            }
          }
        })).pipe(delay(500)); // Simulate network delay
      }
    }

    return this.http.post<LoginResponse>('/api/login', body).pipe(
      tap((response) => {
        if (response.data) {
          localStorage.setItem(this.STORAGE_KEY, 'authenticated');
          localStorage.setItem(this.CUSTOMER_ID_KEY, customerId);
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
    localStorage.removeItem(this.CUSTOMER_ID_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'authenticated';
  }

  /**
   * Get current customer ID
   */
  getCustomerId(): string | null {
    return localStorage.getItem(this.CUSTOMER_ID_KEY);
  }
}

