import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../shared/data-table/data-table.component';

@Component({
  selector: 'app-creditdebit-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './creditdebit-list.component.html',
  styleUrls: ['./creditdebit-list.component.css']
})
export class CreditdebitListComponent {
  @Input() memos: any[] = [];
}

