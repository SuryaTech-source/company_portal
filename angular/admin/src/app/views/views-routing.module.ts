import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// import { MapViewComponent } from './map-view/map-view.component';
import { ViewsComponent } from './views.component';
import { FaqManagementComponent } from './faq-management/faq-management.component';
import { title } from 'process';
const routes: Routes = [
  {
    path: '',
    component: ViewsComponent,

    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
        data: {
          title: 'Dashboard'
        }
      },
      {
        path: 'administrator',
        loadChildren: () => import('./administrators/administrators.module').then(m => m.AdministratorsModule),
        data: {
          title: 'Administrator'
        }
      },
      {
        path: 'users',
        loadChildren: () => import('./users/users.module').then(m => m.UsersModule),
        data: {
          title: 'Users'
        }
      },
      {
        path: 'email-template',
        loadChildren: () => import('./emailtemplete/emailtemplete.module').then(m => m.EmailtempleteModule),
        data: {
          title: 'Email Template'
        }
      },
      {
        path: 'settings',
        loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule),
        data: {
          title: 'Settings'
        }
      },
      {
        path: 'language',
        loadChildren: () => import('./language/language.module').then(m => m.LanguageModule),
        data: {
          title: 'Languages'
        }
      },
      {
        path: 'invoice',
        loadChildren: () => import('./invoice/invoice.module').then(m => m.InvoiceModule),
        data: {
          title: 'Invoice'
        }
      },
      {
        path: 'report',
        loadChildren: () => import('./report/report.module').then(m => m.ReportModule),
        data: {
          title: 'Report'
        }
      },
      {
        path: 'pages',
        loadChildren: () => import('./pages/pages.module').then(m => m.PagesModule),
        data: {
          title: 'Pages'
        }
      },
      {
        path: 'subscription',
        loadChildren: () => import('./subscription/subscription.module').then(m => m.SubscriptionModule),
        data: {
          title: 'Subscription'
        }
      },
      {
        path: 'paymentgateway',
        loadChildren: () => import('./paymentgateway/paymentgateway.module').then(m => m.PaymentgatewayModule),
        data: {
          title: 'Payment Gateway'
        }
      },
      {
        path: 'support-ticket',
        loadChildren: () => import('./support-ticket/support-ticket.module').then(m => m.SupportTicketModule),
        data: {
          title: 'Support Ticket'
        }
      },
      {
        path: 'notification',
        loadChildren: () => import('./notification/notification.module').then(m => m.NotificationModule),
        data: {
          title: 'Notification'
        }
      },
      {
        path: 'transaction',
        loadChildren: () => import('./transaction/transaction.module').then(m => m.TransactionModule),
        data: {
          title: 'Transaction'
        }
      },
      {
        path: 'brand',
        loadChildren: () => import('./brand/brand.module').then(b => b.BrandModule),
        data: {
          title: 'Brands'
        }
      },
      {
        path: 'banners',
        loadChildren: () => import('./banners/banners.module').then(b => b.BannersModule),
        data: {
          title: 'Banner types'
        }
      },
      {
        path: 'testimonial',
        loadChildren: () => import('./testimonial/testimonial.module').then(b => b.TestimonialModule),
        data: {
          title: 'Testimonials'
        }
      },
      {
        path: 'category',
        loadChildren: () => import('./category/category.module').then(m => m.CategoryModule),
        data: {
          title: 'Category'
        }
      },
      {
        path: 'units',
        loadChildren: () => import('./units/units.module').then(u => u.UnitsModule),
        data: {
          title: 'Attribute'
        }
      },
      {
        path: 'orders',
        loadChildren: () => import('./orders/orders.module').then(u => u.OrdersModule),
        data: {
          title: 'Orders'
        }
      },
      {
        path: 'taxmanagement',
        loadChildren: () => import('./taxmanagement/taxmanagement.module').then(m => m.TaxmanagementModule),
        data: {
          title: 'Tax Management'
        }
      },
      {
        path: 'vehicle',
        loadChildren: () => import('./vehicle/vehicle.module').then(m => m.VehicleModule),
        data: {
          title: 'Vehicle'
        }
      },
      {
        path: 'coupon',
        loadChildren: () => import('./coupon/coupon.module').then(m => m.CouponModule),
        data: {
          title: 'Coupon'
        }
      },
      {
        path: 'products',
        loadChildren: () => import('./products/products.module').then(m => m.ProductsModule),
        data: {
          title: 'Products'
        }
      },
      {
        path: 'tags',
        loadChildren: () => import('./tags/tags.module').then(m => m.TagsModule),
        data: {
          title: 'Vendors'
        }
      },
      {
        path: 'deals',
        loadChildren: () => import('./deals/deals.module').then(m => m.DealsModule),
        data: {
          title: 'Deals'
        }
      },
      {
        path: 'combo',
        loadChildren: () => import('./combo/combo.module').then(m => m.ComboModule),
        data: {
          title: 'Combo'
        }
      },
      {
        path: 'offer',
        loadChildren: () => import('./offer-management/offer-management.module').then(m => m.OfferManagementModule),
        data: {
          title: 'Offers'
        }
      },
      /* {
        path: 'mapview',
        component: MapViewComponent,
        data: {
          title: 'Map View'
        }
      }, */
      {
        path: 'faq-management',
        component: FaqManagementComponent,
        data: {
          title: 'FAQ Management'
        }
      },
      {
        path: 'documentManagement',
        loadChildren: () => import('./document-management/document-management.module').then(m => m.DocumentManagementModule),
        data: {
          title: 'Document Management'
        }
      },
      {
        path: 'walkthrough_images',
        loadChildren: () => import('./walkthrough/walkthrough.module').then(m => m.WalkthroughModule),
        data: {
          title: 'Walkthrough Images'
        }
      },
      {
        path: 'cancellationreason',
        loadChildren: () => import('./cancellationreason/cancellationreason.module').then(c => c.CancellationreasonModule),
        data: {
          title: 'Cancellation Management'
        }
      },
      {
        path: 'adminearnings',
        loadChildren: () => import('./adminearnings/adminearnings.module').then(a => a.AdminearningsModule),
        data: {
          title: 'Site Earnings'
        }
      },
      {
        path: 'timeSlots',
        loadChildren: () => import('./time-slots/time-slots.module').then(m => m.TimeSlotsModule),
        data: {
          title: 'Time Slots'
        }
      },
      {
        path: 'drivers',
        loadChildren: () => import('./drivers/drivers.module').then(m => m.DriversModule),
        data: {
          title: 'Drivers'
        }
      },
      {
        path: 'fleet',
        loadChildren: () => import('./testimonial/testimonial.module').then(m => m.TestimonialModule),
        data: {
          title: 'Fleet'
        }
      },
      {
        path: 'contracts',
        loadChildren: () => import('./contracts/contracts.module').then(m => m.ContractsModule),
        data: {
          title: 'Contracts'
        }
      },
      {
        path: 'cityManagement',
        loadChildren: () => import('./city-management/city-management.module').then(m => m.CityManagementModule),
        data: {
          title: 'City Management'
        }
      },
      {
        path: 'reviews/rating',
        loadChildren: () => import('./reviews-rating/reviews-rating.module').then(m => m.ReviewsRatingModule),
        data: {
          title: 'Reviews & Rating'
        }
      },
      {
        path: 'fuel-records',
        loadChildren: () => import('./fuel-records/fuel-records.module').then(m => m.FuelRecordsModule),
        data: {
          title: 'Fuel Records'
        }
      },
      {
        path: 'maintenance',
        loadChildren: () => import('./maintenance/maintenance.module').then(m => m.MaintenanceModule),
        data: {
          title: 'Maintenance'
        }
      },
      {
       path: 'employees',
       loadChildren: () => import('./employees/employees.module').then(m => m.EmployeesModule),
       data: {
         title: 'Employees'
       }

      },
      {
        path: 'performance-analysis',
        loadChildren: () => import('./performance-analysis/performance-analysis.module').then(m => m.PerformanceAnalysisModule),
        data: {
          title: 'Performance Analysis'

        }
      },
      {
        path:'spare-parts',
        loadChildren: () => import('./spare-parts/spare-parts.module').then(m => m.SparePartsModule),
        data: {
          title:'Spare Parts'
        }
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ViewsRoutingModule { }
