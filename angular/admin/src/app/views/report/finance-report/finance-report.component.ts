import { ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid
} from "ng-apexcharts";
import { Apiconfig } from "src/app/_helpers/api-config";

import { ApiService } from "src/app/_services/api.service";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
};

import { DefaultStoreService } from 'src/app/_services/default-store.service';

@Component({
  selector: 'app-finance-report',
  templateUrl: './finance-report.component.html',
  styleUrls: ['./finance-report.component.scss']
})
export class FinanceReportComponent {
  @ViewChild("sales-chart") salesChart: any;
  @ViewChild("payments-chart") paymentsChart: any;


  public salesChartOptions: Partial<ChartOptions>;
  public paymentsChartOptions: Partial<ChartOptions>;
  public salesData: any;
  public paymentsData: any;

  selectedYear: number = 2024;
  selectedMonth: number = 12; // 0 for 'All'
  curreny_symbol: any = 'KD';

  constructor(
    private http: HttpClient,
    private apiService: ApiService,
    private cdRef: ChangeDetectorRef,
    private store: DefaultStoreService
  ) {
    this.salesChartOptions = {
      series: [],
      chart: {
        height: 250,
        type: "line",
        zoom: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 2
      },
      grid: {
        row: {
          colors: ["#f3f3f3", "transparent"],
          opacity: 0.5
        }
      },
      xaxis: {
        categories: [],
        tickAmount: 16
      }
    };

    this.paymentsChartOptions = {
      series: [],
      chart: {
        height: 250,
        type: "line",
        zoom: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 2
      },
      grid: {
        row: {
          colors: ["#f3f3f3", "transparent"],
          opacity: 0.5
        }
      },
      xaxis: {
        categories: [],
        tickAmount: 16
      }
    };

    this.store.generalSettings.subscribe((settings) => {
      if (settings && settings.currency_symbol) {
        this.curreny_symbol = settings.currency_symbol;
      }
    });

    this.fetchData();
  }

  onYearChange(event: any): void {
    this.selectedYear = event.target.value;
    this.fetchData();  // Re-fetch the data when the year changes
  }

  onMonthChange(event: any): void {
    this.selectedMonth = event.target.value;
    this.fetchData();  // Re-fetch the data when the month changes
  }

  fetchData(): void {
    // Construct the API URL dynamically based on selected year and month
    const year = this.selectedYear;
    const month = this.selectedMonth;

    // const salesUrl = `/api/sales?year=${year}&month=${month}`;
    // const paymentsUrl = `/api/payments?year=${year}&month=${month}`;

    this.apiService.CommonApi(Apiconfig.paymentReport.method, Apiconfig.paymentReport.url, { year: Number(year), month: month }).subscribe(result => {
      this.paymentsData = result;  // Assume response is in the expected format
      this.updatePaymentsChart();

    })

    this.apiService.CommonApi(Apiconfig.salesReport.method, Apiconfig.salesReport.url, { year: Number(year), month: Number(month) }).subscribe(result => {
      if (result.status) {
        this.salesData = result;  // Assume response is in the expected format
        this.updateSalesChart();
      }

    })
    // Fetch payments data
  }

  updateSalesChart(): void {
    console.log(this.salesData, 'this.salesData');

    // Update the x-axis categories
    const months = this.salesData.category.map(item => item.label);
    console.log(months, 'sales months');

    this.salesChartOptions.xaxis.categories = months;

    // Update series data
    const totalSales = this.salesData.category.map(item => item.total_sale);
    const grossSales = this.salesData.category.map(item => item.gross_sale);
    const discounts = this.salesData.category.map(item => item.discount);
    const shippingCosts = this.salesData.category.map(item => item.shipping);
    const taxes = this.salesData.category.map(item => item.taxes);

    this.salesChartOptions = {
      ...this.salesChartOptions,  // Keep existing chart options
      series: [
        { name: "Gross Sales", data: grossSales },
        { name: "Discounts", data: discounts },
        { name: "Shipping", data: shippingCosts },
        { name: "Taxes", data: taxes },
        { name: "Total Sale", data: totalSales }
      ],
      xaxis: {
        ...this.salesChartOptions.xaxis,
        categories: months  // Update categories here
      }
    };

    // Ensure Angular change detection is triggered
    this.salesChart?.chart.updateOptions(this.salesChartOptions);
    // Ensure Angular change detection is triggered
    this.cdRef.detectChanges();
  }


  updatePaymentsChart(): void {
    const months = this.paymentsData.data.map(item => item.label);
    this.paymentsChartOptions.xaxis.categories = months;
    console.log(months, 'monthsmonthsmonthsmonths');

    // Update series data
    const cod = this.paymentsData.data.map(item => item.cod_amount);
    const razorpay = this.paymentsData.data.map(item => item.razorpay_amount);

    this.paymentsChartOptions = {
      ...this.paymentsChartOptions,  // Keep existing chart options
      series: [
        { name: "Razorpay", data: razorpay },
        { name: "COD", data: cod }
      ],
      xaxis: {
        ...this.paymentsChartOptions.xaxis,
        categories: months  // Update categories here
      }
    };

    // Ensure Angular change detection is triggered
    this.paymentsChart?.chart.updateOptions(this.paymentsChartOptions);
    // Ensure Angular change detection is triggered
    this.cdRef.detectChanges();
  }


}
