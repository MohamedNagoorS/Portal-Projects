import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../shared/data-table/data-table.component';
import { SapApiService } from '../../services/sap-api.service'; // Ensure correct path

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.css']
})
export class InvoiceListComponent {
  @Input() invoices: any[] = [];

  constructor(private sapApi: SapApiService) {}

  // This triggers when the user clicks the download button in the table
  onDownloadClick(row: any) {
    const invoiceId = row.invoiceNumber; // Maps to VBELN
    if (!invoiceId) {
      alert('Invalid Invoice Number');
      return;
    }

    console.log('Requesting PDF for Invoice:', invoiceId);

    this.sapApi.getInvoicePdf(invoiceId).subscribe({
      next: (response) => {
        // Adjust 'E_PDF' based on exactly what your Node.js returns
        // Usually response.data.base64 or response.data.EV_PDF_BASE64
        const base64Data = response.data?.base64 || response.data?.EV_PDF_BASE64; 
        
        if (base64Data) {
           this.downloadBase64Pdf(base64Data, `Invoice_${invoiceId}.pdf`);
        } else {
           alert("PDF data not found in response");
        }
      },
      error: (err) => {
        console.error('Download failed', err);
        alert("Error downloading PDF. Please check the console.");
      }
    });
  }

  // Helper to convert Base64 string to a downloadable file
  private downloadBase64Pdf(base64Data: string, filename: string) {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error processing PDF data', e);
      alert('Failed to process PDF file.');
    }
  }
}