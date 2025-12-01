import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// Update the interface to support buttons
export interface ColumnConfig {
  field: string;
  header: string;
  isButton?: boolean; // <-- New optional property
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent {
  @Input() data: any[] = [];
  @Input() columns: ColumnConfig[] = [];

  // New event emitter for button clicks
  @Output() buttonClick = new EventEmitter<any>();

  // Search state
  searchText: string = '';
  searchDate: string = ''; // ISO date string from <input type="date">
  filteredData: any[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.applyFilter();
    }
  }

  onSearchTextChange(value: string) {
    this.searchText = value || '';
    this.applyFilter();
  }

  onSearchDateChange(value: string) {
    this.searchDate = value || '';
    this.applyFilter();
  }

  private applyFilter() {
    if ((!this.searchText || this.searchText.trim() === '') && !this.searchDate) {
      this.filteredData = Array.isArray(this.data) ? this.data : [];
      return;
    }

    const txt = (this.searchText || '').toString().toLowerCase().trim();
    const dateFilter = this.searchDate ? new Date(this.searchDate) : null;

    this.filteredData = (this.data || []).filter(row => {
      // If search text provided, match any column value as substring
      let textMatch = true;
      if (txt) {
        textMatch = Object.keys(row).some(k => {
          const v = row[k];
          if (v === null || v === undefined) return false;
          return String(v).toLowerCase().includes(txt);
        });
      }

      // If date provided, try to match any column that contains a date equal to the selected date
      let dateMatch = true;
      if (dateFilter) {
        dateMatch = Object.keys(row).some(k => {
          const v = row[k];
          if (v === null || v === undefined) return false;
          // If value already a Date
          if (v instanceof Date) {
            return this.dateEquals(v, dateFilter);
          }
          // Try to parse common date strings
          const parsed = new Date(String(v));
          if (!isNaN(parsed.getTime())) {
            return this.dateEquals(parsed, dateFilter);
          }
          return false;
        });
      }

      return textMatch && dateMatch;
    });
  }

  private dateEquals(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  getColumnValue(row: any, column: ColumnConfig): any {
    return row[column.field] || 'N/A';
  }

  // Handler when the button inside the table is clicked
  onButtonClick(row: any) {
    this.buttonClick.emit(row);
  }

  onWrapperScroll(wrapper: ElementRef | any) {
    try {
      const el = wrapper instanceof ElementRef ? wrapper.nativeElement : wrapper;
      if (!el) return;
      if (el.scrollTop && el.scrollTop > 0) {
        el.classList.add('scrolled');
      } else {
        el.classList.remove('scrolled');
      }
    } catch (e) {
      // noop
    }
  }
}