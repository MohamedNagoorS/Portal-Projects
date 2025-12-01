import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  activeRoute: string = '';
  
  menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/financials', label: 'Financials', icon: 'moneybag' },
    { path: '/profile', label: 'Profile', icon: 'profile' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.activeRoute = event.url;
      });
    
    this.activeRoute = this.router.url;
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isActive(path: string): boolean {
    return this.activeRoute === path || this.activeRoute.startsWith(path + '/');
  }

  getIconSrc(icon: string | undefined): string | undefined {
    if (!icon) return undefined;
    if (icon.indexOf('/') !== -1 || icon.toLowerCase().endsWith('.svg')) return icon;
    if (/[^\w\-]/.test(icon)) return undefined;
    return `assets/icons/${icon}.svg`;
  }
}

