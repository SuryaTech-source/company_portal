import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { ApiService } from 'src/app/_services/api.service';
import { ChartOptions, ChartType, ChartDataset } from 'chart.js';
import { Colors } from "src/app/_helpers/colors.service";
import { environment } from 'src/environments/environment';
import { DatePipe } from '@angular/common';
import * as moment from 'moment';
// import { ChartComponent } from "ng-apexcharts";
// import {
//   ApexNonAxisChartSeries,
//   ApexResponsive,
//   ApexChart
// } from "ng-apexcharts";
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexFill,
  ApexMarkers,
  ApexYAxis,
  ApexOptions
} from "ng-apexcharts";
import { EMPTY } from 'rxjs';
import { log } from 'console';
export type ChartOptionss = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
};
export type ChartOptioncard = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  fill: ApexFill;
  markers: ApexMarkers;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
};


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  @ViewChild("chart") chart: ChartComponent;
  public chartOptionss: Partial<ChartOptions>;
  years: number[] = [];
  selectedMonth: number;
  selectedYear: number;
  barChartLabels: string[] = [];
  // barChartData: any[] = [{ data: [] }];
  from: string;
  to: string;
  month: boolean;
  day: boolean;
  dashboardDetails: any;
  dates: string[];
  year: any
  @ViewChild("chartcard") chartcard: ChartComponent;
  // public chartOptionscard: Partial<ChartOptions>;
  public chartOptionscard: Partial<ApexOptions>;
  @ViewChild("totalamntchart") totalamntchart: ChartComponent;
  public chartOptionsamount: Partial<ApexOptions>;
  @ViewChild("usercharts") usercharts: ChartComponent;
  public chartOptionsuser: Partial<ApexOptions>;
  @ViewChild("productcharts") productcharts: ChartComponent;
  public chartOptionsprod: Partial<ApexOptions>;
  public chartOptionearnings: Partial<ChartOptions>;
  @ViewChild("earningCharts") earningCharts: ChartComponent;

  last7daysAmount: any[] = []
  last7DaysUsers: any[] = []
  last7daysProduct: any[] = []
  months = [
    { value: 0, name: 'All' },
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
  // years: number[] = [];
  // selectedMonth: number;
  // selectedYear: number;
fuelChartOptions: Partial<ApexOptions>;
fuelChartType: 'daily' | 'monthly' | 'yearly' = 'monthly';
fuelStartDate: string;
fuelEndDate: string;

fuelEfficiencyType = 'monthly';
fuelEfficiencyStart: string = '';
fuelEfficiencyEnd: string = '';
fuelEfficiencyChartOptions: any;


  public chartOptionschart: Partial<ApexOptions> = {
    series: [
      {
        name: "Orders",
        data: []
      }
    ],
    chart: {
      // height: 350,
      type: "area",

      // width: 200,   // Set the width here
      height: 100,
    },
    stroke: {
      width: 3,
      curve: "smooth"
    },
    xaxis: {
      labels: {
        show: false
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
      // type: "datetime",
      // categories: ["1", "2", "3", "4", "5", "6", "7"] 
      // show: false
    },

    yaxis: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#00E396'], // Start color of the gradient
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal', // Can be 'horizontal' or 'vertical'
        shadeIntensity: 0.5,
        gradientToColors: ['#F9D423'], // End color of the gradient
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100]
      }
    }
  };
  public chartOptionsTotalamount: Partial<ApexOptions> = {
    series: [
      {
        name: "Amount",
        data: []
      }
    ],
    chart: {
      // height: 350,
      type: "area",

      // width: 200,   // Set the width here
      height: 100,
    },
    stroke: {
      width: 3,
      curve: "smooth"
    },
    xaxis: {
      labels: {
        show: false
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
      // type: "datetime",
      // categories: ["1", "2", "3", "4", "5", "6", "7"] 
    },

    yaxis: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#00E396'], // Start color of the gradient
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal', // Can be 'horizontal' or 'vertical'
        shadeIntensity: 0.5,
        gradientToColors: ['#F9D423'], // End color of the gradient
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100]
      }
    }
  };
  public chartOptionsUsers: Partial<ApexOptions> = {
    series: [
      {
        name: "User",
        data: []
      }
    ],
    chart: {
      // height: 350,
      type: "area",

      // width: 200,   // Set the width here
      height: 100,
    },
    stroke: {
      width: 3,
      curve: "smooth"
    },
    xaxis: {
      labels: {
        show: false
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
      // type: "datetime",
      // categories: ["1", "2", "3", "4", "5", "6", "7"] 
    },

    yaxis: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#00E396'], // Start color of the gradient
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal', // Can be 'horizontal' or 'vertical'
        shadeIntensity: 0.5,
        gradientToColors: ['#F9D423'], // End color of the gradient
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100]
      }
    }
  };
  public chartOptionsProduct: Partial<ApexOptions> = {
    series: [
      {
        name: "Product",
        data: []
      }
    ],
    chart: {
      // height: 350,
      type: "area",

      // width: 200,   // Set the width here
      height: 100,
    },
    stroke: {
      width: 3,
      curve: "smooth"
    },
    xaxis: {
      labels: {
        show: false
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
      // type: "datetime",
      // categories: ["1", "2", "3", "4", "5", "6", "7"] 
    },

    yaxis: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#00E396'], // Start color of the gradient
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal', // Can be 'horizontal' or 'vertical'
        shadeIntensity: 0.5,
        gradientToColors: ['#F9D423'], // End color of the gradient
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100]
      }
    }
  };

  // public chartOptionsEarnings: Partial<ApexOptions>  = {
  //   series: [
  //     {
  //       name: 'Orders',
  //       type: 'column',
  //       data: [70, 100, 80, 120, 90, 60, 100, 70, 110, 90, 60, 50]
  //     },
  //     {
  //       name: 'Earnings',
  //       type: 'column',
  //       data: [50, 80, 60, 100, 70, 50, 90, 60, 100, 80, 60, 40]
  //     },
  //     // {
  //     //   name: 'Refunds',
  //     //   type: 'column',
  //     //   data: [10, 20, 15, 25, 18, 10, 15, 10, 20, 15, 10, 5]
  //     // }
  //   ],
  //   chart: {
  //     height: 350,
  //     type: 'line'
  //   },
  //   stroke: {
  //     width: [0, 4, 4]
  //   },
  //   title: {
  //     text: 'Orders, Earnings and Refunds'
  //   },
  //   dataLabels: {
  //     // enabled: true,
  //     enabledOnSeries: [1, 2]
  //   },
  //   xaxis: {
  //     categories: [
  //       'Jan',
  //       'Feb',
  //       'Mar',
  //       'Apr',
  //       'May',
  //       'Jun',
  //       'Jul',
  //       'Aug',
  //       'Sep',
  //       'Oct',
  //       'Nov',
  //       'Dec'
  //     ]
  //   },
  //   yaxis: [
  //     {
  //       title: {
  //         text: 'Orders'
  //       }
  //     },
  //     {
  //       // opposite: true,
  //       title: {
  //         text: 'Earnings'
  //       }
  //     },
  //     // {
  //     //   // opposite: true,
  //     //   title: {
  //     //     text: 'Refunds'
  //     //   }
  //     // }
  //   ]
  // };
  barChartData: ApexAxisChartSeries = [
    {
      name: 'Orders',
      type: 'column',
      data: []
    },
    {
      name: 'Earnings',
      type: 'column',
      data: []
    }
  ];

  orderstatics: any = 7;
  // dates: any;
  // from: any;
  // to: any;
  // month: any;
  categoryName: any;
  orderCount: any
  earningsOrders : any
  // day: any;
  date: any;
  last7DaysOrders: any[] = []
  labelcategories: any[] = []
  todate: any;
  todayOrder: any = {
    total_orders: 0 as Number,
    completedOrderDetails: {
      count: 0 as Number,
      orderDetails: [] as any,
    },
    newOrderDetails: {
      count: 0 as Number,
      orderDetails: [] as any,
    },
    restaurantAcceptOrderDetails: {
      count: 0 as Number,
      orderDetails: [] as any,
    },
    driverAcceptedOrderDetails: {
      count: 0 as Number,
      orderDetails: [] as any,
    },
    driverPickedUpOrderDetails: {
      count: 0 as Number,
      orderDetails: [] as any,
    },
    userRejectedOrderDetails: {
      count: 0 as Number,
      orderDetails: [] as any,
    },
    driverRejectedOrderDetails: {
      count: 0 as Number,
      orderDetails: [] as any,
    },
    adminRejectedOrderDetails: {
      count: 0 as Number,
      orderDetails: [] as any,
    },
  }
  grand_total: any;
  restaurant_total: any;
  tax_total: any;
  delivery_amount: any;
  coupon_total: any;
  curreny_symbol : any ;
  dashBoardDetails: any = {
    orders: 0 as Number,
    completedOrders: 0 as Number,
    inprogressOrders: 0 as Number,
    users: 0 as Number,
    activeUsers: 0 as Number,
    inactiveUsers: 0 as Number,
    subscription: 0 as Number,
    approvedDrivers: 0 as Number,
    unapprovedDrivers: 0 as Number,
    onlineDrivers: 0 as Number,
    oflineDrivers: 0 as Number,
    products: 0 as Number,
    allReport: 0 as Number,
    unrecommended: 0 as Number,
    activeproducts: 0 as Number,
    inactiveproducts: 0 as Number,
  };

  constructor(
    private apiService: ApiService,
    public datepipe: DatePipe,
    private cdr: ChangeDetectorRef
  ) {

    this.apiService.CommonApi(Apiconfig.landingData.method, Apiconfig.landingData.url, {}).subscribe(result => {
      console.log(result.currency_symbol, "settingssettingssettingssettingssettingssettingssettingssettings");
      this.curreny_symbol = result && result.currency_symbol != (undefined || null) && result.currency_symbol ? result.currency_symbol : "₹"
    })

  }





  public chartOptions: ChartOptionss = {
    series: [],
    chart: {
      type: "donut",
      width: 500,   // Set the width here
      height: 500,
      redrawOnParentResize: false
    },
    labels: [],
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 100
          },
          legend: {
            position: "bottom"
          }
        }
      }
    ]

  };


  public chartOptionsEarnings: Partial<ApexOptions> = {
    series: [],
    chart: {
      height: 350,
      type: 'line'
    },
    stroke: {
      width: [0, 4, 4]
    },
    // title: {
    //   text: 'Orders and Earnings'
    // },
    dataLabels: {
      enabledOnSeries: [1]
    },
    xaxis: {
      categories: []
    },
    yaxis: [
      {
        title: {
          text: 'Orders'
        }
      },
      {
        // opposite: true,
        title: {
          text: 'Earnings'
        }
      }
    ]
  };

  // public barChartOptions: ChartOptions = {
  //   responsive: true,
  //   devicePixelRatio: 2.2,
  //   scales: {
  //     x: {
  //       ticks: {
  //         display: true,
  //         maxTicksLimit: 20,
  //       },
  //       grid: {
  //         tickLength: 15,
  //         color: '#9da0a2',
  //         drawOnChartArea: false,
  //       },
  //       title: {
  //         display: true,
  //         text: '',
  //       },
  //     },
  //     y: {
  //       ticks: {
  //         display: true,
  //       },
  //       title: {
  //         display: true,
  //         text: '',
  //       },
  //       grid: {
  //         tickLength: 0,
  //         color: '#9da0a2',
  //         drawOnChartArea: false,
  //       },
  //     },
  //   },
  //   plugins: {
  //     legend: {
  //       display: true,
  //       position: 'right',
  //       reverse: true,
  //       labels: {
  //         color: 'black',
  //         font: {
  //           size: 15,
  //         },
  //         padding: 20,
  //         usePointStyle: true,
  //         boxWidth: 9,
  //       },
  //     },
  //   },
  //   animation: false
  // };
  // public barChartLabels: any = [];
  public barChartType: ChartType = 'bar';
  public barChartLegend = false;
  // public barChartData: ChartDataset[] = [
  //   { barPercentage: 0.3, data: [], label: 'Orders', },
  // ];
  public barChartColors: any[] = [
    { backgroundColor: Colors.getColors().themeColor7 },
  ];


 loadFuelChart(): void {
    const payload = {
      type: this.fuelChartType,
      startDate: this.fuelStartDate,
      endDate: this.fuelEndDate
    };

    this.apiService
      .CommonApi(Apiconfig.fuelUsageAnalytics.method, Apiconfig.fuelUsageAnalytics.url, payload)
      .subscribe((res: any) => {
        if (res.status && res.data?.length) {
          const labels = res.data.map((item: any) => item.label);
          const fuelData = res.data.map((item: any) => item.totalFuelConsumed);
          const amountData = res.data.map((item: any) => item.totalAmountPaid);

          this.setFuelChart(labels, fuelData, amountData);
        } else {
          this.fuelChartOptions = { series: [] };
        }
      });
  }

  

  setFuelChart(labels: string[], fuel: number[], amount: number[]): void {
    this.fuelChartOptions = {
      series: [
        {
          name: 'Fuel Consumed (Litres)',
          type: 'column',
          data: fuel
        },
        {
          name: 'Amount Paid (₹)',
          type: 'line',
          data: amount
        }
      ],
      chart: {
        height: 380,
        type: 'line',
        toolbar: {
          show: true
        },
        zoom: {
          enabled: true
        }
      },
      stroke: {
        width: [0, 3],
        curve: 'smooth'
      },
      dataLabels: {
        enabled: true,
        enabledOnSeries: [1],
        style: {
          fontSize: '12px'
        }
      },
      fill: {
        type: ['solid', 'gradient'],
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.6,
          opacityTo: 0.9
        }
      },
      colors: ['#2E93fA', '#FF4560'],
      xaxis: {
        categories: labels,
        title: { text: 'Period' },
        labels: {
          rotate: -45,
          style: { fontSize: '12px' }
        }
      },
      yaxis: [
        {
          title: {
            text: 'Fuel (Litres)'
          },
          labels: {
            formatter: (val) => val.toFixed(0)
          }
        },
        {
          opposite: true,
          title: {
            text: 'Amount (₹)'
          },
          labels: {
            formatter: (val) => `₹${val.toFixed(0)}`
          }
        }
      ],
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (val, { seriesIndex }) =>
            seriesIndex === 0 ? `${val} L` : `₹${val.toFixed(2)}`
        }
      },
      title: {
        text: 'Fuel Usage Analytics',
        align: 'center',
        style: { fontWeight: '600', fontSize: '16px' }
      }
    };
  }

loadFuelEfficiencyChart() {
  const payload = {
    type: this.fuelEfficiencyType,
    startDate: this.fuelEfficiencyStart,
    endDate: this.fuelEfficiencyEnd,
  };

    this.apiService
      .CommonApi(Apiconfig.fuelEfficiencyAnalytics.method, Apiconfig.fuelEfficiencyAnalytics.url, payload).subscribe((res: any) => {
    if (res.status && res.data.length) {
      const labels = res.data.map((x: any) => x.label);
      const efficiency = res.data.map((x: any) => +(x.fuelEfficiency.toFixed(2)));

      this.fuelEfficiencyChartOptions = {
        series: [
          {
            name: 'Fuel Efficiency (L/km)',
            data: efficiency,
          },
        ],
        chart: {
          type: 'line',
          height: 350,
          toolbar: { show: false },
        },
        xaxis: {
          categories: labels,
          title: { text: 'Date' },
          labels: { rotate: -45 },
        },
        yaxis: {
          title: { text: 'Fuel Efficiency (L/km)' },
          decimalsInFloat: 2,
        },
        tooltip: {
          y: {
            formatter: (val: number) => `${val.toFixed(2)} L/km`,
          },
        },
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical' } },
        colors: ['#1E90FF'],
        dataLabels: { enabled: true },
      };
    } else {
      this.fuelEfficiencyChartOptions = { series: [] };
    }
  });
}

  populateYears() {
    const startYear = 2018;
    const currentYear = new Date().getFullYear();
    for (let year = startYear; year <= currentYear; year++) {
      this.years.push(year);
    }
  }

  setCurrentMonthAndYear() {
    const currentDate = new Date();
    this.selectedMonth = 0; // getMonth() returns 0-indexed month
    this.selectedYear = currentDate.getFullYear();
    this.fetchData();
  }

  onMonthChange() {
    this.fetchData();
  }

  onYearChange() {
    this.fetchData();
  }
  
  fetchData() {
    console.log(this.selectedMonth,'Selected Month');
    console.log(this.selectedYear,'Selected Year');

    
    if (this.selectedMonth!=0 && this.selectedYear) {
      // Fetch daily data for the selected month
      const fromDate = new Date(this.selectedYear, this.selectedMonth - 1, 1).toISOString();
      const toDate = new Date(this.selectedYear, this.selectedMonth, 0).toISOString();
      // if (this.selectedMonth == 0) {
      //   this.from = '0';
      //   this.to = '0';
      // } else {
        this.from = fromDate;
        this.to = toDate;
      // }
      this.month = true;
      this.day = true;
      this.year = this.years
      this.getDays(this.from, this.to);
    } else if (this.selectedYear && this.selectedMonth==0) {
      // Fetch monthly data for the selected year
      const fromDate = new Date(this.selectedYear, 0, 1).toISOString();
      
      const toDate = new Date(this.selectedYear, 11, 31).toISOString();
      console.log(fromDate,toDate,"for,...................");

      // if (this.selectedMonth == 0) {
      //   this.from = '0';
      //   this.to = '0';
      // } else {
        this.from = fromDate;
        this.to = toDate;
      // }
      this.month = true;
      this.day = false;
      this.year = this.selectedYear
      this.getMonths(this.from, this.to);
    }

    this.getOrderStatics();
  }

  getDays(startdate: string, enddate: string): void {
    console.log(this.selectedMonth, 'this.selectedMonthADAAAAA');
    if (this.selectedMonth !== 0) {    
      const start = this.datepipe.transform(startdate, 'yyyy-MM-dd');
      const end = this.datepipe.transform(enddate, 'yyyy-MM-dd');
      
      if (!start || !end) {
        console.error('Invalid start or end date.');
        return;
      }
      
      const date = new Date(start);
      const endDate = new Date(end);
      this.dates = [];
  
      while (date <= endDate) {
        const formattedDate = this.datepipe.transform(date, 'dd-MM-yyyy');
        if (formattedDate) {
          this.dates.push(formattedDate);
        }
        date.setDate(date.getDate() + 1);
      }
  
      console.log(this.dates, "Dates generated");
  
      this.barChartLabels = [...this.dates];
      console.log(this.barChartLabels, 'Bar Chart Labels');
      
      this.chartOptionsEarnings = {
        ...this.chartOptionsEarnings,
        xaxis: {
          ...this.chartOptionsEarnings.xaxis,
          categories: [...this.dates]
        }
      };
  
      this.cdr.detectChanges();
      console.log(this.chartOptionsEarnings.xaxis.categories, "Chart xaxis categories updated");
    }
  }

  getMonths(startdate: string, enddate: string) {
    // console.log(this.selectedYear,'this.selectedYear');
    console.log(this.selectedMonth,'this.selectedMonthMMMMMMMMMMMMMMMMMMM');

    
    if(this.selectedYear && this.selectedMonth == 0){
      console.log(startdate,"Start Date");
      console.log(enddate,"End Date");

      
      const start = new Date(startdate);
      const end = new Date(enddate);
      this.dates = [];
      for (let date = start; date <= end; date.setMonth(date.getMonth() + 1)) {
        const data = this.datepipe.transform(date, 'MMM-yyyy');
        this.dates.push(data);
      }
      this.chartOptionsEarnings = {
        ...this.chartOptionsEarnings,
        xaxis: {
          ...this.chartOptionsEarnings.xaxis,
          categories: [...this.dates]
        }
      };
    }
    this.barChartLabels = [...this.dates];
    this.cdr.detectChanges()
    console.log(this.chartOptionsEarnings.xaxis.categories,"this.chartOptionsEarnings.xaxis.categoriesthis.chartOptionsEarnings.xaxis.categories");
    
  }

  formatDateToMMMYYYYWithDash(dateString: string): string {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    // Replace space with a dash to match the format in barChartLabels
    return formattedDate.replace(' ', '-');
  }


  getOrderStatics() {
    this.barChartData[0].data = [];
    this.barChartData[1].data = [];

    const url = `dashboard/orderstats?from=${this.from}&to=${this.to}&month=${this.month}&day=${this.day}&year=${this.selectedYear}&mothvalue=${this.selectedMonth}`;

    this.apiService.CommonApi("get", url, {}).subscribe(
      (result: any[]) => {
        if(result.length!=0){

          if(this.selectedMonth==0){
            result.forEach(item => {
              // if(this.selectedMonth=0){
                console.log("Are you entered here?");
                
                const transformedDate = this.formatDateToMMMYYYYWithDash(item.Date);
                console.log(transformedDate,'transformedDate');
                
                // const date = transformedDate.trim(); // Ensure no leading/trailing spaces
                // console.log(date,'date');
                console.log(this.barChartLabels,'date');
      
                const index = this.barChartLabels.findIndex(label => label.trim() === transformedDate);
                console.log(index,'index');
      
                if (index !== -1) {
                  this.barChartData[0].data[index] = item.count || 0; // Handle null values
                  this.barChartData[1].data[index] = item.totalGrandAmount || 0; // Handle null values
                }
          
    
            });
          }else{
            result.forEach(item => {
              const transformedDate = this.datepipe.transform(item.Date, 'dd-MM-yyyy');
              console.log(transformedDate,'transformedDate');
              
              const date = transformedDate.trim(); // Ensure no leading/trailing spaces
              console.log(date,'date');
              console.log(this.barChartLabels,'date');
    
              const index = this.barChartLabels.findIndex(label => label.trim() === date);
              console.log(index,'index');
    
              if (index !== -1) {
                this.barChartData[0].data[index] = item.count || 0; // Handle null values
                this.barChartData[1].data[index] = item.totalGrandAmount || 0; // Handle null values
              }
            });
          }
        }else{
          const zeroDataArray = new Array(this.barChartLabels.length).fill(0);
          this.barChartData[0].data = zeroDataArray;
          this.barChartData[1].data = zeroDataArray;
        }



        // Ensure all data points are set; fill with 0 where data is missing
        this.barChartData[0].data = this.replaceEmptyWithZero(this.barChartData[0].data)
        // let total = this.barChartData[0].data.map(data => data);
        for(let datas of this.barChartData[0].data){
          this.earningsOrders += datas 
          console.log(this.earningsOrders,"datasdatasdatasdatasdatas");
              //  var   total =        
        }
        // console.log(total, "Total sum of this.barChartData[0].data");
        console.log(this.barChartData[0].data.map(data => data++),"this.barChartData[0].data")
        this.barChartData[1].data = this.replaceEmptyWithZero(this.barChartData[1].data)
        console.log(this.barChartData[1].data,"this.barChartData[1].data")

        // Update chart options after setting data
        this.chartOptionsEarnings.series = [...this.barChartData];
        console.log(this.chartOptionsEarnings, "data1");

      },
      error => {
        console.error('Error fetching data:', error);
      }
    );
  }
  replaceEmptyWithZero(arr) {
    const result = [];
    for (let data of arr) {
      console.log(data, "datacheck");
      if (!data) {
        data = 0
        result.push(data);
        // console.log(result,"resultresultresultresult");

      } else {
        result.push(parseInt(data));

      }
    }
    console.log(result, "resultresultresultresult");

    return result;
  }



  ngOnInit(): void {
    // console.log('asdasdasdddd  dashboard');
    //getDashboard
 const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(today.getMonth() - 6);

  this.fuelChartType = 'monthly';
  this.fuelStartDate = sixMonthsAgo.toISOString().split('T')[0];
  this.fuelEndDate = today.toISOString().split('T')[0];

  this.loadFuelChart();

  this.loadFuelEfficiencyChart()
 this.apiService.CommonApi(Apiconfig.getDashboard.method, Apiconfig.getDashboard.url, {}).subscribe(
      (result) => {

        console.log(result,"result");
        this.dashboardDetails = result.totals
        

      })




    // this.populateYears();
    // this.setCurrentMonthAndYear();
    // var date = new Date();
    // let dataFrom = new Date(new Date().setDate(date.getDate() - 6));
    // var from_date = date.setUTCHours(0, 0, 0, 0);
    // var to_date = date.setUTCHours(23, 59, 59, 0);
    // if (this.selectedMonth == 0) {
    //   this.from = "0";
    //   this.to = "0";
    // } else {
    //   this.from = dataFrom.toISOString();
    //   this.to = date.toISOString();
    // }
    // this.month = true;
    // this.day = false;
    // if(this.selectedMonth != 0){
    //   this.getDays(dataFrom.toString(), date.toString())
    // }else{
    //   console.log(this.selectedYear,"kkkk");
      
    //   const fromDate = new Date(this.selectedYear, 0, 1).toISOString();
    //   const toDate = new Date(this.selectedYear, 11, 31).toISOString();
    //   // if (this.selectedMonth == 0) {
    //   //   this.from = '0';
    //   //   this.to = '0';
    //   // } else {
    //     this.from = fromDate;
    //     this.to = toDate;
    //   // }
    //   this.month = true;
    //   this.day = false;
    //   this.year = this.selectedYear
    //   this.getMonths(this.from, this.to);
    // }
    // this.barChartLabels = this.dates;
    // this.apiService.CommonApi(Apiconfig.dashboard_get.method, Apiconfig.dashboard_get.url, {}).subscribe(
    //   (result) => {

    //     this.dashBoardDetails = result.statistics;
    //     console.log(this.dashBoardDetails, "this.dashBoardDetailsthis.dashBoardDetailsthis.dashBoardDetails");
    //     this.labelcategories = this.dashBoardDetails.subCategoryDoc.forEach((category) => {
    //       console.log(category, "categorycategorycategorycategory");
    //       this.chartOptions.labels = this.dashBoardDetails.subCategoryDoc.map((category) => category.categoryName);
    //       this.chartOptions.series = this.dashBoardDetails.subCategoryDoc.map((category) => category.orderCount);
    //       this.categoryName = category.categoryName;
    //       this.orderCount = category.orderCount
    //       this.last7DaysOrders = result.statistics.last7DaysOrders
    //       this.last7daysAmount = result.statistics.last7DaysAmounts
    //       this.last7DaysUsers = result.statistics.last7DaysUsers
    //       this.last7daysProduct = result.statistics.last7DaysProducts
    //       // this.chartOptionschart.series.map((category) => 
    //       //   console.log(category,"subCategoryDoc"),
    //       //    category.data) 
    //       this.chartOptionschart.series.forEach((ele) => {
    //         ele.data = this.last7DaysOrders
    //       })

    //       this.chartOptionsTotalamount.series.forEach((ele) => {
    //         ele.data = this.last7daysAmount
    //       })
    //       this.chartOptionsUsers.series.forEach((ele) => {
    //         ele.data = this.last7DaysUsers
    //       })
    //       this.chartOptionsProduct.series.forEach((ele) => {
    //         ele.data = this.last7daysProduct
    //       })

    //       console.log(this.last7DaysOrders, "this.last7DaysOrdersthis.last7DaysOrders");

    //       this.cdr.detectChanges();
    //       // return { name: category.categoryName, count: category.orderCount };
    //     })
    //     // this.chartOptions.labels = this.labelcategories.map(category => category.name);
    //   }, (error) => {
    //     console.log(error);
    //   }

    // );
    // var today_orders = {
    //   from_date: from_date,
    //   to_date: to_date,
    //   month: false,
    //   day: true
    // }
    // this.apiService.CommonApi(Apiconfig.dashboard_today_Order.method, Apiconfig.dashboard_today_Order.url + '?from_date=' + from_date + '&to_date=' + to_date, {}).subscribe(
    //   (result) => {
    //     this.todayOrder = result;
    //     this.grand_total = result.grand_total.toFixed(2);
    //     this.restaurant_total = result.restaurant_total.toFixed(2);
    //     this.tax_total = result.tax_total.toFixed(2);
    //     this.delivery_amount = result.delivery_amount.toFixed(2);
    //     this.coupon_total = result.coupon_total.toFixed(2);
    //   }, (error) => {
    //     console.log(error);
    //   }
    // );
    // this.getOrderStatics()
    // var url = 'dashboard/orderstats?from=' + this.from + '&to=' + this.to + '&month=' + this.month + '&day=' + this.day;
    // this.apiService.CommonApi(Apiconfig.dashboard_orderstats.method, url, {}).subscribe(
    //   (result) => {
    //     let dataset = result.map(x => x.count);
    //     this.barChartData[0].data = dataset.reverse();
    //   }, (error) => {
    //     console.log(error);
    //   }
    // );
  }
  // populateYears() {
  //   const startYear = 2018;
  //   const currentYear = new Date().getFullYear();
  //   for (let year = startYear; year <= currentYear; year++) {
  //     this.years.push(year);
  //   }
  // }
  // onChangeOrderStatics(value) {
  //   if (value == '7') {
  //     var date = new Date();
  //     let dataFrom = new Date(new Date().setDate(date.getDate() - 6));
  //     this.from = dataFrom.toISOString()
  //     this.to = date.toISOString()
  //     this.month = false;
  //     this.day = true;
  //     this.getOrderStatics()
  //     this.getDays(new Date(dataFrom), new Date(date))
  //     this.barChartLabels = this.dates;
  //   }
  //   if (value == '30') {
  //     var date = new Date();
  //     let dataFrom = new Date(new Date().setMonth(date.getMonth() - 1));
  //     this.from = dataFrom.toISOString()
  //     this.to = date.toISOString()
  //     this.month = true;
  //     this.day = true;
  //     this.getMonth(new Date(this.from), new Date(this.to))
  //     this.getOrderStatics();
  //     this.barChartLabels = this.dates;
  //   }
  //   if (value == '180') {
  //     var date = new Date();
  //     let dataFrom = new Date(new Date().setMonth(date.getMonth() - 5));
  //     this.from = dataFrom.toISOString()
  //     this.to = date.toISOString()
  //     this.month = true;
  //     this.day = false;
  //     this.getMonths(this.from, this.to)
  //     this.getOrderStatics()
  //     this.barChartLabels = this.dates;
  //   }
  //   if (value == '365') {
  //     var date = new Date();
  //     let dataFrom = new Date(new Date().setMonth(date.getMonth() - 11));
  //     this.from = dataFrom.toISOString()
  //     this.to = date.toISOString()
  //     this.month = true;
  //     this.day = false;
  //     this.getMonths(this.from, this.to)
  //     this.getOrderStatics()
  //     this.barChartLabels = this.dates;
  //   }
  // }

  // getDays(startdate, enddate) {
  //   const date = new Date(startdate.getTime());
  //   this.dates = [];
  //   while (date <= enddate) {
  //     var data = this.datepipe.transform(date, 'dd-MM-yyyy')
  //     this.dates.push(data);
  //     console.log(this.dates,"this.datesthis.datesthis.datesthis.dates");

  //     date.setDate(date.getDate() + 1);
  //   }
  //   return this.dates;
  // }
  // getMonth(startdate, enddate) {
  //   const date = new Date(startdate.getTime());
  //   this.dates = [];
  //   while (date <= enddate) {
  //     var data = this.datepipe.transform(date, 'dd-MM-yyyy')
  //     this.dates.push(data);
  //     date.setDate(date.getDate() + 1);
  //   }
  //   return this.dates;
  // }
  // getMonths(startdate, enddate) {
  //   var start = startdate.split('-');
  //   var end = enddate.split('-');
  //   var startYear = parseInt(start[0]);
  //   var endYear = parseInt(end[0]);
  //   this.dates = [];
  //   for (var i = startYear; i <= endYear; i++) {
  //     var endMonth = i != endYear ? 11 : parseInt(end[1]) - 1;
  //     var startMon = i === startYear ? parseInt(start[1]) - 1 : 0;
  //     for (var j = startMon; j <= endMonth; j = j > 12 ? j % 12 || 11 : j + 1) {
  //       var month = j + 1;
  //       var displayMonth = month < 10 ? '0' + month : month;
  //       var data = moment(displayMonth, 'MM').format('MMM')
  //       this.dates.push([data, i].join('-'));
  //     }
  //   }
  //   return this.dates;
  // }
  // getOrderStatics() {
  //   this.barChartData[0].data = []
  //   var url = 'dashboard/orderstats?from=' + this.from + '&to=' + this.to + '&month=' + this.month + '&day=' + this.day;
  //   this.apiService.CommonApi("get", url, {}).subscribe(
  //     (result) => {
  //       let dataset = result.map(x => x.count);
  //       for (let index = 0; index < result.length; index++) {
  //         for (let i = 0; i < this.barChartLabels.length; i++) {
  //           if ((this.barChartLabels[i] == this.datepipe.transform(result[index].Date, 'dd-MM-yyyy')) || (this.barChartLabels[i] == this.datepipe.transform(result[index].Date, 'MMM-yyyy'))) {
  //             this.barChartData[0].data[i] = result[index].count
  //             console.log("data", result[index].count)
  //           } else if (!this.barChartData[0].data[i]) {
  //             this.barChartData[0].data[i] = 0
  //           }
  //         }
  //       }
  //       // this.barChartData[0].data = dataset.reverse();
  //     }, (error) => {
  //       console.log(error);
  //     }
  //   );
  // }
}
