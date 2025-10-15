import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/app/_services/api.service';
import { Apiconfig } from 'src/app/_helpers/api-config';
import html2pdf from 'html2pdf.js';
import { NotificationService } from 'src/app/_services/notification.service';

@Component({
  selector: 'app-reportlist',
  templateUrl: './reportlist.component.html',
  styleUrls: ['./reportlist.component.scss']
})
export class ReportlistComponent implements OnInit {
  activeTab: string = 'attendance';

  // Filters
  searchText: string = '';
  filterStatus: string = '';
  startDate: string = '';
  endDate: string = '';
  sortBy: string = '';

  // Data arrays
  attendanceData: any[] = [];
  customerPayments: any[] = [];
  vendorPayments: any[] = [];

  // Modal
  showModal = false;
  form: any = {};
  editData: any = null;
  // inside class ReportlistComponent
selectedDate: string = new Date().toISOString().split('T')[0]; // default today
selectedEmployees: string[] = []; // for bulk


  @ViewChild('tableContent', { static: false }) tableContent!: ElementRef;

  constructor(private apiService: ApiService, private notification:NotificationService) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  // 🔹 Load records dynamically depending on tab
  loadRecords() {
    if (this.activeTab === 'attendance') {
      this.apiService.CommonApi(Apiconfig.listAttendance.method, Apiconfig.listAttendance.url, {})
        .subscribe((res: any) => {
          if (res.status) this.attendanceData = res.data;
        });
    } else if (this.activeTab === 'customers') {
      this.apiService.CommonApi(Apiconfig.listCustomerPayments.method, Apiconfig.listCustomerPayments.url, {})
        .subscribe((res: any) => {
          if (res.status) this.customerPayments = res.data;
        });
    } else {
      this.apiService.CommonApi(Apiconfig.listVendorPayments.method, Apiconfig.listVendorPayments.url, {})
        .subscribe((res: any) => {
          if (res.status) this.vendorPayments = res.data;
        });
    }
  }

  // 🔹 Dynamic Filters & Sort
  get filterOptions() {
    if (this.activeTab === 'attendance') {
      return { label: 'Employee', placeholder: 'Employee Name' };
    }
    if (this.activeTab === 'customers') {
      return { label: 'Client', placeholder: 'Client Name' };
    }
    return { label: 'Vendor', placeholder: 'Vendor Name' };
  }

  get sortOptions() {
    if (this.activeTab === 'attendance') {
      return [
        { value: 'dateAsc', label: 'Date ↑' },
        { value: 'dateDesc', label: 'Date ↓' },
        { value: 'idAsc', label: 'Employee ID' }
      ];
    }
    return [
      { value: 'dateAsc', label: 'Date ↑' },
      { value: 'dateDesc', label: 'Date ↓' },
      { value: 'amountAsc', label: 'Amount ↑' },
      { value: 'amountDesc', label: 'Amount ↓' },
      { value: 'nameAsc', label: this.activeTab === 'customers' ? 'Customer Name' : 'Vendor Name' }
    ];
  }

  // 🔹 Attendance Filters
  get filteredAttendance() {
    let data = [...this.attendanceData];
    if (this.searchText) {
      data = data.filter(d => d.employeeName?.toLowerCase().includes(this.searchText.toLowerCase()));
    }
    if (this.filterStatus) data = data.filter(d => d.status === this.filterStatus);
    if (this.startDate && this.endDate) {
      data = data.filter(d => d.date >= this.startDate && d.date <= this.endDate);
    }
    if (this.sortBy === 'dateAsc') data.sort((a, b) => a.date.localeCompare(b.date));
    if (this.sortBy === 'dateDesc') data.sort((a, b) => b.date.localeCompare(a.date));
    if (this.sortBy === 'idAsc') data.sort((a, b) => a.idNo.localeCompare(b.idNo));
    return data;
  }

  // 🔹 Customer Filters
  get filteredCustomers() {
    let data = [...this.customerPayments];
    if (this.searchText) data = data.filter(d => d.name?.toLowerCase().includes(this.searchText.toLowerCase()));
    if (this.filterStatus) data = data.filter(d => d.status === this.filterStatus);
    if (this.startDate && this.endDate) {
      data = data.filter(d => d.dueDate >= this.startDate && d.dueDate <= this.endDate);
    }
    if (this.sortBy === 'dateAsc') data.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    if (this.sortBy === 'dateDesc') data.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
    if (this.sortBy === 'amountAsc') data.sort((a, b) => a.amountPaid - b.amountPaid);
    if (this.sortBy === 'amountDesc') data.sort((a, b) => b.amountPaid - a.amountPaid);
    if (this.sortBy === 'nameAsc') data.sort((a, b) => a.name.localeCompare(b.name));
    return data;
  }

  // 🔹 Vendor Filters
  get filteredVendors() {
    let data = [...this.vendorPayments];
    if (this.searchText) data = data.filter(d => d.name?.toLowerCase().includes(this.searchText.toLowerCase()));
    if (this.filterStatus) data = data.filter(d => d.status === this.filterStatus);
    if (this.startDate && this.endDate) {
      data = data.filter(d => d.dueDate >= this.startDate && d.dueDate <= this.endDate);
    }
    if (this.sortBy === 'dateAsc') data.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    if (this.sortBy === 'dateDesc') data.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
    if (this.sortBy === 'amountAsc') data.sort((a, b) => a.amountPaid - b.amountPaid);
    if (this.sortBy === 'amountDesc') data.sort((a, b) => b.amountPaid - a.amountPaid);
    if (this.sortBy === 'nameAsc') data.sort((a, b) => a.name.localeCompare(b.name));
    return data;
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.searchText = '';
    this.filterStatus = '';
    this.startDate = '';
    this.endDate = '';
    this.sortBy = '';
    this.loadRecords();
  }

  // 🔹 Modal
  openModal(row: any = null) {
    this.showModal = true;
    this.editData = row;

    if (this.activeTab === 'attendance') {
      this.form = row ? { ...row } : { employee: '', date: '', status: 'P', remarks: '' };
    } else if (this.activeTab === 'customers') {
      this.form = row ? { ...row } : { client: '', contractId: '', invoiceNo: '', dueDate: '', amountPaid: 0, status: 'Unpaid', balance: 0, remarks: '' };
    } else {
      this.form = row ? { ...row } : { vendor: '', contractId: '', invoiceNo: '', dueDate: '', amountPaid: 0, status: 'Unpaid', balance: 0, remarks: '' };
    }
  }

  closeModal() {
    this.showModal = false;
    this.form = {};
    this.editData = null;
  }

  saveRecord() {
    let apiUrl = '', apiMethod = '';
    if (this.activeTab === 'attendance') {
      apiUrl = Apiconfig.saveAttendance.url;
      apiMethod = Apiconfig.saveAttendance.method;
    } else if (this.activeTab === 'customers') {
      apiUrl = Apiconfig.saveCustomerPayment.url;
      apiMethod = Apiconfig.saveCustomerPayment.method;
    } else {
      apiUrl = Apiconfig.saveVendorPayment.url;
      apiMethod = Apiconfig.saveVendorPayment.method;
    }

    this.apiService.CommonApi(apiMethod, apiUrl, this.form).subscribe((res: any) => {
      if (res.status) {
        this.notification.showSuccess('Record saved successfully');
        this.closeModal();
        this.loadRecords();
      } else {
        this.notification.showError(res.message || 'Error saving record');
      }
    });
  }

  // 🔹 Export PDF
  downloadPDF() {
    const element = this.tableContent.nativeElement;
    const opt = {
      margin: 0.5,
      filename: `${this.activeTab}-report.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().from(element).set(opt).save();
  }

  // load attendance for date
loadAttendanceByDate() {
  this.apiService.CommonApi(
    Apiconfig.listAttendance.method,
    Apiconfig.listAttendance.url,
    { date: this.selectedDate }
  ).subscribe((res: any) => {
    if (res.status) {
      this.attendanceData = res.data.map((e: any) => ({
        employeeId: e.employeeData?._id,
        employeeName: e.employeeData?.fullName,
        idNo: e.employeeData?.employeeId,
        status: e.status || 'A',
        remarks: e.remarks || '',
      }));
    }
  });
}

// mark/update single attendance
updateAttendance(row: any) {

  const payload = {
    employee: row._id,
    date: this.selectedDate,
    status: row.status,
    remarks: row.remarks,
  };

  this.apiService.CommonApi(
    Apiconfig.saveAttendance.method,
    Apiconfig.saveAttendance.url,
    payload
  ).subscribe((res: any) => {
    if (res.status) {
      this.notification.showSuccess(`Attendance updated for ${row.employeeName}`);
    } else {
      this.notification.showError(res.message || 'Error updating attendance');
    }
  });
}

// toggle single employee in selection
toggleEmployee(empId: string, event: any) {
  if (event.target.checked) {
    this.selectedEmployees.push(empId);
  } else {
    this.selectedEmployees = this.selectedEmployees.filter((id) => id !== empId);
  }
}

// check/uncheck all
toggleSelectAll(event: any) {
  if (event.target.checked) {
    this.selectedEmployees = this.attendanceData.map((e) => e.employeeId);
  } else {
    this.selectedEmployees = [];
  }
}
isAllSelected() {
  return (
    this.attendanceData.length > 0 &&
    this.selectedEmployees.length === this.attendanceData.length
  );
}


markAllPresentToday() {
  this.apiService.CommonApi(
    Apiconfig.markallAttendance.method,
    Apiconfig.markallAttendance.url,
    {}
  ).subscribe((res: any) => {
    if (res.status) {
      this.notification.showSuccess('All employees marked present for today');
      this.loadRecords(); // refresh attendance list
    } else {
      this.notification.showError(res.message || 'Error marking attendance');
    }
  });
}

// bulk mark attendance
bulkMarkAttendance(status: 'P' | 'A' | 'L') {
  const payload = {
    employeeIds: this.selectedEmployees,
    date: this.selectedDate,
    status,
  };

  this.apiService.CommonApi(
    Apiconfig.bulkMarkAttendance.method,
    Apiconfig.bulkMarkAttendance.url,
    payload
  ).subscribe((res: any) => {
    if (res.status) {
      this.notification.showSuccess('Bulk attendance updated');
      this.loadAttendanceByDate();
      this.selectedEmployees = [];
    } else {
      this.notification.showError(res.message || 'Error marking attendance');
    }
  });
}
}
