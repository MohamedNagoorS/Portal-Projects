import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../services/employee';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../shared/header/header.component';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, SidebarComponent, HeaderComponent],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
    employeeId: string = '';
    profile: any = null;

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
        this.employeeService.getProfile(this.employeeId).subscribe({
            next: (res) => {
                console.log('Profile Page Data:', res);
                if (res && res.d && res.d.results && res.d.results.length > 0) {
                    this.profile = res.d.results[0];
                } else if (res && res.d && !res.d.results) {
                    this.profile = res.d;
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Profile Page Error:', err);
                this.cdr.detectChanges();
            }
        });
    }
}
