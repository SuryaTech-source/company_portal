import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/app/_services/api.service';
import { Apiconfig } from 'src/app/_helpers/api-config';
import html2pdf from 'html2pdf.js';
import { NotificationService } from 'src/app/_services/notification.service';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/_services/authentication.service';
import { DefaultStoreService } from 'src/app/_services/default-store.service';

@Component({
  selector: 'app-invoice-list',
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss']
})
export class InvoiceListComponent implements OnInit {
  invoices: any[] = [];
  page: number = 1;
  limit: number = 10;
  count: number = 0;
  totalPages: number = 0;
  currency_code = 'KWD';
  currency_symbol = 'KD';
  permissions = {
    add: true,
    edit: true,
    view: true,
    delete: true
  };
  currentUser: any;

  // Filters
  searchText: string = '';
  filterStatus: string = '';
  startDate: string = '';
  endDate: string = '';

  @ViewChild('tableContent', { static: false }) tableContent!: ElementRef;

  constructor(
    private api: ApiService,
    private notify: NotificationService,
    private router: Router,
    private store: DefaultStoreService,
    private authService: AuthenticationService
  ) { }

  ngOnInit(): void {
    this.store.generalSettings.subscribe((settings) => {
      if (settings) {
        this.currency_code = settings.currency_code;
        this.currency_symbol = settings.currency_symbol;
      }
    });
    this.checkPrivileges();
    this.loadInvoices();
  }

  checkPrivileges() {
    this.currentUser = this.authService.currentUserValue;
    if (this.currentUser && this.currentUser.doc.role === 'subadmin' && this.currentUser.doc.privileges) {
      const privilege = this.currentUser.doc.privileges.find(p => p.alias === 'finance');
      if (privilege && privilege.status) {
        this.permissions = {
          add: !!privilege.status.add,
          edit: !!privilege.status.edit,
          view: !!privilege.status.view,
          delete: !!privilege.status.delete
        };

        if (!this.permissions.view) {
          this.notify.showError('You do not have permission to view this module.');
          this.router.navigate(['/app/dashboard']);
        }
      }
    }
  }

  loadInvoices() {
    const payload = {
      page: this.page,
      limit: this.limit,
      search: this.searchText,
      status: this.filterStatus,
      startDate: this.startDate,
      endDate: this.endDate,
      sortBy: 'date',
      sortOrder: 'desc'
    };

    this.api.CommonApi(Apiconfig.listInvoices.method, Apiconfig.listInvoices.url, payload)
      .subscribe((res: any) => {
        if (res.status) {
          this.invoices = res.data;
          this.count = res.count;
          this.totalPages = Math.ceil(this.count / this.limit);
        } else {
          this.notify.showError(res.message || "Failed to load invoices");
        }
      });
  }

  changePage(newPage: number) {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.page = newPage;
    this.loadInvoices();
  }

  // ✅ Navigate to edit route
  viewInvoice(id: string) {
    if (!this.permissions.edit) {
      this.notify.showError('You do not have permission to edit.');
      return;
    }
    this.router.navigate(['/app/invoice/edit', id]);
  }

  // ✅ Inline status update
  updateInvoiceStatus(invoice: any) {
    const payload = { _id: invoice._id, status: invoice.status };

    this.api.CommonApi(Apiconfig.updateInvoiceStatus.method, Apiconfig.updateInvoiceStatus.url, payload)
      .subscribe((res: any) => {
        if (res.status) {
          this.notify.showSuccess("Invoice status updated");
        } else {
          this.notify.showError("Failed to update status");
        }
      });
  }

  deleteInvoice(id: string) {
    if (!this.permissions.delete) {
      this.notify.showError('You do not have permission to delete.');
      return;
    }
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    this.api.CommonApi(Apiconfig.deleteInvoice.method, `${Apiconfig.deleteInvoice.url}/${id}`, {})
      .subscribe((res: any) => {
        if (res.status) {
          this.notify.showSuccess("Invoice deleted");
          this.loadInvoices();
        } else {
          this.notify.showError("Failed to delete invoice");
        }
      });
  }

  downloadTablePDF() {
    // Check if there are any invoices to export
    if (!this.invoices || this.invoices.length === 0) {
      this.notify.showWarning("No invoice data available to export");
      return;
    }

    const element = this.tableContent.nativeElement;
    const opt = {
      margin: 0.5,
      filename: `invoice-list-${new Date().toLocaleDateString()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    // Show loading notification
    this.notify.showInfo("Generating PDF export...");

    html2pdf().from(element).set(opt).save().then(() => {
      this.notify.showSuccess("Invoice list exported successfully");
    }).catch((error) => {
      console.error('Export error:', error);
      this.notify.showError("Failed to export invoice list");
    });
  }


  downloadInvoicePDF(invoice: any) {
    // Validate invoice data
    if (!invoice) {
      this.notify.showError("Invalid invoice data");
      return;
    }

    // Check if invoice has required data
    if (!invoice.clientName && !invoice.invoiceNo) {
      this.notify.showWarning("Invoice contains insufficient data to generate PDF");
      return;
    }

    // Check if invoice has items
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    if (items.length === 0) {
      this.notify.showWarning("Invoice has no items to display in PDF");
      return;
    }

    // Safe helpers
    const safeDate = (d: any) => {
      if (!d) return '-';
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString();
    };

    const fmtCurrency = (v: number) => {
      if (typeof v !== 'number') v = Number(v) || 0;
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: this.currency_code }).format(v);
    };

    console.log(invoice);

    // Compute totals if not present
    let computedTotal = 0;
    const rowsHtml = items.map((it: any, idx: number) => {
      const q = Number(it.quantity) || 0;
      const up = Number(it.unitPrice) || 0;
      const total = Number(it.total) || q * up;
      computedTotal += total;
      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td>${(it.description || '').replace(/\n/g, '<br>')}</td>
          <td class="text-right">${q}</td>
          <td class="text-right">${fmtCurrency(up)}</td>
          <td class="text-right">${fmtCurrency(total)}</td>
        </tr>
      `;
    }).join('');

    const totalAmount = invoice.totalAmount ? Number(invoice.totalAmount) : computedTotal;

    // Sanitize filename
    const safeInvoiceNo = (invoice.invoiceNo || 'invoice').toString().replace(/[^a-z0-9-_]/gi, '_');

    // Build printable HTML with embedded CSS (black & white professional)
    const html = `
    <div class="print-invoice">
      <style>
        /* Reset-ish */
        .print-invoice { font-family: Arial, Helvetica, sans-serif; color: #000; }
        .inv-wrapper { max-width: 900px; margin: 0 auto; padding: 18px; border: 1px solid #000; }
        .inv-header { display:flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .company {
          font-weight: 700;
          font-size: 20px;
          letter-spacing: 0.5px;
        }
        .company small { display:block; font-weight: 400; font-size: 11px; margin-top:6px; color:#222; }
        .meta { text-align: right; font-size: 13px; }
        .meta .label { font-weight:700; display:block; }
        hr { border: none; border-top: 1px solid #000; margin: 12px 0; }
        .to-block, .meta-block { display:flex; gap:12px; }
        .to { flex: 1; }
        .meta-table { width: 280px; text-align: left; }
        .items { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .items th, .items td { border: 1px solid #000; padding: 8px; font-size: 13px; }
        .items th { background: #fff; font-weight:700; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals { margin-top: 12px; display:flex; justify-content:flex-end; }
        .totals table { border-collapse: collapse; width: 340px; }
        .totals td { padding: 6px 8px; font-size: 13px; border: 1px solid #000; }
        .totals .label { font-weight:700; background:#f5f5f5; }
        .payment { margin-top: 14px; font-size: 13px; }
        .small { font-size: 12px; color:#333; }
        .footer { margin-top: 20px; font-size: 12px; text-align:center; color:#444; border-top:1px solid #000; padding-top:8px; }
        /* Print-friendly */
        @media print {
          .inv-wrapper { box-shadow:none; margin:0; border:none; }
        }
      </style>

      <div class="inv-wrapper">
        <div class="inv-header">
          <div>
            <div class="company">YOUR COMPANY NAME</div>
            <small class="small">
              Address line 1<br/>
              Address line 2 · City · Pincode<br/>
              Phone: +91 99999 99999 · Email: info@company.com
            </small>
          </div>

          <div class="meta">
            <div style="font-size:18px; font-weight:700; margin-bottom:6px;">INVOICE</div>
            <div class="meta-table">
              <div><span class="label">Invoice #</span> ${invoice.invoiceNo || '-'}</div>
              <div><span class="label">Generated</span> ${safeDate(invoice.date)}</div>
              <div><span class="label">Due Date</span> ${safeDate(invoice.dueDate)}</div>
              <div><span class="label">Status</span> ${invoice.status || 'Pending'}</div>
            </div>
          </div>
        </div>

        <hr/>

        <div style="display:flex; justify-content:space-between; gap:12px;">
          <div class="to">
            <div style="font-weight:700; margin-bottom:6px;">Bill To</div>
            <div>${invoice.clientName || '-'}</div>
            ${invoice.contract ? `<div class="small">Contract: ${invoice.contract}</div>` : ''}
          </div>

          <div style="width:260px;">
            <div style="font-weight:700; margin-bottom:6px;">Payment Details</div>
            <div class="small">Bank: ${invoice.paymentDetails?.bankName || '-'}</div>
            <div class="small">A/C: ${invoice.paymentDetails?.accountNo || '-'}</div>
          </div>
        </div>

        <table class="items" style="margin-top:16px;">
          <thead>
            <tr>
              <th style="width:48px;" class="text-center">#</th>
              <th>Description</th>
              <th style="width:120px;" class="text-right">Qty</th>
              <th style="width:150px;" class="text-right">Unit Price</th>
              <th style="width:150px;" class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td class="label">Subtotal</td>
              <td class="text-right">${fmtCurrency(computedTotal)}</td>
            </tr>
            <tr>
              <td class="label">Total</td>
              <td class="text-right">${fmtCurrency(totalAmount)}</td>
            </tr>
          </table>
        </div>

        ${invoice.remarks ? `<div style="margin-top:12px;"><strong>Remarks:</strong><div class="small">${(invoice.remarks || '').replace(/\n/g, '<br>')}</div></div>` : ''}

        <div class="footer">
          This is a system generated invoice. If you have any queries, contact accounts@company.com
        </div>
      </div>
    </div>
    `;

    // Create container element
    const container = document.createElement('div');
    container.innerHTML = html;

    // Create filename
    const filename = `invoice-${safeInvoiceNo || Date.now()}.pdf`;

    // html2pdf options
    const opt = {
      margin: 12 / 72,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // Show loading notification
    this.notify.showInfo("Generating invoice PDF...");

    // Generate pdf
    // @ts-ignore
    html2pdf().from(container).set(opt).save().then(() => {
      this.notify.showSuccess(`Invoice ${invoice.invoiceNo} downloaded successfully`);
    }).catch((error) => {
      console.error('PDF generation error:', error);
      this.notify.showError("Failed to generate invoice PDF");
    });
  }

}
