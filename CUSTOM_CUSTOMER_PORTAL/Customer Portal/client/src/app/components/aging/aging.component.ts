import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { DataTableComponent } from '../shared/data-table/data-table.component';

@Component({
  selector: 'app-aging',
  standalone: true,
  imports: [CommonModule, NgChartsModule, DataTableComponent],
  templateUrl: './aging.component.html',
  styleUrls: ['./aging.component.css']
})
export class AgingComponent implements OnChanges {
  // The parent now sends the clean, flattened array
  @Input() agingData: any[] = []; 

  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Payment Aging Analysis'
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['agingData']) {
      this.updateChart();
    }
  }

  updateChart(): void {
    if (!this.agingData || this.agingData.length === 0) {
      this.barChartData = { labels: [], datasets: [] };
      return;
    }

    // Add a 'Current' bucket for invoices not yet due
    const buckets = {
      'Current (Not Due)': 0,  // <-- NEW BUCKET
      '0-30 Days Overdue': 0,
      '31-60 Days Overdue': 0,
      '61-90 Days Overdue': 0,
      '90+ Days Overdue': 0,
    };

    for (const item of this.agingData) {
      // Ensure agingDays is a number
      const days = Number(item.agingDays) || 0;
      const amount = Number(item.amount) || 0;

      if (days <= 0) {
        buckets['Current (Not Due)'] += amount;
      } else if (days <= 30) {
        buckets['0-30 Days Overdue'] += amount;
      } else if (days <= 60) {
        buckets['31-60 Days Overdue'] += amount;
      } else if (days <= 90) {
        buckets['61-90 Days Overdue'] += amount;
      } else {
        buckets['90+ Days Overdue'] += amount;
      }
    }

    this.barChartData = {
      labels: Object.keys(buckets),
      datasets: [{
        label: 'Total Amount',
        data: Object.values(buckets),
        backgroundColor: [
          '#28a745', // Green for Current
          '#ffc107', // Yellow for 0-30
          '#fd7e14', // Orange for 31-60
          '#dc3545', // Red for 61-90
          '#dc3545'  // Red for 90+
        ],
        borderWidth: 1
      }]
    };
  }
}