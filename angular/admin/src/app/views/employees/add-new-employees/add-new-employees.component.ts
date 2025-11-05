import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/_services/api.service';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { NotificationService } from 'src/app/_services/notification.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-new-employees',
  templateUrl: './add-new-employees.component.html',
  styleUrls: ['./add-new-employees.component.scss']
})
export class AddNewEmployeesComponent implements OnInit {
  mode: 'add' | 'edit' | 'view' = 'add';
  id: string | null = null;
  readonly: boolean = false;
uploadedDocument: boolean = false;
employeeDocuments: any[] = [];
   apiUrl = environment.apiUrl
  // Employee fields
  fullName: string = '';
  nationality: string = '';
  bloodGroup: string = '';
  dob: string = '';
  permanentAddress: string = '';
  designation: string = '';
  employeeId: string = '';
  employmentType: string = 'Full-Time';
  dateOfJoining: string = '';
  underContract: string = '';
  salary: number = 0;
  bankName: string = '';
  accountNo: string = '';
  ifsc: string = '';
  nomineeName: string = '';
  nomineeRelation: string = '';
  nomineeContact: string = '';
  visaExpiry: string = '';
  licenseNo: string = '';
  role: string = 'Staff';
  status: number = 1;
  contactNumber: string = '';

  // Employee document fields
  documentType: string = '';
  documentFile: File | null = null;

  // Dropdown options
  contractOptions: any[] = [];
  bloodGroups: string[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Others'];
  relations: string[] = ['Father', 'Mother', 'Brother', 'Sister', 'Husband', 'Wife', 'Others'];
  documentTypes: string[] = ['Aadhar Card', 'PAN Card', 'Ration Card', 'License'];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private notifyService: NotificationService
  ) {}

   ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.id = params['id'];
        this.mode = this.router.url.includes('view') ? 'view' : 'edit';
        this.readonly = this.mode === 'view';
        this.getEmployee();
      } else {
        // Initialize with one empty document for add mode
        this.addDocument();
      }
    });
    this.loadContracts();
  }

  // Load contract options from API
  loadContracts() {
    this.apiService.CommonApi(
      Apiconfig.listContracts.method,
      Apiconfig.listContracts.url,
      { status: 1 }
    ).subscribe((res: any) => {
      this.contractOptions = res.data || [];
    });
  }

  // Allow only numbers
  allowOnlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;

    // allow: backspace, tab, delete, arrow keys
    if (charCode === 8 || charCode === 9 || charCode === 46 || (charCode >= 37 && charCode <= 40)) {
      return;
    }

    // block non-numeric keys
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  // File selection handler
//  onFileSelected(event: any) {
//   const file = event.target.files[0];
//   if (file) {
//     this.documentFile = file;
//     this.uploadedDocument = true;
//   } else {
//     this.uploadedDocument = false;
//   }
// }

  // Get employee by ID
  getEmployee() {
    this.apiService.CommonApi(
      Apiconfig.viewEmployee.method,
      Apiconfig.viewEmployee.url,
      { id: this.id }
    ).subscribe((res: any) => {
      if (res.status) {
        const emp = res.data.doc;
        console.log(emp,"empempempempemp");
        
        this.fullName = emp.fullName || '';
        this.nationality = emp.nationality || '';
        this.bloodGroup = emp.bloodGroup || '';
        this.dob = emp.dob ? emp.dob.split('T')[0] : '';
        this.permanentAddress = emp.permanentAddress || '';
        this.designation = emp.designation || '';
        this.employeeId = emp.employeeId || '';
        this.employmentType = emp.employmentType || 'Full-Time';
        this.dateOfJoining = emp.dateOfJoining ? emp.dateOfJoining.split('T')[0] : '';
        this.underContract = emp.underContract || '';
        this.salary = emp.salary || 0;
        this.bankName = emp.bankDetails?.bankName || '';
        this.accountNo = emp.bankDetails?.accountNo || '';
        this.ifsc = emp.bankDetails?.ifsc || '';
        this.nomineeName = emp.nominee?.name || '';
        this.nomineeRelation = emp.nominee?.relation || '';
        this.nomineeContact = emp.nominee?.contact || '';
        this.visaExpiry = emp.visaExpiry ? emp.visaExpiry.split('T')[0] : '';
        this.licenseNo = emp.licenseNo || '';
        this.role = emp.role || 'Staff';
        this.status = emp.status ?? 1;
        this.contactNumber = emp.contactNumber || '';
        // this.documentType = emp.documentType || '';
        this.employeeDocuments = emp.documents
           this.initializeDocuments(emp.documents);
        // documentFile cannot be preloaded (only preview URL from backend if available)
      }
    });
  }

    // Initialize documents based on mode
  initializeDocuments(existingDocuments?: any[]) {
    if (existingDocuments && existingDocuments.length > 0) {
      // Edit/View mode: populate with existing documents
      this.employeeDocuments = existingDocuments.map(doc => ({
        type: doc.documentType || '',
        fileUrl: doc.fileUrl || '',
        file: null,
        _id: doc._id || null,
        isExisting: true
      }));
    } else {
      // Add mode: start with one empty document
      this.employeeDocuments = [{ type: '', file: null, fileUrl: '', isExisting: false }];
    }
  }

  addDocument() {
    this.employeeDocuments.push({ 
      type: '', 
      file: null, 
      fileUrl: '', 
      isExisting: false 
    });
  }
 // Remove document row
  removeDocument(index: number) {
    if (this.employeeDocuments.length > 1) {
      this.employeeDocuments.splice(index, 1);
    }
  }

  // Handle file selection
  onFileSelected(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      this.employeeDocuments[index].file = file;
      // If replacing an existing file, mark it as updated
      if (this.employeeDocuments[index].isExisting) {
        this.employeeDocuments[index].isUpdated = true;
      }
    }
  }
// Get filename from URL
getFileName(fileUrl: string): string {
  if (!fileUrl) return '';
  // Handle both relative and absolute URLs
  const fileName = fileUrl.split('/').pop() || 'Unknown file';
  return fileName;
}

// Preview document in new tab
previewDocument(fileUrl: string) {
  if (fileUrl) {
    const fullUrl = this.getFullFileUrl(fileUrl);
    console.log('Opening file at:', fullUrl);
    window.open(fullUrl, '_blank');
  }
}

// Get full file URL with proper slash handling
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

  // Save employee
  // submitForm(form: any) {
  //   if (form.invalid) {
  //     this.notifyService.showError('Please fill all required fields');
  //     return;
  //   }

  //   const payload: any = {
  //     _id: this.id,
  //     fullName: this.fullName,
  //     nationality: this.nationality,
  //     bloodGroup: this.bloodGroup,
  //     dob: this.dob,
  //     permanentAddress: this.permanentAddress,
  //     designation: this.designation,
  //     employeeId: this.employeeId,
  //     employmentType: this.employmentType,
  //     dateOfJoining: this.dateOfJoining,
  //     underContract: this.underContract,
  //     salary: this.salary,
  //     bankDetails: {
  //       bankName: this.bankName,
  //       accountNo: this.accountNo,
  //       ifsc: this.ifsc
  //     },
  //     nominee: {
  //       name: this.nomineeName,
  //       relation: this.nomineeRelation,
  //       contact: this.nomineeContact
  //     },
  //     visaExpiry: this.visaExpiry,
  //     licenseNo: this.licenseNo,
  //     role: this.role,
  //     status: this.status,
  //     documentType: this.documentType
  //   };

  //   const formData = new FormData();
  //   Object.keys(payload).forEach(key => {
  //     if (typeof payload[key] === 'object') {
  //       formData.append(key, JSON.stringify(payload[key]));
  //     } else {
  //       formData.append(key, payload[key]);
  //     }
  //   });

  //   if (this.documentFile) {
  //     formData.append('documentFile', this.documentFile);
  //   }

  //   this.apiService.CommonApi(
  //     Apiconfig.saveEmployee.method,
  //     Apiconfig.saveEmployee.url,
  //     formData
  //   ).subscribe((res: any) => {
  //     if (res.status) {
  //       this.notifyService.showSuccess(
  //         this.id ? 'Employee updated successfully' : 'Employee added successfully'
  //       );
  //       this.router.navigate(['/app/employees/active-list']);
  //     } else {
  //       this.notifyService.showError('Failed to save employee');
  //     }
  //   });
  // }



   submitForm(form: any) {
    if (form.invalid) {
      this.notifyService.showError('Please fill all required fields');
      return;
    }

    // Validate that each document has both type and file
    const invalidDocuments = this.employeeDocuments.filter(doc => 
      !doc.type || (!doc.file && !doc.fileUrl)
    );

    if (invalidDocuments.length > 0) {
      this.notifyService.showError('Please select document type and file for all documents');
      return;
    }

    // Prepare employee payload
    const payload: any = {
      _id: this.id,
      fullName: this.fullName,
      nationality: this.nationality,
      bloodGroup: this.bloodGroup,
      dob: this.dob,
      permanentAddress: this.permanentAddress,
      designation: this.designation,
      contactNumber: this.contactNumber,
      employeeId: this.employeeId,
      employmentType: this.employmentType,
      dateOfJoining: this.dateOfJoining,
      underContract: this.underContract,
      salary: this.salary,
      bankDetails: {
        bankName: this.bankName,
        accountNo: this.accountNo,
        ifsc: this.ifsc
      },
      nominee: {
        name: this.nomineeName,
        relation: this.nomineeRelation,
        contact: this.nomineeContact
      },
      visaExpiry: this.visaExpiry,
      licenseNo: this.licenseNo,
      role: this.role,
      status: this.status
    };

    // Use FormData for uploading files
    const formData = new FormData();

    // Append payload values
    Object.keys(payload).forEach(key => {
      if (typeof payload[key] === 'object') {
        formData.append(key, JSON.stringify(payload[key]));
      } else {
        formData.append(key, payload[key]);
      }
    });

    // Append documents - only new files and document types
    this.employeeDocuments.forEach((doc: any, index: number) => {
      formData.append(`documents[${index}][type]`, doc.type);
      
      if (doc.file) {
        // New file selected
        formData.append(`documents[${index}][file]`, doc.file, doc.file.name);
      } else if (doc.fileUrl && doc.isExisting) {
        // Existing file - send the URL to maintain reference
        formData.append(`documents[${index}][existingFileUrl]`, doc.fileUrl);
        if (doc._id) {
          formData.append(`documents[${index}][documentId]`, doc._id);
        }
      }
    });

    console.log('Submitting form data...');
    
    this.apiService.CommonApi(
      Apiconfig.saveEmployee.method,
      Apiconfig.saveEmployee.url,
      formData
    ).subscribe((res: any) => {
      if (res.status) {
        this.notifyService.showSuccess(
          this.id ? 'Employee updated successfully' : 'Employee added successfully'
        );
        this.router.navigate(['/app/employees/active-list']);
      } else {
        this.notifyService.showError('Failed to save employee');
      }
    });
  }


  // Cancel button
  cancel() {
    this.router.navigate(['/app/employees/list']);
  }
}
