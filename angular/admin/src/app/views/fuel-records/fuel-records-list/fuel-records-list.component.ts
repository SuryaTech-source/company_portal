import { Component, ElementRef, ViewChild, TemplateRef } from '@angular/core';
import html2pdf from 'html2pdf.js';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { ApiService } from 'src/app/_services/api.service';

interface FuelRecord {
  _id?: string;
  vehicleId?: string;
  driverId?: string;
  contractId?: string;
  vehicleNo: string;
  driverName: string;
  startOdometer: number;
  endOdometer: number;
  prevDate: string;
  amountPaid: number;
  issuedBy: string;
  fuelConsumed: number;
}

@Component({
  selector: 'app-fuel-records-list',
  templateUrl: './fuel-records-list.component.html',
  styleUrls: ['./fuel-records-list.component.scss']
})
export class FuelRecordsListComponent {
  @ViewChild('fuelTable', { static: false }) fuelTable!: ElementRef;
  @ViewChild('fuelForm', { static: false }) fuelForm!: TemplateRef<any>;
  modalRef?: BsModalRef;

  // Filters
  searchVehicle = '';
  searchDriver = '';
  searchContract = '';
  startDate = '';
  endDate = '';
  sortBy = '';

  // Data
  records: FuelRecord[] = [];
  vehicles: any[] = [];
  drivers: any[] = [];
  contracts: any[] = [];

  // New or editing record
  newFuel: FuelRecord = this.getEmptyFuel();
  editingFuelId: string | null = null;

  constructor(private modalService: BsModalService, private apiService: ApiService) {}

  ngOnInit() {
    this.loadFuelRecords();
    this.loadVehicles();
    this.loadDrivers();
    this.getActiveContracts();
  }

  getActiveContracts() {
    this.apiService.CommonApi(Apiconfig.contractListActive.method, Apiconfig.contractListActive.url, {})
      .subscribe((res: any) => {
        if (res.status && res.data) {
          this.contracts = res.data.doc || [];
        }
      });
  }

  loadFuelRecords() {
    this.apiService.CommonApi(Apiconfig.listFuels.method, Apiconfig.listFuels.url, { status: 1 })
      .subscribe((res: any) => {
        if (res.status) {
          this.records = res.data.map((item: any) => ({
            _id: item._id,
            vehicleId: item.vehicleData?._id || '',
            vehicleNo: item.vehicleData?.registrationNo || '',
            driverId: item.driverData?._id || '',
            driverName: item.driverData?.fullName || '',
            contractId: item.contractData?._id || '',
            startOdometer: item.startOdometer || 0,
            endOdometer: item.endOdometer || 0,
            prevDate: item.lastRechargeDate || '',
            amountPaid: item.amountPaid || 0,
            issuedBy: item.issuedBy || '',
            fuelConsumed: item.fuelConsumed || 0
          }));
        }
      });
  }

  loadVehicles() {
    this.apiService.CommonApi(Apiconfig.listFleets.method, Apiconfig.listFleets.url, {})
      .subscribe((res: any) => {
        if (res.status) this.vehicles = res.data;
      });
  }

  loadDrivers() {
    this.apiService.CommonApi(Apiconfig.listEmployees.method, Apiconfig.listEmployees.url, { status: 1, role: 'Driver' })
      .subscribe((res: any) => {
        if (res.status) this.drivers = res.data;
      });
  }

  openModal(template: TemplateRef<any>) {
    this.newFuel = this.getEmptyFuel();
    this.editingFuelId = null;
    this.modalRef = this.modalService.show(template, { class: 'modal-lg' });
  }

  editFuel(record: FuelRecord) {
    this.editingFuelId = record._id || null;
    this.newFuel = { ...record };
    this.modalRef = this.modalService.show(this.fuelForm, { class: 'modal-lg' });
  }

  saveFuel() {
    // 🔸 Basic front-end validation
    if (!this.newFuel.vehicleId || !this.newFuel.driverId || !this.newFuel.contractId) {
      alert('Please select Vehicle, Driver, and Contract.');
      return;
    }
    if (this.newFuel.startOdometer <= 0 || this.newFuel.endOdometer <= 0) {
      alert('Please enter valid odometer readings.');
      return;
    }
    if (this.newFuel.amountPaid < 0 || this.newFuel.fuelConsumed <= 0) {
      alert('Please enter valid Amount Paid and Fuel Consumed.');
      return;
    }

    const payload = {
      ...this.newFuel,
      _id: this.editingFuelId || undefined
    };

    this.apiService.CommonApi(Apiconfig.saveFuel.method, Apiconfig.saveFuel.url, payload)
      .subscribe((res: any) => {
        if (res.status) {
          this.modalRef?.hide();
          this.loadFuelRecords();
          this.editingFuelId = null;
        }
      });
  }

  getEmptyFuel(): FuelRecord {
    return {
      vehicleNo: '',
      driverName: '',
      contractId: '',
      startOdometer: 0,
      endOdometer: 0,
      prevDate: '',
      amountPaid: 0,
      issuedBy: '',
      fuelConsumed: 0
    };
  }

  calcMileage(record: FuelRecord): number {
    return (record.endOdometer - record.startOdometer) / (record.fuelConsumed || 1);
  }

  get filteredRecords() {
    let data = [...this.records];
    if (this.searchVehicle)
      data = data.filter(d => d.vehicleNo.toLowerCase().includes(this.searchVehicle.toLowerCase()));
    if (this.searchDriver)
      data = data.filter(d => d.driverName.toLowerCase().includes(this.searchDriver.toLowerCase()));
    if (this.searchContract)
      data = data.filter(d => d.contractId?.toLowerCase().includes(this.searchContract.toLowerCase()));

    if (this.startDate && this.endDate)
      data = data.filter(d => d.prevDate >= this.startDate && d.prevDate <= this.endDate);

    return data;
  }

  downloadPDF() {
    const element = this.fuelTable.nativeElement;
    const opt = {
      margin: 0.5,
      filename: 'fuel-records.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().from(element).set(opt).save();
  }
}
