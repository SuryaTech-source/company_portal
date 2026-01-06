import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup, NgForm } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { generalSettings } from 'src/app/interface/general-setting.interface';
import { Apiconfig } from 'src/app/_helpers/api-config';
import { CURRENCY } from 'src/app/_helpers/currency';
import { ApiService } from 'src/app/_services/api.service';
import { DefaultStoreService } from 'src/app/_services/default-store.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { environment } from "src/environments/environment";
import { AuthenticationService } from 'src/app/_services/authentication.service';
import { PrivilagesData } from 'src/app/menu/privilages';
@Component({
  selector: 'app-gentralsettings',
  templateUrl: './gentralsettings.component.html',
  styleUrls: ['./gentralsettings.component.scss']
})
export class GentralsettingsComponent implements OnInit {

  @ViewChild('gentrelSettingForm') form: NgForm;
  metakeyname: string = '';
  metakeyList: any[] = [];

  submitebtn: boolean = false;
  submitted: boolean = false;
  general: any;
  currencyList: any[] = CURRENCY.filter(x => x.symbol != '');
  faviconPriview: any;
  logoPriview: any;
  sitelogoPriview: any;
  footerLogoPriview: any;
  appIconPriview: any;
  footerIconPreview: any;
  shipIconPreview: any;
  allcatIconPreview: any;
  finalFavicon: File;
  finalfooterLogo: File;
  finalfooterIcon: File;
  finalshipIcon: File;
  finalcatIcon: File;
  finalLogo: File;
  sitefinalLogo: File;
  multipleFiles: any[] = [];
  documentFiles: any[] = [];
  time_slot: string = 'enable'; // Default value for time_slot
  number_of_days: number;
  finalappIcon: File;
  webfoodcategory = [];
  mobilefoodcategory = [];
  currency: any;
  faviconName: string;
  appIconName: string;
  footerIconName: string
  siteIconName: string
  allCatIconName: string
  logoName: string;
  footerLogoName: string;
  shipLogoName: string;
  time_format = ['hh:mm a', 'HH:mm'];
  date_format = ['MMMM dd, YYYY', 'YYYY-MM-dd', 'MM/dd/YYYY', 'dd/MM/YYYY'];
  dateFormat = new Date();
  Preview_files: any = [];
  curentUser: any;

  @ViewChild('additionlimage') addimg;
  review_rat: boolean = false;
  time_slot_check: boolean = false;
  // time_zone: any[] = []
  time_zone_value: any;
  login_image: any;
  login_image_preview: any;
  userPrivilegeDetails: PrivilagesData[];

  register_image: any;
  register_image_preview: any;
  isImageSelected: boolean;
  environment: any = environment.apiUrl;
  viewOnly: boolean = false;
  constructor(
    private apiService: ApiService,
    private notifyService: NotificationService,
    private store: DefaultStoreService,
    private titleService: Title,
    private authService: AuthenticationService,
    @Inject(DOCUMENT) private _document: HTMLDocument,
    private router: Router
  ) {
    this.curentUser = this.authService.currentUserValue;
    if (this.curentUser && this.curentUser.doc.role == "subadmin") {
      if (this.router.url == '/app/settings/gentralsetting' && this.curentUser.doc.privileges) {
        this.userPrivilegeDetails = this.curentUser.doc.privileges.filter(x => x.alias == 'settings');
        // if (!this.userPrivilegeDetails[0].status.view) {
        //   this.notifyService.showWarning('You are not authorized this module');
        //   this.router.navigate(['/app']);
        // };
        if (this.userPrivilegeDetails[0].status.view && !this.userPrivilegeDetails[0].status.edit) {
          this.viewOnly = true;
        } else {
          this.viewOnly = false;
        }

      }
    }
  }

  ngOnInit(): void {
    // this.curency();
    this.apiService.CommonApi(Apiconfig.get_general.method, Apiconfig.get_general.url, {}).subscribe(
      (result) => {
        console.log(result, 'this is the result')

        setTimeout(() => {
          if (result) {
            this.general = result;
            // console.log("this.general.time_zone", this.general.time_zone)
            this.review_rat = this.general.review_rating;
            this.form.form.controls['site_title'].setValue(this.general.site_title);
            this.form.form.controls['site_url'].setValue(this.general.site_url);
            this.form.form.controls['phone'].setValue(this.general.phone);
            this.form.form.controls['meta_title'].setValue(this.general && this.general.meta && this.general.meta.meta_title != (undefined || null || '') ? this.general.meta.meta_title : '');
            this.form.form.controls['meta_description'].setValue(this.general && this.general.meta && this.general.meta.meta_description != (undefined || null || '') ? this.general.meta.meta_description : '');
            this.metakeyList = this.general && this.general.meta && this.general.meta.meta_keyword != (undefined || null || '') ? this.general.meta.meta_keyword : []
            this.form.form.controls['email_address'].setValue(this.general.email_address);
            this.form.form.controls['report_email'].setValue(this.general.report_email ? this.general.report_email : '');
            this.form.form.controls['booking_id'].setValue(this.general.bookingIdPrefix);
            this.form.form.controls['site_address'].setValue(this.general.site_address);
            // this.form.form.controls['search_radius'].setValue(this.general.radius);
            // this.form.form.controls['admin_order'].setValue(this.general.time_out);
            // this.form.form.controls['drivers_order'].setValue(this.general.drivertime_out);
            // this.form.form.controls['billing_cycle'].setValue(this.general.billingcycle);
            // this.form.form.controls['web_header'].setValue(this.general.rcategory ? this.general.rcategory : []);
            this.number_of_days = this.general.delivery_days
            // this.form.form.controls['number_of_days'].setValue(this.general.delivery_days)
            // this.form.form.controls['mobile_header'].setValue(this.general.mrcategory);
            // this.form.form.controls['currency_code'].setValue(this.general.currency_code);
            // this.form.form.controls['currency_symbol'].setValue(this.general.currency_symbol);
            this.setCurrencyValue(); // Call helper to bind if currency list ready
            // this.form.form.controls['site_publish'].setValue(this.general.site_publish);
            // this.form.form.controls['date_format'].setValue(this.general.date_format);
            // this.form.form.controls['time_format'].setValue(this.general.time_format);
            // this.form.form.controls['eta_time'].setValue(this.general.eta_time);
            // this.form.form.controls['time_zone'].setValue(this.general.time_zone ? this.general.time_zone : '');



            this.time_slot = this.general.time_slot;

            console.log("this.time_slot", this.time_slot)

            if (this.time_slot == 'disable') {
              this.time_slot_check = false
            } else {
              this.time_slot_check = true
            }

            if (this.general && this.general.login_image) {
              this.login_image_preview = this.environment + this.general.login_image
              console.log(this.login_image_preview, "this.login_image_preview");

            }
            if (this.general && this.general.register_image) {
              this.register_image_preview = this.environment + this.general.register_image
            }
            this.apiService.imageExists(environment.apiUrl + this.general.favicon, (exists) => {
              if (exists) {
                this.faviconPriview = environment.apiUrl + this.general.favicon;
                this.finalFavicon = this.general.favicon;
                var favname = this.general.favicon.split('/');
                this.faviconName = favname[favname.length - 1];
              }
            });
            this.apiService.imageExists(environment.apiUrl + this.general.logo, (exists) => {
              if (exists) {
                this.logoPriview = environment.apiUrl + this.general.logo;
                this.finalLogo = this.general.logo;
                var favname = this.general.logo.split('/');
                this.logoName = favname[favname.length - 1];
              }
            });

            this.apiService.imageExists(environment.apiUrl + this.general.footer_logo, (exists) => {
              if (exists) {
                this.footerLogoPriview = environment.apiUrl + this.general.footer_logo;
                this.finalfooterLogo = this.general.footer_logo;
                var favname = this.general.footer_logo.split('/');
                this.footerLogoName = favname[favname.length - 1];
              }
            });
            this.apiService.imageExists(environment.apiUrl + this.general.shipping_banner, (exists) => {
              if (exists) {
                this.shipIconPreview = environment.apiUrl + this.general.shipping_banner;
                this.finalshipIcon = this.general.shipping_banner;
                var favname = this.general.shipping_banner.split('/');
                this.shipLogoName = favname[favname.length - 1];
              }
            });
            this.apiService.imageExists(environment.apiUrl + this.general.appicon, (exists) => {
              if (exists) {
                console.log('are you entered in appp icon');

                this.appIconPriview = environment.apiUrl + this.general.appicon;
                this.finalappIcon = this.general.appicon;
                var iconname = this.general.appicon.split('/');
                this.appIconName = iconname[iconname.length - 1];
              }
            })

            this.apiService.imageExists(environment.apiUrl + this.general.footer_icon, (exists) => {
              if (exists) {
                console.log('are you entered in footer icon');

                this.footerIconPreview = environment.apiUrl + this.general.footer_icon;
                this.finalfooterIcon = this.general.footer_icon;
                var iconname = this.general.footer_icon.split('/');
                this.footerIconName = iconname[iconname.length - 1];

              }
            })
            this.apiService.imageExists(environment.apiUrl + this.general.site_logo, (exists) => {
              if (exists) {
                console.log('are you entered in footer icon');

                this.sitelogoPriview = environment.apiUrl + this.general.site_logo;
                this.sitefinalLogo = this.general.site_logo;
                var iconname = this.general.site_logo.split('/');
                this.siteIconName = iconname[iconname.length - 1];

              }
            })
            this.apiService.imageExists(environment.apiUrl + this.general.allcat_banner, (exists) => {
              if (exists) {
                console.log('are you entered in footer icon');

                this.allcatIconPreview = environment.apiUrl + this.general.allcat_banner;
                this.finalcatIcon = this.general.allcat_banner;
                var iconname = this.general.allcat_banner.split('/');
                this.allCatIconName = iconname[iconname.length - 1];

              }
            })


            if (result.splash_screen && result.splash_screen.length > 0) {
              for (let i = 0; i < result.splash_screen.length; i++) {
                console.log(result.splash_screen[i], 'result.splash_screen result.splash_screen result.splash_screen');
                let image = environment.apiUrl + result.splash_screen[i];
                console.log(image, 'this is the image');
                // this.multipleFiles.push(image);
                this.Preview_files.push(image);
              }
            }
          }
        }, 500);
      },
      (error) => {
        console.log(error);
      }
    );
    this.finalFavicon = undefined;
    this.finalfooterLogo = undefined;
    this.finalLogo = undefined;
    this.finalappIcon = undefined;

    this.apiService.CommonApi(Apiconfig.get_foodcategory.method, Apiconfig.get_foodcategory.url, {}).subscribe(
      (result) => {
        this.webfoodcategory = result.list;
        console.log("webfoodcategory", this.webfoodcategory)
        // this.mobilefoodcategory = result.list
      })
    this.apiService.CommonApi(Apiconfig.get_currency.method, Apiconfig.get_currency.url, {}).subscribe(
      (result) => {
        if (result.error == 1) {
          // this.curency()
        } else if (result.error == 0 && result.data) {
          this.currency = result.data.currency;
          this.setCurrencyValue(); // Ensure binding happens if general loaded first
        }
      })

    console.log(this.Preview_files, "privewfiles ....");
    if (this.viewOnly) {
      console.log("This is what I am talking about...");

      this.form?.form.disable();
    }
    // this.apiService.CommonApi(Apiconfig.time_zone.method, Apiconfig.time_zone.url, {}).subscribe(time => {
    //   this.time_zone = time

    //   console.log("this.time_zone", this.time_zone)
    // })
  };

  faviconChange(event) {
    if (event) {

      var file = event.target.files[0];
      console.log(file, 'file');
      if (file.type == 'image/jpeg' || file.type == 'image/png' || file.type == 'image/jpg' || file.type == 'image/webp' || file.type == 'image/x-icon') {
        var reader = new FileReader();
        reader.onload = (evt) => {
          this.faviconPriview = evt.target.result;
          this.finalFavicon = this.dataURLtoFile(this.faviconPriview, 'favicon.png');
        };
        reader.readAsDataURL(file);
      } else {
        this.notifyService.showError('Photo only allows file types of PNG, JPG, ICO and JPEG ');
      }
    }
  }
  logoChange(event) {
    if (event) {
      var file = event.target.files[0];
      if (file.type == 'image/jpeg' || file.type == 'image/png' || file.type == 'image/jpg' || file.type == 'image/webp') {
        var reader = new FileReader();
        reader.onload = (evt) => {
          this.logoPriview = evt.target.result;
          this.finalLogo = this.dataURLtoFile(this.logoPriview, 'logo.png');
        };
        reader.readAsDataURL(file);
      } else {
        this.notifyService.showError('Photo only allows file types of PNG, JPG and JPEG ');
      }
    }
  }
  siteLogoChange(event) {
    if (event) {
      var file = event.target.files[0];
      if (file.type == 'image/jpeg' || file.type == 'image/png' || file.type == 'image/jpg' || file.type == 'image/webp') {
        var reader = new FileReader();
        reader.onload = (evt) => {
          this.sitelogoPriview = evt.target.result;
          this.sitefinalLogo = this.dataURLtoFile(this.sitelogoPriview, 'site_logo.png');
        };
        reader.readAsDataURL(file);
      } else {
        this.notifyService.showError('Photo only allows file types of PNG, JPG and JPEG ');
      }
    }
  }
  footerLogoChange(event) {
    if (event) {
      var file = event.target.files[0];
      if (file.type == 'image/jpeg' || file.type == 'image/png' || file.type == 'image/jpg' || file.type == 'image/webp') {
        var reader = new FileReader();
        reader.onload = (evt) => {
          this.footerLogoPriview = evt.target.result;
          this.finalfooterLogo = this.dataURLtoFile(this.footerLogoPriview, 'footer_logo.png');
        };
        reader.readAsDataURL(file);
      } else {
        this.notifyService.showError('Photo only allows file types of PNG, JPG and JPEG ');
      }
    }
  };
  getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
  detectFiles(event) {
    if (event.target.files && event.target.files[0]) {
      let files = event.target.files;
      console.log(files);

      for (let index = 0; index < files.length; index++) {
        if (this.multipleFiles.length <= 6) {

          let fileSize = files[index].size;
          let fileType = files[index].type;
          let isDocument = files[index].name.split('.')[1];
          if (fileType == "image/png" || fileType == "image/jpeg" || fileType == "image/jpg" || fileType == "application/pdf" || isDocument == "doc" || isDocument == "docx") {
            if (fileSize / 1024 > 15360) {
              return this.notifyService.showError('Error!, Allowed only maximum of 15MB');
            }
            this.getBase64(files[index]).then(
              (data: any) => {
                this.multipleFiles.push(data);
                this.Preview_files.push(data);
                this.isImageSelected = true;
              }
            );
            // this.multipleFiles.push(file)
            // var reader = new FileReader();
            // reader.onload = (event:any) => {
            //   this.Preview_files.push((event.target.result)); 
            // }            
            // reader.readAsDataURL(file);         
          } else {
            this.notifyService.showError('Only support Pdf, Jpg, Png, Jpeg');
          }
        } else {
          this.notifyService.showError('Sorry, Allowed only 7 images');
        }
      }
      // for (let file of files) {         
      //   let fileSize = file.size;
      //   let fileType = file['type'];
      //   let isDocument = file.name.split('.')[1];
      //   if (fileType == "image/png" || fileType == "image/jpeg" || fileType == "image/jpg" || fileType == "application/pdf" || isDocument == "doc" || isDocument == "docx") {
      //     if (fileSize / 1024 > 15360) {
      //       return this.notifyService.showError('Error!, Allowed only maximum of 15MB');
      //     }
      //     this.getBase64(file).then(
      //       (data: any) =>
      //       {
      //         this.multipleFiles.push(data);
      //         this.Preview_files.push(data); 
      //       }
      //     );
      //     // this.multipleFiles.push(file)
      //     // var reader = new FileReader();
      //     // reader.onload = (event:any) => {
      //     //   this.Preview_files.push((event.target.result)); 
      //     // }            
      //     // reader.readAsDataURL(file);         
      //   } else {
      //     this.notifyService.showError('Only support Pdf, Jpg, Png, Jpeg');
      //   }  

      // }

    }
  }
  appIconChange(event) {
    if (event) {
      var file = event.target.files[0];
      if (file.type == 'image/jpeg' || file.type == 'image/png' || file.type == 'image/jpg' || file.type == 'image/webp') {
        var reader = new FileReader();
        reader.onload = (evt) => {
          this.appIconPriview = evt.target.result;
          this.finalappIcon = this.dataURLtoFile(this.appIconPriview, 'appicon.png');

        };
        reader.readAsDataURL(file);
      } else {
        this.notifyService.showError('Photo only allows file types of PNG, JPG and JPEG ');
      }
    }
  };

  footerIconChange(event) {
    if (event) {
      var file = event.target.files[0];
      if (file.type == 'image/jpeg' || file.type == 'image/png' || file.type == 'image/jpg' || file.type == 'image/webp') {
        var reader = new FileReader();
        reader.onload = (evt) => {
          this.footerIconPreview = evt.target.result;
          this.finalfooterIcon = this.dataURLtoFile(this.footerIconPreview, 'footericon.png');

        };
        reader.readAsDataURL(file);
      } else {
        this.notifyService.showError('Photo only allows file types of PNG, JPG and JPEG ');
      }
    }
  };
  addmetamanage(event) {
    const input = (event.target as HTMLInputElement).value.trim();
    if (event.which == 13 && input) {
      this.metakeyList.push(event.target.value);
      this.metakeyname = '';
    }
  }
  shippingIconChange(event) {
    if (event) {
      var file = event.target.files[0];
      if (file.type == 'image/jpeg' || file.type == 'image/png' || file.type == 'image/jpg' || file.type == 'image/webp') {
        var reader = new FileReader();
        reader.onload = (evt) => {
          this.shipIconPreview = evt.target.result;
          this.finalshipIcon = this.dataURLtoFile(this.shipIconPreview, 'shipping_logo.png');

        };
        reader.readAsDataURL(file);
      } else {
        this.notifyService.showError('Photo only allows file types of PNG, JPG and JPEG ');
      }
    }
  };
  allowOnlyPhoneNumbers(event: KeyboardEvent): boolean {
    const charCode = event.charCode;

    // Allow only numbers (0-9), spaces (32), and plus (+) symbol (43)
    if (
      (charCode >= 48 && charCode <= 57) || // Numbers
      charCode === 32 || // Space
      charCode === 43 // Plus symbol
    ) {
      return true;
    } else {
      event.preventDefault();
      return false;
    }
  }
  allcatIconChange(event) {
    if (event) {
      var file = event.target.files[0];
      if (file.type == 'image/jpeg' || file.type == 'image/png' || file.type == 'image/jpg' || file.type == 'image/webp') {
        var reader = new FileReader();
        reader.onload = (evt) => {
          this.allcatIconPreview = evt.target.result;
          this.finalcatIcon = this.dataURLtoFile(this.allcatIconPreview, 'allcategory_logo.png');

        };
        reader.readAsDataURL(file);
      } else {
        this.notifyService.showError('Photo only allows file types of PNG, JPG and JPEG ');
      }
    }
  };
  // appIconChange(event){
  //   console.log(event,'this is event');

  //   if(event){
  //     var file= event.target.file[0];
  //     if (file.type == 'image/jpeg' || file.type == 'image/png' || file.type == 'image/jpg') {
  //       var reader = new FileReader()
  //       reader.onload=(evt)=>{
  //         this.appIconPriview= evt.target.result;
  //         this.finalappIcon= this.dataURLtoFile(this.appIconPriview,'app_icon.png');
  //       }
  //       reader.readAsDataURL(file);
  //     }else{
  //       this.notifyService.showError('Photo only allows file types of PNG, JPG and JPEG ');
  //     }
  //   }
  // }

  dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

  currencyChange(value) {
    let code = value;
    if (value && typeof value === 'object' && value.code) {
      code = value.code;
    }

    if (code && this.currency) {
      const selectedCurrency = this.currency.find(x => x.code == code);
      if (selectedCurrency) {
        this.form.form.controls['currency_symbol'].setValue(selectedCurrency.symbol);
      }
    }
  }

  setCurrencyValue() {
    if (this.general && this.general.currency_code && this.currency && this.currency.length > 0) {
      // Only set if we haven't touched it or if it's empty/needs setting
      // But for initialization, we just want to ensure the form control has the value
      // that matches the list.
      const code = this.general.currency_code;
      // Check if code exists in list to avoid selecting something invalid?
      // Usually ng-select handles that, but setting it explicitly helps.
      this.form.form.controls['currency_code'].setValue(code);

      // Also set the symbol initially
      const selectedCurrency = this.currency.find(x => x.code == code);
      if (selectedCurrency) {
        this.form.form.controls['currency_symbol'].setValue(selectedCurrency.symbol);
      }
    }
  }

  reloadComponent() {
    let currentUrl = this.router.url;
    window.location.reload()
    // console.log(currentUrl, 'currentUrl');
    // this.router.navigateByUrl('/', { skipLocationChange: true }).then(() =>
    //   this.router.navigate([currentUrl]));
  }
  curency() {
    var currency = {
      'AED': 'د.إ',
      'AFN': '؋',
      'ALL': 'L',
      'AMD': '֏',
      'ANG': 'ƒ',
      'AOA': 'Kz',
      'ARS': '$',
      'AUD': '$',
      'AWG': 'ƒ',
      'AZN': '₼',
      'BAM': 'KM',
      'BBD': '$',
      'BDT': '৳',
      'BGN': 'лв',
      'BHD': '.د.ب',
      'BIF': 'FBu',
      'BMD': '$',
      'BND': '$',
      'BOB': '$b',
      'BRL': 'R$',
      'BSD': '$',
      'BTC': '฿',
      'BTN': 'Nu.',
      'BWP': 'P',
      'BYR': 'Br',
      'BYN': 'Br',
      'BZD': 'BZ$',
      'CAD': '$',
      'CDF': 'FC',
      'CHF': 'CHF',
      'CLP': '$',
      'CNY': '¥',
      'COP': '$',
      'CRC': '₡',
      'CUC': '$',
      'CUP': '₱',
      'CVE': '$',
      'CZK': 'Kč',
      'DJF': 'Fdj',
      'DKK': 'kr',
      'DOP': 'RD$',
      'DZD': 'دج',
      'EEK': 'kr',
      'EGP': '£',
      'ERN': 'Nfk',
      'ETB': 'Br',
      'ETH': 'Ξ',
      'EUR': '€',
      'FJD': '$',
      'FKP': '£',
      'GBP': '£',
      'GEL': '₾',
      'GGP': '£',
      'GHC': '₵',
      'GHS': 'GH₵',
      'GIP': '£',
      'GMD': 'D',
      'GNF': 'FG',
      'GTQ': 'Q',
      'GYD': '$',
      'HKD': '$',
      'HNL': 'L',
      'HRK': 'kn',
      'HTG': 'G',
      'HUF': 'Ft',
      'IDR': 'Rp',
      'ILS': '₪',
      'IMP': '£',
      'INR': '₹',
      'IQD': 'ع.د',
      'IRR': '﷼',
      'ISK': 'kr',
      'JEP': '£',
      'JMD': 'J$',
      'JOD': 'JD',
      'JPY': '¥',
      'KES': 'KSh',
      'KGS': 'лв',
      'KHR': '៛',
      'KMF': 'CF',
      'KPW': '₩',
      'KRW': '₩',
      'KWD': 'KD',
      'KYD': '$',
      'KZT': 'лв',
      'LAK': '₭',
      'LBP': '£',
      'LKR': '₨',
      'LRD': '$',
      'LSL': 'M',
      'LTC': 'Ł',
      'LTL': 'Lt',
      'LVL': 'Ls',
      'LYD': 'LD',
      'MAD': 'MAD',
      'MDL': 'lei',
      'MGA': 'Ar',
      'MKD': 'ден',
      'MMK': 'K',
      'MNT': '₮',
      'MOP': 'MOP$',
      'MRO': 'UM',
      'MRU': 'UM',
      'MUR': '₨',
      'MVR': 'Rf',
      'MWK': 'MK',
      'MXN': '$',
      'MYR': 'RM',
      'MZN': 'MT',
      'NAD': '$',
      'NGN': '₦',
      'NIO': 'C$',
      'NOK': 'kr',
      'NPR': '₨',
      'NZD': '$',
      'OMR': '﷼',
      'PAB': 'B/.',
      'PEN': 'S/.',
      'PGK': 'K',
      'PHP': 'PHP',
      'PKR': '₨',
      'PLN': 'zł',
      'PYG': 'Gs',
      'QAR': '﷼',
      'RMB': '￥',
      'RON': 'lei',
      'RSD': 'Дин.',
      'RUB': '₽',
      'RWF': 'R₣',
      'SAR': '﷼',
      'SBD': '$',
      'SCR': '₨',
      'SDG': 'ج.س.',
      'SEK': 'kr',
      'SGD': '$',
      'SHP': '£',
      'SLL': 'Le',
      'SOS': 'S',
      'SRD': '$',
      'SSP': '£',
      'STD': 'Db',
      'STN': 'Db',
      'SVC': '$',
      'SYP': '£',
      'SZL': 'E',
      'THB': '฿',
      'TJS': 'SM',
      'TMT': 'T',
      'TND': 'د.ت',
      'TOP': 'T$',
      'TRL': '₤',
      'TRY': '₺',
      'TTD': 'TT$',
      'TVD': '$',
      'TWD': 'NT$',
      'TZS': 'TSh',
      'UAH': '₴',
      'UGX': 'USh',
      'USD': '$',
      'UYU': '$U',
      'UZS': 'лв',
      'VEF': 'Bs',
      'VND': '₫',
      'VUV': 'VT',
      'WST': 'WS$',
      'XAF': 'FCFA',
      'XBT': 'Ƀ',
      'XCD': '$',
      'XOF': 'CFA',
      'XPF': '₣',
      'YER': '﷼',
      'ZAR': 'R',
      'ZWD': 'Z$'
    }
    this.currency = Object.entries(currency)
    var newarr = [];
    var nest = this.currency.forEach((element, i) => {
      var data = {
        code: element[0],
        symbol: element[1]
      }
      newarr.push(data)
    });

    this.apiService.CommonApi(Apiconfig.save_cuurency.method, Apiconfig.save_cuurency.url, { currency: newarr }).subscribe(
      (result) => {
      })
  }


  public onFormSubmit(gentrelSettingForm: UntypedFormGroup) {
    this.submitted = true;

    console.log(this.metakeyList, "this.metakeyList");

    console.log(gentrelSettingForm.value, 'form value....')
    console.log(gentrelSettingForm, "gentrelSettingForm.valid");

    if (gentrelSettingForm.valid) {
      if (this.time_slot === 'disable' && (!this.number_of_days || this.number_of_days <= 0)) {
        return this.notifyService.showError("Invalid Number of day delivery")
      }
      this.submitebtn = true;
      let formData = new FormData();
      if (typeof this.finalFavicon != 'undefined' && this.finalFavicon) {
        formData.append('favicon', this.finalFavicon);
      };
      if (typeof this.finalLogo != 'undefined' && this.finalLogo) {
        formData.append('logo', this.finalLogo);
      };
      if (typeof this.finalfooterLogo != 'undefined' && this.finalfooterLogo) {
        formData.append('footer_logo', this.finalfooterLogo);
      };
      if (typeof this.finalfooterIcon != 'undefined' && this.finalfooterIcon) {
        console.log(this.finalfooterIcon, 'this is final finalFooter');
        formData.append('footer_icon', this.finalfooterIcon);
      };
      if (typeof this.sitefinalLogo != 'undefined' && this.sitefinalLogo) {
        console.log(this.sitefinalLogo, 'this is final finalFooter');
        formData.append('site_logo', this.sitefinalLogo);
      };
      if (typeof this.finalshipIcon != 'undefined' && this.finalshipIcon) {
        console.log(this.finalshipIcon, 'this is final finalFooter');
        formData.append('shipping_banner', this.finalshipIcon);
      };
      if (typeof this.finalcatIcon != 'undefined' && this.finalcatIcon) {
        console.log(this.finalcatIcon, 'this is final finalFooter');
        formData.append('allcat_banner', this.finalcatIcon);
      };
      console.log(this.finalappIcon, 'this.finalappIcon this.finalappIcon___________________');
      if (typeof this.finalappIcon != 'undefined' && this.finalappIcon) {
        console.log(this.finalappIcon, 'this is final appIcon++++++++++++++++++++');
        formData.append('appicon', this.finalappIcon);
      }
      var data = gentrelSettingForm.value;

      // this.formdata.meta_title = details.meta_title;
      // this.formdata.meta_keyword = this.metakeyList;
      // this.formdata.meta_description = details.meta_description;
      formData.append('meta_title', data.meta_title);
      console.log(this.metakeyList, "this.metakeyList");

      formData.append('meta_keyword', JSON.stringify(this.metakeyList));
      formData.append('meta_description', data.meta_description);
      formData.append('site_title', data.site_title);
      formData.append('site_url', data.site_url);
      formData.append('phone', data.phone);
      formData.append('email_address', data.email_address);
      formData.append('report_email', data.report_email);
      formData.append('time_slot', this.time_slot)
      formData.append('bookingIdPrefix', data.booking_id);
      formData.append('site_address', data.site_address);
      // formData.append('radius', data.search_radius);
      formData.append('time_out', data.admin_order);
      // formData.append('drivertime_out', data.drivers_order);
      // formData.append('billingcycle', data.billing_cycle);
      formData.append('currency_code', data.currency_code);
      formData.append('currency_symbol', data.currency_symbol);
      // formData.append('site_publish', data.site_publish);
      formData.append('date_format', data.date_format);
      formData.append('time_format', data.time_format);
      formData.append('review_rating', this.review_rat + '');
      formData.append('delivery_days', this.number_of_days + '');

      // formData.append('time_zone', data.time_zone);
      // console.log(data, 'time_zone_value');

      if (this.multipleFiles && this.multipleFiles.length > 0) {
        for (let i = 0; i < this.multipleFiles.length; i++) {
          formData.append('multiBase64', this.multipleFiles[i]);
        }
      };

      if (this.login_image) {
        formData.append("login_image", this.login_image)
      } else if (this.general) {
        formData.append("login_image", this.general.login_image)
      }
      if (this.register_image) {
        formData.append("register_image", this.register_image)
      } else if (this.general) {
        formData.append("register_image", this.general.register_image)
      }
      // formData.multiBase64 = this.multipleFiles;
      // formData.append('eta_time', data.eta_time);
      // formData.append('wallet', data.eta_time);
      // formData.append('wallet[amount][minimum_recharge]', null);
      // formData.append('wallet[amount][minimum_request]', null);
      // formData.append('wallet[amount][minimum_amount]', null);
      // formData.append('wallet[amount][maximum_amount]', null);
      // for (let index = 0; index < data.web_header.length; index++) {
      //   formData.append(`rcategory[${index}]`, data.web_header[index]);
      // }
      // for (let index = 0; index < data.mobile_header.length; index++) {
      //   formData.append(`mrcategory[${index}]`, data.mobile_header[index]);
      // }
      // console.log(formData,"formData");

      // return
      this.apiService.CommonApi(Apiconfig.save_general.method, Apiconfig.save_general.url, formData).subscribe(
        (result) => {
          console.log(result, 'this is the result');

          if (result) {
            this.reloadComponent();
            this.notifyService.showSuccess("Succesfully Updated");
          } else {
            this.notifyService.showSuccess("Not Updated");
          }
          this.submitebtn = false;
        }, (error) => {
          this.submitebtn = false;
        }
      )
    } else {
      this.notifyService.showError('Please Enter all mandatory fields');
    }
  }
  removemetaTag(index) {
    this.metakeyList.splice(index, 1);
    console.log(this.metakeyList, "this.metakeyList")
  }
  closeMultiImage(index: number, url) {
    console.log(url, 'url and', index, ' index');

    if (this.multipleFiles.length > 0) {
      if (index > -1) {
        this.apiService.CommonApi(Apiconfig.delete_splachScreen.method, Apiconfig.delete_splachScreen.url, index).subscribe((res) => {
          console.log(res, 'res');
        })
        this.Preview_files.splice(index, 1);
        var findIndex = this.multipleFiles.indexOf(url);
        if (findIndex != -1) {
          this.multipleFiles.splice(findIndex, 1);
        }
        if (this.documentFiles) {
          var find_Index = this.documentFiles.indexOf(url);
          if (find_Index != -1) {
            this.documentFiles.splice(find_Index, 1);
          }
        }
        if (this.multipleFiles.length == 0) {
          this.addimg.nativeElement.value = ''
          this.isImageSelected = false;
        }
      }
    } else {
      if (index > -1) {
        this.apiService.CommonApi(Apiconfig.delete_splachScreen.method, Apiconfig.delete_splachScreen.url, { id: index }).subscribe((res) => {
          if (res.error == true) {
            this.notifyService.showError(res.message);
          } else {
            this.notifyService.showSuccess(res.message)
          }
        })
        this.Preview_files.splice(index, 1);
        if (this.documentFiles) {
          this.documentFiles.splice(index, 1);
        }
      }
    }
  }

  change_timeSlot(event) {
    console.log(event, "change_timeSlot")
    if (event) {
      this.time_slot = "enable";
    } else {
      this.time_slot = "disable";
      this.number_of_days = 1;
    }
  }

  loginImageChange(file) {
    if (file) {
      this.login_image = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.login_image_preview = reader.result as string;
      }
      reader.readAsDataURL(file);
    }
  }
  registerImageChange(file) {
    if (file) {
      this.register_image = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.register_image_preview = reader.result as string;
      }
      reader.readAsDataURL(file);
    }
  }

}
