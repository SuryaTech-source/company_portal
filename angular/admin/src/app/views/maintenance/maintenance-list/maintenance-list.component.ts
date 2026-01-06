import { Component, ElementRef, ViewChild, OnInit, TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import html2pdf from 'html2pdf.js';
import { ApiService } from 'src/app/_services/api.service';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { NotificationService } from 'src/app/_services/notification.service';
import { DefaultStoreService } from 'src/app/_services/default-store.service';

@Component({
  selector: 'app-maintenance-list',
  templateUrl: './maintenance-list.component.html',
  styleUrls: ['./maintenance-list.component.scss']
})
export class MaintenanceListComponent implements OnInit {
  @ViewChild('maintenanceTable', { static: false }) maintenanceTable!: ElementRef;

  modalRef: BsModalRef;

  records: any[] = [];
  vehicles: any[] = [];
  drivers: any[] = [];
  spareParts: any[] = [];
  currency_code = 'KWD';
  currency_symbol = 'KD';

  // Filters
  searchVehicle: string = '';
  searchDriver: string = '';
  filterType: string = '';
  filterPart: string = '';
  startDate: string = '';
  endDate: string = '';
  sortBy: string = '';

  // Modal
  showModal = false;
  editData: any = null;
  form: any = { partsUsed: [] };

  deleteData: any = null;

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private modalService: BsModalService,
    private store: DefaultStoreService
  ) { }

  ngOnInit(): void {
    this.store.generalSettings.subscribe((settings) => {
      if (settings) {
        this.currency_code = settings.currency_code;
        this.currency_symbol = settings.currency_symbol;
      }
    });
    this.loadRecords();
    this.loadVehicles();
    this.loadDrivers();
    this.loadSpareParts();
  }

  // ... (existing code) ...

  // 🗑️ Delete Maintenance
  openDeleteModal(template: TemplateRef<any>, row: any) {
    this.deleteData = row;
    this.modalRef = this.modalService.show(template, { class: 'modal-md' });
  }

  closeDeleteModal() {
    this.modalRef.hide();
    this.deleteData = null;
  }

  confirmDelete() {
    if (this.deleteData && this.deleteData._id) {
      this.apiService.CommonApi(Apiconfig.deleteMaintenance.method, Apiconfig.deleteMaintenance.url, { id: this.deleteData._id })
        .subscribe((res: any) => {
          if (res.status) {
            this.notification.showSuccess(res.message);
            this.loadRecords();
            this.closeDeleteModal();
          } else {
            this.notification.showError(res.message);
          }
        });
    }
  }

  // 🚐 Fetch vehicles
  loadVehicles() {
    this.apiService.CommonApi(Apiconfig.listFleets.method, Apiconfig.listFleets.url, { status: 1 })
      .subscribe((res: any) => {
        if (res.status) this.vehicles = res.data;
      });
  }

  // 👨 Fetch drivers
  loadDrivers() {
    this.apiService.CommonApi(Apiconfig.listEmployees.method, Apiconfig.listEmployees.url, { role: 'Driver', status: 1 })
      .subscribe((res: any) => {
        if (res.status) this.drivers = res.data;
      });
  }

  // ⚙️ Fetch spare parts
  loadSpareParts() {
    this.apiService.CommonApi(Apiconfig.listSpareParts.method, Apiconfig.listSpareParts.url, { page: 1, limit: 100 })
      .subscribe((res: any) => {
        if (res.status) this.spareParts = res.data;
      });
  }

  // 🛠️ Fetch maintenance records
  loadRecords() {
    this.apiService.CommonApi(Apiconfig.maintancelist.method, Apiconfig.maintancelist.url, {})
      .subscribe((res: any) => {
        if (res.status) {
          this.records = res.data;
        }
      });
  }

  // Filter + sort
  get filteredRecords() {
    let data = [...this.records];
    if (this.searchVehicle) {
      data = data.filter(d =>
        d.vehicleData?.registrationNo?.toLowerCase().includes(this.searchVehicle.toLowerCase())
      );
    }
    if (this.searchDriver) {
      data = data.filter(d =>
        d.driverData?.fullName?.toLowerCase().includes(this.searchDriver.toLowerCase())
      );
    }
    if (this.filterType) data = data.filter(d => d.maintenanceType === this.filterType);
    if (this.filterPart) data = data.filter(d => d.partsData?.some((p: any) => p.name === this.filterPart));
    if (this.startDate && this.endDate) {
      data = data.filter(d => d.maintenanceDate >= this.startDate && d.maintenanceDate <= this.endDate);
    }
    if (this.sortBy === 'dateAsc') data.sort((a, b) => a.maintenanceDate.localeCompare(b.maintenanceDate));
    if (this.sortBy === 'dateDesc') data.sort((a, b) => b.maintenanceDate.localeCompare(a.maintenanceDate));
    if (this.sortBy === 'vehicle') data.sort((a, b) =>
      (a.vehicleData?.registrationNo || '').localeCompare(b.vehicleData?.registrationNo || '')
    );
    if (this.sortBy === 'driver') data.sort((a, b) =>
      (a.driverData?.fullName || '').localeCompare(b.driverData?.fullName || '')
    );
    if (this.sortBy === 'costAsc') data.sort((a, b) => a.maintenanceCost - b.maintenanceCost);
    if (this.sortBy === 'costDesc') data.sort((a, b) => b.maintenanceCost - a.maintenanceCost);
    return data;
  }

  // 📄 Export PDF
  downloadPDF() {
    const element = this.maintenanceTable.nativeElement;
    const opt = {
      margin: 0.5,
      filename: 'maintenance-records.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().from(element).set(opt).save();
  }

  // 🎛️ Modal
  openModal(row: any = null) {
    console.log(row, 'edit row');

    this.showModal = true;
    this.editData = row;

    if (row) {
      // Pre-fill form for edit
      this.form = {
        _id: row._id,
        vehicle: row.vehicleData?._id || '',
        driver: row.driverData?._id || '',
        maintenanceType: row.maintenanceType || '',
        maintenanceCost: row.maintenanceCost || 0,
        extraCharges: row.extraCharges || 0,
        remarks: row.remarks || '',
        partsUsed: row.partsUsed?.map((p: any) => ({
          part: p.part?._id || p.part, // keep consistency with DB ID
          quantity: p.quantity || 0,
          pricePerUnit: p.pricePerUnit || 0,
          discount: p.discount || 0,
          finalPrice: p.finalPrice || 0,
        })) || []
      };
    } else {
      // Default empty form for add
      this.form = {
        vehicle: '',
        driver: '',
        maintenanceType: '',
        maintenanceCost: 0,
        extraCharges: 0,
        remarks: '',
        partsUsed: []
      };
    }
  }

  closeModal() {
    this.showModal = false;
    this.editData = null;
    this.form = { partsUsed: [] };
  }

  addPart() {
    this.form.partsUsed.push({ part: '', quantity: 1 });
  }

  removePart(index: number) {
    this.form.partsUsed.splice(index, 1);
  }



  // 💾 Save
  saveMaintenance() {
    this.calculateTotal()

    this.apiService.CommonApi(
      Apiconfig.saveMaintenance.method,
      Apiconfig.saveMaintenance.url,
      this.form
    ).subscribe((res: any) => {
      if (res.status) {
        this.closeModal();
        this.notification.showSuccess('Maintenance record saved successfully');
        this.loadRecords();
      } else {
        this.notification.showError(res.message || 'Error saving maintenance record');
      }
    });
  }

  updatePartDetails(index: number) {
    const selectedPartId = this.form.partsUsed[index].part;
    const selectedPart = this.spareParts.find(sp => sp._id === selectedPartId);
    if (selectedPart) {
      this.form.partsUsed[index].pricePerUnit = selectedPart.finalPrice || 0;
      this.form.partsUsed[index].discount = selectedPart.discount || 0;
      this.updatePartTotal(index);
    }
  }

  updatePartTotal(index: number) {
    const p = this.form.partsUsed[index];
    const qty = Number(p.quantity) || 0;
    const price = Number(p.pricePerUnit) || 0;
    const discount = Number(p.discount) || 0;

    const discounted = price - (price * discount / 100);
    p.finalPrice = +(discounted * qty).toFixed(2);

    this.calculateTotal();
  }

  calculateTotal() {
    const partsTotal = this.form.partsUsed.reduce((sum: number, p: any) => sum + (Number(p.finalPrice) || 0), 0);
    const extra = Number(this.form.extraCharges) || 0;
    this.form.maintenanceCost = +(partsTotal + extra).toFixed(2);
  }
}
