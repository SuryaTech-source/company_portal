import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { ApiService } from 'src/app/_services/api.service';
import { NotificationService } from 'src/app/_services/notification.service';

@Component({
  selector: 'app-spare-parts-new',
  templateUrl: './spare-parts-new.component.html',
  styleUrls: ['./spare-parts-new.component.scss']
})
export class SparePartsNewComponent implements OnInit {
  sparePartForm!: FormGroup;
  loading = false;
  isEdit = false;
  id: string | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.sparePartForm = this.fb.group({
      _id: [null],
      name: ['', Validators.required],
      partNumber: ['', Validators.required],
      description: [''],
      totalQuantity: [0, [Validators.required, Validators.min(0)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      finalPrice: [{ value: 0, disabled: true }],
    });

    // Check if editing
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.isEdit = true;
      this.getSparePartById(this.id);
    }

    this.sparePartForm.get('unitPrice')?.valueChanges.subscribe(() => this.calculateFinalPrice());
this.sparePartForm.get('discount')?.valueChanges.subscribe(() => this.calculateFinalPrice());

  }
calculateFinalPrice() {
  const price = this.sparePartForm.get('unitPrice')?.value || 0;
  const discount = this.sparePartForm.get('discount')?.value || 0;
  const final = price - (price * discount / 100);
  this.sparePartForm.patchValue({ finalPrice: final }, { emitEvent: false });
}

  getSparePartById(id: string) {
    this.loading = true;
    this.apiService.CommonApi(
      Apiconfig.viewSparePart.method,
      Apiconfig.viewSparePart.url,
      { id }
    ).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status && res.data.doc) {
          this.sparePartForm.patchValue(res.data.doc);
        } else {
          this.notificationService.showError(res.message || 'Spare part not found');
          this.router.navigate(['/spare-parts']);
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Error fetching spare part details');
        this.router.navigate(['/spare-parts']);
      }
    });
  }

  saveSparePart() {
    if (this.sparePartForm.invalid) {
      this.sparePartForm.markAllAsTouched();
      return;
    }
    this.loading = true;

    // const payload = this.sparePartForm.value;
      const payload = {
    ...this.sparePartForm.getRawValue(), // ✅ includes final price
  };

    this.apiService.CommonApi(
      Apiconfig.saveSparePart.method,
      Apiconfig.saveSparePart.url,
      payload
    ).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status) {
          this.notificationService.showSuccess('Spare part saved successfully');
          this.router.navigate(['/app/spare-parts/list']);
        } else {
          this.notificationService.showError(res.message || 'Error saving spare part');
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Error saving spare part');
      }
    });
  }
}
