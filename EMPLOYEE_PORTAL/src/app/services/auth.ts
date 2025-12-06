import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmployeeService } from './employee';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'http://localhost:4000/api';

  private currentUserKey = 'currentUser';

  constructor(private http: HttpClient, private employeeService: EmployeeService) { }

  login(employeeId: string, passcode: string): Observable<any> {
    const url = `${this.baseUrl}/login`;
    return this.http.post(url, { employeeId, passcode });
  }

  setCurrentUser(user: any) {
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
  }

  getCurrentUser(): any {
    const user = localStorage.getItem(this.currentUserKey);
    return user ? JSON.parse(user) : null;
  }

  logout() {
    localStorage.removeItem(this.currentUserKey);
    this.employeeService.clearCache();
  }
}
