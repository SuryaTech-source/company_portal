import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/_services/api.service';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { NotificationService } from 'src/app/_services/notification.service';
import { DefaultStoreService } from 'src/app/_services/default-store.service';
import html2pdf from 'html2pdf.js';

@Component({
    selector: 'app-salary-list',
    templateUrl: './salary-list.component.html',
    styleUrls: ['./salary-list.component.scss']
})
export class SalaryListComponent implements OnInit {
    salaries: any[] = [];
    loading = false;
    currency_code = 'KWD';
    currency_symbol = 'KD';

    // Filters
    years: number[] = [];
    months = [
        { value: 1, name: 'January' },
        { value: 2, name: 'February' },
        { value: 3, name: 'March' },
        { value: 4, name: 'April' },
        { value: 5, name: 'May' },
        { value: 6, name: 'June' },
        { value: 7, name: 'July' },
        { value: 8, name: 'August' },
        { value: 9, name: 'September' },
        { value: 10, name: 'October' },
        { value: 11, name: 'November' },
        { value: 12, name: 'December' }
    ];

    selectedYear: number;
    selectedMonth: number;
    searchQuery: string = '';

    // Sorting
    sortBy: string = 'employeeName';
    sortOrder: number = 1; // 1: Asc, -1: Desc


    constructor(
        private apiService: ApiService,
        private notify: NotificationService,
        private router: Router,
        private route: ActivatedRoute,
        private store: DefaultStoreService
    ) { }

    ngOnInit(): void {
        this.store.generalSettings.subscribe((settings) => {
            if (settings) {
                this.currency_code = settings.currency_code;
                this.currency_symbol = settings.currency_symbol;
            }
        });

        // Initialize Years (current year - 5 to current year + 1)
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 5; i <= currentYear + 1; i++) {
            this.years.push(i);
        }

        // Subscribe to query params to set initial state
        this.route.queryParams.subscribe(params => {
            this.selectedYear = params.year ? parseInt(params.year) : currentYear;
            this.selectedMonth = params.month ? parseInt(params.month) : (new Date().getMonth() + 1);
            this.searchQuery = params.search || '';
            this.sortBy = params.sortBy || 'employeeName';
            this.sortOrder = params.sortOrder ? parseInt(params.sortOrder) : 1;

            this.fetchSalaries();
        });
    }

    // Called by UI changes (Filters/Sort) - Updates URL
    updateUrl(): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                year: this.selectedYear,
                month: this.selectedMonth,
                search: this.searchQuery || null,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder
            },
            queryParamsHandling: 'merge'
        });
    }

    // Call this for search/filter changes
    onFilterChange(): void {
        this.updateUrl();
    }

    sort(column: string): void {
        if (this.sortBy === column) {
            this.sortOrder = this.sortOrder * -1;
        } else {
            this.sortBy = column;
            this.sortOrder = 1;
        }
        this.updateUrl();
    }

    // Actual API Call
    fetchSalaries(): void {
        this.loading = true;
        const payload = {
            year: this.selectedYear,
            month: this.selectedMonth,
            search: this.searchQuery,
            sortBy: this.sortBy,
            sortOrder: this.sortOrder
        };

        this.apiService.CommonApi(Apiconfig.listAllSalaries.method, Apiconfig.listAllSalaries.url, payload)
            .subscribe(
                (res: any) => {
                    this.loading = false;
                    if (res && res.status) {
                        this.salaries = res.data || [];
                    } else {
                        this.salaries = [];
                    }
                },
                (error) => {
                    this.loading = false;
                    this.salaries = [];
                    console.error('Error fetching salaries:', error);
                    this.notify.showError("Failed to fetch salaries.");
                }
            );
    }

    // Kept for direct template binding if needed, but updateUrl is preferred
    loadSalaries(): void {
        this.updateUrl();
    }

    viewSalary(employeeId: string): void {
        this.router.navigate(['/app/employees/salary-view', employeeId], {
            queryParams: { year: this.selectedYear }
        });
    }

    downloadPDF(): void {
        const element = document.getElementById('salaryTable');
        if (!element) {
            this.notify.showError("Table not found.");
            return;
        }

        // Temporarily hide action column for clean PDF
        const actionHeaders = element.querySelectorAll('th:last-child');
        const actionCells = element.querySelectorAll('td:last-child');

        actionHeaders.forEach((el: any) => el.style.display = 'none');
        actionCells.forEach((el: any) => el.style.display = 'none');

        const opt = {
            margin: 0.2,
            filename: `Salary_List_${this.selectedMonth}_${this.selectedYear}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
        };
        html2pdf().from(element).set(opt).save().then(() => {
            // Restore action column
            actionHeaders.forEach((el: any) => el.style.display = '');
            actionCells.forEach((el: any) => el.style.display = '');
        });
    }
}
