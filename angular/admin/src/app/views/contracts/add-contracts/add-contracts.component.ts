import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/_services/api.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-contracts',
  templateUrl: './add-contracts.component.html',
  styleUrls: ['./add-contracts.component.scss']
})
export class AddContractsComponent implements OnInit {
  @ViewChild('contractForm') contractForm: NgForm;

  id: string | null = null;
  mode: 'add' | 'edit' | 'view' = 'add';

  // Form fields
  clientName = '';
  contractId = '';
  startDate: string;
  endDate: string;
  busesDeployed: number = 0;
  driversDeployed: number = 0;
  contractType: string = "";
  contactOfficer = '';
  // contractType = 'Fixed';
  // invoicingDate: string;
  // lastPayment: string;
  status = 1;

  // Dropdown options
  fleetOptions: any[] = [];
  employeeOptions: any[] = [];

  readonly = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private notify: NotificationService
  ) {
    this.id = this.route.snapshot.paramMap.get('id');
    const path = this.route.snapshot.routeConfig?.path;
    if (path?.includes('edit')) this.mode = 'edit';
    if (path?.includes('view')) {
      this.mode = 'view';
      this.readonly = true;
    }
  }

  ngOnInit(): void {
    this.loadDropdowns();

    if (this.id) {
      this.apiService
        .CommonApi(Apiconfig.viewContract.method, Apiconfig.viewContract.url, { id: this.id })
        .subscribe((res) => {
          if (res && res.status) {
            const data = res.data.doc;
            this.clientName = data.clientName;
            this.contractId = data.contractId;
            this.startDate = data.startDate ? data.startDate.split('T')[0] : '';
            this.endDate = data.endDate ? data.endDate.split('T')[0] : '';
            // ✅ Convert numbers
            this.busesDeployed = data.busesDeployed;
            this.driversDeployed = data.driversDeployed;

            // ✅ Convert array to CSV
            this.contractType = data.contractType?.join(", ") || "";
            this.contactOfficer = data.contactOfficer;
            // this.contractType = data.contractType;
            // this.invoicingDate = data.invoicingDate ? data.invoicingDate.split('T')[0] : '';
            // this.lastPayment = data.lastPayment ? data.lastPayment.split('T')[0] : '';
            this.status = data.status;
          }
        });
    }
  }

  loadDropdowns() {
    // Load fleets
    this.apiService.CommonApi(Apiconfig.listFleets.method, Apiconfig.listFleets.url, { status: 1 })
      .subscribe((res) => {
        if (res && res.status) {
          this.fleetOptions = res.data;
        }
      });

    // Load employees
    this.apiService.CommonApi(Apiconfig.listEmployees.method, Apiconfig.listEmployees.url, { status: 1 })
      .subscribe((res) => {
        if (res && res.status) {
          this.employeeOptions = res.data;
        }
      });
  }

  submitForm(form: NgForm) {
    if (this.readonly) {
      return;
    }

    if (form.valid) {
      const payload: any = {
        clientName: this.clientName,
        contractId: this.contractId,
        startDate: this.startDate,
        endDate: this.endDate,
        busesDeployed: Number(this.busesDeployed),
        driversDeployed: Number(this.driversDeployed),
        contractType: this.contractType.split(',').map(s => s.trim()),
        contactOfficer: this.contactOfficer,
        // contractType: this.contractType,
        // invoicingDate: this.invoicingDate,
        // lastPayment: this.lastPayment,
        status: this.status,
      };

      if (this.id) payload._id = this.id;

      this.apiService.CommonApi(Apiconfig.saveContract.method, Apiconfig.saveContract.url, payload)
        .subscribe((res) => {
          if (res && res.status) {
            this.notify.showSuccess(this.id ? 'Contract updated successfully' : 'Contract created successfully');
            this.router.navigate(['/app/contracts/list']);
          } else {
            this.notify.showError(res.message || 'An error occurred');
          }
        });
    } else {
      this.notify.showError('Please fill all required fields');
    }
  }

  cancel() {
    this.router.navigate(['/app/contracts/list']);
  }
}
