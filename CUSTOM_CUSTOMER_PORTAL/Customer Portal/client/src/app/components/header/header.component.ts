import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  customerId: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.customerId = this.authService.getCustomerId();
  }
}

