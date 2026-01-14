import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { ApiService } from 'src/app/_services/api.service';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { NotificationService } from 'src/app/_services/notification.service';
import { environment } from 'src/environments/environment';
import { AuthenticationService } from 'src/app/_services/authentication.service';

@Component({
  selector: 'app-add-edit-tag',
  templateUrl: './add-edit-tag.component.html',
  styleUrls: ['./add-edit-tag.component.scss'],
})
export class AddEditTagComponent implements OnInit {
  submitebtn = false;
  viewpage = false;
  userDetails: any = {};
  id: string | null = null;
  currentUser: any;

  contractTypes = ['Monthly', 'Yearly'];

  contracts: any[] = [];

  form: any = { noOfBuses: 0 };
  fleets: any[] = [];
  drivers: any[] = [];
  apiUrl = environment.apiUrl

  // hold actual File objects selected in UI


  assignedFleetDrivers: Array<{
    busRegisterNumber: string;
    driverName: string;
    driverContact: string;
    driverCivilId: string;
    driverDocFile: File | null;
    driverDocUrl?: string; // relative URL from API, if any
  }> = [];

  constructor(
    private apiService: ApiService,
    private router: Router,
    private notifyService: NotificationService,
    private route: ActivatedRoute,
    private authService: AuthenticationService
  ) { }

  ngOnInit(): void {
    this.checkPrivileges();
    this.id = this.route.snapshot.paramMap.get('id');
    const path = this.route.snapshot.routeConfig?.path;

    this.loadContracts();
    if (path?.includes('view')) {
      this.viewpage = true;
      this.getVendor();
    }
    if (this.id && !this.viewpage) {
      this.getVendor();
    }
  }

  checkPrivileges() {
    this.currentUser = this.authService.currentUserValue;
    if (this.currentUser && this.currentUser.doc.role === 'subadmin' && this.currentUser.doc.privileges) {
      const privilege = this.currentUser.doc.privileges.find(p => p.alias === 'operations');
      if (privilege && privilege.status) {
        if (!this.id && !privilege.status.add) {
          this.notifyService.showError('You do not have permission to add vendors.');
          // Use /app/tags/list as that seems to be the list route
          this.router.navigate(['/app/tags/list']);
        }
        if (this.id && !privilege.status.edit && !this.viewpage) {
          this.notifyService.showError('You do not have permission to edit vendors.');
          this.router.navigate(['/app/tags/list']);
        }
        if (this.viewpage && !privilege.status.view) {
          this.notifyService.showError('You do not have permission to view vendors.');
          this.router.navigate(['/app/dashboard']);
        }
      }
    }
  }

  generateFleetDriverRows() {
    const count = Number(this.form.noOfBuses) || 0;
    if (count <= 0) {
      this.assignedFleetDrivers = [];
      return;
    }

    // Adjust array length while preserving existing data
    if (this.assignedFleetDrivers.length > count) {
      this.assignedFleetDrivers.length = count;
    } else {
      while (this.assignedFleetDrivers.length < count) {
        this.assignedFleetDrivers.push({
          busRegisterNumber: '',
          driverName: '',
          driverContact: '',
          driverCivilId: '',
          driverDocFile: null,
          driverDocUrl: ''
        });
      }
    }
  }



  uploadDriverDoc(event: Event, i: number) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0] || null;
    this.assignedFleetDrivers[i].driverDocFile = file;
  }



  onlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) event.preventDefault();
  }

  loadContracts() {
    this.apiService
      .CommonApi(Apiconfig.contractListActive.method, Apiconfig.contractListActive.url, {})
      .subscribe((res: any) => {
        if (res.status) this.contracts = res.data.doc;
      });
  }

  // Basic field validations (template-driven adds required too)
  private validateFormModel(f: NgForm): string | null {
    const u = this.userDetails;
    console.log(f, "vendor form   msdf");

    if (!f.valid) return 'Please enter all mandatory fields.';
    if (!u.carrierName?.trim()) return 'Carrier Name is required.';
    if (!u.contractId) return 'Contract is required.';
    if (!u.contractType) return 'Contract Type is required.';
    if (!u.startDate) return 'Start Date is required.';
    if (!u.endDate) return 'End Date is required.';
    const s = new Date(u.startDate);
    const e = new Date(u.endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'Invalid dates.';
    if (e <= s) return 'End Date must be greater than Start Date.';
    // per-row validations
    for (let i = 0; i < this.assignedFleetDrivers.length; i++) {
      const row = this.assignedFleetDrivers[i];
      if (!row.busRegisterNumber) return `Row ${i + 1}: Bus Number is required.`;
      if (!row.driverName) return `Row ${i + 1}: Driver Name is required.`;
      if (!row.driverContact) return `Row ${i + 1}: Driver Contact is required.`;
    }

    return null;
  }

  onFormSubmit(form: NgForm) {
    const validationError = this.validateFormModel(form);
    if (validationError) {
      this.notifyService.showError(validationError);
      return;
    }

    this.submitebtn = true;

    const fd = new FormData();

    fd.append('vendorName', this.userDetails.carrierName);
    fd.append('contractId', this.userDetails.contractId);
    fd.append('contractType', this.userDetails.contractType);
    fd.append('startDate', this.userDetails.startDate);
    fd.append('endDate', this.userDetails.endDate);

    const driversMeta = this.assignedFleetDrivers.map(d => ({
      busRegisterNumber: d.busRegisterNumber,
      driverName: d.driverName,
      driverContact: d.driverContact,
      driverCivilId: d.driverCivilId,
      driverDocUrl: d.driverDocUrl // Preserve existing URL if no new file
    }));

    fd.append('drivers', JSON.stringify(driversMeta));
    fd.append('noOfBuses', String(driversMeta.length));
    fd.append('noOfDrivers', String(driversMeta.length));



    // append driver files with continuous indexes based on meta order
    this.assignedFleetDrivers.forEach((d, idx) => {
      if (d.driverDocFile) {
        fd.append(`drivers[${idx}][file]`, d.driverDocFile, d.driverDocFile.name);
      }
    });

    if (this.id) fd.append('id', this.id);

    this.apiService
      .CommonApi(Apiconfig.saveVendor.method, Apiconfig.saveVendor.url, fd)
      .subscribe({
        next: (res: any) => {
          if (!res.status) {
            // Show duplicate/validation error from backend
            this.notifyService.showError(res.message || 'Failed to save');
            this.submitebtn = false; // Re-enable button so user can fix and retry
          } else {
            this.notifyService.showSuccess(res?.message || 'Saved successfully');
            this.router.navigate(['/app/tags/list']);
            // Button stays disabled during redirect
          }
        },
        error: (err) => {
          console.error("Save error:", err);
          this.notifyService.showError('Failed to save. Please try again.');
          this.submitebtn = false;
        },
      });
  }

  getVendor() {
    this.apiService
      .CommonApi(Apiconfig.viewVendor.method, Apiconfig.viewVendor.url, { id: this.id })
      .subscribe((res: any) => {
        if (!res.status) return;

        const v = res.data;

        this.userDetails = {
          carrierName: v.vendorName,
          contractId: v.contractDetails?._id,
          contractType: v.contractType,
          startDate: v.startDate?.split('T')[0],
          endDate: v.endDate?.split('T')[0],

        };

        this.form.noOfBuses = v.drivers?.length || 0; // Length is based on drivers array now

        // Map manual drivers
        this.assignedFleetDrivers = (v.drivers || []).map((d: any) => ({
          busRegisterNumber: d.busRegisterNumber || '',
          driverName: d.driverName || '',
          driverContact: d.driverContact || '',
          driverCivilId: d.driverCivilId || '',
          driverDocFile: null,
          driverDocUrl: d.driverDocUrl || ''
        }));

        // setTimeout(() => {
        //   this.assignedFleetDrivers.forEach((_, i) => this.onDriverSelect(i));
        // }, 0);
      });
  }



  getFullFileUrl(fileUrl: string): string {
    if (!fileUrl) return '';

    // Remove leading './' if present
    let cleanPath = fileUrl.replace(/^\.\//, '');

    // Remove leading '/' if present to avoid double slashes
    cleanPath = cleanPath.replace(/^\//, '');

    // Ensure apiUrl doesn't end with '/' and add single '/'
    const baseUrl = this.apiUrl.replace(/\/$/, '');

    return `${baseUrl}/${cleanPath}`;
  }

  previewDriverDoc(index: number) {
    const url = this.assignedFleetDrivers[index]?.driverDocUrl;

    if (!url) {
      this.notifyService.showError('No driver document available');
      return;
    }
    const fullUrl = this.getFullFileUrl(url);
    window.open(fullUrl, '_blank');
  }


  previewDriverDocLocal(index: number) {
    const file = this.assignedFleetDrivers[index]?.driverDocFile;
    if (!file) {
      this.notifyService.showError('No driver document selected');
      return;
    }
    const objUrl = URL.createObjectURL(file);
    window.open(objUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(objUrl), 60000);
  }


}
