import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormGroup } from '@angular/forms';
import { ApiService } from 'src/app/_services/api.service';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { NotificationService } from 'src/app/_services/notification.service';

@Component({
   selector: 'app-add-edit-tag',
  templateUrl: './add-edit-tag.component.html',
  styleUrls: ['./add-edit-tag.component.scss'],
})
export class AddEditTagComponent  implements OnInit {
  submitebtn = false;
  viewpage = false;
  userDetails: any = {};
 id: string | null = null;
  contractTypes = ['Yes', 'No'];
  documentTypes = ['PDF', 'DOC'];
  contracts: any[] = [];


  constructor(
    private apiService: ApiService,
    private router: Router,
    private notifyService: NotificationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
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
  onlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  loadContracts() {
  this.apiService.CommonApi(Apiconfig.contractListActive.method, Apiconfig.contractListActive.url, {})
    .subscribe((res: any) => {
      if (res.status) this.contracts = res.data.doc;
    });
}
  onFormSubmit(tagAddEditForm: UntypedFormGroup) {
    console.log(tagAddEditForm.value);

    if (!this.viewpage) {
      if (tagAddEditForm.valid) {
        this.submitebtn = true;
        this.userDetails = tagAddEditForm.value;

        const datas = {
          vendorName: this.userDetails.carrierName,
          noOfDrivers: this.userDetails.noOfDrivers,
          contractId: this.userDetails.contractId,
          contractType: this.userDetails.contractType,
          startDate: this.userDetails.startDate,
          endDate: this.userDetails.endDate,
          noOfBuses: this.userDetails.noOfBuses,
          contactOfficer: this.userDetails.contactOfficer,
          documentType: this.userDetails.documentType,
          documentFile: this.userDetails.documentFile
        };

        this.apiService
          .CommonApi(Apiconfig.saveVendor.method, Apiconfig.saveVendor.url, datas)
          .subscribe((result) => {
            if (result.status !== 0) {
              this.router.navigate(['/app/carrier/list']);
              this.notifyService.showSuccess(result.message);
            } else {
              this.notifyService.showError(result.message);
            }
            this.submitebtn = false;
          });
      } else {
        this.notifyService.showError('Please enter all mandatory fields');
      }
    } else {
      if (tagAddEditForm.valid) {
        this.submitebtn = true;
        this.userDetails = tagAddEditForm.value;

        const datas = {
          id: this.userDetails.id,
          carrierName: this.userDetails.carrierName,
          noOfDrivers: this.userDetails.noOfDrivers,
          contractId: this.userDetails.contractId,
          contractType: this.userDetails.contractType,
          startDate: this.userDetails.startDate,
          endDate: this.userDetails.endDate,
          noOfBuses: this.userDetails.noOfBuses,
          contactOfficer: this.userDetails.contactOfficer,
          documentType: this.userDetails.documentType,
          documentFile: this.userDetails.documentFile
        };

        this.apiService
          .CommonApi(Apiconfig.tagEdit.method, Apiconfig.tagEdit.url, datas)
          .subscribe((result) => {
            if (result) {
              this.router.navigate(['/app/carrier/list']);
              this.notifyService.showSuccess(result.message);
            } else {
              this.notifyService.showError(result.message);
            }
            this.submitebtn = false;
          });
      } else {
        this.notifyService.showError('Please enter all mandatory fields');
      }
    }
  }

getVendor() {
  this.apiService
    .CommonApi(Apiconfig.viewVendor.method, Apiconfig.viewVendor.url, { id: this.id })
    .subscribe((res: any) => {
      if (res && res.status && res.data) {
        const v = res.data;

        // Map backend fields to your form fields
        this.userDetails = {
          id: v._id,
          carrierName: v.vendorName || '',
          noOfDrivers: v.noOfDrivers || '',
          contractId: v.contractDetails?._id || '',
          contractType: v.contractType || '',
          startDate: v.startDate ? v.startDate.split('T')[0] : '',
          endDate: v.endDate ? v.endDate.split('T')[0] : '',
          noOfBuses: v.noOfBuses || '',
          contactOfficer: v.contactOfficer || '',
          documentType: v.documents?.[0]?.type || '',
          documentFile: v.documents?.[0]?.file || ''
        };

        // Log to confirm mapping
        console.log("Mapped userDetails:", this.userDetails);
      } else {
        this.notifyService.showError(res.message || 'An error occurred');
      }
    });
}

}
