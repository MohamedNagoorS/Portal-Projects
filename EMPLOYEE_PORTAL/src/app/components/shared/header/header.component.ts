import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { EmployeeService } from '../../../services/employee';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
    user: any = null;

    constructor(
        private router: Router,
        private authService: AuthService,
        private employeeService: EmployeeService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        const currentUser = this.authService.getCurrentUser();
        console.log('Header Initialized. Current User:', currentUser);
        if (currentUser && currentUser.employeeId) {
            this.employeeService.getProfile(currentUser.employeeId).subscribe({
                next: (res) => {
                    console.log('Header Profile Data:', res);
                    if (res && res.d && res.d.results && res.d.results.length > 0) {
                        this.user = res.d.results[0];
                    } else if (res && res.d && !res.d.results) {
                        this.user = res.d;
                    }
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Header Profile Fetch Error:', err);
                    this.cdr.detectChanges();
                }
            });
        }
    }
    onSearch(event: any) {
        const query = event.target.value.toLowerCase();
        if (!query) return;

        if (query.includes('leave') || query.includes('history')) {
            this.router.navigate(['/leave-history']);

        } else if (query.includes('profile') || query.includes('my')) {
            this.router.navigate(['/profile']);
        } else if (query.includes('pay') || query.includes('salary') || query.includes('slip')) {
            this.router.navigate(['/payslip']);
        } else if (query.includes('dash') || query.includes('home')) {
            this.router.navigate(['/dashboard']);
        }
    }
}
