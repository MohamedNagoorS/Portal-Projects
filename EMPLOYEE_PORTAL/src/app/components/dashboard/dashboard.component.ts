import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../services/employee';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../shared/header/header.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, SidebarComponent, HeaderComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    employeeId: string = '';
    profile: any = null;
    recentLeaves: any[] = [];
    latestPayslip: any = null;
    debugData: any = null;
    isLoading: boolean = true;

    constructor(
        private employeeService: EmployeeService,
        private authService: AuthService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        const user = this.authService.getCurrentUser();
        console.log('Dashboard initialized. User:', user);
        if (user && user.employeeId) {
            this.employeeId = user.employeeId;
            // Use setTimeout to push to next tick and ensure view is ready
            setTimeout(() => {
                this.loadData();
            }, 100);
        } else {
            console.warn('No user found, redirecting to login');
            this.router.navigate(['/login']);
        }
    }

    loadData() {
        console.log('Dashboard loading data for:', this.employeeId);
        this.isLoading = true;

        this.employeeService.getProfile(this.employeeId).subscribe({
            next: (res) => {
                console.log('Dashboard Profile Data:', res);
                this.debugData = res;
                if (res && res.d && res.d.results && res.d.results.length > 0) {
                    this.profile = res.d.results[0];
                    console.log('Profile set:', this.profile);
                } else if (res && res.d && !res.d.results) {
                    this.profile = res.d;
                    console.log('Profile set (direct):', this.profile);
                } else {
                    console.warn('Profile data structure mismatch or empty:', res);
                }
                this.isLoading = false;
                this.cdr.detectChanges(); // Force update
            },
            error: (err) => {
                console.error('Dashboard Profile Fetch Error:', err);
                this.debugData = { error: err };
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });

        this.employeeService.getLeaveRequests(this.employeeId).subscribe({
            next: (res) => {
                console.log('Dashboard Leave Data:', res);
                if (res && res.d && res.d.results) {
                    this.recentLeaves = res.d.results.slice(0, 5);
                }
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Dashboard Leave Fetch Error:', err)
        });

        this.employeeService.getPayslips(this.employeeId).subscribe({
            next: (res) => {
                console.log('Dashboard Payslip Data:', res);
                if (res && res.d && res.d.results && res.d.results.length > 0) {
                    this.latestPayslip = res.d.results[0];
                }
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Dashboard Payslip Fetch Error:', err)
        });
    }
    downloadPdf() {
        if (!this.latestPayslip) return;
        console.log('Dashboard: Downloading PDF for:', this.latestPayslip);
        this.employeeService.getPayslipPdf(this.employeeId).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Payslip_${this.latestPayslip.WageType}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            },
            error: (err) => {
                console.error('Download failed:', err);
                alert('Failed to download payslip. Please try again.');
            }
        });
    }

    parseDate(dateString: string): Date | null {
        if (!dateString) return null;
        if (dateString.indexOf('/Date(') !== -1) {
            const timestamp = parseInt(dateString.replace('/Date(', '').replace(')/', ''), 10);
            return new Date(timestamp);
        }
        return new Date(dateString);
    }
}
