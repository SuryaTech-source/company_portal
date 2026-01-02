import { Component, OnInit, ChangeDetectorRef, AfterViewInit, Input, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/_services/api.service';
import { AuthenticationService } from 'src/app/_services/authentication.service';
import { Apiconfig } from "src/app/_helpers/api-config";
import { environment } from 'src/environments/environment';
import { LocalDataSource } from 'src/app/common-table/table/public-api';
import { DatePipe } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser'
import { TableSettingsService } from 'src/app/_helpers/table-settings.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { SpinnerService } from 'src/app/_services/spinner.service';
import { FeaturedComponent } from 'src/app/shared/featured.component';
import { DefaultStoreService } from 'src/app/_services/default-store.service';
import { apis } from 'src/app/interface/interface';
import { EditPriceComponent } from 'src/app/shared/editPrice.component';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { UntypedFormGroup } from '@angular/forms';
import { CloneComponent } from 'src/app/shared/clone.component';
import { ExpensiveComponent } from 'src/app/shared/expensive.component';
import { PopupComponent } from 'src/app/shared/popup.component';


@Component({
  selector: 'app-taglist',
  templateUrl: './taglist.component.html',
  styleUrls: ['./taglist.component.scss']
})
export class TaglistComponent {
  @ViewChild('confirmModal') confirmModal: any;
  @ViewChild('foodForm') form: UntypedFormGroup;
  status: any = 1;
  categorylist: any;
  getcardsdata: any;
  settings: any;
  env_url: any = environment.apiUrl;
  source: LocalDataSource = new LocalDataSource();
  skip: number = 0;
  limit: number = 10;
  count: number = 0;
  curentUser: any;
  settingData: any;
  default_limit: number = 10;
  userPrivilegeDetails: any;
  add_btn: boolean = true;
  edit_btn: boolean = true;
  view_btn: boolean = false;
  delete_btn: boolean = true;
  addBtnUrl: string = '/app/tags/add';
  addBtnName: string = 'Add new vendor';
  editUrl: string = `/app/tags/edit/`;
  viewUrl: string = `/app/tags/view/`;
  global_status: number = 0;
  global_search: string;
  bulk_action: boolean = false;
  filter_action: boolean = false;
  filter_action_list: any[] = [];
  global_filter_action = {} as any;
  deleteApis: apis = Apiconfig.tagDelete;
  productDetails: any;
  error: any;
  disable: any = [];
  constructor(
    private router: Router,
    private authService: AuthenticationService,
    private apiService: ApiService,
    private sanitized: DomSanitizer,
    private getSettings: TableSettingsService,
    private loader: SpinnerService,
    private notifyService: NotificationService,
    private cd: ChangeDetectorRef,
    private store: DefaultStoreService
  ) {
    this.loader.loadingSpinner.next(true);
    this.curentUser = this.authService.currentUserValue;
    if (this.curentUser && this.curentUser.doc.role == "subadmin") {
      if (this.router.url == '/app/tags/list' && this.curentUser.doc.privileges) {
        this.userPrivilegeDetails = this.curentUser.doc.privileges.filter(x => x.alias == 'tags');
        // if (!this.userPrivilegeDetails[0].status.view) {
        //   this.notifyService.showWarning('You are not authorized this module');
        //   this.router.navigate(['/app']);
        // };
        if (this.userPrivilegeDetails[0].status.delete) {
          this.delete_btn = true;
        } else {
          this.delete_btn = false;
          this.bulk_action = false;
        }
        if (this.userPrivilegeDetails[0].status.edit) {
          this.edit_btn = true;
        } else {
          this.edit_btn = false;
        }
        if (this.userPrivilegeDetails[0].status.add) {
          this.add_btn = true;
        } else {
          this.add_btn = false;
        }
      }
    }
    this.filter_action_list = [
      {
        name: 'Status',
        tag: 'select',
        type: '',
      }
    ]
    this.loadsettings('');
  }

  ngOnInit(): void {
    var data = {
      limit: this.limit,
      skip: this.skip,
      status: this.status,
      'search': this.global_search
    }

    this.getdata(data)


    // this.apiService.CommonApi(Apiconfig.tagsGetAll.method,Apiconfig.tagsGetAll.url,{}).subscribe(
    //   (result)=>{
    //     console.log(result,'result for me ');
    //   }
    // )

  }

  // getdata(data) {
  //   console.log(data,'filtering data,,,,')
  //   this.apiService.CommonApi(Apiconfig.vendorList.method, Apiconfig.vendorList.url, data).subscribe(response => {
  //     console.log("+++++++++++++++++++++++");

  //     console.log(response);

  //     if (response && response.length > 0) {
  //       console.log(response,'tag list....');
  //       this.categorylist = response[0];
  //       this.count = response[1];
  //       this.source.load(this.categorylist);
  //       this.cd.detectChanges();

  //     }
  //   })
  // }

  getdata(data) {
    console.log(data, 'filtering data,,,,')
    this.apiService.CommonApi(Apiconfig.vendorList.method, Apiconfig.vendorList.url, data).subscribe(response => {
      console.log("+++++++++++++++++++++++");
      console.log(response);

      if (response && response.status && response.data && response.data.length > 0) {
        console.log(response.data, 'vendor list....');
        this.categorylist = response.data; // Changed from response[0] to response.data
        this.count = response.count; // Changed from response[1] to response.count
        this.source.load(this.categorylist);
        this.cd.detectChanges();
      }
    })
  }


  onDeleteChange(event) {
    console.log(event);
    console.log('delete event triggerred...')
    this.ngOnInit();
  };

  onSearchChange(event) {
    console.log("search change");
    this.source = new LocalDataSource();
    this.global_search = event;
    console.log(this.global_search, "this.global_searchthis.global_searchthis.global_search");

    let data = {
      'skip': this.skip,
      'limit': this.limit,
      'search': event
    }
    if (Object.keys(this.global_filter_action).length > 0) {
      let searchdata = {
        ...data,
        ...this.global_filter_action
      }
      this.getdata(searchdata);
    } else {
      this.getdata(data);
    }
  };

  onitemsPerPageChange(event) {
    console.log("onItemPerpage event is require");

    this.limit = event;
    this.skip = 0;
    this.default_limit = event;
    this.source = new LocalDataSource();
    let data = {
      'skip': this.skip,
      'limit': this.limit,
      'search': this.global_search,
      'status': 1
    }
    if (Object.keys(this.global_filter_action).length > 0) {
      let perpagedata = {
        ...data,
        ...this.global_filter_action
      }
      this.getdata(perpagedata);
    } else {
      this.getdata(data);
    }
  };
  onPageChange(event) {
    console.log(event, "why this is here++++++++++");
    this.skip = this.limit * (event - 1);
    this.source = new LocalDataSource();
    let data = {
      'skip': this.limit * (event - 1),
      'limit': this.limit,
      'search': this.global_search
    };
    if (Object.keys(this.global_filter_action).length > 0) {
      let pagechangedata = {
        ...data,
        ...this.global_filter_action
      }
      this.getdata(pagechangedata);
    } else {
      this.getdata(data);
    }

  }

  onheaderCardChange(event) {

    this.skip = 0;
    this.source = new LocalDataSource();
    let data = {
      'skip': this.skip,
      'limit': this.limit,
      'status': this.global_status,
      'search': this.global_search
    }
    if (event == 'all') {
      data.status = 0;
      this.global_status = 0;
    } else if (event == 'active') {
      data.status = 1;
      this.global_status = 1;
    } else if (event == 'inactive') {
      data.status = 2;
      this.global_status = 2;
    }
    this.getdata(data);
  }

  changefeatured(id, feature) {
    console.log(id, 'id id id', feature, 'feature feature');
    var data = {
      db: "food",
      id: id,
      value: 1,
      for: 'expensive'
    };
    if (feature == 1) {
      data.value = 0;
    } else {
      data.value = 1;
    }
    this.apiService.CommonApi(Apiconfig.changeStatus.method, Apiconfig.changeStatus.url, data).subscribe(response => {
      if (response && response.status == 1) {
        this.notifyService.showSuccess("Successfully Updated");
        this.ngOnInit();
      } else {
        this.notifyService.showError("Something went wrong. Please try again later.");
      }
    })
  }

  changeStatus(id, feature) {

    var data = {
      db: "tags",
      id: id,
      value: 1
    };
    if (feature == 1) {
      data.value = 2;
    }
    console.log("data", data)
    // this.apiService.CommonApi(Apiconfig.tagStatusToggle.method, Apiconfig.tagStatusToggle.url, data).subscribe(response => {
    //   if (response && response.status == 1) {
    //     this.notifyService.showSuccess("Successfully Updated");
    //     this.ngOnInit();
    //   } else {
    //     this.notifyService.showError("Something went wrong. Please try again later.");
    //   }
    // })

    this.apiService.CommonApi(Apiconfig.categoryFeatured.method, Apiconfig.categoryFeatured.url, data).subscribe(response => {
      if (response && response.status == 1) {
        this.notifyService.showSuccess("Successfully Updated");
        this.ngOnInit();
      } else {
        this.notifyService.showError("Something went wrong. Please try again later.");
      }
    })
  }

  onFilterAction(event) {
    console.log("this is on filter");

    this.source = new LocalDataSource();
    if (event && event.City != '') {
      this.global_filter_action.city = event.City;
    } else {
      delete this.global_filter_action.city;
    }

    if (event && event.Brands != '') {
      this.global_filter_action.brandname = event.Brands;
    } else {
      delete this.global_filter_action.brandname;
    }
    if (event && event.Status != '') {
      this.global_status = parseInt(event.Status);
      this.global_filter_action.publish = event.Status;
    } else {
      delete this.global_filter_action.publish;
    }
    if (event && event.Recommended != '') {
      this.global_filter_action.isRecommeneded = event.Recommended;
    } else {
      delete this.global_filter_action.isRecommeneded;
    }
    if (event && event.Category != '') {
      this.global_filter_action.rcat = event.Category;
    } else {
      delete this.global_filter_action.rcat;
    }
    if (event && event.Subcategory != '') {
      this.global_filter_action.scat = event.Subcategory;
    } else {
      delete this.global_filter_action.scat;
    }
    var data = {
      'skip': this.skip,
      'limit': this.default_limit,
      'status': this.global_status,
      'search': this.global_search,
      'filter': true
    };
    let filterdata = {
      ...data,
      ...this.global_filter_action
    };
    this.getdata(filterdata);
  }

  // loadsettings(event) {
  //   if (event == 'delete') {
  //     this.settings = {
  //       selectMode: 'multi',
  //       hideSubHeader: true,
  //       columns: {
  //         name: {
  //           title: 'Name',
  //           filter: true,
  //           type: 'html',
  //           valuePrepareFunction: (value, row) => {
  //             return value;
  //           }
  //         },
  //         iconimg: {
  //           title: 'Image ',
  //           filter: false,
  //           type: "html",
  //           valuePrepareFunction: image => {
  //             if(image===''){
  //               return 'assets/image/no_images.png'
  //             }else{
  //               return '<img src="' + environment.apiUrl + image + '" width="32" height="32">';
  //             }
  //           }
  //         },
  //         // rcategory: {
  //         //   title: 'Category Name',
  //         //   filter: true,
  //         //   valuePrepareFunction: value => {
  //         //     return value.rcatname.charAt(0).toUpperCase() + value.rcatname.substr(1).toLowerCase();
  //         //   }
  //         // },
  //         status: {
  //           title: 'Status',
  //           filter: true,
  //           type: 'custom',
  //           renderComponent: PopupComponent,
  //           sort: false,
  //           editable: true,
  //           onComponentInitFunction: (instance: any) => {
  //             instance.save.subscribe(row => {
  //               this.changeStatus(row._id, row.status);
  //             });
  //           }
  //         },
  //         // sale_price: {
  //         //   title: 'Sale Price',
  //         //   filter: false,
  //         //   valuePrepareFunction: value => {
  //         //     return value;
  //         //   }
  //         // },
  //         createdAt: {
  //           title: 'Created At',
  //           filter: false,
  //           valuePrepareFunction: value => {
  //             var date = value ? new DatePipe('en-US').transform(value, 'MMMM dd,yyyy hh:mm a') : new DatePipe('en-US').transform(new Date(), 'dd/MM/yyyy');
  //             return date;
  //           }
  //         },
  //         // isRecommeneded: {
  //         //   title: 'Recommended Product',
  //         //   filter: false,
  //         //   type: "custom",
  //         //   renderComponent: FeaturedComponent,
  //         //   sort: false,
  //         //   editable: true,
  //         //   onComponentInitFunction: (instance: any) => {
  //         //     instance.save.subscribe(row => {
  //         //       this.changefeatured(row._id, row.isRecommeneded);
  //         //     });
  //         //   }
  //         // },
  //         // EditPrice: {
  //         //   title: 'Edit Price',
  //         //   filter: false,
  //         //   type: "custom",
  //         //   renderComponent: EditPriceComponent,
  //         //   sort: false,
  //         //   editable: true,
  //         //   onComponentInitFunction: (instance: any) => {
  //         //     instance.save.subscribe(row => {
  //         //       this.changefeatured(row._id, row.isRecommeneded);
  //         //     });
  //         //   }
  //         // },
  //       },
  //       pager: {
  //         display: true,
  //         perPage: this.default_limit
  //       },
  //       actions: {
  //         add: true,
  //         edit: false,
  //         delete: false,
  //         columnTitle: 'Actions',
  //         class: 'action-column',
  //         position: 'right',
  //         custom: [],
  //       },
  //     }
  //     this.settings.actions.custom = this.getSettings.loadSettings(event, this.curentUser, '/app/tags/list', this.userPrivilegeDetails, this.delete_btn, this.edit_btn, this.view_btn);
  //   } else {
  //     this.settings = {
  //       // selectMode: 'multi',
  //       hideSubHeader: true,
  //       columns: {
  //         index: {
  //           title: 'S.No',
  //           type: 'text',
  //           valuePrepareFunction: (value, row, cell) => {
  //             return this.skip + cell.row.index + 1 + '.'
  //           }
  //         },
  //         // name: {
  //         //   title: 'Name',
  //         //   filter: true,
  //         //   valuePrepareFunction: value => {
  //         //     return value.charAt(0).toUpperCase() + value.substr(1).toLowerCase();
  //         //   }
  //         // },
  //         // iconimg: {
  //         //   title: 'Icon',
  //         //   filter: false,
  //         //   type: "html",
  //         //   valuePrepareFunction: image => {
  //         //     // return '<img src="' + environment.apiUrl + image + '" width="40" height="40">';
  //         //     if(image===''){
  //         //       return '<img src="assets/image/no_images.png" width="32" height="32">'
  //         //     }else{
  //         //       return '<img src="' + environment.apiUrl + image + '" width="32" height="32">';
  //         //     }
  //         //   }
  //         // },
  //         name: {
  //           title: 'Name',
  //           filter: true,
  //           type: 'html',
  //           valuePrepareFunction: (value, row) => {
  //             return value;
  //           }
  //         },

  //           number: {
  //           title: 'Contact Number',
  //           filter: true,
  //           type: 'html',
  //           valuePrepareFunction: (value, row) => {
  //             return value;
  //           }
  //         },

  //         // rcategory: {
  //         //   title: 'Category Name',
  //         //   filter: true,
  //         //   valuePrepareFunction: value => {
  //         //     return value.rcatname.charAt(0).toUpperCase() + value.rcatname.substr(1).toLowerCase();
  //         //   }
  //         // },

  //         // isRecommeneded: {
  //         //   title: 'Recommended Product',
  //         //   filter: false,
  //         //   type: "custom",
  //         //   renderComponent: FeaturedComponent,
  //         //   sort: false,
  //         //   editable: true,
  //         //   onComponentInitFunction: (instance: any) => {
  //         //     instance.save.subscribe(row => {
  //         //       this.changefeatured(row._id, row.isRecommeneded);
  //         //     });
  //         //   }
  //         // },
  //         // sale_price: {
  //         //   title: 'Sale Price',
  //         //   filter: false,
  //         //   valuePrepareFunction: value => {
  //         //     return `MRP ${value}`;
  //         //   }
  //         // },
  //         createdAt: {
  //           title: 'Published',
  //           filter: false,
  //           valuePrepareFunction: value => {
  //             var date = value ? new DatePipe('en-US').transform(value, 'MMMM dd,yyyy hh:mm a') : new DatePipe('en-US').transform(new Date(), 'dd/MM/yyyy');
  //             return date;
  //           }
  //         },
  //         // expensive: {
  //         //   title: 'Featured',
  //         //   filter: false,
  //         //   type: "custom",
  //         //   renderComponent: ExpensiveComponent,
  //         //   sort: false,
  //         //   editable: true,
  //         //   onComponentInitFunction: (instance: any) => {
  //         //     instance.save.subscribe(row => {
  //         //       console.log(row,"row from productlist");

  //         //       this.changefeatured(row._id, row.expensive)
  //         //     });
  //         //   }
  //         // },
  //         status: {
  //           title: 'Status',
  //           filter: true,
  //           type: 'custom',
  //           renderComponent: PopupComponent,
  //           sort: false,
  //           editable: true,
  //           onComponentInitFunction: (instance: any) => {
  //             instance.save.subscribe(row => {
  //               this.changeStatus(row._id, row.status);
  //             });
  //           }
  //         },
  //         // Clone: {
  //         //   title: 'Clone',
  //         //   filter: false,
  //         //   type: "custom",
  //         //   renderComponent: CloneComponent,
  //         //   sort: false,
  //         //   editable: true,
  //         //   onComponentInitFunction: (instance: any) => {
  //         //     instance.save.subscribe(row => {
  //         //       this.cloneDetails(row)
  //         //     });
  //         //   }
  //         // },
  //       },
  //       pager: {
  //         display: true,
  //         perPage: this.default_limit
  //       },
  //       actions: {
  //         add: true,
  //         edit: false,
  //         delete: false,
  //         columnTitle: 'Actions',
  //         class: 'action-column',
  //         position: 'right',
  //         custom: [],
  //       },
  //     }
  //     this.settings.actions.custom = this.getSettings.loadSettings(event, this.curentUser, '/app/tags/list', this.userPrivilegeDetails, this.delete_btn, this.edit_btn, this.view_btn);
  //   };
  // };

  loadsettings(event) {
    if (event == 'delete') {
      this.settings = {
        selectMode: 'multi',
        hideSubHeader: true,
        columns: {
          vendorName: {
            title: 'Vendor Name',
            filter: true,
            type: 'html',
            valuePrepareFunction: (value, row) => {
              return value;
            }
          },
          contractDetails: {
            title: 'Contract ID',
            filter: true,
            type: 'html',
            valuePrepareFunction: (value, row) => {
              return value.contractId;
            }
          },
          startDate: {
            title: 'Start Date',
            filter: false,
            valuePrepareFunction: value => {
              return value ? new DatePipe('en-US').transform(value, 'MMM dd, yyyy') : '-';
            }
          },
          endDate: {
            title: 'End Date',
            filter: false,
            valuePrepareFunction: value => {
              return value ? new DatePipe('en-US').transform(value, 'MMM dd, yyyy') : '-';
            }
          },
          invoicingDate: {
            title: 'Invoicing Date',
            filter: false,
            valuePrepareFunction: value => {
              return value ? new DatePipe('en-US').transform(value, 'MMM dd, yyyy') : '-';
            }
          },
          lastPayment: {
            title: 'Last Payment',
            filter: false,
            valuePrepareFunction: value => {
              return value ? new DatePipe('en-US').transform(value, 'MMM dd, yyyy') : '-';
            }
          },
          status: {
            title: 'Status',
            filter: true,
            type: 'custom',
            renderComponent: PopupComponent,
            sort: false,
            editable: true,
            onComponentInitFunction: (instance: any) => {
              instance.save.subscribe(row => {
                this.changeStatus(row._id, row.status);
              });
            }
          },
          busesDetails: {
            title: 'Buses Under Contract',
            filter: false,
            valuePrepareFunction: (value, row) => {
              return row.drivers ? row.drivers.length : 0;
            }
          },
          driversDetails: {
            title: 'Drivers Under Contract',
            filter: false,
            valuePrepareFunction: (value, row) => {
              return row.drivers ? row.drivers.length : 0;
            }
          },
          contactOfficer: {
            title: 'Contact Officer',
            filter: true,
            type: 'html',
            valuePrepareFunction: (value, row) => {
              return value || '-';
            }
          }
        },
        pager: {
          display: true,
          perPage: this.default_limit
        },
        actions: {
          add: true,
          edit: false,
          delete: false,
          columnTitle: 'Actions',
          class: 'action-column',
          position: 'right',
          custom: [],
        },
      }
      this.settings.actions.custom = this.getSettings.loadSettings(event, this.curentUser, '/app/vendors/list', this.userPrivilegeDetails, this.delete_btn, this.edit_btn, this.view_btn);
    } else {
      this.settings = {
        hideSubHeader: true,
        columns: {
          index: {
            title: 'S.No',
            type: 'text',
            valuePrepareFunction: (value, row, cell) => {
              return this.skip + cell.row.index + 1 + '.'
            }
          },
          vendorName: {
            title: 'Vendor Name',
            filter: true,
            type: 'html',
            valuePrepareFunction: (value, row) => {
              return value;
            }
          },
          contractDetails: {
            title: 'Contract ID',
            filter: true,
            type: 'html',
            valuePrepareFunction: (value, row) => {
              return value.contractId;
            }
          },
          startDate: {
            title: 'Start Date',
            filter: false,
            valuePrepareFunction: value => {
              return value ? new DatePipe('en-US').transform(value, 'MMM dd, yyyy') : '-';
            }
          },
          endDate: {
            title: 'End Date',
            filter: false,
            valuePrepareFunction: value => {
              return value ? new DatePipe('en-US').transform(value, 'MMM dd, yyyy') : '-';
            }
          },
          invoicingDate: {
            title: 'Invoicing Date',
            filter: false,
            valuePrepareFunction: value => {
              return value ? new DatePipe('en-US').transform(value, 'MMM dd, yyyy') : '-';
            }
          },
          lastPayment: {
            title: 'Last Payment',
            filter: false,
            valuePrepareFunction: value => {
              return value ? new DatePipe('en-US').transform(value, 'MMM dd, yyyy') : '-';
            }
          },
          status: {
            title: 'Status',
            filter: true,
            type: 'custom',
            renderComponent: PopupComponent,
            sort: false,
            editable: true,
            onComponentInitFunction: (instance: any) => {
              instance.save.subscribe(row => {
                this.changeStatus(row._id, row.status);
              });
            }
          },
          busesDetails: {
            title: 'Buses Under Contract',
            filter: false,
            valuePrepareFunction: (value, row) => {
              return row.drivers ? row.drivers.length : 0;
            }
          },
          driversDetails: {
            title: 'Drivers Under Contract',
            filter: false,
            valuePrepareFunction: (value, row) => {
              return row.drivers ? row.drivers.length : 0;
            }
          },
          contactOfficer: {
            title: 'Contact Officer',
            filter: true,
            type: 'html',
            valuePrepareFunction: (value, row) => {
              return value || '-';
            }
          }
        },
        pager: {
          display: true,
          perPage: this.default_limit
        },
        actions: {
          add: true,
          edit: false,
          delete: false,
          columnTitle: 'Actions',
          class: 'action-column',
          position: 'right',
          custom: [],
        },
      }
      this.settings.actions.custom = this.getSettings.loadSettings(event, this.curentUser, '/app/vendors/list', this.userPrivilegeDetails, this.delete_btn, this.edit_btn, this.view_btn);
    }
  }


  ngAfterViewInit(): void {
    // this.apiService.CommonApi(Apiconfig.productcatgory.method, Apiconfig.productcatgory.url, {}).subscribe(
    //   (result) => {
    //     if (result && result.status == 1) {
    //       this.store.categoryList.next(result.list ? result.list : []);
    //     }
    //   },
    //   (error) => {
    //     console.log(error);
    //   }
    // );
    // this.apiService.CommonApi(Apiconfig.productbrandns.method, Apiconfig.productbrandns.url, {}).subscribe(
    //   (result) => {
    //     if (result && result.length == 1) {
    //       this.store.brandsList.next(result[0].length > 0 ? result[0] : []);
    //     };
    //   },
    //   (error) => {
    //     console.log(error);
    //   }
    // );
    // this.apiService.CommonApi(Apiconfig.productcity.method, Apiconfig.productcity.url, {}).subscribe(
    //   (result) => {
    //     if (result && result.length > 0) {
    //       this.store.cityList.next(result[0].length > 0 ? result[0] : []);
    //     }
    //   },
    //   (error) => {
    //     console.log(error);
    //   }
    // );
  };
  cancel() {
    this.confirmModal.show()
  }
  editPrice(value) {
    this.apiService.CommonApi(Apiconfig.foodEdit.method, Apiconfig.foodEdit.url, { id: value._id }).subscribe(response => {
      if (response) {
        this.productDetails = response.foodDetails;

        this.confirmModal.show()
      }
    })

  }
  setPrice(event, index) {
    console.log(event.target.checked);
    if (event.target.checked) {
      this.form.controls[`sprice${index}`].disable()
      this.productDetails.price_details[index].sprice = this.productDetails.price_details[index].mprice;
    } else {
      this.form.controls[`sprice${index}`].enable()
      this.productDetails.price_details[index].sprice = ''
    }

  }

  removeAttri(index) {
    console.log(index);
    this.productDetails.price_details.splice(index, 1)
  }

  cloneDetails(row) {
    this.router.navigate([`/app/products/food-clone/${row._id}`]);
  }

  public Changeprice(foodForm: UntypedFormGroup) {
    this.error = 'VALID';
    this.productDetails.price_details.forEach(element => {
      if (element.mprice < element.sprice) {
        this.error = "INVALID"
      }
    });
    if (foodForm.status != "INVALID" && this.error != "INVALID") {
      this.apiService.CommonApi(Apiconfig.foodAdd.method, Apiconfig.foodAdd.url, this.productDetails).subscribe(
        (result) => {
          this.confirmModal.hide()
          this.notifyService.showSuccess("Successfully updated.");
        },
        (error) => {
          console.log(error);
        }
      );
    } else {
      this.notifyService.showError('Please Enter all mandatory fields');
    }
  }
}
