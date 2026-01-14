import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, NgForm } from '@angular/forms';
import { NotificationService } from 'src/app/_services/notification.service';
import { Apiconfig } from "src/app/_helpers/api-config";
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/_services/api.service';
import { AuthenticationService } from 'src/app/_services/authentication.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { environment } from 'src/environments/environment';
import { ImageCropperComponent, ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
@Component({
  selector: 'app-add-edit-testimonial',
  templateUrl: './add-edit-testimonial.component.html',
  styleUrls: ['./add-edit-testimonial.component.scss']
})
export class AddEditTestimonialComponent implements OnInit {
  @ViewChild('testimonialForm') testimonialForm!: NgForm;

  id: string | null = null;
  submitted = false;
  documentTypeOptions: string[] = ['RC', 'Insurance', 'Pollution', 'Other'];
  documentType = '';
  documentFile: File | null = null;
  apiUrl = environment.apiUrl

  preview: string = '';
  getFleet: any = null;
  currentUser: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private notifyService: NotificationService,
    private apiService: ApiService,
    private authService: AuthenticationService
  ) { }

  ngOnInit(): void {
    this.checkPrivileges();
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.getFleetDetails();
    }
  }

  checkPrivileges() {
    this.currentUser = this.authService.currentUserValue;
    if (this.currentUser && this.currentUser.doc.role === 'subadmin' && this.currentUser.doc.privileges) {
      const privilege = this.currentUser.doc.privileges.find(p => p.alias === 'resources');
      if (privilege && privilege.status) {
        // If ID exists, it's edit mode
        if (this.route.snapshot.paramMap.get('id')) {
          if (!privilege.status.edit) {
            this.notifyService.showError('You do not have permission to edit fleet.');
            this.router.navigate(['/app/fleet/list']);
          }
        } else {
          // Add mode
          if (!privilege.status.add) {
            this.notifyService.showError('You do not have permission to add fleet.');
            this.router.navigate(['/app/fleet/list']);
          }
        }
      }
    }
  }

  // 🔹 Fetch existing Fleet data for editing
  getFleetDetails(): void {
    this.apiService
      .CommonApi(Apiconfig.viewFleets.method, Apiconfig.viewFleets.url, { id: this.id })
      .subscribe((res) => {
        if (res && res.status && res.data?.doc) {
          this.getFleet = res.data.doc;

          const doc = (this.getFleet.documents && this.getFleet.documents.length > 0) ? this.getFleet.documents[0] : null;

          if (doc) {
            this.documentType = doc.documentType;
          }

          setTimeout(() => {
            if (this.testimonialForm) {
              this.testimonialForm.form.patchValue({
                vehicleName: this.getFleet.vehicleName || '',
                cubicCapacity: this.getFleet.cubicCapacity || '',
                registrationNo: this.getFleet.registrationNo || '',
                colour: this.getFleet.colour || '',
                insuranceNo: this.getFleet.insuranceNo || '',
                seatingCapacity: this.getFleet.seatingCapacity || '',
                monthYrOf: this.formatMonth(this.getFleet.manufactureDate),
                nextPassingDue: this.formatDate(this.getFleet.passingExpiry),
                makersName: this.getFleet.makerName || '',
                documentType: doc ? doc.documentType : ''
              });
            }
          });
        } else {
          this.notifyService.showError('Failed to fetch fleet details.');
        }
      });
  }

  // Helpers for input types
  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  private formatMonth(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().slice(0, 7);
  }

  // 🔹 File upload
  onDocumentSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.documentFile = file;
    }
  }
  // Preview document in new tab
  previewDocument(fileUrl: string) {
    if (fileUrl) {
      const fullUrl = this.getFullFileUrl(fileUrl);
      console.log('Opening file at:', fullUrl);
      window.open(fullUrl, '_blank');
    }
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


  // Download document
  downloadDocument(fileUrl: string): void {
    const fullUrl = `${environment.apiUrl}${fileUrl}`;
    const fileName = fileUrl.split('/').pop() || 'document.pdf';

    const a = document.createElement('a');
    a.href = fullUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Submit / Update
  submitForm(form: NgForm): void {
    this.submitted = true;

    if (form.valid) {
      const formData = new FormData();
      if (this.id) formData.append('_id', this.id);

      formData.append('vehicleName', form.value.vehicleName);
      formData.append('cubicCapacity', form.value.cubicCapacity);
      formData.append('registrationNo', form.value.registrationNo);
      formData.append('colour', form.value.colour);
      formData.append('insuranceNo', form.value.insuranceNo);
      formData.append('seatingCapacity', form.value.seatingCapacity);
      formData.append('manufactureDate', form.value.monthYrOf);
      formData.append('passingExpiry', form.value.nextPassingDue);
      formData.append('makerName', form.value.makersName);

      formData.append('documentType', this.documentType || '');
      if (this.documentFile) formData.append('document', this.documentFile);

      this.apiService.CommonApi(Apiconfig.addFleets.method, Apiconfig.addFleets.url, formData)
        .subscribe((res) => {
          if (res && res.status) {
            this.notifyService.showSuccess(this.id ? 'Updated successfully' : 'Created successfully');
            this.router.navigate(['/app/fleet/list']);
          } else {
            this.notifyService.showError(res.message || 'An error occurred.');
          }
        });
    } else {
      this.notifyService.showError('Please fill all required fields correctly.');
    }
  }


  cancel(): void {
    this.router.navigate(['/app/fleet/list']);
  }
}