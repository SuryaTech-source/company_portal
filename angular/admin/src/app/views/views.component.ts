import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, Inject, OnInit, TemplateRef } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router, ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { settings } from '../interface/interface';
import { navItems } from '../menu/_nav';
import { Apiconfig } from '../_helpers/api-config';
import { ApiService } from '../_services/api.service';
import { AuthenticationService } from '../_services/authentication.service';
import { DefaultStoreService } from '../_services/default-store.service';
import { NotificationService } from '../_services/notification.service';
import { WebSocketService } from '../_services/webSocketService.service';
import { filter, map } from 'rxjs/operators';
import { SpinnerService } from '../_services/spinner.service';
import { PopupService } from '../_services/popup.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
@Component({
  selector: 'app-views',
  templateUrl: './views.component.html',
  styleUrls: ['./views.component.scss']
})
export class ViewsComponent implements OnInit, AfterViewInit {

  minimized = false;
  public navItems = [...navItems];
  settings: settings;
  currentDate: Date = new Date();
  icon: string = 'assets/image/icon.svg';
  currentUrl: string = '';
  selectedParentMenu: string = '';
  total: any;
  pendingOrderlength: any;
  pendingOrders: any;
  pendingDriverlength: any;
  pendingDrivers: any;
  currentuser: any;
  privileges: any;
  modalLogoutRef: BsModalRef;
  logo: string = '';
  profile : string;

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private apiService: ApiService,
    private titleService: Title,
    private store: DefaultStoreService,
    private notifyService: NotificationService,
    @Inject(DOCUMENT) private _document: HTMLDocument,
    private socketService: WebSocketService,
    private meta: Meta,
    private activatedRoute: ActivatedRoute,
    private spinner: SpinnerService,
    private popupService: PopupService,
    private modalService: BsModalService,

  ) {
    let userObj
     if(localStorage.getItem('currentAdmin')){

      let user = localStorage.getItem('currentAdmin');
       userObj = JSON.parse(user);
     }

     let userName = userObj.doc.name||"User";
        this.profile =this.generateDefaultImage(userName)

    this.apiService.CommonApi(Apiconfig.landingData.method, Apiconfig.landingData.url, {}).subscribe(
      (result) => {
        if (result && result.site_url) {
          this.settings = result;
          this.apiService.setAppFavicon(this.settings.favicon);
          this.titleService.setTitle(this.settings.site_title);
          this.store.generalSettings.next(this.settings);
          this.meta.updateTag({ name: 'og:title', content: this.settings.site_title });

          this.apiService.imageExists(environment.apiUrl + this.settings.admin_profile, (exists) => {
            if (exists) {
              this._document.getElementsByClassName('img-avatar')[0].setAttribute('src', environment.apiUrl + this.settings.admin_profile);
            }
          });
          this.apiService.imageExists(environment.apiUrl + this.settings.logo, (exists) => {
            if (exists) {
              this.icon = environment.apiUrl + this.settings.favicon;
              this.logo = environment.apiUrl + this.settings.logo
              console.log(this.logo);

            }
          });
        }
      },
      (error) => {
        console.log(error);
      }
    );
    console.log(this.logo);

    this.apiService.tapObservable$.subscribe(result => {
      if (result) {
        this.notificationData();
      }
    })
  }
  audioplay() {
    var sounds = new Audio();
    sounds.src = "assets/audio/Notification.mp3";
    sounds.load();
    sounds.play();
    setTimeout(() => {
      sounds.pause()
    }, 1000)
  }
  ngOnInit(): void {
    this.notificationData()




    // this.apiService.CommonApi(Apiconfig.currentuser.method, Apiconfig.currentuser.url, { currentUserData: this.authService.currentUserValue.user }).subscribe(result => {
    //   this.currentuser = result[0]
    //   this.privileges = result[0].privileges
    //   this.authService.currentUserSubject.next(this.currentuser);
    //   console.log("this.current", this.currentuser)
    // })


    this.socketService.listen('order_notification_to_admin').subscribe(data => {
      if (data) {
        this.audioplay()
        this.notifyService.showInfo(data.data);
        this.apiService.CommonApi(Apiconfig.pendinglist.method, Apiconfig.pendinglist.url, {}).subscribe(
          (result) => {
            this.pendingOrderlength = result[2].length
            this.pendingOrders = result[2]
            this.pendingDriverlength = result[1].length
            this.pendingDrivers = result[1]
            this.total = this.pendingOrderlength
          })
      }
    })


    this.socketService.listen('joinNotifyRoom').subscribe(data => {
      if (data && data != '') {
        console.log('room joined');
      }
    });
    this.socketService.listen('admin_new_debate').subscribe(data => {
      if (data && data != '') {
        if (data.message && data.message != '') {
          this.notificationMessage(data, this.settings.site_title, this.icon, this.router);
        }
      }
    });
    this.socketService.listen('admin_debate_new_request').subscribe(data => {
      if (data && data != '') {
        if (data.message && data.message != '') {
          this.notificationMessage(data, this.settings.site_title, this.icon, this.router);
        }
      }
    });
    this.socketService.listen('admin_debate_leave_request').subscribe(data => {
      if (data && data != '') {
        if (data.message && data.message != '') {
          this.notificationMessage(data, this.settings.site_title, this.icon, this.router);
        }
      }
    });
    this.socketService.listen('admin_debate_participate_accept').subscribe(data => {
      if (data && data != '') {
        if (data.message && data.message != '') {
          this.notificationMessage(data, this.settings.site_title, this.icon, this.router);
        }
      }
    });
    this.socketService.listen('admin_debate_participate_remove').subscribe(data => {
      if (data && data != '') {
        if (data.message && data.message != '') {
          this.notificationMessage(data, this.settings.site_title, this.icon, this.router);
        }
      }
    });
    this.socketService.listen('admin_debate_participate_reject').subscribe(data => {
      if (data && data != '') {
        if (data.message && data.message != '') {
          this.notificationMessage(data, this.settings.site_title, this.icon, this.router);
        }
      }
    });
    this.socketService.listen('admin_debate_add_to_feed').subscribe(data => {
      if (data && data != '') {
        if (data.message && data.message != '') {
          this.notificationMessage(data, this.settings.site_title, this.icon, this.router);
        }
      }
    });
    this.socketService.listen('admin_debate_completed').subscribe(data => {
      if (data && data != '') {
        if (data.message && data.message != '') {
          this.notificationMessage(data, this.settings.site_title, this.icon, this.router);
        }
      }
    });
    this.socketService.listen('admin_join_debate').subscribe(data => {
      if (data && data != '') {
        if (data.message && data.message != '') {
          this.notificationMessage(data, this.settings.site_title, this.icon, this.router);
        }
      }
    });
    this.socketService.listen('admin_start_debate').subscribe(data => {
      if (data && data != '') {
        if (data.message && data.message != '') {
          this.notificationMessage(data, this.settings.site_title, this.icon, this.router);
        }
      }
    });
    this.socketService.listen('admin_debate_delete').subscribe(data => {
      if (data && data != '') {
        if (data.message && data.message != '') {
          this.notificationMessage(data, this.settings.site_title, this.icon, this.router);
        }
      }
    });
    // this.socketService.listen('new_follow').subscribe(data => {
    //   console.log(data);
    // });

    this.socketService.listen('sub_admin_logout').subscribe(data => {
      if (data && data.message) {
        this.notifyService.showWarning(data.message);
        this.logout();
      }
    });

    this.socketService.listen('subadmin_change').subscribe(data => {
      this.notifyService.showWarning('Your Access Data Changed From Admin.');
      this.sidebarFunction();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) { route = route.firstChild; }
          return route;
        })
      ).subscribe((event) => {
        const path = this.router.url.split('?')[0];
        const paramtersLen = Object.keys(event.snapshot.params).length;
        const pathArr = path.split('/').slice(0, path.split('/').length - paramtersLen);
        this.currentUrl = pathArr.join('/');
      });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const toParentUrl = this.currentUrl.split('/').filter(x => x !== '')[1];
      if (toParentUrl !== undefined || toParentUrl !== null) {
        this.selectedParentMenu = toParentUrl.toLowerCase();
      } else {
        this.selectedParentMenu = 'dashboards';
      }
      window.scrollTo(0, 0);
    });
    this.sidebarFunction()




  };

  notificationData() {
    this.apiService.CommonApi(Apiconfig.pendinglist.method, Apiconfig.pendinglist.url, {}).subscribe(
      (result) => {
        this.pendingOrderlength = result[2].length
        this.pendingOrders = result[2]
        this.pendingDriverlength = result[1].length
        this.pendingDrivers = result[1]
        this.total = this.pendingOrderlength
      })
  }

generateDefaultImage(name: string) {
    // Create a canvas element
    const canvas = document.createElement("canvas");
    canvas.style.display = "none";
    canvas.width = 32;
    canvas.height = 32;
    document.body.appendChild(canvas);
    const context = canvas.getContext("2d")!;
    
    // Generate a color based on the initials
    const initials = this.getInitials(name);
    const color = this.getColorFromInitials(initials);
  
    // Fill the canvas with the generated color
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);
  
    // Set font and text color
    context.font = "14px Helvetica";
    context.fillStyle = "#fff";
  
    // Draw the initials on the canvas
    if (initials.length > 1) {
      context.fillText(initials.toUpperCase(), 6, 22);
    } else {
      context.fillText(initials.toUpperCase(), 11, 22);
    }
  
    // Convert the canvas to a data URL
    const data = canvas.toDataURL();
    document.body.removeChild(canvas);
    return data;
  }
  
  // Function to extract initials from a name
  getInitials(name: string): string {
    const nameArray = name.split(" ");
    let initials = "";
    for (let i = 0; i < nameArray.length; i++) {
      if (i <= 1) {
        initials = initials + nameArray[i][0];
      }
    }
    return initials;
  }
  
  // Function to generate a dark color based on initials
  getColorFromInitials(initials: string): string {
    const hash = initials.charCodeAt(0) + (initials.length > 1 ? initials.charCodeAt(1) : 0);
    const hue = hash % 360; 
    return `hsl(${hue}, 70%, 20%)`; // Darker shade with lightness set to 20%
  }


  sidebarFunction() {
    // this.spinner.loadingSpinner.next(false)
    console.log("If this work it is a lotary________________-----------------------------________________");

    this.apiService.CommonApi(Apiconfig.get_general.method, Apiconfig.get_general.url, {}).subscribe(
      (result) => {
        const settings = result;
        console.log(settings, 'this are settings');
        console.log(this.navItems, 'this are nav itemssssssssss');
        let menu = [];
        menu.push(this.navItems[0])
        if (settings.time_slot == 'disable') {
          this.navItems.forEach((value) => {
            console.log(value, 'this isvalue');
            var checkmodule = ["Administrators","Employees", "Vendors","Contracts", "Drivers", "Combo Offers", "Banners", "Customers", "Categories", "Products", "Coupon Management", "Coupons", "Email Template", "Orders", 'Walkthrough Images', "Reviews & Ratings", "Settings", "Site Earnings", "Payment Gateway", "Units/Metrics", "Page List", "language", "Layout Control", "Reports", "Fuel Records","Spare Parts", "Maintenance", "Performance Analysis", "Shipping", "Banner Types", "Offer Management", "Fleet", "Invoice"];
            if (value.name && checkmodule.includes(value.name)) {
              menu.push(value);
            }
          });
          this.navItems = menu;
        } else {
          this.navItems.forEach((value) => {
            console.log(value, 'this isvalue');
            var checkmodule = ["Administrators","Employees", "Vendors","Contracts", "Drivers", "Combo Offers", "Banners", "Customers", "Categories", "Products", "Coupon Management", "Coupons", "Email Template", "Orders", 'Walkthrough Images', "Reviews & Ratings", "Settings", "Site Earnings", "Payment Gateway", "Units/Metrics", "Page List", "language", "Time Slots", "Layout Control", "Reports", "Fuel Records","Spare Parts", "Maintenance", "Performance Analysis", "Shipping", "Banner Types", "Offer Management", "Fleet", "Invoice"];
            if (value.name && checkmodule.includes(value.name)) {
              menu.push(value);
            }
          });
          this.navItems = menu;
        }
        // this.ngOnInit()
      });

    var currentUser = this.authService.currentUserValue;
    console.log(currentUser, 'currentUsercurrentUsercurrentUsercurrentUser');

    if (this.authService.currentUserValue.doc.role == "subadmin") {
      this.apiService.CommonApi(Apiconfig.currentuser.method, Apiconfig.currentuser.url, { currentUserData: this.authService.currentUserValue.doc.username }).subscribe(
        (result) => {
          console.log("result__________", result)
          if (result.status) {
            // console.log('////////////////', result);
            localStorage.setItem('currentAdmin', JSON.stringify(result));
            this.authService.currentUserSubject.next(result);
            currentUser.privileges = result.doc.privileges;
            let menu = [];
            menu.push(this.navItems[0])
            console.log('MMMMMMMMMMMMMMMMMmmmmmmmmmmmmmmmmmmmmmmmMMMMMMMMMMMMMMMMMM', menu, 'this is MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMmmmmmmmmmmmmmmmmmmmmmmmmmmmMMMMMMMMMM');


            this.navItems.forEach((value) => {
              let index = result.doc.privileges.findIndex(x => x.alias == value.id);
              if (index != -1) {
                if (
                  currentUser.privileges[index].status.view ||
                  currentUser.privileges[index].status.add ||
                  currentUser.privileges[index].status.edit ||
                  currentUser.privileges[index].status.delete ||
                  currentUser.privileges[index].status.export ||
                  currentUser.privileges[index].status.bulk
                ) {
                  const checkmodule = ["Administrators","Employees", "Vendors", "Drivers", "Combo Offers", "Banners", "Customers", "Categories", "Products", "Coupon Management", "Coupons", "Email Template", "Orders", 'Walkthrough Images', "Reviews & Ratings", "Settings", "Site Earnings", "Payment Gateway", "Units/Metrics", "Page List", "language", "Time Slots", "Layout Control", "Reports", "Shipping", "Banner Types", "Offer Management", "Feet"];

                  console.log(value.children, 'value.children');
                  console.log(value.id, 'value.id');
                  console.log(value, 'value');

                  // Check if user lacks 'add' or 'report' privileges
                  if (!currentUser.privileges[index].status.add) {
                    if (value.children) {
                      // If 'add' is disabled, filter 'add' children
                      // if (!currentUser.privileges[index].status.add) {
                      // if (checkmodule.includes(value.id)) {
                      value.children = value.children.filter(x => x.id !== 'add');
                      // }
                      // }

                      // If 'report' is disabled, filter 'report' children
                      // if (!currentUser.privileges[index].status.report) {
                      //   // if (checkmodule.includes(value.id)) {
                      //     value.children = value.children.filter(x => x.id !== 'report');
                      //   // }
                      // }
                    }
                  }
                  else if (!currentUser.privileges[index].status.edit && !currentUser.privileges[index].status.view && !currentUser.privileges[index].status.delete && !currentUser.privileges[index].status.export && !currentUser.privileges[index].status.bulk) {
                    if (value.children) {
                      // If 'add' is disabled, filter 'add' children
                      // if (checkmodule.includes(value.id)) {
                      value.children = value.children.filter(x => x.id !== 'list');
                      // }


                    }
                  }

                  // condition for category
                  // if(value.id=='category'){ 
                  //   if(!currentUser.privileges[index].status.edit && !currentUser.privileges[index].status.delete){
                  //     value.children=value.children.filter(x=>x.name!=="Sub Category List")
                  //   }
                  // }

                  // Always push the value after conditions are processed
                  menu.push(value);
                }

              }
              // let index = result.doc.privileges.findIndex(x => x.alias == value.id);



            });
            this.navItems = menu;
          }
        });
    }
  }

  notificationMessage(data, title, icon, router) {
    var message = data.message ? data.message : '';
    Notification.requestPermission(function (permission) {
      var notification = new Notification(title ? title : "Voizout", { body: message, icon: icon, dir: 'auto' });
      notification.onclick = () => {
        if (data && data.debate_id && data.debate_id != '') {
          window.location.href = '/app/debate/view/' + data.debate_id
        }
      };
      setTimeout(function () {
        notification.close();
      }, 5000);
    });
  }

  ngAfterViewInit(): void {
    this.authService.currentUser.subscribe(val => {
      if (val && typeof val._id != 'undefined') {
        this.socketService.emit('joinNotifyRoom', { user: val._id });
      }
    });
  }

  toggleMinimize(e) {
    this.minimized = e;
  }

  logout() {
    this.modalLogoutRef.hide()
    this.authService.currentUser.subscribe(val => {
      if (val && typeof val._id != 'undefined') {
        this.socketService.emit('disconnect', { user: val._id });
      }
    });
    this.authService.logout();
    this.notifyService.showSuccess('Logged out successfully!');
    setTimeout(() => {
      this.router.navigate(['/auth']);
    }, 1000);
  }

  confirmPopunModal() {
    this.popupService.confirmModal();
  }
  confirmPopunModalflag() {
    this.popupService.confirmFlagModal();
  }
  logOutPop(template: TemplateRef<any>) {
    this.modalLogoutRef = this.modalService.show(template, { id: 1, class: 'logoutPop-model', ignoreBackdropClick: false })
  }
  destroyPopup() {
    this.modalLogoutRef.hide();
  }

}
