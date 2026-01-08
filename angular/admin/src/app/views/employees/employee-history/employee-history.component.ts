import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/_services/api.service';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { NotificationService } from 'src/app/_services/notification.service';
import { DefaultStoreService } from 'src/app/_services/default-store.service';

@Component({
    selector: 'app-employee-history',
    templateUrl: './employee-history.component.html',
    styleUrls: ['./employee-history.component.scss']
})
export class EmployeeHistoryComponent implements OnInit {
    employeeId: string = '';
    loading = false;
    activeTab = 'penalty'; // penalty, allowance, vacation

    historyData: any = {
        employee: null,
        penalties: { list: [], totalCount: 0, totalAmount: 0, paidAmount: 0, balance: 0 },
        allowances: { list: [], totalCount: 0, totalAmount: 0, repaidAmount: 0, balance: 0 },
        vacations: { list: [], totalCount: 0 }
    };

    currency_code = 'KWD';
    currency_symbol = 'KD';

    constructor(
        private route: ActivatedRoute,
        private apiService: ApiService,
        private notify: NotificationService,
        private store: DefaultStoreService
    ) {
        this.employeeId = this.route.snapshot.paramMap.get('id') || '';
    }

    ngOnInit(): void {
        this.store.generalSettings.subscribe((settings) => {
            if (settings) {
                this.currency_code = settings.currency_code;
                this.currency_symbol = settings.currency_symbol;
            }
        });

        if (this.employeeId) {
            this.fetchHistory();
        }
    }

    fetchHistory() {
        this.loading = true;
        this.apiService.CommonApi(Apiconfig.getEmployeeHistory.method, Apiconfig.getEmployeeHistory.url, { employeeId: this.employeeId })
            .subscribe((res: any) => {
                this.loading = false;
                if (res.status) {
                    this.historyData = res.data;
                } else {
                    this.notify.showError(res.message || "Failed to fetch history");
                }
            }, err => {
                this.loading = false;
                this.notify.showError("Error fetching history");
            });
    }

    switchTab(tab: string) {
        this.activeTab = tab;
    }
}
