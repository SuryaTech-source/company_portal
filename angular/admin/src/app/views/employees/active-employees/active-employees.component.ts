import { Component, OnInit, TemplateRef } from '@angular/core';
import { ApiService } from 'src/app/_services/api.service';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { NotificationService } from 'src/app/_services/notification.service';
import { Router } from '@angular/router';
import html2pdf from 'html2pdf.js';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { DefaultStoreService } from 'src/app/_services/default-store.service';

@Component({
  selector: 'app-active-employees',
  templateUrl: './active-employees.component.html',
  styleUrls: ['./active-employees.component.scss']
})
export class ActiveEmployeesComponent implements OnInit {
  // --- New dynamic tab and data management ---
  allEmployees: any[] = [];
  roles: { key: string, display: string }[] = [
    { key: 'Driver', display: 'Drivers' },
    { key: 'Staff', display: 'Employees' },
    { key: 'Mechanic', display: 'Mechanics' },
    { key: 'Helper', display: 'Helpers' },
    { key: 'Supervisor', display: 'Supervisors' },
    { key: 'Others', display: 'Others' },
    { key: 'Vacation', display: 'Vacations' }
  ];
  activeTab: string = 'Staff'; // Default to 'Employees' (Staff)
  loading = false;
  vacationsLoading = false;
  vacationList: any[] = [];

  // Vacation Modals
  vacationModalRef: BsModalRef;
  viewVacationData: any;
  editVacationData: any = {};
  deleteVacationData: any;
  currency_code = 'KWD';
  currency_symbol = 'KD';

  // Statistics
  stats: { [key: string]: { total: number, active?: number, inactive?: number, deployed?: number, vacation?: number } } = {};

  modalRef: BsModalRef;
  deleteEmployeeData: any;

  constructor(
    private apiService: ApiService,
    private notify: NotificationService,
    private router: Router,
    private modalService: BsModalService,
    private store: DefaultStoreService
  ) { }

  ngOnInit(): void {
    this.store.generalSettings.subscribe((settings) => {
      if (settings) {
        this.currency_code = settings.currency_code;
        this.currency_symbol = settings.currency_symbol;
      }
    });
    this.getAllEmployees();
  }

  // --- Replaces getEmployees() and getDrivers() with a single call ---
  getAllEmployees(): void {
    this.loading = true;
    this.apiService.CommonApi(Apiconfig.listEmployees.method, Apiconfig.listEmployees.url, { status: 1 })
      .subscribe(
        (res: any) => {
          this.loading = false;
          if (res && res.status) {
            this.allEmployees = res.data || [];
            this.calculateStats();
          }
        },
        (error) => {
          this.loading = false;
          console.error('Error fetching employees:', error);
          this.notify.showError("Failed to fetch employees.");
        }
      );
  }

  getVacations(): void {
    this.vacationsLoading = true;
    this.apiService.CommonApi(Apiconfig.listVacations.method, Apiconfig.listVacations.url, {})
      .subscribe((res: any) => {
        this.vacationsLoading = false;
        if (res.status) {
          this.vacationList = res.data;
        }
      }, err => {
        this.vacationsLoading = false;
        console.error(err);
      });
  }

  // --- New method to filter employees for the active tab ---
  getEmployeesForTab(roleKey: string): any[] {
    if (roleKey === 'Staff') {
      return this.allEmployees;
    }
    return this.allEmployees.filter(e => e.role === roleKey || (roleKey === 'Helper' && e.role === 'Maid'));
  }

  calculateStats(): void {
    this.roles.forEach(role => {
      const employeesForRole = this.getEmployeesForTab(role.key);

      const total = employeesForRole.length;
      if (role.key === 'Driver') {
        this.stats[role.key] = {
          total: total,
          // Assuming status can be 'deployed' or 'vacation' for drivers
          deployed: employeesForRole.filter(e => e.status === 'deployed').length,
          vacation: employeesForRole.filter(e => e.status === 'vacation').length,
        };
      } else {
        this.stats[role.key] = {
          total: total,
          active: employeesForRole.filter(e => e.status === 1).length,
          inactive: employeesForRole.filter(e => e.status === 2).length,
        };
      }
    });
  }

  switchTab(tabKey: string): void {
    this.activeTab = tabKey;
    if (tabKey === 'Vacation') {
      this.getVacations();
    }
  }

  // Track by function for performance
  trackByEmployeeId(index: number, employee: any): any {
    return employee._id || index;
  }

  // Status helpers (no change)
  getStatusText(status: number): string {
    switch (status) {
      case 1: return 'Active';
      case 2: return 'Inactive';
      case 0: return 'Deleted';
      default: return 'Unknown';
    }
  }
  getStatusClass(status: number): string {
    switch (status) {
      case 1: return 'badge badge-success';
      case 2: return 'badge badge-warning';
      case 0: return 'badge badge-danger';
      default: return 'badge badge-secondary';
    }
  }

  // PDF download method
  downloadPDF(roleKey: string): void {
    const element = document.getElementById(`${roleKey}Table`);
    if (!element) {
      this.notify.showError("Table not found.");
      return;
    }
    const options = {
      margin: 0.5,
      filename: `${roleKey.toLowerCase()}-list.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().from(element).set(options).save();
  }

  // Navigation methods
  viewEmployee(employee: any): void {
    this.router.navigate(['/app/employees/view', employee._id]);
  }

  editEmployee(employee: any): void {
    this.router.navigate(['/app/employees/edit', employee._id]);
  }

  // --- New navigation method for salary view ---
  viewSalary(employee: any): void {
    const currentYear = new Date().getFullYear();
    this.router.navigate(['/app/employees/salary-view', employee._id], {
      queryParams: { year: currentYear }
    });
  }

  viewHistory(employeeId: string): void {
    this.router.navigate(['/app/employees/history', employeeId]);
  }

  openDeleteModal(template: TemplateRef<any>, employee: any) {
    this.deleteEmployeeData = employee;
    this.modalRef = this.modalService.show(template, { class: 'modal-md' });
  }

  closeModal() {
    this.modalRef.hide();
    this.deleteEmployeeData = null;
  }

  confirmDelete(): void {
    if (this.deleteEmployeeData && this.deleteEmployeeData._id) {
      this.apiService.CommonApi(Apiconfig.deleteEmployee.method, Apiconfig.deleteEmployee.url, { id: this.deleteEmployeeData._id })
        .subscribe(
          (res: any) => {
            if (res && res.status) {
              this.notify.showSuccess(res.message);
              // Optimistically remove from list or refresh
              this.allEmployees = this.allEmployees.filter(e => e._id !== this.deleteEmployeeData._id);
              this.calculateStats();
              this.closeModal();
            } else {
              this.notify.showError(res.message);
            }
          },
          (error) => {
            console.error('Error deleting employee:', error);
            this.notify.showError("Failed to delete employee.");
          }
        );
    }
  }

  // --- Vacation Actions ---

  openViewVacationModal(template: TemplateRef<any>, vac: any) {
    this.viewVacationData = vac;
    this.vacationModalRef = this.modalService.show(template, { class: 'modal-md' });
  }

  openEditVacationModal(template: TemplateRef<any>, vac: any) {
    // Clone to avoid live editing table
    this.editVacationData = { ...vac };
    // Format dates for input if needed (usually handled by date picker binding) 
    // If using <input type="date">, might need YYYY-MM-DD
    this.editVacationData.startDate = new Date(vac.startDate);
    this.editVacationData.endDate = new Date(vac.endDate);

    this.vacationModalRef = this.modalService.show(template, { class: 'modal-md' });
  }

  openDeleteVacationModal(template: TemplateRef<any>, vac: any) {
    this.deleteVacationData = vac;
    this.vacationModalRef = this.modalService.show(template, { class: 'modal-sm' });
  }

  closeVacationModal() {
    if (this.vacationModalRef) this.vacationModalRef.hide();
    this.viewVacationData = null;
    this.editVacationData = {};
    this.deleteVacationData = null;
  }

  saveVacationChanges() {
    if (!this.editVacationData.startDate || !this.editVacationData.endDate) {
      this.notify.showError("Dates are required");
      return;
    }

    // Map _id (MongoID) to employeeId for backend, as backend expects ObjectId
    const payload = {
      ...this.editVacationData,
      employeeId: this.editVacationData._id
    };

    this.apiService.CommonApi(Apiconfig.editVacation.method, Apiconfig.editVacation.url, payload)
      .subscribe((res: any) => {
        if (res.status) {
          this.notify.showSuccess("Vacation updated");
          this.getVacations(); // Refresh list
          this.closeVacationModal();
        } else {
          this.notify.showError(res.message);
        }
      });
  }

  confirmDeleteVacation() {
    if (!this.deleteVacationData) return;

    this.apiService.CommonApi(Apiconfig.deleteVacation.method, Apiconfig.deleteVacation.url, {
      vacationId: this.deleteVacationData.vacationId,
      employeeId: this.deleteVacationData._id // Use ObjectId
    }).subscribe((res: any) => {
      if (res.status) {
        this.notify.showSuccess("Vacation deleted");
        this.getVacations(); // Refresh
        this.closeVacationModal();
      } else {
        this.notify.showError(res.message);
      }
    });
  }
}
