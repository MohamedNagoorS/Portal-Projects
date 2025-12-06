import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../shared/header/header.component';

@Component({
    selector: 'app-leave-request',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent],
    templateUrl: './leave-request.component.html',
    styleUrls: ['./leave-request.component.css']
})
export class LeaveRequestComponent {
    leave = {
        category: '',
        startDate: '',
        endDate: '',
        description: ''
    };

    categories = [
        { code: '0100', name: 'Annual Leave' },
        { code: '0200', name: 'Sick Leave' },
        { code: '0300', name: 'Casual Leave' }
    ];

    constructor(private employeeService: EmployeeService, private authService: AuthService, private router: Router) {
        const user = this.authService.getCurrentUser();
        if (!user || !user.employeeId) {
            this.router.navigate(['/login']);
        }
    }

    submitRequest() {
        console.log('Submitting leave request:', this.leave);
        // Implementation for POST request would go here
        // this.employeeService.createLeaveRequest(this.leave).subscribe(...)
        alert('Leave request submitted (Simulation)');
    }
}
