import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import html2pdf from 'html2pdf.js';
import { ApiService } from 'src/app/_services/api.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { Apiconfig } from 'src/app/_helpers/api-config';

interface PerformanceRecord {
  _id?: string;
  employeeId?: string;
  name: string;
  doj: string;
  leaveDays: number;
  sickDays: number;
  analysis: number;
  drivingBehaviour?: any;
  remarks: string;
  role: 'Employee' | 'Driver';
}

@Component({
  selector: 'app-performance-analysis-list',
  templateUrl: './performance-analysis-list.component.html',
  styleUrls: ['./performance-analysis-list.component.scss']
})
export class PerformanceAnalysisListComponent implements OnInit {
  @ViewChild('performanceTable', { static: false }) performanceTable!: ElementRef;

  constructor(
    private apiService: ApiService,
    private notification: NotificationService
  ) {}

  // Filters
  filterMonth: string = '';
  filterAnalysis: string = '';
  filterBehaviour: string = '';
  sortBy: string = '';

  // Data
  records: PerformanceRecord[] = [];
  drivers: any[] = [];

  // Modal
  showBehaviourModal = false;
  selectedDriverId: string = '';
  behaviourForm = {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    speedViolations: 0,
    accidents: 0,
    trafficPenalties: 0,
    incidents: 0,
  };

  ngOnInit() {
    this.loadPerformanceList();
    this.loadDrivers();
  }

  // ✅ Fetch Performance Data from API
  loadPerformanceList() {
    const payload = {
      month: this.filterMonth ? Number(this.filterMonth) : new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      sortBy: this.sortBy.includes('doj') ? 'doj' : 'performance',
      sortOrder: this.sortBy.endsWith('Desc') ? 'desc' : 'asc',
    };

    this.apiService.CommonApi(Apiconfig.performanceList.method, Apiconfig.performanceList.url, payload)
      .subscribe((res: any) => {
        if (res.status) {
          this.records = res.data.map((r: any) => ({
            _id: r.employeeId,
            name: r.employeeName,
            doj: r.doj,
            leaveDays: r.leaveDays,
            sickDays: r.sickDays,
            analysis: Number(r.performancePercent),
            drivingBehaviour: r.drivingBehaviour,
            remarks: r.remarks,
            role: r.role
          }));
        } else {
          this.records = [];
          this.notification.showError('No records found');
        }
      });
  }

  // ✅ Fetch list of drivers for modal dropdown
    loadDrivers() {
      this.apiService.CommonApi(Apiconfig.listEmployees.method, Apiconfig.listEmployees.url, { status: 1, role: 'Driver' })
        .subscribe((res: any) => {
          if (res.status) this.drivers = res.data;
        });
    }

  // ✅ Filtered & Sorted Records
  get filteredRecords() {
    let data = [...this.records];

    // Filter by Month (D.O.J)
    if (this.filterMonth) {
      data = data.filter(d => new Date(d.doj).getMonth() + 1 === +this.filterMonth);
    }

    // Filter by Analysis Range
    if (this.filterAnalysis === '100-90') data = data.filter(d => d.analysis >= 90);
    if (this.filterAnalysis === '90-80') data = data.filter(d => d.analysis >= 80 && d.analysis < 90);
    if (this.filterAnalysis === '<80') data = data.filter(d => d.analysis < 80);

    // Filter by Driving Behaviour
    if (this.filterBehaviour) {
      data = data.filter(d =>
        d.role === 'Driver' &&
        d.drivingBehaviour &&
        Object.keys(d.drivingBehaviour).some(
          key =>
            key.replace(/([A-Z])/g, ' $1').trim().toLowerCase() ===
              this.filterBehaviour.toLowerCase()
        )
      );
    }

    // Sort
    if (this.sortBy === 'dojAsc') data.sort((a, b) => a.doj.localeCompare(b.doj));
    if (this.sortBy === 'dojDesc') data.sort((a, b) => b.doj.localeCompare(a.doj));
    if (this.sortBy === 'analysisAsc') data.sort((a, b) => a.analysis - b.analysis);
    if (this.sortBy === 'analysisDesc') data.sort((a, b) => b.analysis - a.analysis);

    return data;
  }

  // ✅ Download table as PDF
  downloadPDF() {
    const element = this.performanceTable.nativeElement;
    const opt = {
      margin: 0.5,
      filename: `performance-analysis-${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().from(element).set(opt).save();
  }

  // ✅ Open Add Driver Behaviour Modal
  openBehaviourModal() {
    this.showBehaviourModal = true;
    this.behaviourForm = {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      speedViolations: 0,
      accidents: 0,
      trafficPenalties: 0,
      incidents: 0
    };
  }

  // ✅ Close Modal
  closeBehaviourModal() {
    this.showBehaviourModal = false;
    this.selectedDriverId = '';
  }

  // ✅ Submit Driver Behaviour
  submitBehaviour() {
    if (!this.selectedDriverId) {
      this.notification.showError('Please select a driver');
      return;
    }

    const payload = {
      employeeId: this.selectedDriverId,
      ...this.behaviourForm
    };

    this.apiService.CommonApi(Apiconfig.driverBehaviourUpdate.method, Apiconfig.driverBehaviourUpdate.url, payload)
      .subscribe((res: any) => {
        if (res.status) {
          this.notification.showSuccess('Driver behaviour updated');
          this.closeBehaviourModal();
          this.loadPerformanceList();
        } else {
          this.notification.showError(res.message || 'Failed to update behaviour');
        }
      });
  }
}
