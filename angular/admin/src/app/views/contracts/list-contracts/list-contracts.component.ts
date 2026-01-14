import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/_services/api.service';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { NotificationService } from 'src/app/_services/notification.service';
import { AuthenticationService } from 'src/app/_services/authentication.service';
import { Router } from '@angular/router';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-list-contracts',
  templateUrl: './list-contracts.component.html',
  styleUrls: ['./list-contracts.component.scss']
})
export class ListContractsComponent implements OnInit {
  contracts: any[] = [];
  loading: boolean = true;
  permissions = {
    add: true,
    edit: true,
    view: true,
    delete: true
  };
  currentUser: any;

  constructor(
    private apiService: ApiService,
    private notifyService: NotificationService,
    private authService: AuthenticationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.checkPrivileges();
    this.getContracts();
  }

  checkPrivileges() {
    this.currentUser = this.authService.currentUserValue;
    if (this.currentUser && this.currentUser.doc.role === 'subadmin' && this.currentUser.doc.privileges) {
      const privilege = this.currentUser.doc.privileges.find(p => p.alias === 'operations');
      if (privilege && privilege.status) {
        this.permissions = {
          add: !!privilege.status.add,
          edit: !!privilege.status.edit,
          view: !!privilege.status.view,
          delete: !!privilege.status.delete
        };

        if (!this.permissions.view) {
          this.notifyService.showError('You do not have permission to view this module.');
          this.router.navigate(['/app/dashboard']);
        }
      }
    }
  }

  getContracts() {
    this.loading = true;
    this.apiService.CommonApi(Apiconfig.listContracts.method, Apiconfig.listContracts.url, { status: 1 })
      .subscribe(
        (res: any) => {
          this.contracts = res.data?.map((c: any) => ({
            ...c,
            contractType: Array.isArray(c.contractType) ? c.contractType : [c.contractType]
          })) || [];
          this.loading = false;
        },
        () => {
          this.notifyService.showError("Failed to load contracts");
          this.loading = false;
        }
      );
  }

  deleteContract(contractId: number) {
    if (!this.permissions.delete) {
      this.notifyService.showError('You do not have permission to delete.');
      return;
    }
    if (confirm("Are you sure you want to delete this contract?")) {
      this.apiService.CommonApi(Apiconfig.deleteContract.method, Apiconfig.deleteContract.url, { id: contractId })
        .subscribe(
          (res: any) => {
            this.notifyService.showSuccess("Contract deleted successfully");
            this.getContracts();
          },
          () => {
            this.notifyService.showError("Failed to delete contract");
          }
        );
    }
  }

  downloadPDF() {
    const element = document.getElementById('contractsTable');
    const options = {
      margin: 0.5,
      filename: `contracts_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().from(element).set(options).save();
  }
}
