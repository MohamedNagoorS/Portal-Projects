import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentUser = authService.getCurrentUser();

    if (currentUser) {
        return true;
    }

    // Not logged in, redirect to login page
    console.warn('AuthGuard: Access denied, redirecting to login');
    router.navigate(['/login']);
    return false;
};
