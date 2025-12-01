import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SapApiService } from '../../services/sap-api.service';
import { KpiCardComponent } from '../shared/kpi-card/kpi-card.component';
import { DataTableComponent } from '../shared/data-table/data-table.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, DataTableComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  isLoading: boolean = true;
  errorMessage: string = '';

  // Simple properties for our KPIs
  totalInquiries: number = 0;
  totalSalesOrders: number = 0;
  totalDeliveries: number = 0;
  totalSales: number = 0.0;
  totalCurrency: string = 'INR';

  // Properties to hold the table data
  inquiryData: any[] = [];
  salesOrderData: any[] = [];
  deliveryData: any[] = [];

  constructor(
    private authService: AuthService,
    private sapApi: SapApiService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  scrollTo(id: string) {
    try {
      const el = document.getElementById(id);
      if (!el) return;
      const header = document.querySelector('.app-header') as HTMLElement | null;
      const headerHeight = header ? header.offsetHeight : 60;
      const rect = el.getBoundingClientRect();
      const top = window.pageYOffset + rect.top - headerHeight - 12;
      window.scrollTo({ top, behavior: 'smooth' });
      // also give the element focus for accessibility
      setTimeout(() => { try { (el as HTMLElement).focus(); } catch(e){} }, 600);
    } catch (e) {
      // noop
    }
  }

  loadDashboard(): void {
    const customerId = this.authService.getCustomerId();
    if (!customerId) {
      this.errorMessage = 'Customer ID not found';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.sapApi.getDashboard(customerId).subscribe({
      next: (response) => {
        console.log('Raw Dashboard Data:', response.data);
        this.processDashboardData(response.data);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.fault?.faultstring || error.error?.error || 'Failed to load dashboard data';
        this.isLoading = false;
      }
    });
  }

  private processDashboardData(data: any): void {
    if (!data) return;

    // 1. Process Inquiries
    this.inquiryData = this.getSafeItemArray(data.inquiry, 'ET_INQUIRY');
    this.totalInquiries = this.inquiryData.length;

    // 2. Process Sales Orders
    this.salesOrderData = this.getSafeItemArray(data.salesorder, 'ET_SALES_ORDER');
    this.totalSalesOrders = this.salesOrderData.length;

    // 3. Process Deliveries
    this.deliveryData = this.getSafeItemArray(data.deliveries, 'ET_DELIVERY');
    this.totalDeliveries = this.deliveryData.length;

    // 4. Process Sales Summary -> totalSales and currency
    try {
      const salesSummaryTable = this.getSafeItemArray(data.salesSummary, 'ET_SALES_SUMMARY');
      const netwrValue = this.extractNetwrFromSalesSummary(salesSummaryTable);
      this.totalSales = netwrValue;

      // Try to pick currency if available (WAERK)
      const waerk = this.extractCurrencyFromSalesSummary(salesSummaryTable);
      if (waerk) this.totalCurrency = waerk;
    } catch (e) {
      console.error('Error processing sales summary', e);
      this.totalSales = 0.0;
      this.totalCurrency = 'INR';
    }
  }

  /**
   * Extract NETWR (net value) from the normalized sales summary table.
   * Returns a float (0.0 if nothing found).
   */
  private extractNetwrFromSalesSummary(tableArr: any[]): number {
    if (!Array.isArray(tableArr) || tableArr.length === 0) {
      // *** ADD THIS LOG ***
      console.log('TotalSales is 0 because tableArr is empty.');
      return 0.0;
    }

    // Common shape: tableArr[0].item is an array of records, take first record's NETWR
    const first = tableArr[0];

    // 1) If NETWR is directly on the object
    if (first.NETWR && Array.isArray(first.NETWR) && first.NETWR.length > 0) {
      const v = parseFloat(first.NETWR[0]);
      
      // *** ADD THIS LOG ***
      console.log('SUCCESS: TotalSales found. Value is:', first.NETWR[0]);
      
      return isNaN(v) ? 0.0 : v;
    }

    // 2) If it's nested inside item array (common): first.item[0].NETWR[0]
    if (first.item && Array.isArray(first.item) && first.item.length > 0) {
      const rec = first.item[0];
      if (rec.NETWR && Array.isArray(rec.NETWR) && rec.NETWR.length > 0) {
        const v = parseFloat(rec.NETWR[0]);
        console.log('SUCCESS: TotalSales found (in nested item). Value is:', rec.NETWR[0]);
        return isNaN(v) ? 0.0 : v;
      }
    }
    
    // Fallback logs...
    console.log('TotalSales is 0. NETWR field not found in expected location.', first);
    return 0.0;
  }
  /**
   * Extract currency (WAERK) from sales summary if present.
   */
  private extractCurrencyFromSalesSummary(tableArr: any[]): string | null {
    if (!Array.isArray(tableArr) || tableArr.length === 0) return null;
    const first = tableArr[0];

    if (first.WAERK && Array.isArray(first.WAERK) && first.WAERK.length > 0) {
      return first.WAERK[0];
    }
    if (first.item && Array.isArray(first.item) && first.item.length > 0) {
      const rec = first.item[0];
      for (const k of Object.keys(rec)) {
        if (k.toUpperCase().includes('WAERK') && Array.isArray(rec[k]) && rec[k].length > 0) {
          return rec[k][0];
        }
      }
    }
    // scan all entries
    for (const entry of tableArr) {
      if (entry.WAERK && Array.isArray(entry.WAERK) && entry.WAERK.length > 0) {
        return entry.WAERK[0];
      }
      if (entry.item && Array.isArray(entry.item)) {
        for (const rec of entry.item) {
          for (const k of Object.keys(rec)) {
            if (k.toUpperCase().includes('WAERK') && Array.isArray(rec[k]) && rec[k].length > 0) {
              return rec[k][0];
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Helper function to safely get the nested 'item' array from an SAP table.
   * Returns an empty array [] if data is missing, invalid, or an error.
   */
  private getSafeItemArray(apiResponse: any, tableName: string): any[] {
    try {
      if (!apiResponse || apiResponse.error) return [];

      // If apiResponse directly contains the tableName
      if (apiResponse[tableName]) {
        const table = apiResponse[tableName];
        if (Array.isArray(table) && table.length === 0) return [];
        if (Array.isArray(table) && table.length > 0 && table[0].item) {
          return table[0].item; // standard case: return the item array
        }
        // sometimes the table itself is the item array
        if (Array.isArray(table) && table.length > 0 && table[0] && table[0].VBELN) {
          return table; // already item-like
        }
      }

      // The API may return { data: { ET_...: [...] } } or a wrapped shape
      // Try to find the tableName anywhere inside apiResponse
      if (typeof apiResponse === 'object') {
        for (const key of Object.keys(apiResponse)) {
          const candidate = apiResponse[key];
          if (candidate && typeof candidate === 'object' && candidate[tableName]) {
            const table = candidate[tableName];
            if (Array.isArray(table) && table.length > 0 && table[0].item) return table[0].item;
            if (Array.isArray(table)) return table;
          }
        }
      }

      // If the response itself is already the expected array with items
      if (Array.isArray(apiResponse) && apiResponse.length > 0 && apiResponse[0].item) {
        return apiResponse[0].item;
      }
    } catch (e) {
      // safe fallback
    }
    return [];
  }
}
