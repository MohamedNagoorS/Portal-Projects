import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../services/employee';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../shared/header/header.component';

@Component({
    selector: 'app-payslip',
    standalone: true,
    imports: [CommonModule, SidebarComponent, HeaderComponent],
    templateUrl: './payslip.component.html',
    styleUrls: ['./payslip.component.css']
})
export class PayslipComponent implements OnInit {
    employeeId: string = '';
    payslips: any[] = [];

    constructor(
        private employeeService: EmployeeService,
        private authService: AuthService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        const user = this.authService.getCurrentUser();
        if (user && user.employeeId) {
            this.employeeId = user.employeeId;
            this.loadData();
        } else {
            this.router.navigate(['/login']);
        }
    }

    loadData() {
        this.employeeService.getPayslips(this.employeeId).subscribe({
            next: (res) => {
                console.log('Payslip Page Data:', res);
                if (res && res.d && res.d.results) {
                    this.payslips = res.d.results;
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Payslip Page Error:', err);
                this.cdr.detectChanges();
            }
        });
    }

    downloadPdf(slip: any) {
        console.log('Downloading PDF for:', slip);
        // Use the employeeId from the component state
        this.employeeService.getPayslipPdf(this.employeeId).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Payslip_${slip.WageType}.pdf`;
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

    previewPdf(slip: any) {
        console.log('Previewing Payslip for:', slip);
        this.employeeService.getPayslipPdf(this.employeeId).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            },
            error: (err) => {
                console.error('Preview failed:', err);
                alert('Failed to preview payslip. Please try again.');
            }
        });
    }

    emailPayslip(slip: any) {
        console.log('Emailing Payslip for:', slip);
        if (!slip.Email) {
            alert('No email address found for this payslip.');
            return;
        }

        const confirmEmail = confirm(`Send payslip for ${slip.WageType} to ${slip.Email}?`);
        if (confirmEmail) {
            this.employeeService.sendPayslipEmail(this.employeeId, slip.WageType, slip.Email).subscribe({
                next: (res) => {
                    console.log('Email sent:', res);
                    alert(res.message || 'Payslip sent successfully!');
                },
                error: (err) => {
                    console.error('Email failed:', err);
                    alert('Failed to send email. Please try again.');
                }
            });
        }
    }
}
