import { Component, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/_services/api.service';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { NotificationService } from 'src/app/_services/notification.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-salary-view',
  templateUrl: './salary-view.component.html',
  styleUrls: ['./salary-view.component.scss']
})
export class SalaryViewComponent implements OnInit {
  employeeId: string = '';
  employee: any = null;
  salaries: any[] = [];
  filteredSalaries: any[] = [];

  // Filters
  filterYear: number = new Date().getFullYear();
  filterStatus: string = '';

  // Modal
  modalRef?: BsModalRef;
  editingSalary: any = null;

  loading = false;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private notify: NotificationService,
    private modalService: BsModalService
  ) {
    this.employeeId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params.year) {
        this.filterYear = parseInt(params.year);
      }
      // Re-apply filters if salaries are already loaded
      if (this.salaries.length > 0) {
        this.applyFilters();
      }
    });

    this.getEmployeeDetails();
    this.getSalaries();
  }

  getEmployeeDetails(): void {
    // Assuming you have an API to get a single employee's details
    this.apiService.CommonApi(Apiconfig.viewEmployee.method, Apiconfig.viewEmployee.url, { id: this.employeeId })
      .subscribe((res: any) => {
        if (res.status) this.employee = res.data.doc;
      });
  }

  getSalaries(): void {
    this.loading = true;
    this.apiService.CommonApi(Apiconfig.listSalariesOfEmployee.method, Apiconfig.listSalariesOfEmployee.url, { employeeId: this.employeeId })
      .subscribe((res: any) => {
        this.loading = false;
        if (res.status) {
          this.salaries = res.data.doc;
          this.applyFilters();
        }
      }, () => this.loading = false);
  }

  applyFilters(): void {
    this.filteredSalaries = this.salaries.filter(s => {
      const yearMatch = this.filterYear ? s.year === this.filterYear : true;
      const statusMatch = this.filterStatus ? s.paymentStatus === this.filterStatus : true;
      return yearMatch && statusMatch;
    });
  }

  openEditModal(template: TemplateRef<any>, salary: any): void {
    this.editingSalary = JSON.parse(JSON.stringify(salary)); // Deep copy
    this.modalRef = this.modalService.show(template, { class: 'modal-lg' });
  }

  addPenalty(): void {
    if (!this.editingSalary.penalties) this.editingSalary.penalties = [];
    this.editingSalary.penalties.push({ type: 'Other', description: '', amount: 0, date: new Date() });
  }

  removePenalty(index: number): void {
    this.editingSalary.penalties.splice(index, 1);
  }

  saveSalaryUpdate(): void {
    this.apiService.CommonApi(Apiconfig.salaryEdit.method, Apiconfig.salaryEdit.url, { salaryId: this.editingSalary._id, data: this.editingSalary })
      .subscribe((res: any) => {
        if (res.status) {
          this.notify.showSuccess("Salary updated successfully.");
          this.modalRef?.hide();
          this.getSalaries(); // Refresh list
        } else {
          this.notify.showError(res.message || "Failed to update salary.");
        }
      });
  }

  getMonthName(monthNumber: number): string {
    const d = new Date();
    d.setMonth(monthNumber - 1);
    return d.toLocaleString('default', { month: 'long' });
  }
}
