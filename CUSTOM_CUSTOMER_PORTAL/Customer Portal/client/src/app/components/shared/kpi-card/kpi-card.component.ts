import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.css']
})
export class KpiCardComponent {
  @Input() title: string = '';
  @Input() value: any = 0;
  @Input() icon: string = '';
  @Input() format: 'number' | 'currency' | 'text' = 'number';
  @Output() cardClick = new EventEmitter<void>();

  onCardClick() {
    this.cardClick.emit();
  }

  /**
   * If `icon` is a name (e.g. 'clipboard') we return the asset path.
   * If it's an emoji or already a path, return undefined to render raw text.
   */
  get iconSrc(): string | undefined {
    if (!this.icon) return undefined;
    // if the icon string looks like a filename or path, use it directly
    if (this.icon.indexOf('/') !== -1 || this.icon.toLowerCase().endsWith('.svg')) {
      return this.icon;
    }
    // if it's a short emoji (non-alphanumeric), don't try to map it
    if (/[^\w\-]/.test(this.icon)) return undefined;
    // otherwise map name to assets path
    return `assets/icons/${this.icon}.svg`;
  }

  getFormattedValue(): string {
    if (this.format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(parseFloat(this.value) || 0);
    }
    if (this.format === 'number') {
      return new Intl.NumberFormat('en-US').format(parseFloat(this.value) || 0);
    }
    return String(this.value || 'N/A');
  }
}

