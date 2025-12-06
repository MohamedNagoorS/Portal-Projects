import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    employeeId: string = '';
    passcode: string = '';
    isLoading: boolean = false;
    errorMessage: string = '';

    constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) { }

    login() {
        if (!this.employeeId || !this.passcode) {
            this.errorMessage = 'Please enter both Employee ID and Password.';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        console.log('Attempting login for:', this.employeeId);
        this.authService.login(this.employeeId, this.passcode)
            .subscribe({
                next: (response) => {
                    console.log('Login response received:', response);
                    this.isLoading = false;
                    if (response && response.d && response.d.Passcode === 'Login Successful') {
                        console.log('Login successful');
                        this.authService.setCurrentUser({ employeeId: this.employeeId });
                        this.router.navigate(['/dashboard']);
                    } else {
                        console.warn('Login response invalid:', response);
                        this.errorMessage = 'Invalid Credentials';
                    }
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Login error callback:', err);
                    this.isLoading = false;
                    if (err.status === 404 || err.status === 401 || err.status === 500) {
                        this.errorMessage = 'Invalid Credentials / Server Error';
                    } else {
                        this.errorMessage = 'Login failed. Please check your connection.';
                    }
                    this.cdr.detectChanges();
                }
            });
    }
}
