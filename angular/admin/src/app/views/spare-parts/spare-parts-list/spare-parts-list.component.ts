import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { ApiService } from 'src/app/_services/api.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { DefaultStoreService } from 'src/app/_services/default-store.service';

@Component({
  selector: 'app-spare-parts-list',
  templateUrl: './spare-parts-list.component.html',
  styleUrls: ['./spare-parts-list.component.scss']
})
export class SparePartsListComponent implements OnInit {
  spareParts: any[] = [];
  search: string = '';
  page: number = 1;
  limit: number = 10;
  total: number = 0;
  loading = false;
  currency_code = 'KWD';
  currency_symbol = 'KD';

  constructor(
    private apiService: ApiService,
    private router: Router,
    private notifyService: NotificationService,
    private store: DefaultStoreService
  ) { }

  ngOnInit(): void {
    this.store.generalSettings.subscribe((settings) => {
      if (settings) {
        this.currency_code = settings.currency_code;
        this.currency_symbol = settings.currency_symbol;
      }
    });
    this.getSpareParts();
  }

  getSpareParts() {
    this.loading = true;
    this.apiService.CommonApi(
      Apiconfig.listSpareParts.method,
      Apiconfig.listSpareParts.url,
      { page: this.page, limit: this.limit, search: this.search }
    ).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status) {
          this.spareParts = res.data;
          this.total = res.count;
        } else {
          this.spareParts = [];
          this.total = 0;
        }
      },
      error: () => {
        this.loading = false;
        this.notifyService.showError('Error fetching spare parts');
      }
    });
  }

  onSearchChange() {
    this.page = 1;
    this.getSpareParts();
  }

  onPageChange(newPage: number) {
    if (newPage < 1 || newPage > Math.ceil(this.total / this.limit)) return;
    this.page = newPage;
    this.getSpareParts();
  }

  editSparePart(id: string) {
    this.router.navigate(['/app/spare-parts/edit', id]);
  }
}
