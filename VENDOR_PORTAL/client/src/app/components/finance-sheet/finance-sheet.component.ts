import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SapApiService } from '../../services/sap-api.service';
import { InvoiceListComponent } from '../invoice-list/invoice-list.component';
import { AgingComponent } from '../aging/aging.component';
import { CreditdebitListComponent } from '../creditdebit-list/creditdebit-list.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-finance-sheet',
  standalone: true,
  imports: [CommonModule, InvoiceListComponent, AgingComponent, CreditdebitListComponent],
  templateUrl: './finance-sheet.component.html',
  styleUrls: ['./finance-sheet.component.css']
})
export class FinanceSheetComponent implements OnInit {
  isLoading: boolean = true;
  invoices: any[] = [];
  aging: any[] = [];
  memos: any[] = [];
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private sapApi: SapApiService
  ) { }

  ngOnInit(): void {
    this.loadFinancialData();
  }

  loadFinancialData(): void {
    const vendorId = this.authService.getVendorId();
    if (!vendorId) {
      this.errorMessage = 'Vendor ID not found';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      invoices: this.sapApi.getInvoices(vendorId),
      aging: this.sapApi.getPayments(vendorId), // Was getAging
      memos: this.sapApi.getMemos(vendorId)
    }).subscribe({
      next: (responses) => {
        const rawInvoices = responses.invoices?.data;
        const rawAging = responses.aging?.data;
        const rawMemos = responses.memos?.data;

        // Assuming table names might be different for Vendor.
        // I will use generic table name guessing or the ones from Customer if they reused them.
        // Vendor Invoice -> ET_INVOICE?
        // Vendor Payment -> ET_PAYMENT?
        // Vendor Memo -> ET_MEMO?

        this.invoices = this.getSafeItemArray(rawInvoices, 'ET_INVOICE').map((rec: any) => this.mapInvoice(this.flattenRecord(rec)));
        this.aging = this.getSafeItemArray(rawAging, 'ET_PAYAGE').map((rec: any) => this.mapAging(this.flattenRecord(rec)));
        if (this.aging.length === 0) this.aging = this.getSafeItemArray(rawAging, 'ET_PAYMENT_AGING').map((rec: any) => this.mapAging(this.flattenRecord(rec)));

        this.memos = this.getSafeItemArray(rawMemos, 'ET_MEMO').map((rec: any) => this.mapMemo(this.flattenRecord(rec)));

        console.log('--- Flattened & Mapped Invoices ---', this.invoices);
        console.log('--- Flattened & Mapped Aging ---', this.aging);
        console.log('--- Flattened & Mapped Memos ---', this.memos);

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading financial data:', err);
        this.errorMessage = 'Failed to load one or more financial components.';
        this.isLoading = false;
      }
    });
  }

  // generic flatten: take first element of SAP arrays, parse numbers
  private flattenRecord(rec: any): any {
    if (!rec || typeof rec !== 'object') return rec;

    const out: any = {};
    for (const key of Object.keys(rec)) {
      const val = rec[key];

      if (Array.isArray(val)) {
        if (val.length === 0 || (val.length === 1 && (val[0] === '' || val[0] === null))) {
          out[key] = null;
          continue;
        }
        const first = val[0];
        if (typeof first === 'string') {
          const cleaned = first.replace(/,/g, '').trim();
          const num = Number(cleaned);
          out[key] = !Number.isNaN(num) && cleaned !== '' ? num : first;
        } else {
          out[key] = first;
        }
      } else if (typeof val === 'object' && val !== null) {
        out[key] = this.flattenRecord(val);
      } else {
        out[key] = val;
      }
    }
    return out;
  }

  // Mappers: convert SAP uppercase names to friendly lowerCamel keys your templates likely expect
  private mapInvoice(rec: any): any {
    return {
      invoiceNumber: rec.BELNR ?? rec.VBELN ?? null, // BELNR is common for FI invoices
      invoiceDate: rec.BLDAT ?? rec.FKDAT ?? rec.BUDAT ?? null,
      amount: rec.WRBTR ?? rec.NETWR ?? null,
      currency: rec.WAERS ?? rec.WAERK ?? null,
      status: rec.STATUS ?? null,
      __raw: rec
    };
  }

  private mapAging(rec: any): any {
    return {
      invoiceNumber: rec.BELNR ?? rec.VBELN ?? null,
      invoiceDate: rec.BLDAT ?? rec.FKDAT ?? rec.BUDAT ?? null,
      amount: rec.WRBTR ?? rec.NETWR ?? null,
      currency: rec.WAERS ?? rec.WAERK ?? null,
      agingDays: rec.AGING ?? null,
      dueDate: rec.FAEDT ?? rec.DATS ?? rec.DUE_DATE ?? null,
      __raw: rec
    };
  }

  private mapMemo(rec: any): any {
    return {
      memoNumber: rec.BELNR ?? rec.VBELN ?? null,
      memoDate: rec.H_BLDAT ?? rec.H_BUDAT ?? rec.BLDAT ?? rec.FKDAT ?? null,
      amount: rec.DMBTR ?? rec.WRBTR ?? rec.NETWR ?? null,
      type: rec.H_BLART ?? rec.MEMO_TYPE ?? rec.FKART ?? null,
      currency: rec.H_WAERS ?? rec.WAERS ?? rec.WAERK ?? null,
      __raw: rec
    };
  }

  // same safe helper as before
  private getSafeItemArray(apiResponse: any, tableName: string): any[] {
    try {
      if (!apiResponse || apiResponse.error) return [];

      if (apiResponse[tableName]) {
        const table = apiResponse[tableName];
        if (Array.isArray(table) && table.length === 0) return [];
        if (Array.isArray(table) && table.length > 0 && table[0].item && Array.isArray(table[0].item)) {
          return table[0].item;
        }
        if (Array.isArray(table) && table.length > 0 && table[0] && typeof table[0] === 'object' && !table[0].item) {
          return table as any[];
        }
      }

      if (typeof apiResponse === 'object') {
        for (const k of Object.keys(apiResponse)) {
          const candidate = apiResponse[k];
          if (candidate && typeof candidate === 'object' && candidate[tableName]) {
            const t = candidate[tableName];
            if (Array.isArray(t) && t.length > 0 && t[0].item) return t[0].item;
            if (Array.isArray(t)) return t;
          }
        }
      }

      if (Array.isArray(apiResponse) && apiResponse.length > 0 && apiResponse[0].item) {
        return apiResponse[0].item;
      }
    } catch (e) { /* ignore */ }
    return [];
  }
}
