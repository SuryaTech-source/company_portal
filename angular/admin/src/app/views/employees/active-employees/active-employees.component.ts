import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/_services/api.service';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { NotificationService } from 'src/app/_services/notification.service';
import { Router } from '@angular/router';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-active-employees',
  templateUrl: './active-employees.component.html',
  styleUrls: ['./active-employees.component.scss']
})
export class ActiveEmployeesComponent implements OnInit {
  // Tab management
  activeTab: string = 'employees';

  // Employee data
  employees: any[] = [];
  loading = false;

  // Employee statistics
  totalEmployees: number = 0;
  activeEmployees: number = 0;
  inactiveEmployees: number = 0;
  totalActive: number = 0;
  totalInactive: number = 0;
  totalDeleted: number = 0;

  // Driver data (if needed)
  driverList: any[] = [];
  totalDrivers: number = 0;
  deployedDrivers: number = 0;
  driversOnVacation: number = 0;

  constructor(
    private apiService: ApiService,
    private notify: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getEmployees();
    if (this.activeTab === 'drivers') {
      this.getDrivers();
    }
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'drivers' && this.driverList.length === 0) {
      this.getDrivers();
    } else if (tab === 'employees' && this.employees.length === 0) {
      this.getEmployees();
    }
  }

  getEmployees(): void {
    this.loading = true;
    this.apiService.CommonApi(Apiconfig.listEmployees.method, Apiconfig.listEmployees.url, { status: 1 })
      .subscribe(
        (res: any) => {
          this.loading = false;
          if (res && res.status) {
            this.employees = res.data || [];
            
            // Calculate statistics
            this.totalEmployees = this.employees.length;
            this.activeEmployees = res.counts?.active || this.employees.filter(e => e.status === 1).length;
            this.inactiveEmployees = res.counts?.inactive || this.employees.filter(e => e.status === 2).length;
            this.totalActive = this.activeEmployees;
            this.totalInactive = this.inactiveEmployees;
            this.totalDeleted = res.counts?.deleted || this.employees.filter(e => e.status === 0).length;
          }
        },
        (error) => {
          this.loading = false;
          console.error('Error fetching employees:', error);
          this.notify.showError("Failed to fetch employees.");
        }
      );
  }

  getDrivers(): void {
    this.loading = true;
    // Assuming similar API structure for drivers
    this.apiService.CommonApi(Apiconfig.listEmployees.method, Apiconfig.listEmployees.url, { status: 1 })
      .subscribe(
        (res: any) => {
          this.loading = false;
          if (res && res.status) {
            this.driverList = res.data || [];
            this.totalDrivers = this.driverList.length;
            this.deployedDrivers = this.driverList.filter(d => d.status === 'deployed').length;
            this.driversOnVacation = this.driverList.filter(d => d.status === 'vacation').length;
          }
        },
        (error) => {
          this.loading = false;
          console.error('Error fetching drivers:', error);
          this.notify.showError("Failed to fetch drivers.");
        }
      );
  }

  // Track by functions for performance optimization
  trackByEmployeeId(index: number, employee: any): any {
    return employee._id || employee.id || index;
  }

  trackByDriverId(index: number, driver: any): any {
    return driver._id || driver.id || index;
  }

  // Status helper methods
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

  // PDF download methods
  downloadEmployeesPDF(): void {
    const element = document.getElementById('employeeTable');
    if (!element) {
      this.notify.showError("Table not found for PDF generation.");
      return;
    }

    const options = {
      margin: 0.5,
      filename: 'employees-list.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().from(element).set(options).save();
  }

  downloadDriversPDF(): void {
    const element = document.getElementById('driverTable');
    if (!element) {
      this.notify.showError("Table not found for PDF generation.");
      return;
    }

    const options = {
      margin: 0.5,
      filename: 'drivers-list.pdf',
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

  viewDriver(driver: any): void {
    this.router.navigate(['/app/employees/view', driver._id]);
  }

  editDriver(driver: any): void {
    this.router.navigate(['/app/employees/edit', driver._id]);
  }
}
