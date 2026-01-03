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
  selector: 'app-list-testimonial',
  templateUrl: './list-testimonial.component.html',
  styleUrls: ['./list-testimonial.component.scss']
})
export class ListTestimonialComponent {
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
  addBtnUrl: string = '/app/fleet/add';
  addBtnName: string = 'Add new asset';
  editUrl: string = `/app/fleet/edit/`;
  viewUrl: string = `/app/fleet/view/`;
  global_status: number = 0;
  global_search: string;
  bulk_action: boolean = false;
  filter_action: boolean = false;
  filter_action_list: any[] = [];
  global_filter_action = {} as any;
  deleteApis: apis = Apiconfig.testimonialDelete;
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
      if (this.router.url == '/app/fleet/list' && this.curentUser.doc.privileges) {
        this.userPrivilegeDetails = this.curentUser.doc.privileges.filter(x => x.alias == 'Testimonial');
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
  getdata(data) {
    console.log(data, 'filtering data,,,,')
    this.apiService.CommonApi(Apiconfig.listFleets.method, Apiconfig.listFleets.url, data)
      .subscribe(response => {
        console.log(response, "fleet list response");

        if (response && response.status) {
          this.categorylist = response.data;   // fleet array
          this.count = response.count;         // count number
          this.source.load(this.categorylist); // load into table
          this.cd.detectChanges();
        } else {
          this.notifyService.showError(response.message || "Failed to fetch fleets");
        }
      });
  }


  onDeleteChange(event) {
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
      db: "offermanagement",
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
      db: "testimonial",
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
      console.log(response, 'res tes');

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

  loadsettings(event) {
    if (event == 'delete') {
      this.settings = {
        hideSubHeader: true,
        columns: {
          index: {
            title: 'S.No',
            type: 'text',
            valuePrepareFunction: (value, row, cell) => {
              return this.skip + cell.row.index + 1 + '.';
            }
          },
          vehicleName: {
            title: 'Vehicle Name',
            filter: true
          },
          registrationNo: {
            title: 'Registration No',
            filter: true
          },
          insuranceNo: {
            title: 'Insurance No',
            filter: true
          },
          makerName: {
            title: 'Maker Name',
            filter: true
          },
          seatingCapacity: {
            title: 'Seating Capacity',
            type: 'number'
          },
          manufactureDate: {
            title: 'Model & Year',
            valuePrepareFunction: (date) => {
              return date ? new DatePipe('en-US').transform(date, 'MMMM, yyyy') : '-';
            }
          },
          passingExpiry: {
            title: 'Passing Expiry',
            valuePrepareFunction: (date) => {
              return date ? new DatePipe('en-US').transform(date, 'dd/MM/yyyy') : '-';
            }
          },
          status: {
            title: 'Status',
            type: 'html',
            valuePrepareFunction: (value) => {
              if (value === 1) {
                return `<span class='badge badge-success badge-pill'>Active</span>`;
              } else if (value === 2) {
                return `<span class='badge badge-warning badge-pill'>Inactive</span>`;
              } else {
                return `<span class='badge badge-danger badge-pill'>Deleted</span>`;
              }
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
          position: 'right'
        }
      };
      this.settings.actions.custom = this.getSettings.loadSettings(event, this.curentUser, '/app/tags/list', this.userPrivilegeDetails, this.delete_btn, this.edit_btn, this.view_btn);
    } else {
      this.settings = {
        hideSubHeader: true,
        columns: {
          index: {
            title: 'S.No',
            type: 'text',
            valuePrepareFunction: (value, row, cell) => {
              return this.skip + cell.row.index + 1 + '.';
            }
          },
          vehicleName: {
            title: 'Vehicle Name',
            filter: true
          },
          registrationNo: {
            title: 'Registration No',
            filter: true
          },
          insuranceNo: {
            title: 'Insurance No',
            filter: true
          },
          makerName: {
            title: 'Maker Name',
            filter: true
          },
          seatingCapacity: {
            title: 'Seating Capacity',
            type: 'number'
          },
          manufactureDate: {
            title: 'Model & Year',
            valuePrepareFunction: (date) => {
              return date ? new DatePipe('en-US').transform(date, 'MMMM, yyyy') : '-';
            }
          },
          passingExpiry: {
            title: 'Passing Expiry',
            valuePrepareFunction: (date) => {
              return date ? new DatePipe('en-US').transform(date, 'dd/MM/yyyy') : '-';
            }
          },
          status: {
            title: 'Status',
            type: 'html',
            valuePrepareFunction: (value) => {
              if (value === 1) {
                return `<span class='badge badge-success badge-pill'>Active</span>`;
              } else if (value === 2) {
                return `<span class='badge badge-warning badge-pill'>Inactive</span>`;
              } else {
                return `<span class='badge badge-danger badge-pill'>Deleted</span>`;
              }
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
          position: 'right'
        }
      };
      if (this.edit_btn) {
        this.settings.columns.status = {
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
        }
      } else {
        this.settings.columns.status = {
          title: 'Status',
          filter: true,
          type: 'html',
          valuePrepareFunction: (value, rowData) => {
            if (rowData && rowData.status == 1) {
              return `<span style="cursor: pointer;" class='badge badge-success badge-pill mb-1' >Active</span>`
            } else if (rowData && rowData.status == 2) {
              return `<span style="cursor: pointer;" class='badge badge-pill badge-warning mb-1' >Inactive</span>`
            }
          }
        }
      }
      this.settings.actions.custom = this.getSettings.loadSettings(event, this.curentUser, '/app/tags/list', this.userPrivilegeDetails, this.delete_btn, this.edit_btn, this.view_btn);
    };
  };

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
