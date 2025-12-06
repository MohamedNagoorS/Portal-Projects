import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../shared/header/header.component';
import { AuthService } from '../../services/auth'; // Import AuthService

@Component({
    selector: 'app-leave-history',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent],
    templateUrl: './leave-history.component.html',
    styleUrls: ['./leave-history.component.css']
})
export class LeaveHistoryComponent implements OnInit {
    employeeId: string = ''; // Initialize empty
    leaves: any[] = [];
    filteredLeaves: any[] = [];

    filterCategory: string = '';
    sortColumn: string = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    constructor(
        private employeeService: EmployeeService,
        private authService: AuthService, // Inject AuthService
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        const user = this.authService.getCurrentUser();
        if (user && user.employeeId) {
            this.employeeId = user.employeeId;
            this.loadData();
        }
    }

    loadData() {
        this.employeeService.getLeaveRequests(this.employeeId).subscribe({
            next: (res) => {
                console.log('Leave History Data:', res);
                if (res && res.d && res.d.results) {
                    this.leaves = res.d.results;
                    this.filteredLeaves = [...this.leaves];
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Leave History Error:', err);
                this.cdr.detectChanges();
            }
        });
    }

    applyFilter() {
        this.filteredLeaves = this.leaves.filter(leave =>
            leave.Category.toLowerCase().includes(this.filterCategory.toLowerCase())
        );
        // Re-apply sort if needed
        if (this.sortColumn) {
            this.sort(this.sortColumn, true);
        }
    }

    sort(column: string, keepDirection: boolean = false) {
        if (!keepDirection) {
            if (this.sortColumn === column) {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortColumn = column;
                this.sortDirection = 'asc';
            }
        }

        this.filteredLeaves.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            // Handle dates (assuming /Date(...)/ format or string)
            if (typeof valA === 'string' && valA.startsWith('/Date(')) {
                const matchA = valA.match(/\d+/);
                valA = matchA ? parseInt(matchA[0]) : 0;

                if (typeof valB === 'string' && valB.startsWith('/Date(')) {
                    const matchB = valB.match(/\d+/);
                    valB = matchB ? parseInt(matchB[0]) : 0;
                }
            }

            if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
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
