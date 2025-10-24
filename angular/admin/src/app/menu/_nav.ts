import { INavData } from 'src/app/layout/public-api';

export const navItems: INavData[] = [
  {
    id: "Dashboard",
    name: 'Dashboard',
    url: '/app/dashboard',
    // icon: 'assets/image/menu.png'
 icon: 'fi fi-rr-dashboard-monitor',
  },
  {
    id: "administrator",
    name: 'Administrators',
    url: '/app/administrator',
    // icon: 'fi fi-rr-mode-portrait',profile
    icon: 'assets/image/profile-2user.png',
    children: [
      {
        name: 'Admin List',
        url: '/app/administrator/list',
        icon: ''
      },
      {
        name: 'Sub Admin List',
        url: '/app/administrator/sub-admin-list',
        icon: ''
      }
    ]
  },
  {
    id: "Employees",
    name: 'Employees',
    url: '/app/employees',
    icon: 'assets/image/profile-2user.png',
    children: [
      {

        name: 'New Employees',
        url: '/app/employees/add',
        icon: '',
        id: 'add'
      },
      {
        name: 'Active Employees',
        url: '/app/employees/active-list',
        icon: '',
        id: 'list'
      }
    ]
  },
   {
    id: "Feet",
    name: 'Fleet',
    url: '/app/testimonial',
    icon: 'assets/image/offer.png',
    children: [
      {
        name: 'New Fleet',
        url: '/app/fleet/add',
        icon: '',
        id: 'add'
      },
      
      {
        name: 'Active List',
        url: '/app/fleet/list',
        icon: '',
        id: 'list'
      },
      {
        name: 'Assignment',
        url: '/app/fleet/assignment',
        icon: '',
        id: 'list'
      },
    ]
  },
  
  {
    id: "Contracts",
    name: 'Contracts',
    url: '/app/contracts',
    icon: 'assets/image/offer.png',
    children: [
      {
        name: 'New Contracts',
        url: '/app/contracts/add',
        icon: '', 
        id: 'add'
      },
      { 
        name: 'Active Contracts',
        url: '/app/contracts/list',
        icon: '',
        id: 'list'
      },
    ]
  },
  {
    id: "tags",
    name: 'Vendors',
    url: '/app/tags',
    icon: 'assets/image/tag.png',
    children: [
    {
        name: 'New Vendors',
        url: '/app/tags/add',
        icon: '',
        id: "add"
      },  
      {
        name: 'Active Vendors',
        url: '/app/tags/list',
        icon: '',
        id: 'list'
      },
      
    ]
  },
  {
    id: "Invoice",
    name: 'Invoice',
    url: '/app/invoice',
    icon: 'assets/image/offer.png',
    children: [
      {
        name: 'Add Invoice',
        url: '/app/invoice/add',
        icon: '',
        id: 'add'
      },
      {
        name: 'Invoice List',
        url: '/app/invoice/list',
        icon: '',
        id: 'list'
      },
    ]
  },
  
  // {
  //   id: "Brand",
  //   name: 'Brand',
  //   url: '/app/brand',
  //   icon: 'fa fa-fi fi-rr-cube',
  //   children: [
  //     {
  //       name: 'Brand List',
  //       url: '/app/brand/brand-list',
  //       icon: ''
  //     },
  //     {
  //       name: 'Brand Add',
  //       url: '/app/brand/brand-add',
  //       icon: '',
  //       id: "add"
  //     },
  //   ]
  // },

  // {
  //   id: "category",
  //   name: 'Categories',
  //   url: '/app/category',
  //   icon: 'assets/image/category.png',
  //   children: [
  //     {
  //       name: 'Category List',
  //       url: '/app/category/category-list',
  //       icon: '',
  //       id:'list'
  //     },
  //     {
  //       name: 'Add Category',
  //       url: '/app/category/category-add',
  //       icon: '',
  //       id: "add"
  //     },
  //     {
  //       name: 'Sub Category List',
  //       url: '/app/category/sub-category-list',
  //       icon: '',
  //       id:'list'

  //     },
  //     {
  //       name: 'Add Sub Category',
  //       url: '/app/category/sub-category-add',
  //       icon: '',
  //       id: "add"
  //     },
  //   ]
  // },
  // {
  //   id: "products",
  //   name: 'Products',
  //   url: '/app/products',
  //   icon: 'assets/image/box.png',
  //   children: [
  //     {
  //       name: 'Products List',
  //       url: '/app/products/list',
  //       id: 'list'
  //     },
  //     {
  //       name: 'Add Product',
  //       url: '/app/products/add',
  //       icon: '',
  //       id: "add"
  //     },
  //     {
  //       name: 'Attributes',
  //       url: '/app/units/units-list',
  //       icon: '',
  //       id: 'list'


  //     },
  //     {
  //       name: 'Add Attributes',
  //       url: '/app/units/units-add',
  //       id: 'add'
  //     }, 
  //   ]
  // },
  
  // {
  //   id: "deals",
  //   name: 'Drivers',
  //   url: '/app/deals',
  //   icon: 'assets/image/deal.png',
  //   children: [
  //     {
  //       name: 'Drivers List',
  //       url: '/app/deals/list',
  //       icon: '',
  //       id: 'list'
  //     },
  //     {
  //       name: 'Add Drivers',
  //       url: '/app/deals/add',
  //       icon: '',
  //       id: "add"
  //     },
  //   ]
  // },
  {
    id: "reports",
    name: 'Reports',
    url: '/app/report/reported-list',
    icon: 'assets/image/category.png',
    // children: [
    //   {
    //     name: 'Drivers List',
    //     url: '/app/deals/list',
    //     icon: '',
    //     id: 'list'
    //   },
    //   {
    //     name: 'Add Drivers',
    //     url: '/app/deals/add',
    //     icon: '',
    //     id: "add"
    //   },
    // ]
  },
  {
    id: "fuel-records",
    name: 'Fuel Records',
    url: '/app/fuel-records/fuel-records-list',
    icon: 'assets/image/category.png',
    // children: [
    //   {
    //     name: 'Drivers List',
    //     url: '/app/deals/list',
    //     icon: '',
    //     id: 'list'
    //   },
    //   {
    //     name: 'Add Drivers',
    //     url: '/app/deals/add',
    //     icon: '',
    //     id: "add"
    //   },
    // ]
  },
  {
    id: "Spare Parts",
    name: 'Spare Parts',
    url: '/app/spare-parts',
    icon: 'assets/image/category.png',
    children: [
      {
        name: 'Spare Parts List',
        url: '/app/spare-parts/list',
        icon: '',
        id: 'list'
      },
      {
        name: 'Add Spare Parts',
        url: '/app/spare-parts/add',
        icon: '',
        id: "add"
      },
    ]
  },
  {
    id: "maintenance",
    name: 'Maintenance',
    url: '/app/maintenance/maintenance-list',
    icon: 'assets/image/category.png',
  },
  {
    id: "performance-analysis",
    name: 'Performance Analysis',
    url: '/app/performance-analysis/peroformance-analysis-list',
    icon: 'assets/image/category.png',
  },
  // {
  //   id: "combo",
  //   name: 'Combo Offers',
  //   url: '/app/combo',
  //   icon: 'assets/image/deal.png',
  //   children: [
  //     {
  //       name: 'Combo Offer List',
  //       url: '/app/combo/list',
  //       icon: ''
  //     },
  //     {
  //       name: 'Add Combo Offers',
  //       url: '/app/combo/add',
  //       icon: '',
  //       id: "add"
  //     },
  //   ]
  // },
  // {
  //   id: "City Management ",
  //   name: 'City Management',
  //   url: '/app/cityManagement',
  //   icon: 'fi fi-rr-building',
  //   children: [
  //     {
  //       name: 'City Dashboard',
  //       url: '/app/cityManagement/city_dashboard',
  //       icon: ''
  //     },
  //     {
  //       name: 'City List',
  //       url: '/app/cityManagement/list',
  //       icon: ''
  //     },
  //     {
  //       name: 'Add City',
  //       url: '/app/cityManagement/add',
  //       icon: '',
  //       id: "add"
  //     },
  //   ]
  // },
  // {
  //   id: "Orders",
  //   name: 'Orders',
  //   url: '/app/orders',
  //   icon: 'assets/image/bag.png',
  //   children: [
  //     {
  //       name: 'All Orders',
  //       url: '/app/orders/allorders',
  //       icon: ''
  //     },
  //     {
  //       name: 'New Orders ',
  //       url: '/app/orders/neworders',
  //       icon: ''
  //     },
  //     {
  //       name: 'Packed Orders',
  //       url: '/app/orders/packedorders',
  //       icon: ''
  //     },
  //     {
  //       name: 'On Going Orders',
  //       url: '/app/orders/orderpickup',
  //       icon: ''
  //     },
  //     {
  //       name: 'Delivered Orders',
  //       url: '/app/orders/deliveredorders',
  //       icon: ''
  //     },
  //     // {
  //     //   name: 'Customer Returns',
  //     //   url: '/app/orders/returnedorders',
  //     //   icon: ''
  //     // },
  //     // {
  //     //   name: 'Collected Orders',
  //     //   url: '/app/orders/return-collectedorders',
  //     //   icon: ''
  //     // },
  //     // {
  //     //   name: 'Refunded Orders',
  //     //   url: '/app/orders/refundedorders',
  //     //   icon: ''
  //     // },
  //     // {
  //     //   name: 'Customer Canceled Orders',
  //     //   url: '/app/orders/usercancelledorders',
  //     //   icon: ''
  //     // },
  //     {
  //       name: 'Admin Canceled Orders',
  //       url: '/app/orders/cancelorders',
  //       icon: ''
  //     },
  //   ]
  // },
  // {
  //   id: "users",
  //   name: 'Customers',
  //   url: '/app/users',
  //   icon: 'assets/image/profile-2user.png',
  //   children: [
  //     {
  //       name: 'Customer List',
  //       url: '/app/users/list',
  //       id: 'list'
  //     },
  //     {
  //       name: 'Subscribe Users',
  //       url: '/app/users/subscribe',
  //       id: 'list'
  //     },
  //     {
  //       name: 'Add Customer',
  //       url: '/app/users/add',
  //       icon: '',
  //       id: "add"
  //     },
  //   ]
  // },
  {
    id: "settings",
    name: 'Settings',
    url: '/app/settings',
    icon: 'assets/image/setting-2.png',
    children: [
      {
        name: 'General Settings',
        url: '/app/settings/gentralsetting',
        icon: ''
      },
      // {
      //   name: 'Banner List',
      //   url: '/app/banners/web-list',
      //   icon: ''
      // },
      // {
      //   name: 'Coupon List',
      //   url: '/app/coupon/couponlist',
      //   icon: ''
      // },
      // {
      //   name: 'Add Mobile Banner',
      //   url: '/app/banners/mobile-banner-add',
      //   icon: '',
      //   id: "add"
      // },
      // {
      //   name: 'Mobile Banner List',
      //   url: '/app/banners/mobile-list',
      //   icon: ''
      // },
      // {
      //   name: 'Email Template List',
      //   url: '/app/email-template/list',
      //   icon: ''
      // },
      // {
      //   name: 'Walkthrough Images',
      //   url: '/app/walkthrough_images/list',
      //   icon: ''
      // },
      // {
      //   name: 'Time Slots List',
      //   url: '/app/timeSlots/list',
      //   icon: ''
      // },
      // {
      //   name: 'SMTP',
      //   url: '/app/settings/smtpsetting',
      //   icon: ''
      // },
      // {
      //   name: 'SMS',
      //   url: '/app/settings/smssetting',
      //   icon: ''
      // },
      // {
      //   name: 'Social Network',
      //   url: '/app/settings/social-network',
      //   icon: ''
      // },
      // {
      //   name: 'S3 Setting',
      //   url: '/app/settings/s3-setting',
      //   icon: ''
      // },
      // {
      //   name: 'SEO',
      //   url: '/app/settings/seosetting',
      //   icon: ''
      // },
      /*  {
         name: 'Return Reason',
         url: '/app/settings/return-reason',
         icon: ''
       }, */
      // {
      //   name: 'Appearance',
      //   url: '/app/settings/appearance',
      //   icon: ''
      // },
      // {
      //   id: "postheader",
      //   name: 'Post Header',
      //   url: '/app/settings/postheaderlist',
      //   icon: '',
      // },

      // {
      //   name: 'Widgets',
      //   url: '/app/settings/widgets',
      //   icon: ''
      // },
      // {
      //   name: 'Shipping',
      //   url: '/app/settings/shipping',
      //   icon: ''
      // },
      // {
      //   name: 'Payment Gateway ',
      //   url: '/app/paymentgateway',
      //   icon: ''
      // },
    ]
  },
  // {
  //   id: "Coupons",
  //   name: 'Coupons',
  //   url: '/app/coupon',
  //   icon: 'assets/image/ticket-discount.png',
  //   children: [
  //     {
  //       name: 'All Coupons',
  //       url: '/app/coupon/couponlist',
  //       icon: '',
  //       id:'list'
  //     },
  //     {
  //       name: 'Add Coupon',
  //       url: '/app/coupon/couponadd',
  //       icon: '',
  //       id:'add'
  //     },
  //   ]
  // },
  // {
  //   id: "Email Template",
  //   name: 'Email Template',
  //   url: '/app/email',
  //   icon: 'assets/image/sms.png',
  //   children: [
  //     {
  //       name: 'Email Template List',
  //       url: '/app/email-template/list',
  //       icon: ''
  //     },
  //   ]
  // },
  // {
  //   id: "Invoice",
  //   name: 'Invoice',
  //   url: '/app/paymentgateway',
  //   icon: 'assets/image/cards.png',
  //   children: [
  //     {
  //       name: 'Create Invoice ',
  //       url: '/app/paymentgateway',
  //       icon: '',
  //       id:'list'
  //     },
  //   ]
  // },
  // {
  //   id: "Reviews & Ratings",
  //   name: 'Reviews & Ratings',
  //   url: '/app/reviews/rating/list',
  //   icon: 'assets/image/star.png'
  // },
  // {
  //   id: "language",
  //   name: 'Languages',
  //   url: '/app/language',
  //   icon: 'fi fi-rr-letter-case',
  //   children: [
  //     {
  //       name: 'Language List',
  //       url: '/app/language/list',
  //       icon: ''
  //     },
  //     {
  //       name: 'Add Language',
  //       url: '/app/language/add',
  //       icon: '',
  //       id: "add"
  //     },
  //   ]
  // },  
  // {
  //   id: "mapview",
  //   name: 'Map View',
  //   url: '/app/mapview',
  //   icon: 'fi fi-rr-marker',
  // },
  // {
  //   id: "notification",
  //   name: 'Push Notification',
  //   url: '/app/notification',
  //   icon: 'fi fi-rr-bell',
  //   children: [
  //     {
  //       name: 'User',
  //       url: '/app/notification/list',
  //       icon: ''
  //     },
  //     {
  //       name: 'Template',
  //       url: '/app/notification/templete',
  //       icon: ''
  //     },
  //     // {
  //     //   name: 'driver',
  //     //   url: '/app/notification/driverlist',
  //     //   icon: ''
  //     // },
  //   ]
  // },
  // {
  //   id: "Site Earnings",
  //   name: 'Site Earnings',
  //   url: '/app/adminearnings/adminearningslist',
  //   icon: 'assets/image/routing-2.png'
  // },


  // {
  //   id: "pages",
  //   name: 'Page List',
  //   url: '/app/pages/list',
  //   icon: 'assets/image/document-text.png'
  // },


  // {
  //   id: "Reports",
  //   name: 'Reports',
  //   url: '/app/Reports',
  //   icon: 'assets/image/category.png',
  //   children: [
  //     {
  //       name: 'Finance Report',
  //       url: '/app/report/finance-report',
  //       icon: ''
  //     },
  //   ]
  // },



  // {
  //   id: "Offer Management",
  //   name: 'Offer Management',
  //   url: '/app/offer-management',
  //   icon: 'assets/image/offer.png',
  //   children : [
  //     {
  //       name: 'Add offer',
  //       url: '/app/offer/add',
  //       icon: ''
  //     },
  //     {
  //       name: 'Offer List',
  //       url: '/app/offer/list',
  //       icon: ''
  //     },
  //   ]
  // },
 

  // {
  //   id: "Layout Control",
  //   name: 'Layout Control',
  //   url: '/app/Pagecontrol',
  //   icon: 'assets/image/layout.png',
  //   children: [
  //     // {
  //     //   name: 'Banner Lists',
  //     //   url: '/app/banners/web-list',
  //     //   icon: ''
  //     // },

  //     // {
  //     //   name: 'Walkthrough Images',
  //     //   url: '/app/walkthrough_images/list',
  //     //   icon: ''
  //     // },
  //     {
  //       name: 'Page List',
  //       url: '/app/pages/list',
  //       icon: ''
  //     },
  //     {
  //       name: 'FAQ Management',
  //       url: '/app/faq-management',
  //       icon: ''
  //     },
  //   ]
  // },
  // {
  //   id: "Banner",
  //   name: 'Banner Types',
  //   url: '/app/banners/banner-types-list',
  //   icon: 'assets/image/banner.png',

  //   children: [
  //     {
  //       name: 'Banner-type-lists',
  //       url: '/app/banners/banner-types-list',
  //       icon: '',
  //       id:'list'
  //     },
  //     {
  //       name: 'Header-1',
  //       url: '/app/banners/header-1',
  //       icon: '',
  //       id:'add'

  //     },
  //     {
  //       name: 'Header-2',
  //       url: '/app/banners/header-2',
  //       icon: '',
  //       id:'add'
  //     },
  //     {
  //       name: 'Banner batchs',
  //       url: '/app/banners/batchs',
  //       icon: '',
  //       id:'add'

  //     },

  //     // {
  //     //   name: 'Post-Header-1',
  //     //   url: '/app/banners/post-header-1',
  //     //   icon: '',
  //     //   id:'add'

  //     // },
  //     {
  //       name: 'Post-Header-2',
  //       url: '/app/banners/post-header-2',
  //       icon: '',
  //       id:'add'

  //     },
  //     {
  //       name: 'Post-Category-3',
  //       url: '/app/banners/post-category-3',
  //       icon: '',
  //       id:'add'

  //     },
  //     {
  //       name: 'Post-Category-6',
  //       url: '/app/banners/post-category-6',
  //       icon: '',
  //       id:'add'

  //     },
  //     {
  //       name: 'Pre-Footer',
  //       url: '/app/banners/pre-footer',
  //       icon: '',
  //       id:'add'

  //     },
  //     // {
  //     //   name: 'Header-1',
  //     //   url: '/app/banners/header-1',
  //     //   icon: ''
  //     // },
  //     // {
  //     //   name: 'Walkthrough Images',
  //     //   url: '/app/walkthrough_images/list',
  //     //   icon: ''
  //     // },
  //     // {
  //     //   name: 'Page List',
  //     //   url: '/app/pages/list',
  //     //   icon: ''
  //     // },
  //   ]
  // },

  // {
  //   id: "taxmanagement",
  //   name: 'Tax Management',
  //   url: '/app/taxmanagement',
  //   icon: 'fi fi-rr-dollar',
  //   children: [
  //     {
  //       name: 'Tax List',
  //       url: '/app/taxmanagement/list',
  //       icon: ''
  //     },
  //     {
  //       name: 'Add Tax',
  //       url: '/app/taxmanagement/add',
  //       icon: '',
  //       id: "add"
  //     },
  //   ]
  // },

];
