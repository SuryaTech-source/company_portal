import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/_services/api.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { Apiconfig } from 'src/app/_helpers/api-config';
import * as html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-assignment',
  templateUrl: './assignment.component.html',
  styleUrls: ['./assignment.component.scss']
})
export class AssignmentComponent implements OnInit {
  fleets: any[] = [];
  drivers: any[] = [];
  contracts: any[] = [];
  totalVehicles = 0;
  deployedVehicles = 0;
  vehiclesOnMaintenance = 0;

  // Pagination
  page = 1;
  limit = 10;
  count = 0;
  search = '';

  // Modal controls
  showAssignModal = false;
  showUnassignModal = false;
  showEditModal = false;

  // Assignment form
  assignForm: any = {
    fleetId: '',
    driverId: '',
    dateAssigned: '',
    odometerReadingStart: '',
    contractId: '',
    remarks: ''
  };

  unassignForm: any = {
    assignmentId: '',
    dateUnassigned: '',
    odometerReadingEnd: '',
    remarks: '',
    odometerReadingStart: 0 // Added for validation
  };

  editForm: any = {
    assignmentId: '',
    dateAssigned: '',
    dateUnassigned: '',
    odometerReadingStart: '',
    odometerReadingEnd: '',
    remarks: ''
  };

  constructor(private apiService: ApiService, private notify: NotificationService) { }

  ngOnInit(): void {
    this.loadFleetAssignments();
    this.loadCounts();
    this.loadEmployees(this.selectedDesignation);
  }

  /** 🔹 Load all assignments */
  loadFleetAssignments() {
    const data = {
      page: this.page,
      limit: this.limit,
      search: this.search
    };

    this.apiService.CommonApi(Apiconfig.listfleetassignments.method, Apiconfig.listfleetassignments.url, data)
      .subscribe((res: any) => {
        if (res?.status) {
          this.fleets = res.data || [];
          this.count = res.count || this.fleets.length;
        } else {
          this.notify.showError(res.message || 'Failed to load assignments');
        }
      });
  }

  loadContracts() {
    this.apiService.CommonApi(Apiconfig.contractListActive.method, Apiconfig.contractListActive.url, {})
      .subscribe((res: any) => {
        if (res.status) this.contracts = res.data.doc;
      });
  }
  /** 🔹 Load top counts */
  loadCounts() {
    this.apiService.CommonApi(Apiconfig.fleetassignmentcount.method, Apiconfig.fleetassignmentcount.url, {})
      .subscribe((res: any) => {
        if (res.status) {
          this.totalVehicles = res.data.totalVehicles;
          this.deployedVehicles = res.data.deployed;
          this.vehiclesOnMaintenance = res.data.maintenance;
        }
      });
  }

  designationOptions = ['Driver', 'Staff', 'Mechanic', 'Helper', 'Supervisor', 'Others'];
  selectedDesignation = 'Driver';

  /** 🔹 Load employees based on designation */
  loadEmployees(role: string) {
    this.drivers = []; // Clear previous list
    this.apiService.CommonApi(Apiconfig.listEmployees.method, Apiconfig.listEmployees.url, { status: 1, role: role })
      .subscribe((res: any) => {
        if (res.status) this.drivers = res.data;
      });
  }

  /** 🔹 Load fleets for dropdown */
  loadFleets() {
    this.apiService.CommonApi(Apiconfig.listFleets.method, Apiconfig.listFleets.url, { status: 1 })
      .subscribe((res: any) => {
        if (res.status) this.fleetOptions = res.data;
      });
  }

  fleetOptions: any[] = [];

  /** 🔹 Open Add Assignment Modal */
  openAssignModal() {
    this.assignForm = {
      fleetId: '',
      driverId: '',
      dateAssigned: new Date().toISOString().substring(0, 10),
      odometerReadingStart: '',
      contractId: '',
      remarks: ''
    };
    this.selectedDesignation = 'Driver';
    this.loadEmployees(this.selectedDesignation);
    this.loadFleets();
    this.loadContracts();
    this.showAssignModal = true;
  }

  /** 🔹 Save Assignment */
  saveAssignment() {
    if (!this.assignForm.fleetId || !this.assignForm.driverId) {
      this.notify.showError('Fleet and Driver are required');
      return;
    }

    this.apiService.CommonApi(Apiconfig.fleetassignments.method, Apiconfig.fleetassignments.url, this.assignForm)
      .subscribe((res: any) => {
        if (res.status) {
          this.notify.showSuccess('Fleet assigned successfully');
          this.showAssignModal = false;
          this.loadFleetAssignments();
          this.loadCounts();
        } else {
          this.notify.showError(res.message || 'Failed to assign fleet');
        }
      });
  }




  /** 🔹 Open Unassign Modal */
  openUnassignModal(assignment: any) {
    this.unassignForm.assignmentId = assignment._id;
    this.unassignForm.dateUnassigned = new Date().toISOString().substring(0, 10);
    this.unassignForm.odometerReadingEnd = '';
    this.unassignForm.remarks = '';
    this.unassignForm.odometerReadingStart = assignment.odometerReadingStart || 0;
    this.showUnassignModal = true;
  }

  /** 🔹 Unassign Fleet */
  unassignFleet() {
    if (!this.unassignForm.assignmentId) return;
    if (this.unassignForm.odometerReadingEnd < this.unassignForm.odometerReadingStart) {
      this.notify.showError('End reading cannot be less than start reading (' + this.unassignForm.odometerReadingStart + ')');
      return;
    }

    this.apiService.CommonApi(Apiconfig.fleetunassignments.method, Apiconfig.fleetunassignments.url, this.unassignForm)
      .subscribe((res: any) => {
        if (res.status) {
          this.notify.showSuccess('Fleet unassigned successfully');
          this.showUnassignModal = false;
          this.loadFleetAssignments();
          this.loadCounts();
        } else {
          this.notify.showError(res.message || 'Error unassigning fleet');
        }
      });
  }

  /** 🔹 Export PDF */
  downloadPDF() {
    const element = document.getElementById('pdfContent');
    const opt = {
      margin: 0.5,
      filename: 'fleet-assignment-report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().from(element).set(opt).save();
  }

  /** 🔹 Open Edit Modal */
  openEditModal(assignment: any) {
    this.editForm = {
      assignmentId: assignment._id,
      dateAssigned: assignment.dateAssigned ? new Date(assignment.dateAssigned).toISOString().substring(0, 10) : '',
      dateUnassigned: assignment.dateUnassigned ? new Date(assignment.dateUnassigned).toISOString().substring(0, 10) : '',
      odometerReadingStart: assignment.odometerReadingStart,
      odometerReadingEnd: assignment.odometerReadingEnd,
      remarks: assignment.remarks
    };
    this.showEditModal = true;
  }

  /** 🔹 Save Edit Assignment */
  saveEditAssignment() {
    if (this.editForm.odometerReadingEnd < this.editForm.odometerReadingStart) {
      this.notify.showError('End reading cannot be less than start reading');
      return;
    }

    this.apiService.CommonApi(Apiconfig.editFleetAssignment.method, Apiconfig.editFleetAssignment.url, this.editForm)
      .subscribe((res: any) => {
        if (res.status) {
          this.notify.showSuccess('Assignment updated successfully');
          this.showEditModal = false;
          this.loadFleetAssignments();
        } else {
          this.notify.showError(res.message || 'Failed to update assignment');
        }
      });
  }
}
