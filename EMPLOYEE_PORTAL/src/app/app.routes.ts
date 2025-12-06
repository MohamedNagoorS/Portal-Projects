import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { authGuard } from './guards/auth.guard';

import { LeaveHistoryComponent } from './components/leave-history/leave-history.component';
import { PayslipComponent } from './components/payslip/payslip.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },

    { path: 'leave-history', component: LeaveHistoryComponent, canActivate: [authGuard] },
    { path: 'payslip', component: PayslipComponent, canActivate: [authGuard] },
];
