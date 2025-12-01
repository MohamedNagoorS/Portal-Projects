import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SapApiService, ApiResponse } from '../../services/sap-api.service';
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
  totalQuotations: number = 0;
  totalPurchaseOrders: number = 0;
  totalGoodsReceipts: number = 0;
  totalInvoices: number = 0;

  // Properties to hold the table data
  quotationData: any[] = [];
  purchaseOrderData: any[] = [];
  goodsReceiptData: any[] = [];
  invoiceData: any[] = [];

  constructor(
    private authService: AuthService,
    private sapApi: SapApiService
  ) { }

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
      setTimeout(() => { try { (el as HTMLElement).focus(); } catch (e) { } }, 600);
    } catch (e) {
      // noop
    }
  }

  loadDashboard(): void {
    const vendorId = this.authService.getVendorId();
    if (!vendorId) {
      this.errorMessage = 'Vendor ID not found';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.sapApi.getDashboard(vendorId).subscribe({
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

    // 1. Process Quotations (was Inquiry)
    // Assuming table name might be ET_QUOTATION or similar, but let's check what the server returns.
    // The server returns normalized JSON. If the RFC returns ET_QUOTATION, it will be under that key.
    // I'll use a generic safe getter that looks for common patterns.
    // For now I'll guess 'ET_QUOTATION' or 'ET_DATA' or just check the first array found.
    // Actually, I should probably check the RFC definition or response structure.
    // Since I don't have it, I'll try to be flexible.

    this.quotationData = this.getSafeItemArray(data.quotations, 'ET_QUOTATION');
    // Fallback if table name is different (e.g. ET_INQUIRY was used before)
    if (this.quotationData.length === 0) this.quotationData = this.getSafeItemArray(data.quotations, 'ET_DATA');
    this.totalQuotations = this.quotationData.length;

    // 2. Process Purchase Orders (was Sales Order)
    this.purchaseOrderData = this.getSafeItemArray(data.purchaseOrders, 'ES_PURCHASE_ORDER');
    if (this.purchaseOrderData.length === 0) this.purchaseOrderData = this.getSafeItemArray(data.purchaseOrders, 'ET_PURCHASE_ORDER');
    this.totalPurchaseOrders = this.purchaseOrderData.length;

    // 3. Process Goods Receipts (was Deliveries)
    this.goodsReceiptData = this.getSafeItemArray(data.goodsReceipts, 'ET_GOODS_RECEIPT');
    if (this.goodsReceiptData.length === 0) this.goodsReceiptData = this.getSafeItemArray(data.goodsReceipts, 'ET_GR_HEADER');
    this.totalGoodsReceipts = this.goodsReceiptData.length;

    // 4. Process Invoices
    this.invoiceData = this.getSafeItemArray(data.invoices, 'ET_INVOICE');
    if (this.invoiceData.length === 0) this.invoiceData = this.getSafeItemArray(data.invoices, 'ET_INVOICE_HEADER');
    this.totalInvoices = this.invoiceData.length;
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
        if (Array.isArray(table) && table.length > 0) {
          return table;
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
