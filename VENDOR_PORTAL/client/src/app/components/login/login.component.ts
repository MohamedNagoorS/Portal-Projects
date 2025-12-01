import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  showDemoHint: boolean = environment.useMock;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      vendorId: ['', [Validators.required, Validators.maxLength(10)]],
      passcode: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    console.log('Login form submitted');

    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { vendorId, passcode } = this.loginForm.value;
      console.log('Calling authService.login with:', { vendorId, passcode: '***' });

      this.authService.login(vendorId, passcode).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Login error:', error);
          this.isLoading = false;
          // Handle SOAP Fault
          if (error.error?.error === 'sap-fault') {
            this.errorMessage = error.error.fault?.faultstring || error.error.message || 'SAP authentication failed. Please check your credentials.';
          }
          // Handle HTTP Error
          else if (error.error?.error === 'sap-http-error') {
            this.errorMessage = error.error.message || `SAP connection error: ${error.error.status} ${error.error.statusText}`;
          }
          // Generic error
          else {
            this.errorMessage = error.error?.fault?.faultstring || error.error?.error || error.error?.message || 'Login failed. Please check your credentials.';
          }
        }
      });
    } else {
      console.log('Form is invalid, marking fields as touched');
      this.loginForm.markAllAsTouched();
    }
  }

  get vendorId() {
    return this.loginForm.get('vendorId');
  }

  get passcode() {
    return this.loginForm.get('passcode');
  }
}
