import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-pill',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-pill.component.html',
  styleUrls: ['./status-pill.component.css']
})
export class StatusPillComponent {
  @Input() status: string = '';
  @Input() type: 'success' | 'warning' | 'error' | 'info' = 'info';

  getStatusClass(): string {
    return `status-pill ${this.type}`;
  }
}

