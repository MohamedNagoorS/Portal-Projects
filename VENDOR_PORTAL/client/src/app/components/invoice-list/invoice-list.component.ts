import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SapApiService } from '../../services/sap-api.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-invoice-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './invoice-list.component.html',
    styleUrls: ['./invoice-list.component.css']
})
export class InvoiceListComponent {
    @Input() invoices: any[] = [];

    constructor(private sapApi: SapApiService, private auth: AuthService) { }

    onDownloadClick(row: any) {
        const invoiceId = row?.invoiceNumber || row?.INVOICE_NUMBER || row?.VBELN;
        const vendorId = row?.vendorId || row?.VENDOR_ID;
        if (!invoiceId) {
            alert('Invalid invoice identifier');
            return;
        }

        // If vendorId not provided, caller must provide or use a different mechanism (auth)
        // Try calling with vendorId if available, otherwise call with placeholder
        const vId = vendorId || this.auth.getVendorId() || '';

        this.sapApi.getInvoicePdf(vId, invoiceId).subscribe({
            next: (resp) => {
                const base64 = resp?.data?.base64 || resp?.data?.EV_PDF_BASE64 || resp?.data?.EV_PDF || resp?.data?.E_PDF;
                if (base64) {
                    this.downloadBase64Pdf(base64, `Invoice_${invoiceId}.pdf`);
                } else {
                    alert('PDF data not found in response');
                }
            },
            error: (err) => {
                console.error('Error downloading invoice PDF', err);
                alert('Failed to download invoice PDF');
            }
        });
    }

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